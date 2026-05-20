"""
Simulates the exact RecommendedCandidatesView logic to surface the real TypeError.
Run: python debug_rec.py
"""
import os, django, traceback
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')
django.setup()

from vacancies.models import Vacancy, Application, JobOffer
from accounts.models import Candidate

for slug in ['software-engineer-technova-solutions', 'senior-react-developer-technova-solutions']:
    print("\n=== Testing slug:", slug, "===")
    try:
        vacancy = Vacancy.objects.get(slug=slug)
    except Vacancy.DoesNotExist:
        print("  NOT FOUND")
        continue

    candidates = Candidate.objects.all()
    for candidate in candidates:
        try:
            score = 0

            # Skills
            candidate_skills = set([s.lower() for s in (candidate.skills or [])])
            required_skills = set([s.lower() for s in (vacancy.required_skills or [])])
            if candidate_skills and required_skills:
                skill_matches = candidate_skills.intersection(required_skills)
                if skill_matches:
                    score += (len(skill_matches) / len(required_skills)) * 40

            # Education
            candidate_education_raw = candidate.education or []
            required_education = [e.lower() for e in (vacancy.education_required or [])]
            if candidate_education_raw and required_education:
                for edu_item in candidate_education_raw:
                    try:
                        if isinstance(edu_item, dict):
                            edu_str = ' '.join(str(val).lower() for val in edu_item.values())
                        else:
                            edu_str = str(edu_item).lower()
                        for req_edu in required_education:
                            if req_edu in edu_str or edu_str in req_edu:
                                score += 20
                                break
                    except Exception as e:
                        print("  edu error for %s: %s" % (candidate.name, e))

            # Experience
            if candidate.experience:
                if vacancy.min_experience_years <= len(candidate.experience):
                    score += 20

            # Job preferences
            if candidate.job_preferences and vacancy.title:
                for pref in candidate.job_preferences:
                    if pref.lower() in vacancy.title.lower() or vacancy.title.lower() in pref.lower():
                        score += 20
                        break

            if score > 0:
                Application.objects.filter(vacancy=vacancy, candidate=candidate).exists()
                JobOffer.objects.filter(vacancy=vacancy, candidate=candidate).exists()
                # profile picture
                if candidate.profile_picture:
                    try:
                        _ = candidate.profile_picture.url
                    except Exception as e:
                        print("  pic error for %s: %s" % (candidate.name, e))

        except Exception as e:
            print("  CRASH on candidate %s (id=%s): %s" % (candidate.name, candidate.id, e))
            traceback.print_exc()

    print("  Done.")
