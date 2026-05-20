from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Conversation, Message, UserStatus
from accounts.models import Candidate, Organization

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user info for chat"""
    name = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()
    slug = serializers.SerializerMethodField()
    user_type = serializers.CharField()
    
    class Meta:
        model = User
        fields = ('id', 'email', 'user_type', 'name', 'profile_picture_url', 'slug')
    
    def get_name(self, obj):
        if obj.user_type == 'candidate':
            try:
                return obj.candidate_profile.name
            except:
                return obj.email
        else:
            try:
                return obj.organization_profile.name
            except:
                return obj.email
    
    def get_slug(self, obj):
        """Get the slug from the user's profile"""
        try:
            if obj.user_type == 'candidate':
                return obj.candidate_profile.slug
            else:
                return obj.organization_profile.slug
        except:
            return None
    
    def get_profile_picture_url(self, obj):
        request = self.context.get('request')
        if not request:
            return None
            
        try:
            if obj.user_type == 'candidate':
                profile = obj.candidate_profile
                if profile.profile_picture:
                    return request.build_absolute_uri(profile.profile_picture.url)
            else:
                profile = obj.organization_profile
                if profile.profile_picture:
                    return request.build_absolute_uri(profile.profile_picture.url)
        except:
            pass
        return None


class MessageSerializer(serializers.ModelSerializer):
    sender = UserBasicSerializer(read_only=True)
    attachment_url = serializers.SerializerMethodField()
    is_image = serializers.SerializerMethodField()
    reply_to_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = (
            'id', 'conversation', 'sender', 'content', 'message_type',
            'attachment', 'attachment_url', 'attachment_name', 'attachment_size',
            'is_image', 'reply_to', 'reply_to_message', 'is_deleted', 'deleted_at',
            'is_read', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'sender', 'created_at', 'updated_at', 'attachment_url', 'is_image', 'reply_to_message')
    
    def get_attachment_url(self, obj):
        request = self.context.get('request')
        if obj.attachment and request:
            return request.build_absolute_uri(obj.attachment.url)
        return None
    
    def get_is_image(self, obj):
        return obj.is_image()
    
    def get_reply_to_message(self, obj):
        if obj.reply_to and not obj.reply_to.is_deleted:
            return {
                'id': obj.reply_to.id,
                'sender': UserBasicSerializer(obj.reply_to.sender, context=self.context).data,
                'content': obj.reply_to.content[:100],  # Truncate long messages
                'message_type': obj.reply_to.message_type,
                'attachment_name': obj.reply_to.attachment_name if obj.reply_to.message_type != 'text' else None,
            }
        return None


class ConversationSerializer(serializers.ModelSerializer):
    participant1 = UserBasicSerializer(read_only=True)
    participant2 = UserBasicSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_participant = serializers.SerializerMethodField()
    is_request = serializers.SerializerMethodField()
    initiated_by = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = Conversation
        fields = (
            'id', 
            'participant1', 
            'participant2', 
            'other_participant',
            'status',
            'is_request',
            'initiated_by',
            'last_message', 
            'unread_count',
            'created_at', 
            'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_last_message(self, obj):
        last_msg = obj.get_last_message()
        if last_msg:
            content_preview = last_msg.content
            if last_msg.message_type == 'image':
                content_preview = '📷 Image'
            elif last_msg.message_type == 'file':
                content_preview = f'📎 {last_msg.attachment_name or "File"}'
            
            return {
                'id': last_msg.id,
                'content': content_preview,
                'sender_id': last_msg.sender.id,
                'created_at': last_msg.created_at,
                'is_read': last_msg.is_read,
            }
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return 0
        
        # Count unread messages where the current user is NOT the sender
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
    
    def get_other_participant(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return None
        
        other_user = obj.get_other_participant(request.user)
        return UserBasicSerializer(other_user, context=self.context).data
    
    def get_is_request(self, obj):
        """Check if this is a pending request for the current user"""
        request = self.context.get('request')
        if not request or not request.user:
            return False
        return obj.is_request_for(request.user)


class UserStatusSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = UserStatus
        fields = ('user', 'is_online', 'last_seen')
        read_only_fields = ('last_seen',)
