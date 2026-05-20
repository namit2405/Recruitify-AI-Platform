"""
Interview scheduling views with Google Meet integration
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from datetime import datetime
import json

from .models import Application
from .serializers import ApplicationSerializer
from accounts.models import Organization
from video_call.google_meet import GoogleMeetService


class ScheduleInterviewView(APIView):
    """Schedule an interview for an application"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, application_slug):
        if request.user.user_type != 'organization':
            return Response({'error': 'Only organizations can schedule interviews'}, status=status.HTTP_403_FORBIDDEN)
        application = get_object_or_404(Application, slug=application_slug)
        
        # Verify organization owns this vacancy
        if application.vacancy.organization.user != request.user:
            return Response(
                {'error': 'You can only schedule interviews for your own vacancies'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Parse request data
        interview_type = request.data.get('interview_type')
        interview_datetime_str = request.data.get('interview_datetime')
        interview_location = request.data.get('interview_location', '')
        interview_panel = request.data.get('interview_panel', [])
        interview_notes = request.data.get('interview_notes', '')
        create_meet_link = request.data.get('create_meet_link', False)
        send_calendar_invite = request.data.get('send_calendar_invite', False)
        
        # Validate required fields
        if not interview_type or interview_type not in ['online', 'physical']:
            return Response(
                {'error': 'interview_type must be "online" or "physical"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not interview_datetime_str:
            return Response(
                {'error': 'interview_datetime is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            interview_datetime = datetime.fromisoformat(interview_datetime_str.replace('Z', '+00:00'))
        except ValueError:
            return Response(
                {'error': 'Invalid datetime format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update application
        application.interview_type = interview_type
        application.interview_datetime = interview_datetime
        application.interview_location = interview_location
        application.interview_panel = interview_panel
        application.interview_notes = interview_notes
        application.status = 'interview_scheduled'
        
        # Create Google Meet link if requested
        meet_link = None
        calendar_event_id = None
        
        if create_meet_link and interview_type == 'online':
            try:
                org = application.vacancy.organization
                
                # Check if Google Calendar is connected
                if not org.google_credentials:
                    return Response(
                        {
                            'error': 'Google Calendar not connected',
                            'message': 'Please connect Google Calendar in settings first'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Calculate end time (1 hour after start)
                from datetime import timedelta
                end_time = interview_datetime + timedelta(hours=1)
                
                # Prepare attendees
                attendees = [application.candidate.user.email]
                if interview_panel:
                    attendees.extend(interview_panel)
                
                # Create event details
                event_details = {
                    'summary': f'Interview - {application.vacancy.title}',
                    'description': f'Interview with {application.candidate.name}\n\n{interview_notes}',
                    'start_time': interview_datetime,
                    'end_time': end_time,
                    'attendees': attendees,
                    'timezone': 'UTC'
                }
                
                # Create Meet event
                credentials = json.loads(org.google_credentials)
                service = GoogleMeetService()
                result = service.create_meet_event(credentials, event_details)
                
                if result.get('status') == 'success':
                    meet_link = result.get('meet_link')
                    calendar_event_id = result.get('event_id')
                    application.interview_meet_link = meet_link
                    application.google_calendar_event_id = calendar_event_id
                else:
                    return Response(
                        {'error': f'Failed to create Meet link: {result.get("error")}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                    
            except Exception as e:
                return Response(
                    {'error': f'Failed to create Meet link: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        application.save()
        
        # Send interview scheduled email to candidate
        try:
            from .email_service import send_interview_scheduled_email
            send_interview_scheduled_email(application, is_reminder=False)
        except Exception as e:
            print(f"[Email] Failed to send interview scheduled email: {e}")
        
        # Serialize and return
        serializer = ApplicationSerializer(application, context={'request': request})
        
        return Response({
            'message': 'Interview scheduled successfully',
            'application': serializer.data,
            'meet_link': meet_link,
            'calendar_event_id': calendar_event_id
        }, status=status.HTTP_200_OK)


class UpdateInterviewView(APIView):
    """Update interview details"""
    permission_classes = [permissions.IsAuthenticated]
    
    def patch(self, request, application_slug):
        if request.user.user_type != 'organization':
            return Response({'error': 'Only organizations can update interviews'}, status=status.HTTP_403_FORBIDDEN)
        application = get_object_or_404(Application, slug=application_slug)
        
        if application.vacancy.organization.user != request.user:
            return Response(
                {'error': 'You can only update interviews for your own vacancies'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update fields if provided
        if 'interview_datetime' in request.data:
            try:
                interview_datetime = datetime.fromisoformat(
                    request.data['interview_datetime'].replace('Z', '+00:00')
                )
                application.interview_datetime = interview_datetime
            except ValueError:
                return Response(
                    {'error': 'Invalid datetime format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if 'interview_location' in request.data:
            application.interview_location = request.data['interview_location']
        
        if 'interview_panel' in request.data:
            application.interview_panel = request.data['interview_panel']
        
        if 'interview_notes' in request.data:
            application.interview_notes = request.data['interview_notes']
        
        if 'status' in request.data:
            application.status = request.data['status']
        
        application.save()
        
        serializer = ApplicationSerializer(application, context={'request': request})
        return Response(serializer.data)


class CancelInterviewView(APIView):
    """Cancel a scheduled interview"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, application_slug):
        if request.user.user_type != 'organization':
            return Response({'error': 'Only organizations can cancel interviews'}, status=status.HTTP_403_FORBIDDEN)
        application = get_object_or_404(Application, slug=application_slug)
        
        if application.vacancy.organization.user != request.user:
            return Response(
                {'error': 'You can only cancel interviews for your own vacancies'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Cancel Google Calendar event if exists
        if application.google_calendar_event_id:
            try:
                org = application.vacancy.organization
                if org.google_credentials:
                    credentials = json.loads(org.google_credentials)
                    service = GoogleMeetService()
                    service.cancel_meet_event(
                        credentials,
                        application.google_calendar_event_id
                    )
            except Exception as e:
                # Log error but continue with cancellation
                print(f"Failed to cancel Google Calendar event: {e}")
        
        # Clear interview fields
        application.interview_type = None
        application.interview_datetime = None
        application.interview_location = None
        application.interview_meet_link = None
        application.interview_panel = []
        application.interview_notes = None
        application.google_calendar_event_id = None
        application.status = 'shortlisted'  # Revert to shortlisted
        application.save()
        
        serializer = ApplicationSerializer(application, context={'request': request})
        return Response({
            'message': 'Interview cancelled successfully',
            'application': serializer.data
        })
