from django.db import transaction
from django.utils import timezone
from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from django.db.models import Q
from django.http import HttpResponse, FileResponse
import os
import zipfile
import shutil
from pathlib import Path

from .models import Vacancy, Application, JobOffer
from .serializers import VacancySerializer, ApplicationSerializer, JobOfferSerializer
from accounts.models import Organization, Candidate
from accounts.serializers import CandidateSerializer, OrganizationSerializer, PublicCandidateSerializer, PublicOrganizationSerializer
from .ml_scoring import score_application_and_store_resume
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from rest_framework.views import APIView
from notifications.utils import (
    notify_application_status_change,
    notify_new_application,
    notify_application_submitted,
    notify_new_vacancy,
    notify_vacancy_closed,
)

# ======================================================
# VACANCIES
# ======================================================

class VacancyListCreateView(generics.ListCreateAPIView):
    serializer_class = VacancySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        org_id = self.request.query_params.get('organization')

        # If organization ID is provided, return public vacancies for that org
        if org_id:
            return Vacancy.objects.filter(
                organization_id=org_id,
                is_public=True,
                status='open'
            )

        if user.user_type == 'organization':
            try:
                org = user.organization_profile
                return Vacancy.objects.filter(organization=org)
            except Organization.DoesNotExist:
                return Vacancy.objects.none()

        if user.user_type == 'candidate':
            # Show all open vacancies (both public and private) to candidates
            return Vacancy.objects.filter(status='open')

        return Vacancy.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.user_type != 'organization':
            raise permissions.PermissionDenied("Only organizations can post vacancies")

        try:
            org = user.organization_profile
        except Organization.DoesNotExist:
            raise permissions.PermissionDenied("Organization profile not found")

        # Generate passcode for private vacancies
        import random
        import string
        is_public = serializer.validated_data.get('is_public', True)
        passcode = None
        
        if not is_public:
            # Generate 6-character alphanumeric passcode
            passcode = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        
        vacancy = serializer.save(organization=org, passcode=passcode)
        
        # Send notifications to all candidates about new vacancy (only if public)
        if is_public:
            try:
                notify_new_vacancy(vacancy)
            except Exception as e:
                # Don't fail vacancy creation if notification fails
                print(f"Failed to send notifications: {e}")


class VacancyDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VacancySerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'organization':
            return Vacancy.objects.filter(organization__user=user)
        if user.user_type == 'candidate':
            return Vacancy.objects.all()
        return Vacancy.objects.none()
    
    def retrieve(self, request, *args, **kwargs):
        """
        Override retrieve to show full details for all vacancies
        Passcode verification will happen during application, not viewing
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_update(self, serializer):
        vacancy = self.get_object()
        if vacancy.organization.user != self.request.user:
            raise permissions.PermissionDenied("You cannot edit this vacancy")
        import random, string
        is_public = serializer.validated_data.get('is_public', vacancy.is_public)
        if not is_public and not vacancy.passcode:
            passcode = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            serializer.save(passcode=passcode)
        elif is_public:
            serializer.save(passcode=None)
        else:
            serializer.save()

    def perform_destroy(self, instance):
        if instance.organization.user != self.request.user:
            raise permissions.PermissionDenied("You cannot delete this vacancy")
        instance.delete()


class PublicVacancyDetailView(generics.RetrieveAPIView):
    """
    Public endpoint — no authentication required.
    Returns vacancy details for sharing via link.
    Lookup by slug.
    """
    serializer_class = VacancySerializer
    permission_classes = [permissions.AllowAny]
    queryset = Vacancy.objects.all()
    lookup_field = 'slug'

    def retrieve(self, request, *args, **kwargs):
        try:
            vacancy = Vacancy.objects.get(slug=kwargs['slug'])
        except Vacancy.DoesNotExist:
            return Response({"detail": "Vacancy not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(vacancy)
        return Response(serializer.data)


class PublicVacancyListView(generics.ListAPIView):
    """
    Public endpoint — no authentication required.
    Returns up to 10 open public vacancies for the Browse Jobs page.
    """
    serializer_class = VacancySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Vacancy.objects.filter(
            is_public=True,
            status='open'
        ).order_by('-created_at')[:10]


class VacancyNotifyView(APIView):
    """
    Notify all candidates who applied to a vacancy about updates
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        user = request.user
        if user.user_type != 'organization':
            return Response({"detail": "Only organizations can send notifications"}, status=status.HTTP_403_FORBIDDEN)
        try:
            vacancy = Vacancy.objects.get(slug=slug)
        except Vacancy.DoesNotExist:
            return Response({"detail": "Vacancy not found"}, status=status.HTTP_404_NOT_FOUND)
        if vacancy.organization.user != user:
            return Response({"detail": "You do not have permission to notify candidates for this vacancy"}, status=status.HTTP_403_FORBIDDEN)

        message = request.data.get('message', '').strip()
        if not message:
            return Response(
                {"detail": "Message is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get all applications for this vacancy
        applications = Application.objects.filter(vacancy=vacancy)

        if applications.count() == 0:
            return Response(
                {"detail": "No candidates have applied to this vacancy yet"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Send notifications to all candidates
        from notifications.models import Notification
        notifications_created = 0

        for application in applications:
            try:
                Notification.objects.create(
                    user=application.candidate.user,
                    title=f"Update: {vacancy.title}",
                    message=message,
                    notification_type='vacancy_update',
                    related_vacancy=vacancy,
                    related_application=application,
                )
                notifications_created += 1
            except Exception as e:
                print(f"Failed to create notification for candidate {application.candidate.id}: {e}")

        return Response({
            "detail": f"Successfully notified {notifications_created} candidate(s)",
            "candidates_notified": notifications_created,
        }, status=status.HTTP_200_OK)


class VacancyPasscodeVerifyView(APIView):
    """
    Verify passcode for private vacancies
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        user = request.user
        if user.user_type != 'candidate':
            return Response({"detail": "Only candidates can verify passcodes"}, status=status.HTTP_403_FORBIDDEN)
        try:
            vacancy = Vacancy.objects.get(slug=slug)
        except Vacancy.DoesNotExist:
            return Response({"detail": "Vacancy not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check if vacancy is private
        if vacancy.is_public:
            return Response(
                {"detail": "This vacancy is public and doesn't require a passcode"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        passcode = request.data.get('passcode', '').strip()
        if not passcode:
            return Response(
                {"detail": "Passcode is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify passcode
        if vacancy.passcode != passcode:
            return Response(
                {"detail": "Invalid passcode"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Return vacancy details if passcode is correct
        serializer = VacancySerializer(vacancy)
        return Response({
            "detail": "Passcode verified successfully",
            "vacancy": serializer.data,
        }, status=status.HTTP_200_OK)


# ======================================================
# APPLICATIONS
# ======================================================

class ApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
           return Application.objects.all()

        if user.user_type == 'candidate':
            try:
                candidate = user.candidate_profile
                return Application.objects.filter(candidate=candidate)
            except Candidate.DoesNotExist:
                return Application.objects.none()

        if user.user_type == 'organization':
            try:
                org = user.organization_profile
                return Application.objects.filter(vacancy__organization=org)
            except Organization.DoesNotExist:
                return Application.objects.none()

        return Application.objects.none()

    def perform_create(self, serializer):
        user = self.request.user

        if user.user_type != 'candidate':
            raise permissions.PermissionDenied("Only candidates can apply")

        try:
            candidate = user.candidate_profile
        except Candidate.DoesNotExist:
            raise permissions.PermissionDenied("Candidate profile not found")

        vacancy_id = self.request.data.get("vacancy")
        vacancy_slug = self.request.data.get("vacancy_slug")

        if not vacancy_id and not vacancy_slug:
            raise serializers.ValidationError("Vacancy is required")

        # Look up by slug first, fall back to id for backwards compat
        try:
            if vacancy_slug:
                vacancy = Vacancy.objects.get(slug=vacancy_slug)
            else:
                vacancy = Vacancy.objects.get(id=vacancy_id)
        except Vacancy.DoesNotExist:
            raise serializers.ValidationError("Vacancy not found")

        if Application.objects.filter(candidate=candidate, vacancy=vacancy, is_self_test=False).exists():
            raise serializers.ValidationError("You have already applied for this vacancy")

        if not candidate.resume:
            raise serializers.ValidationError("Upload a PDF resume before applying")

        if not candidate.resume.name.lower().endswith(".pdf"):
            raise serializers.ValidationError("Upload a PDF resume before applying")

        # Check if vacancy is private and verify passcode
        if not vacancy.is_public:
            passcode = self.request.data.get("passcode", "").strip()
            if not passcode:
                raise serializers.ValidationError("Passcode is required for private vacancies")
            if vacancy.passcode != passcode:
                raise serializers.ValidationError("Invalid passcode")

        # --- TRANSACTION SAFE APPLICATION + ML ---
        with transaction.atomic():
            application = serializer.save(
                candidate=candidate,
                vacancy=vacancy,
                status="applied",
            )

            try:
                final_score, category = score_application_and_store_resume(
                    candidate=candidate,
                    vacancy=vacancy,
                    application=application,
                )
            except Exception:
                # ML failure should not break DB consistency
                final_score = 0.0
                category = "no_visit"

            application.final_score = final_score
            application.category = category
            application.save(update_fields=["final_score", "category"])
            
            # Send notifications
            try:
                # Notify candidate that application was submitted
                notify_application_submitted(application)
                # Notify organization about new application
                notify_new_application(application)
            except Exception as e:
                # Don't fail application if notification fails
                print(f"Failed to send notifications: {e}")


class ApplicationDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Application.objects.all()
    lookup_field = 'slug'

    def patch(self, request, *args, **kwargs):
        application = self.get_object()
        user = request.user

        # Only vacancy owner can update
        if (
            user.user_type != 'organization'
            or application.vacancy.organization.user != user
        ):
            return Response(
                {"detail": "You do not have permission to update this application"},
                status=status.HTTP_403_FORBIDDEN,
            )

        status_value = request.data.get("status")

        if status_value not in dict(Application.STATUS_CHOICES):
            return Response(
                {"detail": "Invalid status"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = application.status
        application.status = status_value
        application.save(update_fields=["status"])
        
        # If status changed to 'hired', automatically create Employment record
        if old_status != 'hired' and status_value == 'hired':
            from accounts.models import Employment
            
            # Check if employment already exists
            existing_employment = Employment.objects.filter(
                candidate=application.candidate,
                organization=application.vacancy.organization,
                is_current=True
            ).first()
            
            if not existing_employment:
                try:
                    Employment.objects.create(
                        candidate=application.candidate,
                        organization=application.vacancy.organization,
                        position=application.vacancy.title,
                        start_date=timezone.now().date(),
                        is_current=True
                    )
                except Exception as e:
                    print(f"Failed to create employment record: {e}")
        
        # Send notification if status changed
        if old_status != status_value:
            try:
                notify_application_status_change(application, old_status, status_value)
            except Exception as e:
                # Don't fail update if notification fails
                print(f"Failed to send notification: {e}")
            
            # Send email to candidate
            try:
                from .email_service import send_status_update_email
                send_status_update_email(application, status_value)
            except Exception as e:
                print(f"Failed to send status email: {e}")

        serializer = self.get_serializer(application)
        return Response(serializer.data)



class OrganizationDashboardAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.user_type != "organization":
            return Response({"detail": "Not allowed"}, status=403)

        try:
            organization = user.organization_profile
        except Organization.DoesNotExist:
            return Response({"detail": "Organization profile not found"}, status=404)

        vacancies = Vacancy.objects.filter(organization=organization)
        applications = Application.objects.filter(vacancy__organization=organization)

        # ---------- Basic counts ----------
        total_vacancies = vacancies.count()
        open_vacancies = vacancies.filter(status="open").count()
        closed_vacancies = vacancies.filter(status="closed").count()

        total_applications = applications.count()

        # ---------- Status breakdown ----------
        status_breakdown = (
            applications.values("status")
            .annotate(count=Count("id"))
            .order_by()
        )

        # ---------- Category breakdown ----------
        category_breakdown = (
            applications.values("category")
            .annotate(count=Count("id"))
            .order_by()
        )

        # ---------- Vacancy vs Applications ----------
        vacancy_applications = (
            vacancies.annotate(app_count=Count("applications"))
            .values("title", "app_count")
        )

        return Response({
            "vacancies": {
                "total": total_vacancies,
                "open": open_vacancies,
                "closed": closed_vacancies,
            },
            "applications": {
                "total": total_applications,
                "by_status": list(status_breakdown),
                "by_category": list(category_breakdown),
            },
            "vacancy_applications": list(vacancy_applications),
        })
        
class ApplicationAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        try:
            application = Application.objects.get(slug=slug)
        except Application.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)

        user = request.user

        # Only organization that owns vacancy can see analysis
        if (
            user.user_type != "organization"
            or application.vacancy.organization.user != user
        ):
            return Response(
                {"detail": "You do not have permission to view this analysis"},
                status=403,
            )

        # If analysis not present, attempt to run scorer synchronously for the owner
        if not application.ml_result:
            try:
                # score_application_and_store_resume will write ml_result, final_score and logs
                score_application_and_store_resume(
                    candidate=application.candidate,
                    vacancy=application.vacancy,
                    application=application,
                )
                # refresh from DB
                application.refresh_from_db()
            except Exception:
                return Response(
                    {"detail": "No ML analysis available"},
                    status=404,
                )

        return Response({
            "application_id": application.id,
            "application_slug": application.slug,
            "candidate_name": application.candidate.name,
            "candidate_website_url": application.candidate.website_url,
            "candidate_github_url": application.candidate.github_url,
            "candidate_linkedin_url": application.candidate.linkedin_url,
            "candidate_instagram_url": application.candidate.instagram_url,
            "vacancy_title": application.vacancy.title,
            "status": application.status,
            "applied_at": application.applied_at,
            "final_score": application.final_score,
            "category": application.category,
            "analysis": application.ml_result,
        })


class GlobalSearchView(APIView):
    """
    Global search endpoint that searches across:
    - Vacancies (title, description, location, required_skills, keywords)
    - Candidates (name, email, skills, job_preferences)
    - Organizations (name, description, location)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        
        if not query:
            return Response({
                'vacancies': [],
                'candidates': [],
                'organizations': [],
                'total_results': 0,
            })

        user = request.user
        
        # Search Vacancies
        vacancy_query = Q(title__icontains=query) | \
                       Q(description__icontains=query) | \
                       Q(location__icontains=query) | \
                       Q(experience_level__icontains=query)
        
        # Also search in JSON fields (required_skills, keywords)
        vacancies = Vacancy.objects.filter(vacancy_query, is_public=True, status='open')
        
        # Filter JSON fields in Python (since JSON field search is complex)
        filtered_vacancies = []
        for vacancy in vacancies:
            # Check if query matches any skill or keyword
            skills_match = any(query.lower() in str(skill).lower() for skill in vacancy.required_skills)
            keywords_match = any(query.lower() in str(keyword).lower() for keyword in vacancy.keywords)
            
            if skills_match or keywords_match or vacancy in vacancies:
                filtered_vacancies.append(vacancy)
        
        # Remove duplicates
        vacancy_ids = set(v.id for v in filtered_vacancies)
        vacancies = Vacancy.objects.filter(id__in=vacancy_ids, is_public=True, status='open')[:10]
        
        # Search Candidates (visible to all users)
        candidate_query = Q(name__icontains=query) | \
                        Q(email__icontains=query) | \
                        Q(address__icontains=query) | \
                        Q(availability__icontains=query)
        
        candidates = Candidate.objects.filter(candidate_query)
        
        # Filter JSON fields in Python
        filtered_candidates = []
        for candidate in candidates:
            skills_match = any(query.lower() in str(skill).lower() for skill in candidate.skills)
            prefs_match = any(query.lower() in str(pref).lower() for pref in candidate.job_preferences)
            
            if skills_match or prefs_match or candidate in candidates:
                filtered_candidates.append(candidate)
        
        # Remove duplicates
        candidate_ids = set(c.id for c in filtered_candidates)
        candidates = Candidate.objects.filter(id__in=candidate_ids)[:10]
        
        # Search Organizations (visible to all authenticated users)
        org_query = Q(name__icontains=query) | \
                   Q(description__icontains=query) | \
                   Q(location__icontains=query) | \
                   Q(contact_email__icontains=query)
        
        organizations = Organization.objects.filter(org_query)[:10]
        
        # Serialize results
        vacancy_serializer = VacancySerializer(vacancies, many=True)
        candidate_serializer = PublicCandidateSerializer(candidates, many=True, context={'request': request})
        org_serializer = PublicOrganizationSerializer(organizations, many=True, context={'request': request})
        
        total_results = len(vacancies) + len(candidates) + len(organizations)
        
        return Response({
            'query': query,
            'vacancies': vacancy_serializer.data,
            'candidates': candidate_serializer.data,
            'organizations': org_serializer.data,
            'total_results': total_results,
        })


class SearchSuggestionsView(APIView):
    """
    Provides search suggestions/autocomplete based on partial query
    Returns top 10 suggestions from each category
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        
        if not query or len(query) < 2:
            # Return popular/recent searches or empty
            return Response({
                'suggestions': [],
            })

        user = request.user
        suggestions = []
        
        # Get vacancy titles and locations
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
                'id': vacancy.id,
            })
        
        # Get organization names (visible to all)
        organizations = Organization.objects.filter(
            Q(name__icontains=query)
        )[:3]
        
        for org in organizations:
            suggestions.append({
                'type': 'organization',
                'text': org.name,
                'subtitle': 'Organization',
                'slug': org.slug,
            })
        
        # Get candidate names (visible to all users)
        candidates = Candidate.objects.filter(
            Q(name__icontains=query)
        )[:3]
        
        for candidate in candidates:
            suggestions.append({
                'type': 'candidate',
                'text': candidate.name,
                'subtitle': 'Candidate',
                'slug': candidate.slug,
            })
        
        # Add skill-based suggestions from vacancies
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
                'id': None,
            })
        
        # Add location-based suggestions from vacancies
        location_suggestions = set()
        for vacancy in all_vacancies:
            if vacancy.location and query.lower() in vacancy.location.lower():
                location_suggestions.add(vacancy.location)
                if len(location_suggestions) >= 2:
                    break
        
        for location in location_suggestions:
            suggestions.append({
                'type': 'location',
                'text': location,
                'subtitle': 'Location',
                'id': None,
            })
        
        # Add experience level suggestions
        experience_levels = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Manager']
        for level in experience_levels:
            if query.lower() in level.lower():
                suggestions.append({
                    'type': 'experience',
                    'text': level,
                    'subtitle': 'Experience Level',
                    'id': None,
                })
        
        return Response({
            'query': query,
            'suggestions': suggestions[:10],  # Limit to 10 total suggestions
        })


class DownloadVacancyResumesView(APIView):
    """
    Download all resumes for a vacancy organized by category as a ZIP file
    Structure: Resumes/Vacancy_Name/Category/Candidate_Name.pdf
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        user = request.user
        if user.user_type != 'organization':
            return Response({"detail": "Only organizations can download resumes"}, status=status.HTTP_403_FORBIDDEN)
        try:
            vacancy = Vacancy.objects.get(slug=slug)
        except Vacancy.DoesNotExist:
            return Response({"detail": "Vacancy not found"}, status=status.HTTP_404_NOT_FOUND)
        if vacancy.organization.user != user:
            return Response({"detail": "You do not have permission to download resumes for this vacancy"}, status=status.HTTP_403_FORBIDDEN)

        # Get all applications for this vacancy
        applications = Application.objects.filter(vacancy=vacancy).select_related('candidate')

        if applications.count() == 0:
            return Response(
                {"detail": "No applications found for this vacancy"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Create a temporary directory for organizing files
        import tempfile
        temp_dir = tempfile.mkdtemp()
        
        try:
            # Create base structure: Resumes/Vacancy_Name/
            vacancy_name = vacancy.title.replace('/', '_').replace('\\', '_')
            base_path = Path(temp_dir) / "Resumes" / vacancy_name
            
            # Organize resumes by category
            for application in applications:
                if not application.candidate.resume:
                    continue
                
                # Get category folder name
                category = application.category or 'no_visit'
                category_path = base_path / category
                category_path.mkdir(parents=True, exist_ok=True)
                
                # Get candidate name and create filename
                candidate_name = application.candidate.name.replace('/', '_').replace('\\', '_')
                resume_filename = f"{candidate_name}.pdf"
                dest_path = category_path / resume_filename
                
                # Copy resume file
                try:
                    resume_path = application.candidate.resume.path
                    if os.path.exists(resume_path):
                        shutil.copy2(resume_path, dest_path)
                except Exception as e:
                    print(f"Failed to copy resume for {candidate_name}: {e}")
                    continue
            
            # Create ZIP file
            zip_filename = f"{vacancy_name}_resumes.zip"
            zip_path = Path(temp_dir) / zip_filename
            
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(base_path):
                    for file in files:
                        file_path = Path(root) / file
                        arcname = file_path.relative_to(temp_dir)
                        zipf.write(file_path, arcname)
            
            # Read ZIP file and return as response
            with open(zip_path, 'rb') as f:
                response = HttpResponse(f.read(), content_type='application/zip')
                response['Content-Disposition'] = f'attachment; filename="{zip_filename}"'
                return response
                
        finally:
            # Clean up temporary directory
            try:
                shutil.rmtree(temp_dir)
            except Exception as e:
                print(f"Failed to clean up temp directory: {e}")


class BrowseOrganizationResumesView(APIView):
    """
    Browse the organized resume folder structure for an organization
    Returns the folder/file tree structure
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.user_type != 'organization':
            return Response(
                {"detail": "Only organizations can browse resumes"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            org = user.organization_profile
        except Organization.DoesNotExist:
            return Response(
                {"detail": "Organization profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        from django.conf import settings
        media_root = settings.MEDIA_ROOT
        org_folder = os.path.join(media_root, "sorted_resumes", f"organization_{org.id}")

        if not os.path.exists(org_folder):
            return Response({
                "organization_id": org.id,
                "organization_name": org.name,
                "vacancies": [],
                "message": "No resumes found yet"
            })

        # Build folder structure
        vacancies_data = []
        
        for vacancy_folder in os.listdir(org_folder):
            vacancy_path = os.path.join(org_folder, vacancy_folder)
            if not os.path.isdir(vacancy_path):
                continue
            
            # Extract vacancy ID from folder name (vacancy_X)
            try:
                vacancy_id = int(vacancy_folder.split('_')[1])
                vacancy = Vacancy.objects.get(id=vacancy_id)
            except (IndexError, ValueError, Vacancy.DoesNotExist):
                continue
            
            # Get categories and resumes
            categories_data = []
            for category_folder in os.listdir(vacancy_path):
                category_path = os.path.join(vacancy_path, category_folder)
                if not os.path.isdir(category_path):
                    continue
                
                # Get all PDF files in this category
                resumes = []
                for filename in os.listdir(category_path):
                    if filename.lower().endswith('.pdf'):
                        file_path = os.path.join(category_path, filename)
                        file_size = os.path.getsize(file_path)
                        file_modified = os.path.getmtime(file_path)
                        
                        # Extract application ID from filename (application_X_...)
                        try:
                            app_id = int(filename.split('_')[1])
                            application = Application.objects.get(id=app_id)
                            # Use same logic as serializer for self-tests
                            if application.is_self_test:
                                candidate_name = f"Self Test #{application.self_test_number}"
                            else:
                                candidate_name = application.candidate.name
                            candidate_id = application.candidate.id
                        except (IndexError, ValueError, Application.DoesNotExist):
                            candidate_name = filename.replace('.pdf', '')
                            candidate_id = None
                            app_id = None
                        
                        # Build relative URL for download
                        relative_path = os.path.join(
                            "sorted_resumes",
                            f"organization_{org.id}",
                            vacancy_folder,
                            category_folder,
                            filename
                        )
                        
                        resumes.append({
                            "filename": filename,
                            "candidate_name": candidate_name,
                            "candidate_id": candidate_id,
                            "application_id": app_id,
                            "size": file_size,
                            "modified": file_modified,
                            "url": f"/media/{relative_path}",
                        })
                
                if resumes:
                    categories_data.append({
                        "name": category_folder,
                        "count": len(resumes),
                        "resumes": resumes,
                    })
            
            if categories_data:
                vacancies_data.append({
                    "id": vacancy.id,
                    "title": vacancy.title,
                    "folder_name": vacancy_folder,
                    "categories": categories_data,
                    "total_resumes": sum(cat['count'] for cat in categories_data),
                })
        
        return Response({
            "organization_id": org.id,
            "organization_name": org.name,
            "vacancies": vacancies_data,
            "total_vacancies": len(vacancies_data),
            "total_resumes": sum(v['total_resumes'] for v in vacancies_data),
        })


class SelfTestVacancyView(APIView):
    """
    Allow organizations to upload test resumes to see ML scoring
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        user = request.user
        if user.user_type != 'organization':
            return Response({"detail": "Only organizations can perform self-tests"}, status=status.HTTP_403_FORBIDDEN)
        try:
            vacancy = Vacancy.objects.get(slug=slug)
        except Vacancy.DoesNotExist:
            return Response({"detail": "Vacancy not found"}, status=status.HTTP_404_NOT_FOUND)
        if vacancy.organization.user != user:
            return Response({"detail": "You do not have permission to test this vacancy"}, status=status.HTTP_403_FORBIDDEN)

        # Get uploaded resume file
        resume_file = request.FILES.get('resume')
        if not resume_file:
            return Response(
                {"detail": "Resume file is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate PDF
        if not resume_file.name.lower().endswith('.pdf'):
            return Response(
                {"detail": "Only PDF files are allowed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get or create a dummy candidate for self-tests
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Create a unique email for self-test user per organization
        test_email = f"selftest_{vacancy.organization_id}@test.local"
        
        try:
            test_user = User.objects.get(email=test_email)
            test_candidate = test_user.candidate_profile
        except User.DoesNotExist:
            # Create test user and candidate
            test_user = User.objects.create(
                email=test_email,
                user_type='candidate',
                email_verified=True,
            )
            test_user.set_unusable_password()
            test_user.save()
            
            test_candidate = Candidate.objects.create(
                user=test_user,
                name="Self Test",
                phone="0000000000",
            )

        # Save the resume file
        from django.core.files.storage import default_storage
        import os
        
        # Get next self-test number for this vacancy
        last_test = Application.objects.filter(
            vacancy=vacancy,
            is_self_test=True
        ).order_by('-self_test_number').first()
        
        test_number = (last_test.self_test_number + 1) if last_test else 1
        
        # Save resume with unique name
        resume_filename = f"selftest_{vacancy.id}_{test_number}_{resume_file.name}"
        resume_path = os.path.join('resumes', resume_filename)
        
        try:
            saved_path = default_storage.save(resume_path, resume_file)
        except Exception as e:
            print(f"Failed to save resume file: {e}")
            return Response(
                {"detail": f"Failed to save resume: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Create application with the saved resume path
        try:
            # Create self-test application
            application = Application.objects.create(
                vacancy=vacancy,
                candidate=test_candidate,
                status='reviewing',
                is_self_test=True,
                self_test_number=test_number,
            )
            
            print(f"Created self-test application {application.id} for vacancy {vacancy.id}")

            # Temporarily update candidate resume for ML scoring
            original_resume_path = test_candidate.resume.name if test_candidate.resume else None
            test_candidate.resume = saved_path
            test_candidate.save()
            
            print(f"Updated candidate resume to: {saved_path}")

            # Run ML scoring
            final_score = 0.0
            category = "no_visit"
            
            try:
                from .ml_scoring import score_application_and_store_resume
                
                final_score, category = score_application_and_store_resume(
                    candidate=test_candidate,
                    vacancy=vacancy,
                    application=application,
                )
                print(f"ML scoring completed: score={final_score}, category={category}")
            except Exception as ml_error:
                print(f"ML scoring failed for self-test: {ml_error}")
                import traceback
                traceback.print_exc()
                # Continue with default values
            
            # Restore original resume
            if original_resume_path:
                test_candidate.resume = original_resume_path
            else:
                test_candidate.resume = ''
            test_candidate.save()
            
            print(f"Restored candidate resume")

            # Update application with scores
            application.final_score = final_score
            application.category = category
            application.save(update_fields=['final_score', 'category'])

            # Refresh from DB to get the saved ml_result
            application.refresh_from_db()
            
            # Get ml_result and FORCE it to be JSON-safe
            import json
            from enum import Enum
            
            ml_result_data = application.ml_result
            
            # Convert to JSON string and back to ensure no Enums
            if ml_result_data:
                try:
                    # Force serialize to string and parse back
                    json_str = json.dumps(ml_result_data, default=str)
                    ml_result_data = json.loads(json_str)
                except Exception as e:
                    print(f"Failed to serialize ml_result: {e}")
                    ml_result_data = "ML analysis available in application details"
            else:
                ml_result_data = "ML analysis not available"

            # Build response with explicit type conversions
            response_data = {
                "detail": "Self-test completed successfully",
                "application_id": int(application.id),
                "test_number": int(test_number),
                "final_score": float(final_score) if final_score is not None else 0.0,
                "category": str(category),
                "ml_result": ml_result_data,
            }
            
            # Final safety check - convert entire response to JSON and back
            try:
                safe_json = json.dumps(response_data, default=str)
                response_data = json.loads(safe_json)
            except Exception as e:
                print(f"Final serialization check failed: {e}")
                # Ultra-safe fallback
                response_data = {
                    "detail": "Self-test completed successfully",
                    "application_id": int(application.id),
                    "test_number": int(test_number),
                    "final_score": float(final_score) if final_score is not None else 0.0,
                    "category": str(category),
                    "ml_result": "ML analysis completed - view in application details",
                }

            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            # Clean up uploaded file on error
            try:
                if default_storage.exists(saved_path):
                    default_storage.delete(saved_path)
            except:
                pass
            
            print(f"Self-test error: {e}")
            import traceback
            traceback.print_exc()
            
            return Response(
                {"detail": f"Self-test failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )




# ======================================================
# JOB OFFER VIEWS
# ======================================================

class RecommendedCandidatesView(APIView):
    """
    Get recommended candidates for a vacancy based on profile matching
    (not resume-based, just profile information)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        try:
            vacancy = Vacancy.objects.get(slug=slug)
        except Vacancy.DoesNotExist:
            return Response({"detail": "Vacancy not found"}, status=404)

        # Check if user owns this vacancy
        if request.user.user_type != 'organization':
            return Response({"detail": "Only organizations can view recommendations"}, status=403)
        
        if vacancy.organization.user != request.user:
            return Response({"detail": "You don't have permission to view this vacancy"}, status=403)

        # Get all candidates
        from accounts.models import Candidate
        candidates = Candidate.objects.all()

        # Simple matching based on profile fields
        recommendations = []
        for candidate in candidates:
            try:
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
                        reasons.append(f"Matches {len(skill_matches)} required skills")

                # Match education
                # candidate.education is a list of dicts like {"degree": "B.Tech", "institution": "...", "year": ...}
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
                                    reasons.append("Education matches requirements")
                                    break
                        except Exception:
                            continue

                # Match experience level
                if candidate.experience:
                    candidate_exp_years = len(candidate.experience)  # Rough estimate
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

                # Only include candidates with some match
                if score > 0:
                    has_applied = Application.objects.filter(
                        vacancy=vacancy,
                        candidate=candidate
                    ).exists()
                    
                    has_offer = JobOffer.objects.filter(
                        vacancy=vacancy,
                        candidate=candidate
                    ).exists()

                    profile_picture_url = None
                    if candidate.profile_picture:
                        try:
                            profile_picture_url = request.build_absolute_uri(candidate.profile_picture.url)
                        except Exception:
                            pass

                    recommendations.append({
                        'candidate_id': candidate.id,
                        'candidate_slug': candidate.slug,
                        'candidate_name': candidate.name,
                        'candidate_email': candidate.user.email,
                        'profile_picture_url': profile_picture_url,
                        'match_score': min(round(score), 100),
                        'match_reasons': reasons,
                        'skills': candidate.skills or [],
                        'education': candidate.education or [],
                        'experience_count': len(candidate.experience or []),
                        'has_applied': has_applied,
                        'has_offer': has_offer,
                    })
            except Exception:
                continue

        # Sort by score
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)

        return Response({
            'vacancy_id': vacancy.id,
            'vacancy_title': vacancy.title,
            'recommendations': recommendations[:20]  # Top 20
        })


class SendJobOfferView(APIView):
    """
    Send a job offer to a candidate
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.user_type != 'organization':
            return Response({"detail": "Only organizations can send offers"}, status=403)

        vacancy_slug = request.data.get('vacancy_slug')
        candidate_id = request.data.get('candidate_id')
        message = request.data.get('message', '')

        if not vacancy_slug or not candidate_id:
            return Response({"detail": "vacancy_slug and candidate_id required"}, status=400)

        try:
            vacancy = Vacancy.objects.get(slug=vacancy_slug)
            from accounts.models import Candidate
            candidate = Candidate.objects.get(id=candidate_id)
        except (Vacancy.DoesNotExist, Candidate.DoesNotExist):
            return Response({"detail": "Vacancy or candidate not found"}, status=404)

        # Check if user owns this vacancy
        if vacancy.organization.user != request.user:
            return Response({"detail": "You don't have permission for this vacancy"}, status=403)

        # Check if offer already exists
        existing_offer = JobOffer.objects.filter(
            vacancy=vacancy,
            candidate=candidate
        ).first()

        if existing_offer:
            return Response({
                "detail": "Offer already sent to this candidate",
                "offer_slug": existing_offer.slug,
                "status": existing_offer.status
            }, status=400)

        # Create offer
        offer = JobOffer.objects.create(
            vacancy=vacancy,
            candidate=candidate,
            organization=vacancy.organization,
            message=message
        )

        # Send notification
        try:
            from notifications.models import Notification
            Notification.objects.create(
                user=candidate.user,
                title="New Job Offer",
                message=f"{vacancy.organization.name} has offered you a position: {vacancy.title}",
                notification_type='job_offer',
            )
        except Exception as e:
            print(f"Failed to send notification: {e}")

        serializer = JobOfferSerializer(offer, context={'request': request})
        return Response(serializer.data, status=201)


class JobOfferListView(APIView):
    """
    List job offers
    - For organizations: offers they've sent
    - For candidates: offers they've received
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type == 'organization':
            offers = JobOffer.objects.filter(
                organization__user=request.user
            ).select_related('vacancy', 'candidate', 'organization')
        else:  # candidate
            offers = JobOffer.objects.filter(
                candidate__user=request.user
            ).select_related('vacancy', 'candidate', 'organization')

        serializer = JobOfferSerializer(offers, many=True, context={'request': request})
        return Response(serializer.data)


class JobOfferDetailView(APIView):
    """
    Get, update, or delete a specific job offer
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        try:
            offer = JobOffer.objects.select_related('vacancy', 'candidate', 'organization').get(slug=slug)
        except JobOffer.DoesNotExist:
            return Response({"detail": "Offer not found"}, status=404)
        if request.user.user_type == 'organization':
            if offer.organization.user != request.user:
                return Response({"detail": "Permission denied"}, status=403)
        else:
            if offer.candidate.user != request.user:
                return Response({"detail": "Permission denied"}, status=403)
        serializer = JobOfferSerializer(offer, context={'request': request})
        return Response(serializer.data)

    def patch(self, request, slug):
        """Update offer status (accept/reject for candidates, withdraw for organizations)"""
        try:
            offer = JobOffer.objects.get(slug=slug)
        except JobOffer.DoesNotExist:
            return Response({"detail": "Offer not found"}, status=404)

        new_status = request.data.get('status')
        
        if request.user.user_type == 'candidate':
            if offer.candidate.user != request.user:
                return Response({"detail": "Permission denied"}, status=403)
            
            if new_status not in ['accepted', 'rejected']:
                return Response({"detail": "Invalid status for candidate"}, status=400)
            
            offer.status = new_status
            offer.responded_at = timezone.now()
            offer.save()

            # Create notification for organization
            try:
                from notifications.models import Notification
                Notification.objects.create(
                    user=offer.organization.user,
                    title=f"Offer {new_status.title()}",
                    message=f"{offer.candidate.name} has {new_status} your offer for {offer.vacancy.title}",
                    notification_type='offer_response',
                )
            except Exception as e:
                print(f"Failed to send notification: {e}")

        else:  # organization
            if offer.organization.user != request.user:
                return Response({"detail": "Permission denied"}, status=403)
            
            if new_status != 'withdrawn':
                return Response({"detail": "Organizations can only withdraw offers"}, status=400)
            
            offer.status = new_status
            offer.save()

        serializer = JobOfferSerializer(offer, context={'request': request})
        return Response(serializer.data)
