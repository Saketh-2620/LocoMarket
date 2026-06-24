from django.urls import path

from .views import CurrentUserView, GoogleLoginView

urlpatterns = [
    path("google/", GoogleLoginView.as_view(), name="google-login"),
    path("user/", CurrentUserView.as_view(), name="current-user"),
]
