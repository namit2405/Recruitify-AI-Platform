import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')
django.setup()

from accounts.models import Candidate

# Get first candidate
candidate = Candidate.objects.first()
if candidate:
    print(f"Candidate: {candidate.name}")
    print(f"Has accomplishments field: {hasattr(candidate, 'accomplishments')}")
    print(f"Accomplishments value: {candidate.accomplishments}")
    print(f"Type: {type(candidate.accomplishments)}")
    
    # Try to update
    candidate.accomplishments = ["Test accomplishment"]
    candidate.save()
    print("Successfully saved test accomplishment")
else:
    print("No candidates found")
