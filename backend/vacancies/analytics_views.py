from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from datetime import datetime, timedelta
from .models import Application, Vacancy
from accounts.models import Organization


class OrganizationAnalyticsView(APIView):
    """
    Comprehensive analytics for organizations
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != 'organization':
            return Response({"detail": "Forbidden"}, status=403)

        try:
            org = request.user.organization_profile
        except Organization.DoesNotExist:
            return Response({"detail": "Organization profile not found"}, status=404)

        # Get all applications for this organization's vacancies
        applications = Application.objects.filter(vacancy__organization=org)
        vacancies = Vacancy.objects.filter(organization=org)

        # Application status distribution
        status_distribution = applications.values('status').annotate(
            count=Count('id')
        ).order_by('status')

        # Applications over time (last 6 months)
        six_months_ago = datetime.now() - timedelta(days=180)
        applications_timeline = applications.filter(
            applied_at__gte=six_months_ago
        ).annotate(
            month=TruncMonth('applied_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')

        # Format timeline data
        timeline_data = []
        for item in applications_timeline:
            timeline_data.append({
                'month': item['month'].strftime('%b'),
                'applications': item['count']
            })

        # Vacancy performance (applications per vacancy)
        vacancy_performance = []
        for vacancy in vacancies[:10]:  # Top 10 vacancies
            app_count = applications.filter(vacancy=vacancy).count()
            vacancy_performance.append({
                'name': vacancy.title[:20] + '...' if len(vacancy.title) > 20 else vacancy.title,
                'applications': app_count,
                'vacancy_id': vacancy.id
            })

        # Sort by applications count
        vacancy_performance.sort(key=lambda x: x['applications'], reverse=True)

        # Calculate metrics
        total_applications = applications.count()
        pending = applications.filter(status='applied').count()
        reviewing = applications.filter(status='reviewing').count()
        shortlisted = applications.filter(status='shortlisted').count()
        hired = applications.filter(status='hired').count()
        rejected = applications.filter(status='rejected').count()

        # Conversion rates
        conversion_rate = round((hired / total_applications * 100), 1) if total_applications > 0 else 0
        # Success rate: hired from shortlisted (capped at 100%)
        success_rate = min(100.0, round((hired / shortlisted * 100), 1)) if shortlisted > 0 else 0
        rejection_rate = round((rejected / total_applications * 100), 1) if total_applications > 0 else 0

        # Vacancy stats
        open_vacancies = vacancies.filter(status='open').count()
        closed_vacancies = vacancies.filter(status='closed').count()
        total_vacancies = vacancies.count()

        # Average applications per vacancy
        avg_applications = round(total_applications / total_vacancies, 1) if total_vacancies > 0 else 0

        return Response({
            'applications': {
                'total': total_applications,
                'pending': pending,
                'reviewing': reviewing,
                'shortlisted': shortlisted,
                'hired': hired,
                'rejected': rejected,
                'by_status': list(status_distribution),
                'timeline': timeline_data,
            },
            'vacancies': {
                'total': total_vacancies,
                'open': open_vacancies,
                'closed': closed_vacancies,
                'performance': vacancy_performance,
                'avg_applications': avg_applications,
            },
            'metrics': {
                'conversion_rate': conversion_rate,
                'success_rate': success_rate,
                'rejection_rate': rejection_rate,
            }
        })


class CandidateAnalyticsView(APIView):
    """
    Comprehensive analytics for candidates
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != 'candidate':
            return Response({"detail": "Forbidden"}, status=403)

        try:
            candidate = request.user.candidate_profile
        except:
            return Response({"detail": "Candidate profile not found"}, status=404)

        # Get all applications for this candidate
        applications = Application.objects.filter(candidate=candidate)

        # Application status distribution
        status_distribution = applications.values('status').annotate(
            count=Count('id')
        ).order_by('status')

        # Applications over time (last 6 months)
        six_months_ago = datetime.now() - timedelta(days=180)
        applications_timeline = applications.filter(
            applied_at__gte=six_months_ago
        ).annotate(
            month=TruncMonth('applied_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')

        # Format timeline data
        timeline_data = []
        for item in applications_timeline:
            timeline_data.append({
                'month': item['month'].strftime('%b'),
                'applications': item['count']
            })

        # Calculate metrics
        total_applications = applications.count()
        applied = applications.filter(status='applied').count()
        reviewing = applications.filter(status='reviewing').count()
        shortlisted = applications.filter(status='shortlisted').count()
        hired = applications.filter(status='hired').count()
        rejected = applications.filter(status='rejected').count()

        # Success metrics
        response_rate = round(((reviewing + shortlisted + hired + rejected) / total_applications * 100), 1) if total_applications > 0 else 0
        success_rate = round(((shortlisted + hired) / total_applications * 100), 1) if total_applications > 0 else 0
        hire_rate = round((hired / total_applications * 100), 1) if total_applications > 0 else 0

        # Available jobs
        available_jobs = Vacancy.objects.filter(status='open', is_public=True).count()

        return Response({
            'applications': {
                'total': total_applications,
                'applied': applied,
                'reviewing': reviewing,
                'shortlisted': shortlisted,
                'hired': hired,
                'rejected': rejected,
                'by_status': list(status_distribution),
                'timeline': timeline_data,
            },
            'metrics': {
                'response_rate': response_rate,
                'success_rate': success_rate,
                'hire_rate': hire_rate,
            },
            'jobs': {
                'available': available_jobs,
            }
        })
