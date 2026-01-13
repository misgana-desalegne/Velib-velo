import json
import os
import re
import urllib.parse
import urllib.request

from django.contrib.auth.models import User
from decouple import config
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .auth_serializers import UserSerializer


def _safe_username(base: str) -> str:
    base = (base or "user").strip().lower()
    base = re.sub(r"[^a-z0-9_]+", "_", base)
    base = re.sub(r"_+", "_", base).strip("_") or "user"
    return base[:30]


def _get_or_create_user(email: str, name: str | None = None) -> User:
    email = (email or "").strip().lower()
    if not email:
        raise ValueError("Email is required")

    user = User.objects.filter(email=email).first()
    if user:
        return user

    first_name = ""
    last_name = ""
    if name:
        parts = name.strip().split()
        first_name = parts[0] if parts else ""
        last_name = " ".join(parts[1:]) if len(parts) > 1 else ""

    base_username = _safe_username(email.split("@")[0])
    username = base_username
    suffix = 1
    while User.objects.filter(username=username).exists():
        suffix += 1
        username = f"{base_username}_{suffix}"[:30]

    user = User.objects.create(
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
    )
    user.set_unusable_password()
    user.save()
    return user


def _issue_tokens(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {
        "user": UserSerializer(user).data,
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "message": "Login successful",
    }


class GoogleLoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        credential = request.data.get("credential") or request.data.get("id_token")
        if not credential:
            return Response({"error": "Missing credential"}, status=status.HTTP_400_BAD_REQUEST)

        expected_aud = config("GOOGLE_CLIENT_ID", default=os.environ.get("GOOGLE_CLIENT_ID"))

        try:
            query = urllib.parse.urlencode({"id_token": credential})
            url = f"https://oauth2.googleapis.com/tokeninfo?{query}"
            with urllib.request.urlopen(url, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            # Basic checks
            email = data.get("email")
            name = data.get("name")
            aud = data.get("aud")
            if expected_aud and aud != expected_aud:
                return Response({"error": "Invalid Google token audience"}, status=status.HTTP_401_UNAUTHORIZED)
            if not email:
                return Response({"error": "Google token did not include email"}, status=status.HTTP_401_UNAUTHORIZED)

            user = _get_or_create_user(email=email, name=name)
            return Response(_issue_tokens(user), status=status.HTTP_200_OK)
        except Exception as exc:
            return Response({"error": f"Google login failed: {exc}"}, status=status.HTTP_401_UNAUTHORIZED)


class FacebookLoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        access_token = request.data.get("access_token")
        if not access_token:
            return Response({"error": "Missing access_token"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            query = urllib.parse.urlencode({
                "fields": "id,name,email",
                "access_token": access_token,
            })
            url = f"https://graph.facebook.com/me?{query}"
            with urllib.request.urlopen(url, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            email = data.get("email")
            name = data.get("name")
            if not email:
                return Response(
                    {"error": "Facebook did not return an email. Ensure you requested the email permission."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            user = _get_or_create_user(email=email, name=name)
            return Response(_issue_tokens(user), status=status.HTTP_200_OK)
        except Exception as exc:
            return Response({"error": f"Facebook login failed: {exc}"}, status=status.HTTP_401_UNAUTHORIZED)
