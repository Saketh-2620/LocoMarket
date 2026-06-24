from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point, Polygon
from django.contrib.gis.measure import D
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Item, ItemImage
from .serializers import ItemCreateUpdateSerializer, ItemDetailSerializer, ItemListSerializer


class ItemViewSet(viewsets.ModelViewSet):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    lookup_field = "pk"

    def get_queryset(self):
        qs = Item.objects.select_related("seller").prefetch_related("images")
        user = self.request.user

        if self.action in ("mine", "mark_sold", "update", "partial_update", "destroy"):
            if not user.is_authenticated:
                return Item.objects.none()
            return qs.filter(seller=user)

        if self.action == "retrieve":
            if user.is_authenticated:
                return qs.filter(Q(is_active=True) | Q(seller=user))
            return qs.filter(is_active=True)

        return qs.filter(is_active=True)

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ItemCreateUpdateSerializer
        if self.action == "retrieve":
            return ItemDetailSerializer
        return ItemListSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy", "mine", "mark_sold"):
            return [IsAuthenticated()]
        return super().get_permissions()

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset().filter(is_active=True)
        qs = self._apply_geo_filters(qs, request)
        qs = self._apply_search_filters(qs, request)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    def _apply_geo_filters(self, queryset, request):
        bbox = request.query_params.get("bbox")
        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")
        radius_km = request.query_params.get("radius_km")

        if bbox:
            try:
                west, south, east, north = map(float, bbox.split(","))
                polygon = Polygon.from_bbox((west, south, east, north))
                polygon.srid = 4326
                queryset = queryset.filter(location__bboverlaps=polygon)
            except (ValueError, TypeError):
                raise ValidationError({"bbox": "Expected west,south,east,north"})

        if lat and lng:
            try:
                user_point = Point(float(lng), float(lat), srid=4326)
                queryset = queryset.annotate(distance=Distance("location", user_point))
                if radius_km:
                    queryset = queryset.filter(location__distance_lte=(user_point, D(km=float(radius_km))))
                else:
                    queryset = queryset.order_by("distance")
            except (ValueError, TypeError):
                raise ValidationError({"lat": "Invalid coordinates"})

        return queryset

    def _apply_search_filters(self, queryset, request):
        q = request.query_params.get("q")
        category = request.query_params.get("category")
        listing_type = request.query_params.get("listing_type")

        if q:
            queryset = queryset.filter(title__icontains=q) | queryset.filter(description__icontains=q)
        if category:
            queryset = queryset.filter(category=category)
        if listing_type:
            queryset = queryset.filter(listing_type=listing_type)
        return queryset

    def perform_create(self, serializer):
        item = serializer.save()
        self._save_images(item)

    def perform_update(self, serializer):
        if serializer.instance.seller != self.request.user:
            raise PermissionDenied("You can only edit your own listings.")
        item = serializer.save()
        self._save_images(item)

    def perform_destroy(self, instance):
        if instance.seller != self.request.user:
            raise PermissionDenied("You can only delete your own listings.")
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])

    def _save_images(self, item):
        request = self.request
        images = request.FILES.getlist("photos") or request.FILES.getlist("images")
        if not images:
            return
        existing_count = item.images.count()
        if existing_count + len(images) > 4:
            raise ValidationError({"photos": "Maximum 4 photos per item."})
        for i, image in enumerate(images):
            ItemImage.objects.create(item=item, image=image, order=existing_count + i)

    @action(detail=False, methods=["get"], url_path="mine")
    def mine(self, request):
        status_filter = request.query_params.get("status", "active")
        qs = self.get_queryset()
        if status_filter == "sold":
            qs = qs.filter(is_active=False, sold_at__isnull=False)
        else:
            qs = qs.filter(is_active=True)
        serializer = ItemDetailSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="mark-sold")
    def mark_sold(self, request, pk=None):
        item = self.get_object()
        if item.seller != request.user:
            raise PermissionDenied("Only the seller can mark this item as sold.")
        if not item.is_active:
            return Response({"detail": "Item is already sold."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            item = Item.objects.select_for_update().get(pk=item.pk)
            if not item.is_active:
                return Response({"detail": "Item is already sold."}, status=status.HTTP_400_BAD_REQUEST)
            item.is_active = False
            item.sold_at = timezone.now()
            item.save(update_fields=["is_active", "sold_at", "updated_at"])

        return Response(ItemDetailSerializer(item, context={"request": request}).data)

    @action(detail=False, methods=["post"], url_path="geocode")
    def geocode(self, request):
        address = request.data.get("address")
        if not address:
            return Response({"detail": "address is required."}, status=status.HTTP_400_BAD_REQUEST)
        from .geocoding import geocode_address

        result = geocode_address(address)
        if not result:
            return Response({"detail": "Address not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(result)
