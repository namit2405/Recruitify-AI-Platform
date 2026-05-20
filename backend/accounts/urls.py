from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path("register/", views.RegisterView.as_view(), name="register"),
    path("register/verify-otp/", views.VerifyRegistrationOTPView.as_view(), name="verify_registration_otp"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("login/verify-otp/", views.VerifyLoginOTPView.as_view(), name="verify_login_otp"),
    path("resend-otp/", views.ResendOTPView.as_view(), name="resend_otp"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    
    # Password Reset
    path("password-reset/request/", views.RequestPasswordResetView.as_view(), name="request_password_reset"),
    path("password-reset/verify-otp/", views.VerifyPasswordResetOTPView.as_view(), name="verify_password_reset_otp"),
    path("password-reset/reset/", views.ResetPasswordView.as_view(), name="reset_password"),

    # Profile (read-only combined)
    path("profile/", views.ProfileView.as_view(), name="profile"),

    # Profile updates
    path(
        "profile/organization/",
        views.OrganizationProfileView.as_view(),
        name="organization_profile",
    ),
    path(
        "profile/candidate/",
        views.CandidateProfileView.as_view(),
        name="candidate_profile",
    ),

    # Resume upload
    path(
        "profile/candidate/resume/",
        views.CandidateResumeUploadView.as_view(),
        name="candidate_resume_upload",
    ),
    
    # Profile picture & cover photo uploads
    path(
        "profile/candidate/profile-picture/",
        views.CandidateProfilePictureUploadView.as_view(),
        name="candidate_profile_picture_upload",
    ),
    path(
        "profile/candidate/cover-photo/",
        views.CandidateCoverPhotoUploadView.as_view(),
        name="candidate_cover_photo_upload",
    ),
    path(
        "profile/organization/profile-picture/",
        views.OrganizationProfilePictureUploadView.as_view(),
        name="organization_profile_picture_upload",
    ),
    path(
        "profile/organization/cover-photo/",
        views.OrganizationCoverPhotoUploadView.as_view(),
        name="organization_cover_photo_upload",
    ),
    
    # Public profiles
    path(
    "public/candidate/<slug:slug>/",
    views.PublicCandidateView.as_view(),
    name="public_candidate",
    ),

    path(
        "public/organization/<slug:slug>/",
        views.PublicOrganizationView.as_view(),
        name="public_organization",
    ),
    
    # Follow/Unfollow
    path(
        "follow/<int:user_id>/",
        views.FollowUserView.as_view(),
        name="follow_user",
    ),
    path(
        "unfollow/<int:user_id>/",
        views.UnfollowUserView.as_view(),
        name="unfollow_user",
    ),
    path(
        "follow-status/<int:user_id>/",
        views.FollowStatusView.as_view(),
        name="follow_status",
    ),
    path(
        "followers/<int:user_id>/",
        views.FollowersListView.as_view(),
        name="followers_list",
    ),
    path(
        "following/<int:user_id>/",
        views.FollowingListView.as_view(),
        name="following_list",
    ),
    
    # Employment/Team Management
    path(
        "employment/add/",
        views.AddEmployeeView.as_view(),
        name="add_employee",
    ),
    path(
        "employment/",
        views.EmploymentListView.as_view(),
        name="employment_list",
    ),
    path(
        "employment/<int:employment_id>/end/",
        views.MarkEmploymentEndedView.as_view(),
        name="mark_employment_ended",
    ),
    path(
        "employment/<int:employment_id>/toggle-visibility/",
        views.ToggleEmploymentVisibilityView.as_view(),
        name="toggle_employment_visibility",
    ),
    path(
        "team/<int:organization_id>/",
        views.TeamStatsView.as_view(),
        name="team_stats",
    ),
    
    # Talent Pool / Community
    path(
        "talent-pool/join/<int:organization_id>/",
        views.JoinTalentPoolView.as_view(),
        name="join_talent_pool",
    ),
    path(
        "talent-pool/leave/<int:organization_id>/",
        views.LeaveTalentPoolView.as_view(),
        name="leave_talent_pool",
    ),
    path(
        "talent-pool/status/<int:organization_id>/",
        views.TalentPoolStatusView.as_view(),
        name="talent_pool_status",
    ),
    path(
        "talent-pool/my-communities/",
        views.MyCommunitiesView.as_view(),
        name="my_communities",
    ),
    path(
        "talent-pool/members/<int:organization_id>/",
        views.TalentPoolMembersView.as_view(),
        name="talent_pool_members",
    ),
    path(
        "talent-pool/stats/<int:organization_id>/",
        views.TalentPoolStatsView.as_view(),
        name="talent_pool_stats",
    ),
    
    # Contact form
    path('contact/', views.ContactFormView.as_view(), name='contact'),
    
    # User Settings & Preferences
    path('settings/preferences/', views.UserPreferencesView.as_view(), name='user_preferences'),
    path('settings/change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    path('settings/delete-account/', views.DeleteAccountView.as_view(), name='delete_account'),

]
