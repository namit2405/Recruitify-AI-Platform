import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recruitify_backend.settings')

# Import and run waitress
from waitress import serve
from recruitify_backend.wsgi import application

print('Starting Recruitify Django server on 0.0.0.0:8000...')
serve(application, host='0.0.0.0', port=8000, threads=4)
