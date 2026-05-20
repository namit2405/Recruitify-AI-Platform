"""
Verify the current state of conversations
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from chat.models import Conversation

User = get_user_model()

def verify_state():
    """Verify conversation state for each user"""
    
    users = User.objects.filter(email__in=['jainnamit34@gmail.com', 'supportind@xpresscargoinc.com'])
    
    for user in users:
        print(f"\n{'='*60}")
        print(f"User: {user.email}")
        print(f"{'='*60}")
        
        # Messages (accepted OR initiated by user)
        from django.db.models import Q
        messages = Conversation.objects.filter(
            Q(participant1=user) | Q(participant2=user)
        ).filter(
            Q(status='accepted') | Q(initiated_by=user)
        )
        
        print(f"\nMESSAGES TAB ({messages.count()}):")
        for conv in messages:
            other = conv.get_other_participant(user)
            print(f"  - With {other.email}")
            print(f"    Status: {conv.status}")
            print(f"    Initiated by: {conv.initiated_by.email if conv.initiated_by else 'Unknown'}")
        
        # Requests (pending AND NOT initiated by user)
        requests = Conversation.objects.filter(
            Q(participant1=user) | Q(participant2=user),
            status='pending'
        ).exclude(
            initiated_by=user
        )
        
        print(f"\nREQUESTS TAB ({requests.count()}):")
        for conv in requests:
            other = conv.get_other_participant(user)
            print(f"  - From {other.email}")
            print(f"    Status: {conv.status}")
            print(f"    Initiated by: {conv.initiated_by.email if conv.initiated_by else 'Unknown'}")

if __name__ == '__main__':
    verify_state()
    print("\n✓ Done!")
