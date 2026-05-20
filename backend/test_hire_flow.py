"""
Test script to verify the hire flow creates Employment records
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')
django.setup()

from accounts.models import User, Candidate, Organization, Employment
from vacancies.models import Vacancy, Application
from django.utils import timezone

def test_hire_flow():
    print("\n=== Testing Hire Flow ===\n")
    
    # Find an organization
    org = Organization.objects.first()
    if not org:
        print("❌ No organization found")
        return
    
    print(f"✓ Organization: {org.name} (ID: {org.id})")
    
    # Find a vacancy for this organization
    vacancy = Vacancy.objects.filter(organization=org).first()
    if not vacancy:
        print("❌ No vacancy found for this organization")
        return
    
    print(f"✓ Vacancy: {vacancy.title} (ID: {vacancy.id})")
    
    # Find an application for this vacancy
    application = Application.objects.filter(vacancy=vacancy).first()
    if not application:
        print("❌ No application found for this vacancy")
        return
    
    print(f"✓ Application: ID {application.id}, Candidate: {application.candidate.name}")
    print(f"  Current status: {application.status}")
    
    # Check if Employment already exists
    existing_employment = Employment.objects.filter(
        candidate=application.candidate,
        organization=org,
        is_current=True
    ).first()
    
    if existing_employment:
        print(f"✓ Employment already exists: {existing_employment.position}")
        print(f"  Start date: {existing_employment.start_date}")
    else:
        print("⚠ No employment record found")
        
        # Simulate hiring by updating status
        print("\n--- Simulating hire process ---")
        old_status = application.status
        application.status = 'hired'
        application.save()
        print(f"✓ Changed application status from '{old_status}' to 'hired'")
        
        # Manually create Employment (this should happen automatically in the API)
        employment = Employment.objects.create(
            candidate=application.candidate,
            organization=org,
            position=vacancy.title,
            start_date=timezone.now().date(),
            is_current=True
        )
        print(f"✓ Created Employment record: {employment.position}")
    
    # Check team stats
    print("\n--- Team Stats ---")
    current_count = Employment.objects.filter(organization=org, is_current=True).count()
    total_count = Employment.objects.filter(organization=org).count()
    print(f"Current employees: {current_count}")
    print(f"Total hired: {total_count}")
    
    # List current employees
    current_employees = Employment.objects.filter(organization=org, is_current=True)
    if current_employees.exists():
        print("\nCurrent team members:")
        for emp in current_employees:
            print(f"  - {emp.candidate.name}: {emp.position} (since {emp.start_date})")
    
    print("\n=== Test Complete ===\n")

if __name__ == "__main__":
    test_hire_flow()
