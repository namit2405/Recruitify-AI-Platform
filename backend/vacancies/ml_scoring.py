# backend/vacancies/ml_scoring.py

import os
import shutil
from typing import Tuple
from django.conf import settings
import json

from vacancies.models import Vacancy, Application
from accounts.models import Candidate

# ✅ USE REAL ML SCORER
from vacancies.ml.scorer import score_resume


def categorize_score(score: float) -> str:
    if score >= 60:
        return "highly_preferred"
    if score >= 50:
        return "mid_preference"
    if score >= 25:
        return "low_preference"
    return "no_visit"


def score_application_and_store_resume(
    candidate: Candidate,
    vacancy: Vacancy,
    application: Application,
) -> Tuple[float, str]:

    # Support both FileField `resume` (current) and legacy `resume_path` attribute
    resume_field = getattr(candidate, "resume", None)
    resume_name = None
    if resume_field:
        # FileField stores the relative path in `.name`
        resume_name = getattr(resume_field, "name", None) or str(resume_field)
    else:
        resume_name = getattr(candidate, "resume_path", None)

    if not resume_name:
        return 0.0, "no_visit"

    media_root = settings.MEDIA_ROOT
    resume_path = os.path.join(media_root, resume_name)

    if not os.path.exists(resume_path):
        return 0.0, "no_visit"

    # 🔑 BUILD JD DICT (THIS WAS MISSING)
    jd = {
        "job_title": getattr(vacancy, "title", None) or "",
        "description": vacancy.description or "",
        # Coerce fields to python sets of strings (vacancy fields may be lists/QuerySets)
        "required_skills": set(map(str, getattr(vacancy, "required_skills", []) or [])),
        "education_required": set(map(str, getattr(vacancy, "education_required", []) or [])),
        "job_title_aliases": set(map(str, getattr(vacancy, "job_title_aliases", []) or [])),
        "keywords": set(map(str, getattr(vacancy, "keywords", []) or [])),
        "min_experience_years": getattr(vacancy, "min_experience_years", 0) or 0,
        "max_experience_years": getattr(vacancy, "max_experience_years", None),
    }

    # 🔥 ACTUAL ML CALL
    result = score_resume(resume_path, jd)

    # --- write debug output so we can inspect scorer internals
    try:
        logs_dir = os.path.join(media_root, "logs")
        os.makedirs(logs_dir, exist_ok=True)
        debug_path = os.path.join(logs_dir, f"application_{application.id}_score.json")
        debug_obj = {
            "candidate_id": candidate.id,
            "vacancy_id": vacancy.id,
            "application_id": application.id,
            "resume_path": resume_path,
            "scorer_result": result,
        }
        with open(debug_path, "w", encoding="utf-8") as fh:
            json.dump(debug_obj, fh, ensure_ascii=False, indent=2)
    except Exception:
        # don't break scoring if logging fails
        pass

    final_score = float(result.get("final_score", 0.0))

    category = categorize_score(final_score)

    # Ensure ml_result is JSON serializable
    try:
        import json
        from enum import Enum
        
        class CustomJSONEncoder(json.JSONEncoder):
            def default(self, obj):
                # Handle Enum
                if isinstance(obj, Enum):
                    return obj.value
                # Handle sets
                if isinstance(obj, set):
                    return list(obj)
                # Handle bytes
                if isinstance(obj, bytes):
                    return obj.decode('utf-8', errors='ignore')
                # Handle objects with __dict__
                if hasattr(obj, '__dict__'):
                    return obj.__dict__
                # Fallback to string
                try:
                    return str(obj)
                except:
                    return None
        
        # First, serialize to JSON string to catch any issues
        json_str = json.dumps(result, cls=CustomJSONEncoder, ensure_ascii=False)
        # Then parse it back to a dict for storage
        serializable_result = json.loads(json_str)
        application.ml_result = serializable_result
    except Exception as e:
        # Fallback: stringify
        print(f"Failed to serialize ml_result: {e}")
        import traceback
        traceback.print_exc()
        application.ml_result = {"error": "Failed to serialize result", "message": str(e)}

    application.final_score = final_score
    application.category = category
    application.save(update_fields=["final_score", "category", "ml_result"])

    # 📁 COPY RESUME
    dest_dir = os.path.join(
        media_root,
        "sorted_resumes",
        f"organization_{vacancy.organization_id}",
        f"vacancy_{vacancy.id}",
        category,
    )
    os.makedirs(dest_dir, exist_ok=True)

    filename = os.path.basename(resume_path)
    dest_file = f"application_{application.id}_candidate_{candidate.id}_{filename}"

    try:
        shutil.copy2(resume_path, os.path.join(dest_dir, dest_file))
    except Exception:
        # non-fatal if copy fails
        pass

    return final_score, category
