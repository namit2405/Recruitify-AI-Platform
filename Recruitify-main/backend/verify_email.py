import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')
django.setup()

from accounts.models import User

# Get the email from command line or use default
import sys
email = sys.argv[1] if len(sys.argv) > 1 else input("Enter email to verify: ")

try:
    user = User.objects.get(email=email)
    user.email_verified = True
    user.save()
    print(f"✓ Email verified for: {email}")
except User.DoesNotExist:
    print(f"✗ User not found: {email}")
