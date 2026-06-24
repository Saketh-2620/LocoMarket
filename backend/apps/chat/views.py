from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.items.models import Item

from .models import ChatRoom, Message
from .serializers import ChatRoomCreateSerializer, ChatRoomSerializer, MessageSerializer


class ChatRoomViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ChatRoomSerializer
    pagination_class = None
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        from django.db.models import Q

        user = self.request.user
        return (
            ChatRoom.objects.filter(Q(buyer=user) | Q(seller=user))
            .select_related("item", "buyer", "seller", "item__seller")
            .prefetch_related("item__images", "messages")
        )

    def create(self, request, *args, **kwargs):
        serializer = ChatRoomCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item_id = serializer.validated_data["item_id"]

        try:
            item = Item.objects.get(pk=item_id, is_active=True)
        except Item.DoesNotExist:
            return Response({"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND)

        if item.seller == request.user:
            return Response(
                {"detail": "You cannot start a chat on your own listing."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        room, created = ChatRoom.objects.get_or_create(
            item=item,
            buyer=request.user,
            seller=item.seller,
        )
        return Response(
            ChatRoomSerializer(room, context={"request": request}).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"], url_path="messages")
    def messages(self, request, pk=None):
        room = self.get_object()
        self._check_room_access(room, request.user)
        msgs = room.messages.select_related("sender").order_by("created_at")
        room.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
        return Response(MessageSerializer(msgs, many=True).data)

    def _check_room_access(self, room, user):
        if room.buyer != user and room.seller != user:
            raise PermissionDenied("You do not have access to this chat.")
