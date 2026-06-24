import uuid

from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class ChatRoom(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey("items.Item", on_delete=models.CASCADE, related_name="chat_rooms")
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="buyer_rooms")
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="seller_rooms")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [["item", "buyer", "seller"]]
        ordering = ["-created_at"]

    def __str__(self):
        return f"Chat: {self.item.title} ({self.buyer.email} / {self.seller.email})"


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    text = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender.email}: {self.text[:30]}"
