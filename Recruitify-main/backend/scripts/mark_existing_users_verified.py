#!/usr/bin/env python
"""
Script to mark all existing users as email verified
Run this once to update users created before OTP system
"""
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


def mark_all_verified():
    print("=" * 50)
    print("Marking Existing Users as Verified")
    print("=" * 50)
    
    # Get all users who are not verified
    unverified_users = User.objects.filter(email_verified=False)
    count = unverified_users.count()
    
    if count == 0:
        print("✅ All users are already verified!")
        return
    
    print(f"\nFound {count} unverified user(s):")
    for user in unverified_users:
        print(f"  - {user.email} (Type: {user.user_type})")
    
    # Mark all as verified
    updated = unverified_users.update(
        email_verified=True,
        is_active=True
    )
    
    print(f"\n✅ Updated {updated} user(s)")
    print("   - email_verified = True")
    print("   - is_active = True")
    print("\nThese users can now login!")
    print("=" * 50)


if __name__ == "__main__":
    mark_all_verified()
