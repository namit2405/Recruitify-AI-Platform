"""
ASGI config for recruitify_backend project.
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from chat.routing import websocket_urlpatterns
from chat.middleware import JWTAuthMiddleware
from django.conf import settings

# In development, skip origin validation so localhost:3000 can connect.
# In production, wrap with AllowedHostsOriginValidator.
websocket_app = JWTAuthMiddleware(URLRouter(websocket_urlpatterns))

if not settings.DEBUG:
    websocket_app = AllowedHostsOriginValidator(websocket_app)

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": websocket_app,
})
