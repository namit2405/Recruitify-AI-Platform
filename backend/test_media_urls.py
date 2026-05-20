"""
Test what media URLs are being returned by the API
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')
django.setup()

from accounts.models import Organization, Candidate
from accounts.serializers import OrganizationSerializer, CandidateSerializer
from django.test import RequestFactory

def test_urls():
    """Test media URL generation"""
    
    factory = RequestFactory()
    request = factory.get('/api/auth/profile/')
    request.META['HTTP_HOST'] = 'recruitify.namits.shop'
    request.META['wsgi.url_scheme'] = 'https'
    
    print("=" * 60)
    print("Testing Organization media URLs:")
    print("=" * 60)
    
    org = Organization.objects.filter(profile_picture__isnull=False).first()
    if org:
        serializer = OrganizationSerializer(org, context={'request': request})
        data = serializer.data
        print(f"\nOrganization: {org.name}")
        print(f"Profile picture field: {org.profile_picture}")
        print(f"Profile picture URL: {data.get('profile_picture_url')}")
        print(f"Cover photo field: {org.cover_photo}")
        print(f"Cover photo URL: {data.get('cover_photo_url')}")
    else:
        print("No organization with profile picture found")
    
    print("\n" + "=" * 60)
    print("Testing Candidate media URLs:")
    print("=" * 60)
    
    candidate = Candidate.objects.filter(profile_picture__isnull=False).first()
    if candidate:
        serializer = CandidateSerializer(candidate, context={'request': request})
        data = serializer.data
        print(f"\nCandidate: {candidate.name}")
        print(f"Profile picture field: {candidate.profile_picture}")
        print(f"Profile picture URL: {data.get('profile_picture_url')}")
        print(f"Cover photo field: {candidate.cover_photo}")
        print(f"Cover photo URL: {data.get('cover_photo_url')}")
    else:
        print("No candidate with profile picture found")

if __name__ == '__main__':
    test_urls()
