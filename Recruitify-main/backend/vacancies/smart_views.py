"""
Smart placement portal features:
1. Profile Strength Score
2. Smart Job Recommendations
3. Skill Gap Analysis
4. Hiring Pipeline Board
"""
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q

from accounts.models import Candidate
from .models import Vacancy, Application
from .serializers import VacancySerializer


# ─────────────────────────────────────────────
# 1. Profile Strength Score
# ─────────────────────────────────────────────
class ProfileStrengthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.user_type != 'candidate':
            return Response({"detail": "Candidates only"}, status=403)

        try:
            c = user.candidate_profile
        except Candidate.DoesNotExist:
            return Response({"detail": "Profile not found"}, status=404)

        checks = [
            ("Profile picture",     bool(c.profile_picture)),
            ("Cover photo",         bool(c.cover_photo)),
            ("Full name",           bool(c.name and c.name.strip())),
            ("Phone number",        bool(c.phone and c.phone.strip())),
            ("Location / address",  bool(c.address and c.address.strip())),
            ("Professional summary",bool(c.summary and c.summary.strip())),
            ("Skills (≥3)",         len(c.skills) >= 3),
            ("Work experience",     len(c.experience) > 0),
            ("Education",           len(c.education) > 0),
            ("Accomplishments",     len(c.accomplishments) > 0),
            ("Resume uploaded",     bool(c.resume)),
            ("LinkedIn URL",        bool(c.linkedin_url and c.linkedin_url.strip())),
            ("GitHub URL",          bool(c.github_url and c.github_url.strip())),
        ]

        completed = [label for label, done in checks if done]
        missing   = [label for label, done in checks if not done]
        score     = round(len(completed) / len(checks) * 100)

        return Response({
            "score": score,
            "completed": completed,
            "missing": missing,
            "total_checks": len(checks),
        })


# ─────────────────────────────────────────────
# 2. Smart Job Recommendations
# ─────────────────────────────────────────────
class SmartJobRecommendationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.user_type != 'candidate':
            return Response({"detail": "Candidates only"}, status=403)

        try:
            candidate = user.candidate_profile
        except Candidate.DoesNotExist:
            return Response({"detail": "Profile not found"}, status=404)

        candidate_skills = {str(s).lower() for s in candidate.skills}
        candidate_prefs  = {str(p).lower() for p in candidate.job_preferences}

        # Only open, public vacancies the candidate hasn't applied to
        applied_ids = set(
            Application.objects.filter(candidate=candidate, is_self_test=False)
            .values_list('vacancy_id', flat=True)
        )
        vacancies = Vacancy.objects.filter(status='open', is_public=True).exclude(id__in=applied_ids)

        scored = []
        for v in vacancies:
            req_skills = {str(s).lower() for s in v.required_skills}
            keywords   = {str(k).lower() for k in v.keywords}

            if not req_skills:
                match_pct = 0
            else:
                matched = candidate_skills & req_skills
                match_pct = round(len(matched) / len(req_skills) * 100)

            # Bonus for job preference match
            pref_bonus = 10 if any(p in v.title.lower() for p in candidate_prefs) else 0
            final = min(match_pct + pref_bonus, 100)

            scored.append((final, v))

        # Sort descending, take top 10
        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[:10]

        results = []
        for match_score, v in top:
            data = VacancySerializer(v).data
            data['match_score'] = match_score
            results.append(data)

        return Response(results)


# ─────────────────────────────────────────────
# 3. Skill Gap Analysis
# ─────────────────────────────────────────────
class SkillGapView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, vacancy_slug):
        user = request.user
        if user.user_type != 'candidate':
            return Response({"detail": "Candidates only"}, status=403)
        try:
            candidate = user.candidate_profile
        except Candidate.DoesNotExist:
            return Response({"detail": "Profile not found"}, status=404)
        try:
            vacancy = Vacancy.objects.get(slug=vacancy_slug)
        except Vacancy.DoesNotExist:
            return Response({"detail": "Vacancy not found"}, status=404)

        candidate_skills = {str(s).lower() for s in candidate.skills}
        required_skills  = [str(s) for s in vacancy.required_skills]

        matched = [s for s in required_skills if s.lower() in candidate_skills]
        missing = [s for s in required_skills if s.lower() not in candidate_skills]

        match_pct = round(len(matched) / len(required_skills) * 100) if required_skills else 100

        return Response({
            "vacancy_title": vacancy.title,
            "required_skills": required_skills,
            "matched_skills": matched,
            "missing_skills": missing,
            "match_percentage": match_pct,
        })


# ─────────────────────────────────────────────
# 4. Hiring Pipeline Board (Kanban)
# ─────────────────────────────────────────────
class HiringPipelineView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.user_type != 'organization':
            return Response({"detail": "Organizations only"}, status=403)

        try:
            org = user.organization_profile
        except Exception:
            return Response({"detail": "Organization profile not found"}, status=404)

        vacancy_slug = request.query_params.get('vacancy')
        qs = Application.objects.filter(
            vacancy__organization=org,
            is_self_test=False
        ).select_related('candidate', 'candidate__user', 'vacancy')

        if vacancy_slug:
            qs = qs.filter(vacancy__slug=vacancy_slug)

        STAGES = ['applied', 'reviewing', 'shortlisted', 'interview_scheduled',
                  'interview_completed', 'rejected', 'hired']

        pipeline = {stage: [] for stage in STAGES}

        for app in qs:
            card = {
                "id": app.id,
                "slug": app.slug,
                "candidate_name": app.candidate.name,
                "candidate_slug": app.candidate.slug,
                "vacancy_title": app.vacancy.title,
                "vacancy_slug": app.vacancy.slug,
                "final_score": app.final_score,
                "applied_at": app.applied_at,
                "interview_datetime": app.interview_datetime,
            }
            stage = app.status if app.status in pipeline else 'applied'
            pipeline[stage].append(card)

        # Sort each column by score desc
        for stage in pipeline:
            pipeline[stage].sort(key=lambda x: x['final_score'] or 0, reverse=True)

        return Response(pipeline)
