import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Conversation, Message, UserStatus
from .serializers import MessageSerializer

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time chat
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope["user"]
        
        print(f"[ChatConsumer] Connection attempt - User: {self.user}, Authenticated: {self.user.is_authenticated}")
        
        # Reject if user is not authenticated
        if not self.user.is_authenticated:
            print("[ChatConsumer] Rejecting connection - User not authenticated")
            await self.close()
            return
        
        # Create a personal room for this user
        self.user_room = f"user_{self.user.id}"
        
        print(f"[ChatConsumer] User {self.user.id} joining room: {self.user_room}")
        
        # Join user's personal room
        await self.channel_layer.group_add(
            self.user_room,
            self.channel_name
        )
        
        # Accept the connection
        await self.accept()
        
        print(f"[ChatConsumer] Connection accepted for user {self.user.id}")
        
        # Mark user as online
        await self.set_user_online(True)
        
        # Notify all conversations that this user is online
        await self.broadcast_user_status(True)
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'user_room'):
            # Leave user's personal room
            await self.channel_layer.group_discard(
                self.user_room,
                self.channel_name
            )
        
        if self.user.is_authenticated:
            # Mark user as offline
            await self.set_user_online(False)
            
            # Notify all conversations that this user is offline
            await self.broadcast_user_status(False)
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'chat_message':
                await self.handle_chat_message(data)
            elif message_type == 'typing':
                await self.handle_typing(data)
            elif message_type == 'mark_read':
                await self.handle_mark_read(data)
            elif message_type == 'webrtc_signal':
                await self.handle_webrtc_signal(data)
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))
    
    async def handle_chat_message(self, data):
        """Handle sending a chat message"""
        conversation_id = data.get('conversation_id')
        content = data.get('content', '').strip()
        
        if not content:
            return
        
        # Save message to database
        message = await self.save_message(conversation_id, content)
        
        if not message:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Failed to send message'
            }))
            return
        
        # Get the other participant
        other_user_id = await self.get_other_participant(conversation_id)
        
        if other_user_id:
            # Send message to the other user's room
            await self.channel_layer.group_send(
                f"user_{other_user_id}",
                {
                    'type': 'chat_message_handler',
                    'message': message
                }
            )
        
        # Send confirmation to sender
        await self.send(text_data=json.dumps({
            'type': 'message_sent',
            'message': message
        }))
    
    async def handle_typing(self, data):
        """Handle typing indicator"""
        conversation_id = data.get('conversation_id')
        is_typing = data.get('is_typing', False)
        
        # Get the other participant
        other_user_id = await self.get_other_participant(conversation_id)
        
        if other_user_id:
            # Send typing indicator to the other user
            await self.channel_layer.group_send(
                f"user_{other_user_id}",
                {
                    'type': 'typing_handler',
                    'conversation_id': conversation_id,
                    'user_id': self.user.id,
                    'is_typing': is_typing
                }
            )
    
    async def handle_mark_read(self, data):
        """Handle marking messages as read"""
        conversation_id = data.get('conversation_id')
        
        # Mark messages as read in database
        await self.mark_messages_read(conversation_id)
        
        # Get the other participant
        other_user_id = await self.get_other_participant(conversation_id)
        
        if other_user_id:
            # Notify the other user that messages were read
            await self.channel_layer.group_send(
                f"user_{other_user_id}",
                {
                    'type': 'messages_read_handler',
                    'conversation_id': conversation_id,
                    'user_id': self.user.id
                }
            )
    
    async def handle_webrtc_signal(self, data):
        """Handle WebRTC signaling (call initiation, offer, answer, ICE candidates)"""
        conversation_id = data.get('conversation_id')
        signal = data.get('signal')
        
        if not conversation_id or not signal:
            return
        
        # Get the other participant
        other_user_id = await self.get_other_participant(conversation_id)
        
        if other_user_id:
            # Forward the signal to the other user
            await self.channel_layer.group_send(
                f"user_{other_user_id}",
                {
                    'type': 'webrtc_signal_handler',
                    'conversation_id': conversation_id,
                    'signal': signal,
                    'sender_id': self.user.id
                }
            )
    
    async def chat_message_handler(self, event):
        """Send chat message to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))
    
    async def typing_handler(self, event):
        """Send typing indicator to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'conversation_id': event['conversation_id'],
            'user_id': event['user_id'],
            'is_typing': event['is_typing']
        }))
    
    async def messages_read_handler(self, event):
        """Send read receipt to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'messages_read',
            'conversation_id': event['conversation_id'],
            'user_id': event['user_id']
        }))
    
    async def user_status_handler(self, event):
        """Send user status update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'user_status',
            'user_id': event['user_id'],
            'is_online': event['is_online']
        }))
    
    async def webrtc_signal_handler(self, event):
        """Forward WebRTC signal to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'webrtc_signal',
            'conversation_id': event['conversation_id'],
            'signal': event['signal'],
            'sender_id': event['sender_id']
        }))
    
    # Database operations
    
    @database_sync_to_async
    def save_message(self, conversation_id, content):
        """Save message to database"""
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            
            # Verify user is a participant
            if self.user not in [conversation.participant1, conversation.participant2]:
                return None
            
            message = Message.objects.create(
                conversation=conversation,
                sender=self.user,
                content=content
            )
            
            # Update conversation timestamp
            conversation.save()
            
            # Serialize message
            serializer = MessageSerializer(message)
            return serializer.data
        except Exception as e:
            print(f"Error saving message: {e}")
            return None
    
    @database_sync_to_async
    def get_other_participant(self, conversation_id):
        """Get the other participant's user ID"""
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            other_user = conversation.get_other_participant(self.user)
            return other_user.id
        except:
            return None
    
    @database_sync_to_async
    def mark_messages_read(self, conversation_id):
        """Mark all unread messages as read"""
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            conversation.messages.filter(
                is_read=False
            ).exclude(
                sender=self.user
            ).update(is_read=True)
        except:
            pass
    
    @database_sync_to_async
    def set_user_online(self, is_online):
        """Set user online/offline status"""
        try:
            status, created = UserStatus.objects.get_or_create(user=self.user)
            status.is_online = is_online
            status.save()
        except:
            pass
    
    @database_sync_to_async
    def get_user_conversations(self):
        """Get all conversations for this user"""
        try:
            from django.db.models import Q
            conversations = Conversation.objects.filter(
                Q(participant1=self.user) | Q(participant2=self.user)
            )
            return list(conversations.values_list('id', flat=True))
        except:
            return []
    
    async def broadcast_user_status(self, is_online):
        """Broadcast user status to all their conversation partners"""
        conversation_ids = await self.get_user_conversations()
        
        for conv_id in conversation_ids:
            other_user_id = await self.get_other_participant(conv_id)
            if other_user_id:
                await self.channel_layer.group_send(
                    f"user_{other_user_id}",
                    {
                        'type': 'user_status_handler',
                        'user_id': self.user.id,
                        'is_online': is_online
                    }
                )
