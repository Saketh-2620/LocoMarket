from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from rest_framework.test import APIClient

from apps.items.models import Item

User = get_user_model()


class ItemGeoTests(TestCase):
    def setUp(self):
        self.seller = User.objects.create_user(
            username="seller@test.com", email="seller@test.com", password="pass"
        )
        self.buyer = User.objects.create_user(
            username="buyer@test.com", email="buyer@test.com", password="pass"
        )
        self.item = Item.objects.create(
            title="Drill",
            description="Power drill",
            price="25.00",
            category="tools",
            listing_type="sale",
            location=Point(-74.006, 40.7128, srid=4326),
            address="NYC",
            seller=self.seller,
        )
        self.client = APIClient()

    def test_bbox_query_returns_active_items(self):
        resp = self.client.get("/api/items/", {"bbox": "-74.1,40.6,-73.9,40.8"})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)

    def test_mark_sold_by_seller(self):
        self.client.force_authenticate(user=self.seller)
        resp = self.client.post(f"/api/items/{self.item.id}/mark-sold/")
        self.assertEqual(resp.status_code, 200)
        self.item.refresh_from_db()
        self.assertFalse(self.item.is_active)
        self.assertIsNotNone(self.item.sold_at)

    def test_mark_sold_denied_for_non_seller(self):
        self.client.force_authenticate(user=self.buyer)
        resp = self.client.post(f"/api/items/{self.item.id}/mark-sold/")
        self.assertEqual(resp.status_code, 403)
