import uuid

import django.contrib.gis.db.models.fields
import django.contrib.postgres.indexes
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Item",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=200)),
                ("description", models.TextField()),
                ("price", models.DecimalField(decimal_places=2, max_digits=10)),
                ("category", models.CharField(choices=[("electronics", "Electronics"), ("tools", "Tools"), ("furniture", "Furniture"), ("clothing", "Clothing"), ("sports", "Sports"), ("other", "Other")], default="other", max_length=50)),
                ("listing_type", models.CharField(choices=[("rent", "Rent"), ("sale", "Sale")], default="sale", max_length=10)),
                ("location", django.contrib.gis.db.models.fields.PointField(srid=4326)),
                ("address", models.TextField(blank=True, default="")),
                ("is_active", models.BooleanField(default=True)),
                ("sold_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("seller", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="ItemImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image", models.ImageField(upload_to="items/")),
                ("order", models.PositiveSmallIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("item", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="images", to="items.item")),
            ],
            options={
                "ordering": ["order", "created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="item",
            index=django.contrib.postgres.indexes.GistIndex(fields=["location"], name="items_item_locatio_gist_idx"),
        ),
    ]
