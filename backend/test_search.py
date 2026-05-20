#!/usr/bin/env python
"""
Test script to verify search functionality
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')
django.setup()

from vacancies.models import Vacancy
from accounts.models import Organization, Candidate
from django.db.models import Q

print("=" * 60)
print("TESTING SEARCH FUNCTIONALITY")
print("=" * 60)

# Test data
test_queries = ["developer", "web", "python", "network", "admin", "gaurav", "namit", "jha"]

for query in test_queries:
    print(f"\n--- Searching for: '{query}' ---")
    
    # Search Vacancies
    vacancy_query = Q(title__icontains=query) | \
                   Q(description__icontains=query) | \
                   Q(location__icontains=query) | \
                   Q(experience_level__icontains=query)
    
    vacancies = Vacancy.objects.filter(vacancy_query, is_public=True, status='open')
    print(f"Vacancies found: {vacancies.count()}")
    for v in vacancies:
        print(f"  - {v.title} (ID: {v.id})")
    
    # Search Candidates
    candidate_query = Q(name__icontains=query) | \
                     Q(email__icontains=query) | \
                     Q(address__icontains=query)
    
    candidates = Candidate.objects.filter(candidate_query)
    print(f"Candidates found: {candidates.count()}")
    for c in candidates:
        print(f"  - {c.name} (ID: {c.id})")
    
    # Search Organizations
    org_query = Q(name__icontains=query) | \
               Q(description__icontains=query) | \
               Q(location__icontains=query)
    
    organizations = Organization.objects.filter(org_query)
    print(f"Organizations found: {organizations.count()}")
    for o in organizations:
        print(f"  - {o.name} (ID: {o.id})")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
