import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')
django.setup()

from django.test import RequestFactory
from accounts.views import CandidateProfileView
from accounts.models import User, Candidate

# Get a candidate user
candidate_user = User.objects.filter(user_type='candidate').first()
if not candidate_user:
    print("No candidate user found")
    exit()

print(f"Testing with user: {candidate_user.email}")

# Create a mock request
factory = RequestFactory()
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

request = factory.patch(
    '/auth/profile/candidate/',
    data=json.dumps(test_data),
    content_type='application/json'
)
request.user = candidate_user

# Call the view
view = CandidateProfileView.as_view()
response = view(request)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.data if hasattr(response, 'data') else response.content}")
