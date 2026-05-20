"""
Test Google Calendar connection
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')
django.setup()

from accounts.models import Organization

def check_connection():
    """Check if Google Calendar is connected"""
    
    org = Organization.objects.get(name="Xpress Cargo")
    
    print(f"Organization: {org.name}")
    print(f"Google credentials exist: {bool(org.google_credentials)}")
    
    if org.google_credentials:
        print("\n✓ Google Calendar is CONNECTED!")
        print(f"Credentials length: {len(org.google_credentials)} characters")
    else:
        print("\n✗ Google Calendar is NOT connected")
        print("The OAuth flow did not save credentials")

if __name__ == '__main__':
    check_connection()
