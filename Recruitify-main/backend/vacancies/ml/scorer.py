# backend/vacancies/ml/scorer.py

import re
from datetime import datetime
from pathlib import Path
from functools import lru_cache
import os
import json

from dotenv import load_dotenv
import pandas as pd
import pdfplumber
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Try loading common .env locations (project root and ml_standalone)
_HERE = Path(__file__).resolve()
try:
    project_root = _HERE.parents[3]
except Exception:
    project_root = _HERE.parent

_env_loaded = False
for candidate in (
    project_root / ".env",
    project_root / "ml_standalone" / ".env",
    _HERE.parent / ".env",
    _HERE.parents[2] / ".env",   # backend/.env
    _HERE.parents[3] / "backend" / ".env",
):
    if candidate.exists():
        try:
            load_dotenv(candidate)
            _env_loaded = True
            print(f"[DEBUG] Loaded .env from: {candidate}")
            break
        except Exception as e:
            print(f"[DEBUG] Failed to load .env from {candidate}: {e}")
            pass

if not _env_loaded:
    print(f"[DEBUG] No .env file found. Searched: {project_root / '.env'}, {project_root / 'ml_standalone' / '.env'}, {_HERE.parent / '.env'}")

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
print(f"[DEBUG] GROQ_API_KEY loaded: {'Yes' if GROQ_API_KEY else 'No'}")

client = None
if GROQ_API_KEY:
    try:
        from groq import Groq

        client = Groq(api_key=GROQ_API_KEY)
        print("[DEBUG] Groq client initialized successfully")
    except Exception as e:
        print(f"[DEBUG] Failed to initialize Groq client: {e}")
        client = None
else:
    print("[DEBUG] GROQ_API_KEY not set, client will be None")


# ==================================================
# PATHS
# ==================================================

BASE_DIR = Path(__file__).resolve().parent.parent   # vacancies/
DATASETS_DIR = BASE_DIR / "Datasets"


# ==================================================
# DATASET LOADERS (CACHED)
# ==================================================

@lru_cache(maxsize=1)
def load_master_data():
    resume_csv = DATASETS_DIR / "UpdatedResumeDataSet.csv"
    try:
        df = pd.read_csv(resume_csv.as_posix(), encoding="utf-8")
    except UnicodeDecodeError:
        df = pd.read_csv(resume_csv.as_posix(), encoding="latin1")

    df["Resume"] = df["Resume"].astype(str)

    skills_master = set()
    titles_master = set()
    degrees_master = set()

    try:
        skills_df = pd.read_excel((DATASETS_DIR / "Technology Skills.xlsx").as_posix())
        skills_master = set(
            skills_df["Skills"].dropna().astype(str).str.lower().str.strip()
        )

        titles_master = set(
            skills_df["Title"].dropna().astype(str).str.lower().str.strip()
        )
    except Exception:
        # missing optional skills file; continue with empty masters
        pass

    try:
        degrees_df = pd.read_excel((DATASETS_DIR / "ProgramsDataset.xlsx").as_posix())
        degrees_master = set(
            degrees_df["Programme"].dropna().astype(str).str.lower().str.strip()
        )
    except Exception:
        pass

    return df, skills_master, titles_master, degrees_master


@lru_cache(maxsize=1)
def load_tfidf():
    df, _, _, _ = load_master_data()

    tfidf = TfidfVectorizer(
        stop_words="english",
        max_features=6000,
        ngram_range=(1, 2),
    )
    tfidf.fit(df["Resume"])
    return tfidf


# ==================================================
# TEXT HELPERS
# ==================================================

def clean_text(text: str) -> str:
    text = text.encode("utf-8", "ignore").decode("utf-8", "ignore")
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def normalize_token(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


# ==================================================
# PDF EXTRACTION
# ==================================================

def extract_text_from_pdf(path: str) -> str:
    text = ""
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + " "
    return text


# ==================================================
# EXPERIENCE EXTRACTION (MATCHES modelv3)
# ==================================================

def extract_experience_years(text: str) -> float:
    text = text.lower()
    current_year = datetime.now().year

    match = re.search(
        r"experience\s*\n(.*?)(?:\n\s*education|\n\s*skills|\n\s*projects|\Z)",
        text,
        re.IGNORECASE | re.DOTALL,
    )

    if not match:
        return 0.0

    section = match.group(1)
    ranges = []

    # Year-Year and Year-Present
    year_ranges = re.findall(
        r"(20\d{2})\s*(?:-|to|–|—)\s*(20\d{2}|present|current)",
        section,
    )

    for start, end in year_ranges:
        start = int(start)
        end = current_year if end in {"present", "current"} else int(end)
        if end > start:
            ranges.append((start, end))

    # Month-Year patterns
    month_ranges = re.findall(
        r"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(20\d{2}).{0,15}(20\d{2}|present|current)",
        section,
    )

    for _, start, end in month_ranges:
        start = int(start)
        end = current_year if end in {"present", "current"} else int(end)
        if end > start:
            ranges.append((start, end))

    if not ranges:
        return 0.0

    ranges.sort()
    total = 0
    last_end = None

    for start, end in ranges:
        if last_end is None:
            total += end - start
            last_end = end
        elif start <= last_end:
            total += max(0, end - last_end)
            last_end = max(last_end, end)
        else:
            total += end - start
            last_end = end

    return round(total, 2)


def experience_score(years: float, jd: dict) -> float:
    min_exp = jd.get("min_experience_years", 0)
    max_exp = jd.get("max_experience_years")

    if years < min_exp:
        return 0.0
    if max_exp and years > max_exp:
        return 100.0

    return min(100.0, (years / min_exp) * 100) if min_exp else 100.0


# ==================================================
# ENTITY EXTRACTION
# ==================================================

def extract_entities(text: str, entities: set) -> set:
    found = set()
    norm_text = normalize_token(text)

    for ent in entities:
        words = clean_text(ent).split()
        if all(normalize_token(w) in norm_text for w in words):
            found.add(ent)

    return found


def extract_job_titles(text: str, titles_master: set, jd_aliases: set) -> set:
    found = set()
    norm_text = normalize_token(text)

    for title in titles_master | jd_aliases:
        words = clean_text(title).split()
        if all(normalize_token(w) in norm_text for w in words):
            found.add(title)

    return found


def parse_resume(text: str, jd: dict) -> dict:
    _, skills_master, titles_master, degrees_master = load_master_data()
    return {
        "skills": extract_entities(text, set(map(str.lower, skills_master)) | set(map(str.lower, jd.get("required_skills", set())))),
        "degrees": extract_entities(text, set(map(str.lower, degrees_master)) | set(map(str.lower, jd.get("education_required", set())))),
        "job_titles": extract_job_titles(text, set(map(str.lower, titles_master)), set(map(str.lower, jd.get("job_title_aliases", set())))),
        "experience_years": 0.0,
        "keywords": extract_entities(text, set(map(str.lower, jd.get("keywords", set())))),
    }


# ==================================================
# SEMANTIC SCORING
# ==================================================

def semantic_score(resume_text: str, jd_text: str) -> float:
    tfidf = load_tfidf()
    vec = tfidf.transform([resume_text, jd_text])
    return round(cosine_similarity(vec[0], vec[1])[0][0] * 100, 2)


def generate_ai_fit_summary(result: dict, jd: dict) -> dict:
    """
    Use Groq (if available) to generate recruiter-style summary.
    Falls back to simple rule-based output when API not configured.
    """
    def _recommendation_from_score(score: float) -> str:
        try:
            s = float(score)
        except Exception:
            return "Unknown"
        if s >= 60:
            return "Strongly Recommend Interview"
        if s >= 50:
            return "Consider"
        if s >= 25:
            return "Low Priority"
        return "Not Recommended"

    if client is None:
        return {
            "fit_summary": "AI summary unavailable (GROQ_API_KEY not configured).",
            "recommendation": _recommendation_from_score(result.get("final_score", 0.0)),
            "strengths": [],
            "weaknesses": [],
        }

    prompt = f"""
You are a senior technical recruiter.

Evaluate this candidate for the role of {jd.get('job_title')}.

Job Requirements:
- Required Skills: {', '.join(jd.get('required_skills', []))}
- Minimum Experience: {jd.get('min_experience_years')}

Candidate Evaluation Data:
- Final Score: {result.get('final_score')}%
- Skill Match: {result.get('skill_match_pct')}%
- Experience Years: {result.get('experience_years')}
- Education Match: {result.get('education_match')}
- Job Title Match: {result.get('job_title_match')}
- Semantic Similarity: {result.get('semantic_similarity')}%
- Matched Skills: {', '.join(result.get('matched_skills', []))}
- Missing Skills: {', '.join(result.get('missing_skills', []))}
- Missing Keywords: {', '.join(result.get('missing_keywords', []))}

Respond STRICTLY in JSON format:

{{
  "fit_summary": "...5-7 sentence professional recruiter explanation...",
  "recommendation": "Strongly Recommend Interview | Consider | Low Priority | Not Recommended",
  "strengths": ["point1", "point2", "point3"],
  "weaknesses": ["point1", "point2"]
}}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert HR recruiter."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=800,
        )

        content = response.choices[0].message.content

        # extract JSON substring
        if '```json' in content:
            content = content.split('```json')[1].split('```')[0]
        elif '{' in content and '}' in content:
            start = content.find('{')
            end = content.rfind('}') + 1
            content = content[start:end]

        parsed = json.loads(content)
        # Ensure recommendation present
        if "recommendation" not in parsed:
            parsed["recommendation"] = _recommendation_from_score(result.get("final_score", 0.0))
        return parsed
    except Exception as e:
        return {
            "fit_summary": f"AI summary failed: {str(e)}",
            "recommendation": _recommendation_from_score(result.get("final_score", 0.0)),
            "strengths": [],
            "weaknesses": [],
        }


# ==================================================
# MATCHING & FINAL SCORE
# ==================================================

def match_resume_to_jd(resume: dict, jd: dict, semantic_sim: float) -> dict:
    # Lowercase-normalized sets for safe matching
    jd_required = set(map(str.lower, jd.get("required_skills", set())))
    jd_education = set(map(str.lower, jd.get("education_required", set())))
    jd_keywords = set(map(str.lower, jd.get("keywords", set())))
    jd_aliases = set(map(str.lower, jd.get("job_title_aliases", set())))

    skill_match = set(map(str.lower, resume.get("skills", set()))) & jd_required
    req_skills_count = len(jd_required)
    skill_score = (len(skill_match) / req_skills_count) * 100 if req_skills_count > 0 else 0.0

    education_match = bool(set(map(str.lower, resume.get("degrees", set()))) & jd_education)
    education_score = 100 if education_match else 0

    # title matching with flexible rules
    extracted_titles = set(map(str.lower, resume.get("job_titles", set())))
    title_match = False
    matched_titles = set()
    for ext in extracted_titles:
        ext_words = set(ext.split())
        for alias in jd_aliases:
            alias_words = set(alias.split())
            if ext_words & alias_words and len(ext_words & alias_words) >= max(1, len(alias_words) - 1):
                title_match = True
                matched_titles.add(ext)
                break

    title_score = 100 if title_match else 0

    exp_score = experience_score(resume.get("experience_years", 0.0), jd)

    keyword_match = set(map(str.lower, resume.get("keywords", set()))) & jd_keywords
    kw_count = len(jd_keywords)
    keyword_score = (len(keyword_match) / kw_count * 100) if kw_count > 0 else 0.0

    final_score = (
        0.35 * skill_score
        + 0.15 * semantic_sim
        + 0.17 * education_score
        + 0.16 * exp_score
        + 0.12 * keyword_score
        + 0.05 * title_score
    )

    return {
        "skill_match_pct": round(skill_score, 2),
        "matched_skills": sorted(skill_match),
        "missing_skills": sorted(jd_required - skill_match),
        "education_match": education_match,
        "job_title_match": title_match,
        "extracted_job_titles": sorted(extracted_titles),
        "matched_job_titles": sorted(matched_titles),
        "experience_years": resume.get("experience_years", 0.0),
        "experience_score": round(exp_score, 2),
        "keyword_match_pct": round(keyword_score, 2),
        "matched_keywords": sorted(keyword_match),
        "missing_keywords": sorted(jd_keywords - keyword_match),
        "semantic_similarity": semantic_sim,
        "final_score": round(final_score, 2),
    }


# ==================================================
# PUBLIC API
# ==================================================

def score_resume(resume_pdf_path: str, jd: dict) -> dict:
    resume_raw_text = extract_text_from_pdf(resume_pdf_path)
    resume_text = clean_text(resume_raw_text)
    parsed_resume = parse_resume(resume_text, jd)
    parsed_resume["experience_years"] = extract_experience_years(resume_raw_text)

    semantic_sim = 0.0
    try:
        semantic_sim = semantic_score(resume_text, jd.get("description", ""))
    except Exception:
        semantic_sim = 0.0

    result = match_resume_to_jd(parsed_resume, jd, semantic_sim)

    # Attach AI summary when possible
    try:
        ai = generate_ai_fit_summary(result, jd)
        result.update(ai)
    except Exception:
        # non-fatal
        pass

    return result
