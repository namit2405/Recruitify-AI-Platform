"""
URL patterns for video call / Google Meet integration
"""
from django.urls import path
from .views import (
    GoogleAuthInitView,
    GoogleAuthCallbackView,
    CreateMeetLinkView,
    CheckGoogleConnectionView,
    DisconnectGoogleView,
    TestGoogleMeetView,
    CreateInstantMeetView,
)

urlpatterns = [
    # Test page
    path('test/', TestGoogleMeetView.as_view(), name='test-google-meet'),
    
    # Google OAuth
    path('google/auth/', GoogleAuthInitView.as_view(), name='google-auth-init'),
    path('google/callback/', GoogleAuthCallbackView.as_view(), name='google-auth-callback'),
    path('google/check/', CheckGoogleConnectionView.as_view(), name='google-check-connection'),
    path('google/disconnect/', DisconnectGoogleView.as_view(), name='google-disconnect'),
    
    # Meet link creation
    path('create-meet-link/', CreateMeetLinkView.as_view(), name='create-meet-link'),
    path('create-instant-meet/', CreateInstantMeetView.as_view(), name='create-instant-meet'),
]
