"""
Test script to demonstrate the job offers feature
Run this after starting the Django server
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')
django.setup()

from accounts.models import User, Organization, Candidate
from vacancies.models import Vacancy, JobOffer

def test_recommendations():
    print("\n" + "="*60)
    print("TESTING JOB OFFERS FEATURE")
    print("="*60)
    
    # Get or create test organization
    try:
        org_user = User.objects.filter(user_type='organization').first()
        if not org_user:
            print("❌ No organization users found. Please create one first.")
            return
        
        org = Organization.objects.get(user=org_user)
        print(f"\n✓ Found organization: {org.name}")
    except Organization.DoesNotExist:
        print("❌ Organization profile not found")
        return
    
    # Get or create a test vacancy
    vacancy = Vacancy.objects.filter(organization=org).first()
    if not vacancy:
        print("\n📝 Creating test vacancy...")
        vacancy = Vacancy.objects.create(
            organization=org,
            title="Senior Python Developer",
            description="We are looking for an experienced Python developer",
            required_skills=["Python", "Django", "REST API", "PostgreSQL"],
            education_required=["Bachelor's in Computer Science", "Master's in Software Engineering"],
            min_experience_years=3,
            max_experience_years=7,
            location="Remote",
            salary_range="$80,000 - $120,000",
            experience_level="Senior",
        )
        print(f"✓ Created vacancy: {vacancy.title}")
    else:
        print(f"\n✓ Found existing vacancy: {vacancy.title}")
    
    print(f"   Required Skills: {', '.join(vacancy.required_skills)}")
    print(f"   Education: {', '.join(vacancy.education_required)}")
    print(f"   Experience: {vacancy.min_experience_years}-{vacancy.max_experience_years} years")
    
    # Get all candidates
    candidates = Candidate.objects.all()
    print(f"\n📊 Found {candidates.count()} candidates in database")
    
    if candidates.count() == 0:
        print("❌ No candidates found. Please create candidate profiles first.")
        return
    
    # Test matching algorithm
    print("\n🔍 Running matching algorithm...")
    print("-" * 60)
    
    recommendations = []
    for candidate in candidates:
        score = 0
        reasons = []
        
        # Match skills
        candidate_skills = set([s.lower() for s in (candidate.skills or [])])
        required_skills = set([s.lower() for s in (vacancy.required_skills or [])])
        
        if candidate_skills and required_skills:
            skill_matches = candidate_skills.intersection(required_skills)
            if skill_matches:
                skill_score = (len(skill_matches) / len(required_skills)) * 40
                score += skill_score
                reasons.append(f"Matches {len(skill_matches)}/{len(required_skills)} required skills")
        
        # Match education
        candidate_education = [e.lower() for e in (candidate.education or [])]
        required_education = [e.lower() for e in (vacancy.education_required or [])]
        
        if candidate_education and required_education:
            for edu in candidate_education:
                for req_edu in required_education:
                    if req_edu in edu or edu in req_edu:
                        score += 20
                        reasons.append("Education matches requirements")
                        break
        
        # Match experience
        if candidate.experience:
            candidate_exp_years = len(candidate.experience)
            if vacancy.min_experience_years <= candidate_exp_years:
                score += 20
                reasons.append(f"Has {candidate_exp_years}+ years experience")
        
        # Match job preferences
        if candidate.job_preferences and vacancy.title:
            candidate_prefs = [p.lower() for p in candidate.job_preferences]
            vacancy_title_lower = vacancy.title.lower()
            for pref in candidate_prefs:
                if pref in vacancy_title_lower or vacancy_title_lower in pref:
                    score += 20
                    reasons.append("Job matches preferences")
                    break
        
        if score > 0:
            recommendations.append({
                'candidate': candidate,
                'score': min(round(score), 100),
                'reasons': reasons
            })
    
    # Sort by score
    recommendations.sort(key=lambda x: x['score'], reverse=True)
    
    print(f"\n✓ Found {len(recommendations)} matching candidates")
    print("\n📋 TOP RECOMMENDATIONS:")
    print("-" * 60)
    
    for i, rec in enumerate(recommendations[:5], 1):
        candidate = rec['candidate']
        print(f"\n{i}. {candidate.name} ({candidate.user.email})")
        print(f"   Match Score: {rec['score']}%")
        print(f"   Skills: {', '.join(candidate.skills[:3]) if candidate.skills else 'None'}")
        print(f"   Reasons:")
        for reason in rec['reasons']:
            print(f"      ✓ {reason}")
    
    # Check existing offers
    existing_offers = JobOffer.objects.filter(vacancy=vacancy)
    print(f"\n📧 Existing offers for this vacancy: {existing_offers.count()}")
    
    if existing_offers.exists():
        print("\nOffer Status:")
        for offer in existing_offers:
            print(f"   • {offer.candidate.name}: {offer.status}")
    
    print("\n" + "="*60)
    print("TEST COMPLETE!")
    print("="*60)
    print("\n📝 To test in the UI:")
    print("1. Login as an organization")
    print("2. Go to Vacancy Management")
    print(f"3. Click on '{vacancy.title}'")
    print("4. Scroll down to see 'Recommended Candidates' section")
    print("5. Click 'Send Offer' on any candidate")
    print("\n")

if __name__ == "__main__":
    test_recommendations()
