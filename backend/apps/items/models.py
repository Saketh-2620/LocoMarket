import uuid

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.gis.db import models
from django.contrib.gis.geos import Point
from django.contrib.postgres.indexes import GistIndex
from django.db import transaction
from django.utils import timezone

User = get_user_model()


class Item(models.Model):
    class Category(models.TextChoices):
        ELECTRONICS = "electronics", "Electronics"
        TOOLS = "tools", "Tools"
        FURNITURE = "furniture", "Furniture"
        CLOTHING = "clothing", "Clothing"
        SPORTS = "sports", "Sports"
        OTHER = "other", "Other"

    class ListingType(models.TextChoices):
        RENT = "rent", "Rent"
        SALE = "sale", "Sale"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=50, choices=Category.choices, default=Category.OTHER)
    listing_type = models.CharField(max_length=10, choices=ListingType.choices, default=ListingType.SALE)
    location = models.PointField(srid=4326)
    address = models.TextField(blank=True, default="")
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="items")
    is_active = models.BooleanField(default=True)
    sold_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            GistIndex(fields=["location"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    @property
    def lat(self):
        return self.location.y if self.location else None

    @property
    def lng(self):
        return self.location.x if self.location else None

    def set_location(self, lat, lng):
        self.location = Point(float(lng), float(lat), srid=4326)


class ItemImage(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="items/")
    order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]

    def __str__(self):
        return f"Image for {self.item.title}"
