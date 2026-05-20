# backend/scripts/get_token_and_profile.py

import os
import sys

# Add backend root to PYTHONPATH
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def main():
    if len(sys.argv) < 2:
        print("Usage: python get_token_and_profile.py <user_email>")
        sys.exit(1)

    email = sys.argv[1]

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        print(f"User with email '{email}' not found")
        sys.exit(1)

    refresh = RefreshToken.for_user(user)

    print("\n=== JWT TOKENS ===")
    print("ACCESS_TOKEN:", str(refresh.access_token))
    print("REFRESH_TOKEN:", str(refresh))
    print("\nUSER:")
    print({
        "id": user.id,
        "email": user.email,
        "user_type": user.user_type
    })

if __name__ == "__main__":
    main()
