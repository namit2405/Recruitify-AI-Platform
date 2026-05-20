import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')
django.setup()

from accounts.serializers import CandidateSerializer
from accounts.models import Candidate

# Test data that would come from frontend
test_data = {
    "name": "Test User",
    "email": "test@example.com",
    "phone": "1234567890",
    "address": "Test Address",
    "skills": ["Python", "Django"],
    "experience": [],
    "education": [],
    "availability": "remote only",
    "job_preferences": [],
}

# Get first candidate
candidate = Candidate.objects.first()
if candidate:
    print(f"Testing update for candidate: {candidate.name}")
    serializer = CandidateSerializer(candidate, data=test_data, partial=True)
    if serializer.is_valid():
        print("✓ Serializer is valid")
        print(f"Validated data: {serializer.validated_data}")
    else:
        print("✗ Serializer errors:")
        print(serializer.errors)
else:
    print("No candidates found in database")
