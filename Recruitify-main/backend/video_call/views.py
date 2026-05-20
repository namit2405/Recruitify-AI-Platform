"""
API views for Google Meet integration
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.conf import settings
from django.shortcuts import render
from django.views import View
from .google_meet import GoogleMeetService
from accounts.models import Organization
import json


class GoogleAuthInitView(APIView):
    """Initiate Google OAuth flow"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get authorization URL to redirect user to Google"""
        if request.user.user_type != 'organization':
            return Response(
                {'error': 'Only organizations can connect Google Calendar'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            service = GoogleMeetService()
            redirect_uri = f"{settings.SITE_URL}/api/video/google/callback"
            
            auth_url, state = service.get_authorization_url(redirect_uri)
            
            # Encode user ID in state parameter for retrieval in callback
            import base64
            user_data = f"{request.user.id}:{state}"
            encoded_state = base64.b64encode(user_data.encode()).decode()
            
            # Replace state in auth_url
            auth_url = auth_url.replace(f"state={state}", f"state={encoded_state}")
            
            # Store state in session for verification
            request.session['google_oauth_state'] = encoded_state
            request.session['google_oauth_user_id'] = request.user.id
            
            return Response({
                'authorization_url': auth_url,
                'state': encoded_state
            })
            
        except FileNotFoundError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to initialize OAuth: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GoogleAuthCallbackView(APIView):
    """Handle Google OAuth callback"""
    permission_classes = []  # Allow unauthenticated access
    
    def get(self, request):
        """Exchange authorization code for tokens"""
        code = request.GET.get('code')
        state = request.GET.get('state')
        error = request.GET.get('error')
        
        # Check for errors
        if error:
            from django.shortcuts import redirect
            return redirect(f"/api/video/test/?google_error={error}")
        
        if not code:
            from django.shortcuts import redirect
            return redirect(f"/api/video/test/?google_error=no_code")
        
        # Decode user ID from state parameter
        user_id = None
        try:
            import base64
            decoded_state = base64.b64decode(state.encode()).decode()
            user_id_str, original_state = decoded_state.split(':', 1)
            user_id = int(user_id_str)
        except:
            # Fallback to session
            user_id = request.session.get('google_oauth_user_id')
        
        if not user_id:
            from django.shortcuts import redirect
            return redirect(f"/api/video/test/?google_error=no_user_id")
        
        try:
            # Exchange code for tokens
            service = GoogleMeetService()
            redirect_uri = f"{settings.SITE_URL}/api/video/google/callback"
            credentials = service.exchange_code_for_token(code, redirect_uri)
            
            # Store credentials in organization profile
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(id=user_id)
            org = user.organization_profile
            
            org.google_credentials = json.dumps(credentials)
            org.save()
            
            # Clear session if available
            if 'google_oauth_state' in request.session:
                del request.session['google_oauth_state']
            if 'google_oauth_user_id' in request.session:
                del request.session['google_oauth_user_id']
            
            # Redirect to test page with success message
            from django.shortcuts import redirect
            return redirect('/api/video/test/?google_connected=true')
            
        except Exception as e:
            from django.shortcuts import redirect
            import traceback
            traceback.print_exc()
            return redirect(f"/api/video/test/?google_error={str(e)}")
            
        except Exception as e:
            return Response(
                {'error': f'Failed to exchange code: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CreateMeetLinkView(APIView):
    """Create Google Meet link for interview"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Create a Google Meet link and calendar event
        
        Request body:
        {
            "title": "Interview - Web Developer",
            "description": "Technical interview",
            "start_time": "2026-03-05T10:00:00",
            "end_time": "2026-03-05T11:00:00",
            "attendees": ["candidate@email.com", "hr@company.com"],
            "timezone": "UTC"
        }
        """
        if request.user.user_type != 'organization':
            return Response(
                {'error': 'Only organizations can create Meet links'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            org = request.user.organization_profile
        except Organization.DoesNotExist:
            return Response(
                {'error': 'Organization profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if Google Calendar is connected
        if not org.google_credentials:
            return Response(
                {
                    'error': 'Google Calendar not connected',
                    'message': 'Please connect your Google Calendar first'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse request data
        title = request.data.get('title')
        description = request.data.get('description', '')
        start_time_str = request.data.get('start_time')
        end_time_str = request.data.get('end_time')
        attendees = request.data.get('attendees', [])
        timezone = request.data.get('timezone', 'UTC')
        
        # Validate required fields
        if not all([title, start_time_str, end_time_str]):
            return Response(
                {'error': 'title, start_time, and end_time are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Parse datetime strings
            from datetime import datetime
            start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
            end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
            
            # Prepare event details
            event_details = {
                'summary': title,
                'description': description,
                'start_time': start_time,
                'end_time': end_time,
                'attendees': attendees,
                'timezone': timezone
            }
            
            # Create Meet event
            credentials = json.loads(org.google_credentials)
            service = GoogleMeetService()
            result = service.create_meet_event(credentials, event_details)
            
            if result.get('status') == 'error':
                return Response(
                    {'error': result.get('error')},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(result, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            return Response(
                {'error': f'Invalid datetime format: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to create Meet link: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CheckGoogleConnectionView(APIView):
    """Check if organization has Google Calendar connected"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Check connection status"""
        if request.user.user_type != 'organization':
            return Response({'connected': False})
        
        try:
            org = request.user.organization_profile
            connected = bool(org.google_credentials)
            
            return Response({
                'connected': connected,
                'organization': org.name
            })
        except Organization.DoesNotExist:
            return Response({'connected': False})


class DisconnectGoogleView(APIView):
    """Disconnect Google Calendar"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Remove Google credentials"""
        if request.user.user_type != 'organization':
            return Response(
                {'error': 'Only organizations can disconnect Google Calendar'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            org = request.user.organization_profile
            org.google_credentials = None
            org.save()
            
            return Response({
                'message': 'Google Calendar disconnected successfully'
            })
        except Organization.DoesNotExist:
            return Response(
                {'error': 'Organization profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )



class TestGoogleMeetView(View):
    """Serve test HTML page"""
    
    def get(self, request):
        """Render test page"""
        return render(request, 'test_google_meet.html')


class CreateInstantMeetView(APIView):
    """Create instant Google Meet link for chat calls"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Create an instant Google Meet link for voice/video calls
        
        Request body:
        {
            "participant_email": "user@email.com",
            "participant_name": "John Doe",
            "call_type": "voice" or "video"
        }
        """
        try:
            # Get organization profile
            if request.user.user_type == 'organization':
                org = request.user.organization_profile
            elif request.user.user_type == 'candidate':
                # For candidates, we'll create a simple meet link without calendar integration
                # This requires the organization they're talking to has Google connected
                # For now, we'll just create a basic meet link
                org = None
            else:
                return Response(
                    {'error': 'Invalid user type'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            participant_email = request.data.get('participant_email')
            participant_name = request.data.get('participant_name', 'Participant')
            call_type = request.data.get('call_type', 'video')
            
            # Create event details for instant call (30 minutes from now)
            from datetime import datetime, timedelta
            import pytz
            
            now = datetime.now(pytz.UTC)
            start_time = now
            end_time = now + timedelta(minutes=30)
            
            call_title = f"{'Voice' if call_type == 'voice' else 'Video'} Call with {participant_name}"
            
            event_details = {
                'summary': call_title,
                'description': f'Instant {call_type} call initiated from chat',
                'start_time': start_time,
                'end_time': end_time,
                'attendees': [participant_email] if participant_email else [],
                'timezone': 'UTC'
            }
            
            # If organization has Google connected, create calendar event
            if org and org.google_credentials:
                credentials = json.loads(org.google_credentials)
                service = GoogleMeetService()
                result = service.create_meet_event(credentials, event_details)
                
                if result.get('status') == 'error':
                    # Fallback to simple meet link
                    return Response({
                        'meet_link': f'https://meet.google.com/new',
                        'message': 'Created instant meet link (calendar integration unavailable)'
                    })
                
                return Response({
                    'meet_link': result.get('meet_link'),
                    'event_id': result.get('event_id'),
                    'message': 'Meet link created and calendar invite sent'
                }, status=status.HTTP_201_CREATED)
            else:
                # Create simple meet link without calendar integration
                return Response({
                    'meet_link': f'https://meet.google.com/new',
                    'message': 'Created instant meet link'
                }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Failed to create instant meet: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
