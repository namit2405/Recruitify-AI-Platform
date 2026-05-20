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

print("All Users:")
print("=" * 80)
for user in User.objects.all():
    print(f"Email: {user.email:40} | Type: {user.user_type:12} | Verified: {user.email_verified} | MFA: {user.mfa_enabled}")
