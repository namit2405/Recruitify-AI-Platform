from django.urls import path
from .smart_views import (
    ProfileStrengthView,
    SmartJobRecommendationsView,
    SkillGapView,
    HiringPipelineView,
)
from .views import (
    ApplicationAnalysisView,
    VacancyListCreateView,
    VacancyDetailView,
    PublicVacancyDetailView,
    VacancyNotifyView,
    VacancyPasscodeVerifyView,
    ApplicationListCreateView,
    ApplicationDetailView,
    OrganizationDashboardAnalyticsView,
    GlobalSearchView,
    SearchSuggestionsView,
    DownloadVacancyResumesView,
    BrowseOrganizationResumesView,
    SelfTestVacancyView,
    RecommendedCandidatesView,
    SendJobOfferView,
    JobOfferListView,
    JobOfferDetailView,
)
from .analytics_views import (
    OrganizationAnalyticsView,
    CandidateAnalyticsView,
)
from .interview_views import (
    ScheduleInterviewView,
    UpdateInterviewView,
    CancelInterviewView,
)

urlpatterns = [
    # =========================
    # VACANCIES  (slug-based)
    # =========================
    path('vacancies/', VacancyListCreateView.as_view(), name='vacancy-list-create'),
    path('vacancies/<slug:slug>/', VacancyDetailView.as_view(), name='vacancy-detail'),
    path('vacancies/<slug:slug>/public/', PublicVacancyDetailView.as_view(), name='vacancy-public-detail'),
    path('vacancies/<slug:slug>/notify/', VacancyNotifyView.as_view(), name='vacancy-notify'),
    path('vacancies/<slug:slug>/verify-passcode/', VacancyPasscodeVerifyView.as_view(), name='vacancy-verify-passcode'),
    path('vacancies/<slug:slug>/download-resumes/', DownloadVacancyResumesView.as_view(), name='vacancy-download-resumes'),
    path('vacancies/<slug:slug>/self-test/', SelfTestVacancyView.as_view(), name='vacancy-self-test'),
    path('vacancies/<slug:slug>/recommended-candidates/', RecommendedCandidatesView.as_view(), name='recommended-candidates'),

    path('resumes/browse/', BrowseOrganizationResumesView.as_view(), name='browse-organization-resumes'),
    path('organization/dashboard/', OrganizationDashboardAnalyticsView.as_view(), name='organization-dashboard'),

    # =========================
    # APPLICATIONS  (slug-based)
    # =========================
    path('applications/', ApplicationListCreateView.as_view(), name='application-list-create'),
    path('applications/<slug:slug>/', ApplicationDetailView.as_view(), name='application-detail'),
    path('applications/<slug:slug>/analysis/', ApplicationAnalysisView.as_view(), name='application_analysis'),

    # =========================
    # INTERVIEWS  (slug-based)
    # =========================
    path('applications/<slug:application_slug>/schedule-interview/', ScheduleInterviewView.as_view(), name='schedule-interview'),
    path('applications/<slug:application_slug>/update-interview/', UpdateInterviewView.as_view(), name='update-interview'),
    path('applications/<slug:application_slug>/cancel-interview/', CancelInterviewView.as_view(), name='cancel-interview'),

    # =========================
    # GLOBAL SEARCH
    # =========================
    path('search/', GlobalSearchView.as_view(), name='global-search'),
    path('search/suggestions/', SearchSuggestionsView.as_view(), name='search-suggestions'),

    # =========================
    # ANALYTICS
    # =========================
    path('analytics/organization/', OrganizationAnalyticsView.as_view(), name='organization-analytics'),
    path('analytics/candidate/', CandidateAnalyticsView.as_view(), name='candidate-analytics'),

    # =========================
    # JOB OFFERS  (slug-based)
    # =========================
    path('job-offers/send/', SendJobOfferView.as_view(), name='send-job-offer'),
    path('job-offers/', JobOfferListView.as_view(), name='job-offers-list'),
    path('job-offers/<slug:slug>/', JobOfferDetailView.as_view(), name='job-offer-detail'),

    # =========================
    # SMART FEATURES
    # =========================
    path('smart/profile-strength/', ProfileStrengthView.as_view(), name='profile-strength'),
    path('smart/job-recommendations/', SmartJobRecommendationsView.as_view(), name='job-recommendations'),
    path('smart/skill-gap/<slug:vacancy_slug>/', SkillGapView.as_view(), name='skill-gap'),
    path('smart/hiring-pipeline/', HiringPipelineView.as_view(), name='hiring-pipeline'),
]
