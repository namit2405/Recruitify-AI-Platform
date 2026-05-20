"""
Test script to check profile endpoint
Run with: python manage.py shell < test_profile.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')
django.setup()

from accounts.models import User, Candidate, Organization

# Get a test user
users = User.objects.all()
print(f"Total users: {users.count()}")

for user in users[:5]:  # Check first 5 users
    print(f"\n--- User: {user.email} ({user.user_type}) ---")
    print(f"  Active: {user.is_active}")
    print(f"  Email verified: {user.email_verified}")
    
    if user.user_type == 'candidate':
        try:
            profile = user.candidate_profile
            print(f"  ✓ Candidate profile exists: {profile.name}")
        except Candidate.DoesNotExist:
            print(f"  ✗ Candidate profile MISSING")
    
    elif user.user_type == 'organization':
        try:
            profile = user.organization_profile
            print(f"  ✓ Organization profile exists: {profile.name}")
        except Organization.DoesNotExist:
            print(f"  ✗ Organization profile MISSING")
