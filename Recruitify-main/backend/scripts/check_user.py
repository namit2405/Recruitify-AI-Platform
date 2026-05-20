#!/usr/bin/env python
import sys
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')

import django
django.setup()

from accounts.models import User

email = sys.argv[1] if len(sys.argv) > 1 else 'nja@gmail.com'

try:
    user = User.objects.get(email=email)
    print(f"Email: {user.email}")
    print(f"Email Verified: {user.email_verified}")
    print(f"MFA Enabled: {user.mfa_enabled}")
    print(f"Active: {user.is_active}")
    print(f"User Type: {user.user_type}")
except User.DoesNotExist:
    print(f"User {email} not found")
