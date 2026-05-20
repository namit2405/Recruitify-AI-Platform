from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import get_user_model
from django.db.models import Q, Max
from django.shortcuts import get_object_or_404

from .models import Conversation, Message, UserStatus
from .serializers import (
    ConversationSerializer,
    MessageSerializer,
    UserStatusSerializer
)
from notifications.models import Notification

User = get_user_model()


class MessagePagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100


class ConversationListView(APIView):
    """
    Get list of all conversations for the current user
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get all conversations where user is a participant
        conversations = Conversation.objects.filter(
            Q(participant1=user) | Q(participant2=user)
        ).annotate(
            last_message_time=Max('messages__created_at')
        ).order_by('-last_message_time')
        
        serializer = ConversationSerializer(
            conversations,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)


class ConversationDetailView(APIView):
    """
    Get or create a conversation with a specific user
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        """Get conversation with a specific user"""
        current_user = request.user
        other_user = get_object_or_404(User, id=user_id)
        
        if current_user.id == other_user.id:
            return Response(
                {"detail": "Cannot create conversation with yourself"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find existing conversation (order doesn't matter)
        conversation = Conversation.objects.filter(
            Q(participant1=current_user, participant2=other_user) |
            Q(participant1=other_user, participant2=current_user)
        ).first()
        
        if not conversation:
            return Response(
                {"detail": "Conversation not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data)
    
    def post(self, request, user_id):
        """Create or get conversation with a specific user"""
        current_user = request.user
        other_user = get_object_or_404(User, id=user_id)
        
        if current_user.id == other_user.id:
            return Response(
                {"detail": "Cannot create conversation with yourself"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Find or create conversation (ensure consistent ordering)
        participant1, participant2 = sorted([current_user, other_user], key=lambda u: u.id)
        conversation, created = Conversation.objects.get_or_create(
            participant1=participant1,
            participant2=participant2,
            defaults={'initiated_by': current_user}
        )
        
        # If conversation exists but was rejected, allow re-initiation
        if not created and conversation.status == 'rejected':
            conversation.status = 'pending'
            conversation.initiated_by = current_user
            conversation.save()
        
        # Check if users are connected (following each other)
        from accounts.models import Follow
        are_connected = (
            Follow.objects.filter(follower=current_user, following=other_user).exists() and
            Follow.objects.filter(follower=other_user, following=current_user).exists()
        )
        
        # If connected, auto-accept the conversation
        if are_connected and conversation.status == 'pending':
            conversation.status = 'accepted'
            conversation.save()
        
        # If not created and status is pending, it's a request
        if not created and conversation.status == 'pending' and conversation.initiated_by != current_user:
            # This is an existing request from the other user
            pass
        
        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class MessageListView(APIView):
    """
    Get messages for a conversation or send a new message
    """
    permission_classes = [IsAuthenticated]
    pagination_class = MessagePagination
    
    def get(self, request, conversation_id):
        """Get all messages in a conversation"""
        conversation = get_object_or_404(Conversation, id=conversation_id)
        
        # Verify user is a participant
        if request.user not in [conversation.participant1, conversation.participant2]:
            return Response(
                {"detail": "You are not a participant in this conversation"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        messages = conversation.messages.all().order_by('-created_at')
        
        # Paginate
        paginator = self.pagination_class()
        paginated_messages = paginator.paginate_queryset(messages, request)
        
        serializer = MessageSerializer(
            paginated_messages,
            many=True,
            context={'request': request}
        )
        
        return paginator.get_paginated_response(serializer.data)
    
    def post(self, request, conversation_id):
        """Send a new message"""
        try:
            conversation = get_object_or_404(Conversation, id=conversation_id)
            
            # Verify user is a participant
            if request.user not in [conversation.participant1, conversation.participant2]:
                return Response(
                    {"detail": "You are not a participant in this conversation"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            content = request.data.get('content', '').strip()
            if not content:
                return Response(
                    {"detail": "Message content cannot be empty"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get reply_to if provided
            reply_to_id = request.data.get('reply_to')
            reply_to = None
            if reply_to_id:
                try:
                    reply_to = Message.objects.get(id=reply_to_id, conversation=conversation)
                except Message.DoesNotExist:
                    return Response(
                        {"detail": "Reply message not found"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Create message
            message = Message.objects.create(
                conversation=conversation,
                sender=request.user,
                content=content,
                message_type='text',
                reply_to=reply_to
            )
            
            # Update conversation timestamp
            conversation.save()  # This updates updated_at
            
            # Create notification for the other participant
            try:
                other_participant = conversation.get_other_participant(request.user)
                Notification.objects.create(
                    user=other_participant,
                    notification_type='message',
                    title='New Message',
                    message=f'You have a new message from {request.user.email}',
                    link=f'/chat/{conversation.id}'
                )
            except Exception as e:
                # Log but don't fail if notification creation fails
                print(f"[Chat] Failed to create notification: {e}")
            
            serializer = MessageSerializer(message, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"[Chat] Error in MessageListView.post: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SendFileMessageView(APIView):
    """
    Send a message with file attachment
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, conversation_id):
        """Send a file message"""
        try:
            conversation = get_object_or_404(Conversation, id=conversation_id)
            
            # Verify user is a participant
            if request.user not in [conversation.participant1, conversation.participant2]:
                return Response(
                    {"detail": "You are not a participant in this conversation"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            file = request.FILES.get('file')
            if not file:
                return Response(
                    {"detail": "No file provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check file size (max 10MB)
            max_size = 10 * 1024 * 1024  # 10MB
            if file.size > max_size:
                return Response(
                    {"detail": "File size exceeds 10MB limit"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Determine message type based on file extension
            file_name = file.name
            image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
            is_image = any(file_name.lower().endswith(ext) for ext in image_extensions)
            message_type = 'image' if is_image else 'file'
            
            # Get optional caption
            caption = request.data.get('caption', '').strip()
            
            # Create message
            message = Message.objects.create(
                conversation=conversation,
                sender=request.user,
                content=caption,
                message_type=message_type,
                attachment=file,
                attachment_name=file_name,
                attachment_size=file.size
            )
            
            # Update conversation timestamp
            conversation.save()
            
            # Create notification for the other participant
            try:
                other_participant = conversation.get_other_participant(request.user)
                notification_message = f'📷 Image' if is_image else f'📎 {file_name}'
                Notification.objects.create(
                    user=other_participant,
                    notification_type='message',
                    title='New Message',
                    message=f'{request.user.email} sent you {notification_message}',
                    link=f'/chat/{conversation.id}'
                )
            except Exception as e:
                print(f"[Chat] Failed to create notification: {e}")
            
            serializer = MessageSerializer(message, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"[Chat] Error in SendFileMessageView.post: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MarkMessagesReadView(APIView):
    """
    Mark all messages in a conversation as read
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id)
        
        # Verify user is a participant
        if request.user not in [conversation.participant1, conversation.participant2]:
            return Response(
                {"detail": "You are not a participant in this conversation"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Mark all unread messages from the other participant as read
        updated_count = conversation.messages.filter(
            is_read=False
        ).exclude(
            sender=request.user
        ).update(is_read=True)
        
        return Response({
            "detail": f"Marked {updated_count} messages as read"
        })


class UnreadCountView(APIView):
    """
    Get total unread message count for current user
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get all conversations where user is a participant
        conversations = Conversation.objects.filter(
            Q(participant1=user) | Q(participant2=user)
        )
        
        # Count unread messages where user is NOT the sender
        unread_count = Message.objects.filter(
            conversation__in=conversations,
            is_read=False
        ).exclude(sender=user).count()
        
        return Response({"unread_count": unread_count})


class UserStatusView(APIView):
    """
    Get online status of a user
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        
        try:
            user_status = user.chat_status
        except UserStatus.DoesNotExist:
            # Create status if it doesn't exist
            user_status = UserStatus.objects.create(user=user, is_online=False)
        
        serializer = UserStatusSerializer(user_status, context={'request': request})
        return Response(serializer.data)


class DeleteMessageView(APIView):
    """
    Delete a message (soft delete)
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, message_id):
        try:
            message = get_object_or_404(Message, id=message_id)
            
            # Only sender can delete their own messages
            if message.sender != request.user:
                return Response(
                    {"detail": "You can only delete your own messages"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Soft delete
            from django.utils import timezone
            message.is_deleted = True
            message.deleted_at = timezone.now()
            message.content = ""  # Clear content
            message.save()
            
            return Response({"detail": "Message deleted successfully"})
        except Exception as e:
            print(f"[Chat] Error in DeleteMessageView: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class MessageRequestsView(APIView):
    """
    Get all pending message requests for the current user
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get conversations where:
        # 1. User is a participant
        # 2. Status is pending
        # 3. User is NOT the one who initiated it
        requests = Conversation.objects.filter(
            Q(participant1=user) | Q(participant2=user),
            status='pending'
        ).exclude(
            initiated_by=user
        ).annotate(
            last_message_time=Max('messages__created_at')
        ).order_by('-last_message_time')
        
        serializer = ConversationSerializer(
            requests,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)


class AcceptedConversationsView(APIView):
    """
    Get all accepted conversations (regular messages)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get conversations where:
        # 1. User is a participant
        # 2. Status is accepted OR user initiated it (can see own pending requests)
        conversations = Conversation.objects.filter(
            Q(participant1=user) | Q(participant2=user)
        ).filter(
            Q(status='accepted') | Q(initiated_by=user)
        ).annotate(
            last_message_time=Max('messages__created_at')
        ).order_by('-last_message_time')
        
        serializer = ConversationSerializer(
            conversations,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)


class AcceptRequestView(APIView):
    """
    Accept a message request
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id)
        
        # Verify user is a participant
        if request.user not in [conversation.participant1, conversation.participant2]:
            return Response(
                {"detail": "You are not a participant in this conversation"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Accept the request
        if conversation.accept_request(request.user):
            # Create notification for the initiator
            try:
                Notification.objects.create(
                    user=conversation.initiated_by,
                    notification_type='message',
                    title='Message Request Accepted',
                    message=f'{request.user.email} accepted your message request',
                    link=f'/chat/{conversation.id}'
                )
            except Exception as e:
                print(f"[Chat] Failed to create notification: {e}")
            
            serializer = ConversationSerializer(conversation, context={'request': request})
            return Response(serializer.data)
        else:
            return Response(
                {"detail": "Cannot accept this request"},
                status=status.HTTP_400_BAD_REQUEST
            )


class RejectRequestView(APIView):
    """
    Reject a message request
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, id=conversation_id)
        
        # Verify user is a participant
        if request.user not in [conversation.participant1, conversation.participant2]:
            return Response(
                {"detail": "You are not a participant in this conversation"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Reject the request
        if conversation.reject_request(request.user):
            # Create notification for the initiator
            try:
                Notification.objects.create(
                    user=conversation.initiated_by,
                    notification_type='message',
                    title='Message Request Rejected',
                    message=f'{request.user.email} rejected your message request',
                    link='/chat'
                )
            except Exception as e:
                print(f"[Chat] Failed to create notification: {e}")
            
            return Response({"detail": "Request rejected successfully"})
        else:
            return Response(
                {"detail": "Cannot reject this request"},
                status=status.HTTP_400_BAD_REQUEST
            )
