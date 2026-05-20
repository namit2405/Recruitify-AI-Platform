"""
Google Meet integration for automatic meeting link generation
"""
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from datetime import datetime, timedelta
from requests_oauthlib import OAuth2Session
import os
import json


class GoogleMeetService:
    """Service for creating Google Meet links via Calendar API"""
    
    SCOPES = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
    ]
    
    def __init__(self):
        self.credentials_file = os.path.join(
            os.path.dirname(__file__), 
            '..', 
            'credentials.json'
        )
        
        # Load client config
        with open(self.credentials_file, 'r') as f:
            client_config = json.load(f)
            self.client_id = client_config['web']['client_id']
            self.client_secret = client_config['web']['client_secret']
            self.auth_uri = client_config['web']['auth_uri']
            self.token_uri = client_config['web']['token_uri']
    
    def get_authorization_url(self, redirect_uri):
        """
        Get OAuth authorization URL for user to grant access
        Uses OAuth2Session directly to avoid PKCE issues
        
        Returns:
            tuple: (authorization_url, state)
        """
        if not os.path.exists(self.credentials_file):
            raise FileNotFoundError(
                "credentials.json not found. Please download it from Google Cloud Console."
            )
        
        # Create OAuth2Session without PKCE
        oauth = OAuth2Session(
            self.client_id,
            scope=self.SCOPES,
            redirect_uri=redirect_uri
        )
        
        authorization_url, state = oauth.authorization_url(
            self.auth_uri,
            access_type='offline',
            prompt='consent'  # Force consent to get refresh token
        )
        
        return authorization_url, state
    
    def exchange_code_for_token(self, code, redirect_uri):
        """
        Exchange authorization code for access token
        Uses OAuth2Session directly to match authorization flow
        
        Args:
            code: Authorization code from OAuth callback
            redirect_uri: Same redirect URI used in authorization
            
        Returns:
            dict: Credentials dictionary with tokens
        """
        # Create OAuth2Session
        oauth = OAuth2Session(
            self.client_id,
            redirect_uri=redirect_uri
        )
        
        # Fetch token
        token = oauth.fetch_token(
            self.token_uri,
            code=code,
            client_secret=self.client_secret
        )
        
        return {
            'token': token['access_token'],
            'refresh_token': token.get('refresh_token'),
            'token_uri': self.token_uri,
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'scopes': self.SCOPES
        }
    
    def create_meet_event(self, credentials_dict, event_details):
        """
        Create Google Calendar event with Meet link
        
        Args:
            credentials_dict: Dictionary with OAuth credentials
            event_details: Dictionary with event information:
                {
                    'summary': 'Interview - Web Developer',
                    'description': 'Technical interview with John Doe',
                    'start_time': datetime object,
                    'end_time': datetime object,
                    'attendees': ['candidate@email.com', 'hr@company.com'],
                    'timezone': 'UTC' (optional, defaults to UTC)
                }
        
        Returns:
            dict: {
                'event_id': 'calendar_event_id',
                'meet_link': 'https://meet.google.com/xxx-xxxx-xxx',
                'html_link': 'https://calendar.google.com/...'
            }
        """
        try:
            # Create credentials object
            credentials = Credentials(
                token=credentials_dict['token'],
                refresh_token=credentials_dict.get('refresh_token'),
                token_uri=credentials_dict['token_uri'],
                client_id=credentials_dict['client_id'],
                client_secret=credentials_dict['client_secret'],
                scopes=credentials_dict['scopes']
            )
            
            # Build Calendar service
            service = build('calendar', 'v3', credentials=credentials)
            
            # Prepare event
            timezone = event_details.get('timezone', 'UTC')
            
            event = {
                'summary': event_details['summary'],
                'description': event_details.get('description', ''),
                'start': {
                    'dateTime': event_details['start_time'].isoformat(),
                    'timeZone': timezone,
                },
                'end': {
                    'dateTime': event_details['end_time'].isoformat(),
                    'timeZone': timezone,
                },
                'attendees': [
                    {'email': email} for email in event_details.get('attendees', [])
                ],
                'conferenceData': {
                    'createRequest': {
                        'requestId': f"recruitify-{int(datetime.now().timestamp())}",
                        'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                    }
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                        {'method': 'popup', 'minutes': 30},        # 30 min before
                    ],
                },
                'guestsCanModify': False,
                'guestsCanInviteOthers': False,
                'guestsCanSeeOtherGuests': True,
            }
            
            # Create event
            event = service.events().insert(
                calendarId='primary',
                body=event,
                conferenceDataVersion=1,
                sendUpdates='all'  # Send email invites to all attendees
            ).execute()
            
            # Extract Meet link
            meet_link = event.get('hangoutLink', '')
            
            return {
                'event_id': event['id'],
                'meet_link': meet_link,
                'html_link': event.get('htmlLink', ''),
                'status': 'success'
            }
            
        except HttpError as error:
            print(f'An error occurred: {error}')
            return {
                'status': 'error',
                'error': str(error)
            }
        except Exception as e:
            print(f'Unexpected error: {e}')
            return {
                'status': 'error',
                'error': str(e)
            }
    
    def update_meet_event(self, credentials_dict, event_id, updates):
        """
        Update existing calendar event
        
        Args:
            credentials_dict: Dictionary with OAuth credentials
            event_id: Google Calendar event ID
            updates: Dictionary with fields to update
        
        Returns:
            dict: Updated event details
        """
        try:
            credentials = Credentials(
                token=credentials_dict['token'],
                refresh_token=credentials_dict.get('refresh_token'),
                token_uri=credentials_dict['token_uri'],
                client_id=credentials_dict['client_id'],
                client_secret=credentials_dict['client_secret'],
                scopes=credentials_dict['scopes']
            )
            
            service = build('calendar', 'v3', credentials=credentials)
            
            # Get existing event
            event = service.events().get(
                calendarId='primary',
                eventId=event_id
            ).execute()
            
            # Update fields
            if 'summary' in updates:
                event['summary'] = updates['summary']
            if 'description' in updates:
                event['description'] = updates['description']
            if 'start_time' in updates:
                event['start']['dateTime'] = updates['start_time'].isoformat()
            if 'end_time' in updates:
                event['end']['dateTime'] = updates['end_time'].isoformat()
            if 'attendees' in updates:
                event['attendees'] = [
                    {'email': email} for email in updates['attendees']
                ]
            
            # Update event
            updated_event = service.events().update(
                calendarId='primary',
                eventId=event_id,
                body=event,
                sendUpdates='all'
            ).execute()
            
            return {
                'event_id': updated_event['id'],
                'meet_link': updated_event.get('hangoutLink', ''),
                'html_link': updated_event.get('htmlLink', ''),
                'status': 'success'
            }
            
        except HttpError as error:
            return {
                'status': 'error',
                'error': str(error)
            }
    
    def cancel_meet_event(self, credentials_dict, event_id):
        """
        Cancel/delete calendar event
        
        Args:
            credentials_dict: Dictionary with OAuth credentials
            event_id: Google Calendar event ID
        
        Returns:
            dict: Status of cancellation
        """
        try:
            credentials = Credentials(
                token=credentials_dict['token'],
                refresh_token=credentials_dict.get('refresh_token'),
                token_uri=credentials_dict['token_uri'],
                client_id=credentials_dict['client_id'],
                client_secret=credentials_dict['client_secret'],
                scopes=credentials_dict['scopes']
            )
            
            service = build('calendar', 'v3', credentials=credentials)
            
            # Delete event
            service.events().delete(
                calendarId='primary',
                eventId=event_id,
                sendUpdates='all'  # Notify attendees
            ).execute()
            
            return {
                'status': 'success',
                'message': 'Event cancelled successfully'
            }
            
        except HttpError as error:
            return {
                'status': 'error',
                'error': str(error)
            }
