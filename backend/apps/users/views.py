import requests
from django.contrib.auth import get_user_model
from decouple import config
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import UserSerializer

User = get_user_model()


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("id_token") or request.data.get("credential")
        if not token:
            return Response({"detail": "id_token is required."}, status=status.HTTP_400_BAD_REQUEST)

        client_id = config("GOOGLE_CLIENT_ID", default="")
        try:
            resp = requests.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": token},
                timeout=10,
            )
            if resp.status_code != 200:
                return Response({"detail": "Invalid Google token."}, status=status.HTTP_400_BAD_REQUEST)
            idinfo = resp.json()
            if client_id and idinfo.get("aud") != client_id:
                return Response({"detail": "Token audience mismatch."}, status=status.HTTP_400_BAD_REQUEST)
        except requests.RequestException:
            return Response({"detail": "Could not verify Google token."}, status=status.HTTP_400_BAD_REQUEST)

        email = idinfo.get("email")
        if not email:
            return Response({"detail": "Email not provided by Google."}, status=status.HTTP_400_BAD_REQUEST)

        name = idinfo.get("name", "")
        first_name = idinfo.get("given_name", name.split(" ")[0] if name else "")
        last_name = idinfo.get("family_name", "")
        avatar_url = idinfo.get("picture", "")

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email,
                "first_name": first_name,
                "last_name": last_name,
                "avatar_url": avatar_url,
            },
        )
        if not created:
            updated = False
            if avatar_url and user.avatar_url != avatar_url:
                user.avatar_url = avatar_url
                updated = True
            if first_name and user.first_name != first_name:
                user.first_name = first_name
                updated = True
            if last_name and user.last_name != last_name:
                user.last_name = last_name
                updated = True
            if updated:
                user.save()

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data,
            }
        )


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
