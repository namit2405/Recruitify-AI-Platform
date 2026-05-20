from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from agora_token_builder import RtcTokenBuilder
import time

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_agora_token(request):
    """Generate Agora RTC token for voice/video calling"""
    
    # Get channel name from request
    channel_name = request.data.get('channel_name')
    if not channel_name:
        return Response({'error': 'channel_name is required'}, status=400)
    
    # Generate UID for user (use user ID)
    uid = request.user.id
    
    # Token expiration time (24 hours from now)
    expiration_time_in_seconds = 24 * 3600
    current_timestamp = int(time.time())
    privilege_expired_ts = current_timestamp + expiration_time_in_seconds
    
    # Build token
    try:
        token = RtcTokenBuilder.buildTokenWithUid(
            settings.AGORA_APP_ID,
            settings.AGORA_APP_CERTIFICATE,
            channel_name,
            uid,
            1,  # Role: 1 = Host (can publish and subscribe)
            privilege_expired_ts
        )
        
        return Response({
            'token': token,
            'app_id': settings.AGORA_APP_ID,
            'channel_name': channel_name,
            'uid': uid
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)
