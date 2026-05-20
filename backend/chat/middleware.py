from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from urllib.parse import parse_qs

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_string):
    """
    Get user from JWT token
    """
    try:
        # Validate token
        access_token = AccessToken(token_string)
        user_id = access_token['user_id']
        
        # Get user
        user = User.objects.get(id=user_id)
        return user
    except (InvalidToken, TokenError, User.DoesNotExist) as e:
        print(f"[Auth Middleware] Token validation failed: {e}")
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware to authenticate WebSocket connections using JWT tokens
    """
    
    async def __call__(self, scope, receive, send):
        # Get token from query string
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        print(f"[Auth Middleware] Query string: {query_string}")
        print(f"[Auth Middleware] Token present: {bool(token)}")
        
        if token:
            # Authenticate user
            scope['user'] = await get_user_from_token(token)
            print(f"[Auth Middleware] Authenticated user: {scope['user']} (ID: {scope['user'].id if scope['user'].is_authenticated else 'N/A'})")
        else:
            scope['user'] = AnonymousUser()
            print("[Auth Middleware] No token provided, user is anonymous")
        
        return await super().__call__(scope, receive, send)
