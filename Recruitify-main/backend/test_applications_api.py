#!/usr/bin/env python
"""
Test script to verify applications API filtering
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')
django.setup()

from accounts.models import User, Candidate
from vacancies.models import Application
from vacancies.serializers import ApplicationSerializer

print("=" * 60)
print("TESTING APPLICATIONS API FILTERING")
print("=" * 60)

# Get all candidate users
candidate_users = User.objects.filter(user_type='candidate')

for user in candidate_users:
    try:
        candidate = user.candidate_profile
        applications = Application.objects.filter(candidate=candidate)
        
        print(f"\nUser: {user.email}")
        print(f"Candidate ID: {candidate.id}")
        print(f"Candidate Name: {candidate.name}")
        print(f"Applications Count: {applications.count()}")
        
        if applications.exists():
            print("Applications:")
            for app in applications:
                print(f"  - App ID: {app.id}, Vacancy: {app.vacancy.title} (ID: {app.vacancy.id})")
                
            # Test serializer
            serializer = ApplicationSerializer(applications, many=True)
            print("\nSerialized Data:")
            for data in serializer.data:
                print(f"  - vacancy: {data['vacancy']}, vacancy_title: {data.get('vacancy_title', 'N/A')}")
        else:
            print("  No applications")
            
    except Exception as e:
        print(f"Error for {user.email}: {e}")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
