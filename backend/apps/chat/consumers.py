import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from django.db.models import Q

from .models import ChatRoom, Message
from .serializers import MessageSerializer

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"chat_{self.room_id}"
        user = self.scope.get("user")

        if not user or not user.is_authenticated:
            await self.close()
            return

        if not await self._user_in_room(user, self.room_id):
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        user = self.scope["user"]
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        text = (data.get("text") or "").strip()
        if not text:
            return

        message = await self._create_message(self.room_id, user, text)
        payload_data = await self._serialize_message(message)
        payload = json.dumps({"type": "chat.message", "message": payload_data})

        # Echo to sender (group_send does not always deliver back to the sending consumer).
        await self.send(text_data=payload)

        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "chat.message", "message": payload_data},
        )
        await self._notify_other_user(message, payload_data)

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({"type": "chat.message", "message": event["message"]}))

    @database_sync_to_async
    def _user_in_room(self, user, room_id):
        return ChatRoom.objects.filter(pk=room_id).filter(Q(buyer=user) | Q(seller=user)).exists()

    @database_sync_to_async
    def _serialize_message(self, message):
        message = Message.objects.select_related("sender").get(pk=message.pk)
        return MessageSerializer(message).data

    @database_sync_to_async
    def _create_message(self, room_id, user, text):
        room = ChatRoom.objects.get(pk=room_id)
        return Message.objects.create(room=room, sender=user, text=text)

    async def _notify_other_user(self, message, payload_data):
        from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        room = await database_sync_to_async(ChatRoom.objects.get)(pk=message.room_id)
        for user_id in [room.buyer_id, room.seller_id]:
            if user_id != message.sender_id:
                await channel_layer.group_send(
                    f"user_{user_id}",
                    {
                        "type": "chat.notification",
                        "room_id": str(message.room_id),
                        "message": payload_data,
                    },
                )


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close()
            return

        self.user_group_name = f"user_{user.id}"
        await self.channel_layer.group_add(self.user_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "user_group_name"):
            await self.channel_layer.group_discard(self.user_group_name, self.channel_name)

    async def chat_notification(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "chat.notification",
                    "room_id": event["room_id"],
                    "message": event["message"],
                }
            )
        )
