from rest_framework import serializers

from .models import Item, ItemImage


class ItemImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemImage
        fields = ["id", "image", "order"]
        read_only_fields = ["id"]


class ItemListSerializer(serializers.ModelSerializer):
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()
    distance_km = serializers.SerializerMethodField()
    seller_name = serializers.CharField(source="seller.get_full_name", read_only=True)

    class Meta:
        model = Item
        fields = [
            "id",
            "title",
            "price",
            "category",
            "listing_type",
            "lat",
            "lng",
            "thumbnail",
            "distance_km",
            "address",
            "seller_name",
            "is_active",
        ]

    def get_lat(self, obj):
        return obj.lat

    def get_lng(self, obj):
        return obj.lng

    def get_thumbnail(self, obj):
        first = obj.images.first()
        if not first:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(first.image.url)
        return first.image.url

    def get_distance_km(self, obj):
        distance = getattr(obj, "distance", None)
        if distance is None:
            return None
        return round(distance.km, 2)


class ItemDetailSerializer(ItemListSerializer):
    images = ItemImageSerializer(many=True, read_only=True)
    seller_id = serializers.IntegerField(source="seller.id", read_only=True)
    description = serializers.CharField()

    class Meta(ItemListSerializer.Meta):
        fields = ItemListSerializer.Meta.fields + [
            "description",
            "images",
            "seller_id",
            "sold_at",
            "created_at",
        ]


class ItemCreateUpdateSerializer(serializers.ModelSerializer):
    lat = serializers.FloatField(write_only=True, required=False)
    lng = serializers.FloatField(write_only=True, required=False)
    address_query = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Item
        fields = [
            "title",
            "description",
            "price",
            "category",
            "listing_type",
            "address",
            "lat",
            "lng",
            "address_query",
        ]

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value

    def validate(self, attrs):
        lat = attrs.get("lat")
        lng = attrs.get("lng")
        address_query = attrs.pop("address_query", None)

        if lat is None or lng is None:
            if address_query:
                from .geocoding import geocode_address

                result = geocode_address(address_query)
                if not result:
                    raise serializers.ValidationError(
                        {"address_query": "Could not geocode this address."}
                    )
                attrs["lat"] = result["lat"]
                attrs["lng"] = result["lng"]
                if not attrs.get("address"):
                    attrs["address"] = result["display_name"]
            else:
                raise serializers.ValidationError(
                    "Provide lat/lng or address_query for item location."
                )
        return attrs

    def create(self, validated_data):
        lat = validated_data.pop("lat")
        lng = validated_data.pop("lng")
        validated_data["seller"] = self.context["request"].user
        item = Item(**validated_data)
        item.set_location(lat, lng)
        item.save()
        return item

    def update(self, instance, validated_data):
        lat = validated_data.pop("lat", None)
        lng = validated_data.pop("lng", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if lat is not None and lng is not None:
            instance.set_location(lat, lng)
        instance.save()
        return instance
