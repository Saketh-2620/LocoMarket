from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    avatar_url = models.URLField(blank=True, default="")

    @property
    def name(self):
        return self.get_full_name() or self.username

    def __str__(self):
        return self.email or self.username
