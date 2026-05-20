#!/usr/bin/env python
"""
Script to clear ml_result for an application and trigger re-scoring.
Usage: python scripts/rescore_application.py <application_id>
"""
import sys
import os
from pathlib import Path

# Add backend to path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')

import django
django.setup()

from vacancies.models import Application
from vacancies.ml_scoring import score_application_and_store_resume


def rescore_application(app_id):
    try:
        application = Application.objects.get(pk=app_id)
        print(f"Found application {app_id}")
        print(f"  Candidate: {application.candidate.name}")
        print(f"  Vacancy: {application.vacancy.title}")
        print(f"  Current score: {application.final_score}")
        
        # Clear existing ml_result to force re-scoring
        application.ml_result = None
        application.save()
        print("\nCleared ml_result, re-scoring...")
        
        # Re-score
        score, category = score_application_and_store_resume(
            candidate=application.candidate,
            vacancy=application.vacancy,
            application=application,
        )
        
        # Refresh from DB
        application.refresh_from_db()
        
        print(f"\n✅ Re-scored successfully!")
        print(f"  New score: {application.final_score}")
        print(f"  Category: {application.category}")
        
        # Check if AI summary is present
        ml_result = application.ml_result
        if isinstance(ml_result, str):
            import json
            ml_result = json.loads(ml_result)
        
        fit_summary = ml_result.get('fit_summary', '')
        if 'unavailable' in fit_summary or 'not configured' in fit_summary:
            print(f"\n⚠️  AI Summary: {fit_summary}")
        else:
            print(f"\n✅ AI Summary generated successfully!")
            print(f"   Preview: {fit_summary[:100]}...")
        
    except Application.DoesNotExist:
        print(f"❌ Application {app_id} not found")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/rescore_application.py <application_id>")
        sys.exit(1)
    
    app_id = int(sys.argv[1])
    rescore_application(app_id)
