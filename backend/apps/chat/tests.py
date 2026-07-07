import json
import uuid

from django.test import SimpleTestCase

from .consumers import json_safe_dumps


class JsonSafeDumpsTests(SimpleTestCase):
    def test_uuid_values_are_serialized_to_strings(self):
        payload = {"id": uuid.uuid4(), "nested": {"room_id": uuid.uuid4()}}

        encoded = json_safe_dumps(payload)
        decoded = json.loads(encoded)

        self.assertEqual(decoded["id"], str(payload["id"]))
        self.assertEqual(decoded["nested"]["room_id"], str(payload["nested"]["room_id"]))
