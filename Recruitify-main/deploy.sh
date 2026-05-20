#!/bin/bash

# Recruitify Production Deployment Script
# Domain: recruitify.namits.shop

set -e  # Exit on error

echo "=========================================="
echo "Recruitify Production Deployment"
echo "Domain: recruitify.namits.shop"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}Please do not run as root. Run as regular user with sudo privileges.${NC}"
    exit 1
fi

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check prerequisites
print_info "Checking prerequisites..."

command -v python3 >/dev/null 2>&1 || { print_error "Python3 is required but not installed. Aborting."; exit 1; }
command -v node >/dev/null 2>&1 || { print_error "Node.js is required but not installed. Aborting."; exit 1; }
command -v nginx >/dev/null 2>&1 || { print_error "Nginx is required but not installed. Aborting."; exit 1; }
command -v psql >/dev/null 2>&1 || { print_error "PostgreSQL is required but not installed. Aborting."; exit 1; }

print_success "All prerequisites found"

# Get configuration from user
echo ""
print_info "Please provide the following information:"
echo ""

read -p "Server IP Address: " SERVER_IP
read -p "Database Password: " -s DB_PASSWORD
echo ""
read -p "Django Secret Key (leave empty to generate): " DJANGO_SECRET
echo ""
read -p "Email Host (e.g., smtp.gmail.com): " EMAIL_HOST
read -p "Email User: " EMAIL_USER
read -p "Email Password: " -s EMAIL_PASSWORD
echo ""
read -p "Groq API Key: " GROQ_KEY
echo ""

# Generate Django secret key if not provided
if [ -z "$DJANGO_SECRET" ]; then
    DJANGO_SECRET=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
    print_success "Generated Django secret key"
fi

# Create application directory
print_info "Creating application directory..."
sudo mkdir -p /var/www/recruitify
sudo chown $USER:$USER /var/www/recruitify
print_success "Application directory created"

# Setup PostgreSQL database
print_info "Setting up PostgreSQL database..."
sudo -u postgres psql <<EOF
CREATE DATABASE recruitify_db;
CREATE USER recruitify_user WITH PASSWORD '$DB_PASSWORD';
ALTER ROLE recruitify_user SET client_encoding TO 'utf8';
ALTER ROLE recruitify_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE recruitify_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE recruitify_db TO recruitify_user;
EOF
print_success "Database created"

# Copy project files
print_info "Copying project files..."
cp -r . /var/www/recruitify/
cd /var/www/recruitify
print_success "Project files copied"

# Setup backend
print_info "Setting up backend..."
cd /var/www/recruitify/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn psycopg2-binary python-dotenv

# Create production environment file
cat > .env.production <<EOF
DEBUG=False
SECRET_KEY=$DJANGO_SECRET
ALLOWED_HOSTS=recruitify.namits.shop,www.recruitify.namits.shop

DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=recruitify_db
DATABASE_USER=recruitify_user
DATABASE_PASSWORD=$DB_PASSWORD
DATABASE_HOST=localhost
DATABASE_PORT=5432

CORS_ALLOWED_ORIGINS=https://recruitify.namits.shop,https://www.recruitify.namits.shop

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=$EMAIL_HOST
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=$EMAIL_USER
EMAIL_HOST_PASSWORD=$EMAIL_PASSWORD

GROQ_API_KEY=$GROQ_KEY

MEDIA_ROOT=/var/www/recruitify/backend/media
STATIC_ROOT=/var/www/recruitify/backend/staticfiles
EOF

# Run migrations
python manage.py migrate
python manage.py collectstatic --noinput

print_success "Backend setup complete"

# Setup frontend
print_info "Setting up frontend..."
cd /var/www/recruitify/frontend

# Create production environment file
cat > .env.production <<EOF
VITE_API_BASE_URL=https://recruitify.namits.shop/api
VITE_WS_BASE_URL=wss://recruitify.namits.shop/ws
EOF

# Install dependencies and build
npm install
npm run build

print_success "Frontend built successfully"

# Create systemd services
print_info "Creating systemd services..."

# Backend service
sudo tee /etc/systemd/system/recruitify-backend.service > /dev/null <<EOF
[Unit]
Description=Recruitify Backend (Gunicorn)
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/recruitify/backend
Environment="PATH=/var/www/recruitify/backend/venv/bin"
ExecStart=/var/www/recruitify/backend/venv/bin/gunicorn \\
    --workers 3 \\
    --bind unix:/var/www/recruitify/backend/gunicorn.sock \\
    backend.wsgi:application

[Install]
WantedBy=multi-user.target
EOF

# Daphne service
sudo tee /etc/systemd/system/recruitify-daphne.service > /dev/null <<EOF
[Unit]
Description=Recruitify Daphne (WebSocket)
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/recruitify/backend
Environment="PATH=/var/www/recruitify/backend/venv/bin"
ExecStart=/var/www/recruitify/backend/venv/bin/daphne \\
    -b 127.0.0.1 \\
    -p 8001 \\
    backend.asgi:application

[Install]
WantedBy=multi-user.target
EOF

print_success "Systemd services created"

# Create Nginx configuration
print_info "Creating Nginx configuration..."

sudo tee /etc/nginx/sites-available/recruitify > /dev/null <<'EOF'
server {
    listen 80;
    server_name www.recruitify.namits.shop;
    return 301 https://recruitify.namits.shop$request_uri;
}

server {
    listen 80;
    server_name recruitify.namits.shop;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name recruitify.namits.shop;

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        root /var/www/recruitify/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    location /api/ {
        proxy_pass http://unix:/var/www/recruitify/backend/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://unix:/var/www/recruitify/backend/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /var/www/recruitify/backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /var/www/recruitify/backend/media/;
        expires 1y;
        add_header Cache-Control "public";
    }

    client_max_body_size 50M;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
EOF

sudo ln -sf /etc/nginx/sites-available/recruitify /etc/nginx/sites-enabled/
sudo nginx -t

print_success "Nginx configuration created"

# Set permissions
print_info "Setting file permissions..."
sudo chown -R www-data:www-data /var/www/recruitify
sudo chmod -R 755 /var/www/recruitify
sudo chmod -R 775 /var/www/recruitify/backend/media
sudo chmod 660 /var/www/recruitify/backend/.env.production
print_success "Permissions set"

# Start services
print_info "Starting services..."
sudo systemctl daemon-reload
sudo systemctl start recruitify-backend
sudo systemctl start recruitify-daphne
sudo systemctl enable recruitify-backend
sudo systemctl enable recruitify-daphne
sudo systemctl restart nginx
print_success "Services started"

# Setup firewall
print_info "Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
print_success "Firewall configured"

echo ""
echo "=========================================="
print_success "Deployment Complete!"
echo "=========================================="
echo ""
print_info "Next steps:"
echo "1. Configure DNS: Add A record for 'recruitify' pointing to $SERVER_IP"
echo "2. Wait for DNS propagation (5-15 minutes)"
echo "3. Run: sudo certbot --nginx -d recruitify.namits.shop -d www.recruitify.namits.shop"
echo "4. Create superuser: cd /var/www/recruitify/backend && source venv/bin/activate && python manage.py createsuperuser"
echo "5. Visit: https://recruitify.namits.shop"
echo ""
print_info "Check service status:"
echo "  sudo systemctl status recruitify-backend"
echo "  sudo systemctl status recruitify-daphne"
echo ""
print_info "View logs:"
echo "  sudo journalctl -u recruitify-backend -f"
echo "  sudo journalctl -u recruitify-daphne -f"
echo ""
