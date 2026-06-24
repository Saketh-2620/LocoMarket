from rest_framework import serializers

from apps.items.serializers import ItemListSerializer
from apps.users.serializers import UserSerializer

from .models import ChatRoom, Message


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ["id", "room", "sender", "text", "is_read", "created_at"]
        read_only_fields = ["id", "room", "sender", "is_read", "created_at"]


class ChatRoomSerializer(serializers.ModelSerializer):
    item = ItemListSerializer(read_only=True)
    buyer = UserSerializer(read_only=True)
    seller = UserSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = [
            "id",
            "item",
            "buyer",
            "seller",
            "created_at",
            "last_message",
            "unread_count",
        ]

    def get_last_message(self, obj):
        msg = obj.messages.order_by("-created_at").first()
        if not msg:
            return None
        return MessageSerializer(msg).data

    def get_unread_count(self, obj):
        user = self.context["request"].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()


class ChatRoomCreateSerializer(serializers.Serializer):
    item_id = serializers.UUIDField()
