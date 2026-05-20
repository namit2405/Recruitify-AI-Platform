#!/usr/bin/env python
"""
Test script to verify search suggestions functionality
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')
django.setup()

from vacancies.models import Vacancy
from accounts.models import Organization, Candidate
from django.db.models import Q

print("=" * 60)
print("TESTING SEARCH SUGGESTIONS")
print("=" * 60)

# Test queries
test_queries = ["web", "dev", "net", "admin", "xpr", "delhi", "jal", "senior", "entry", "gau", "namit", "jha"]

for query in test_queries:
    print(f"\n--- Suggestions for: '{query}' ---")
    
    suggestions = []
    
    # Get vacancy titles
    vacancies = Vacancy.objects.filter(
        Q(title__icontains=query) | Q(location__icontains=query),
        is_public=True,
        status='open'
    )[:5]
    
    for vacancy in vacancies:
        suggestions.append({
            'type': 'vacancy',
            'text': vacancy.title,
            'subtitle': vacancy.location or 'Job',
        })
    
    # Get organization names
    organizations = Organization.objects.filter(
        Q(name__icontains=query)
    )[:3]
    
    for org in organizations:
        suggestions.append({
            'type': 'organization',
            'text': org.name,
            'subtitle': 'Organization',
        })
    
    # Get candidate names
    candidates = Candidate.objects.filter(
        Q(name__icontains=query)
    )[:3]
    
    for candidate in candidates:
        suggestions.append({
            'type': 'candidate',
            'text': candidate.name,
            'subtitle': 'Candidate',
        })
    
    # Get skills
    all_vacancies = Vacancy.objects.filter(is_public=True, status='open')
    skill_suggestions = set()
    
    for vacancy in all_vacancies:
        for skill in vacancy.required_skills:
            if query.lower() in str(skill).lower():
                skill_suggestions.add(str(skill))
                if len(skill_suggestions) >= 3:
                    break
        if len(skill_suggestions) >= 3:
            break
    
    for skill in skill_suggestions:
        suggestions.append({
            'type': 'skill',
            'text': skill,
            'subtitle': 'Skill',
        })
    
    # Get locations
    all_vacancies_list = Vacancy.objects.filter(is_public=True, status='open')
    location_suggestions = set()
    for vacancy in all_vacancies_list:
        if vacancy.location and query.lower() in vacancy.location.lower():
            location_suggestions.add(vacancy.location)
            if len(location_suggestions) >= 2:
                break
    
    for location in location_suggestions:
        suggestions.append({
            'type': 'location',
            'text': location,
            'subtitle': 'Location',
        })
    
    # Get experience levels
    experience_levels = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Manager']
    for level in experience_levels:
        if query.lower() in level.lower():
            suggestions.append({
                'type': 'experience',
                'text': level,
                'subtitle': 'Experience Level',
            })
    
    print(f"Total suggestions: {len(suggestions)}")
    for s in suggestions[:10]:
        print(f"  [{s['type']}] {s['text']} - {s['subtitle']}")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
