# backend/scripts/test_model_run.py

import os
import sys
import traceback

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')

import django
django.setup()

from vacancies.ml.scorer import score_resume

# Absolute resume path
resume_path = os.path.join(
    BASE_DIR,
    'media',
    'resumes',
    'candidate_1.pdf'
)

job_description = {
    "job_title": "web developer",
    "description": "We need a web developer experienced in html css javascript react django",
    "required_skills": {
        "html", "css", "javascript", "react", "django"
    },
    "education_required": {
        "bachelor", "bca", "bsc", "btech", "computer science"
    },
    "job_title_aliases": {
        "web developer", "frontend developer", "full stack developer"
    },
    "keywords": {
        "frontend", "backend", "api", "responsive"
    },
    "min_experience_years": 1,
    "max_experience_years": 6
}

print("Resume path:", resume_path)

try:
    result = score_resume(resume_path, job_description)
    print("\n=== MODEL RESULT ===")
    for k, v in result.items():
        print(f"{k}: {v}")
except Exception:
    print("\nERROR running score_resume")
    traceback.print_exc()
