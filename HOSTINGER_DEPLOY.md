# 🚀 BondQuest - Hostinger VPS Deployment Guide

## Prerequisites
- Hostinger VPS account
- Domain name (optional but recommended)
- SSH access to your VPS

## Quick Deployment (Recommended)

### Option 1: One-Command Deployment
```bash
# Connect to your VPS
ssh root@your-vps-ip

# Run automated deployment
curl -sSL https://raw.githubusercontent.com/TabareMajem/Bondquest/main/deploy.sh | bash
```

### Option 2: Manual Step-by-Step

#### 1. VPS Setup
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install required packages
npm install -g pm2
apt install nginx git postgresql-client -y
```

#### 2. Deploy Application
```bash
# Clone repository
cd /var/www
git clone https://github.com/TabareMajem/Bondquest.git
cd Bondquest

# Install dependencies
npm install

# Create environment file
nano .env
```

**Add your environment variables:**
```env
DATABASE_URL="your-postgresql-connection-string"
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"
SENDGRID_API_KEY="your-sendgrid-api-key"
SESSION_SECRET="your-session-secret"
NODE_ENV="production"
PORT="3000"
```

#### 3. Build and Start
```bash
# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

#### 4. Configure Nginx
```bash
# Create Nginx config
nano /etc/nginx/sites-available/bondquest
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/bondquest /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

#### 5. Setup SSL
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d your-domain.com
```

#### 6. Configure Firewall
```bash
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
```

## Verification

Test your deployment:
```bash
# Check services
pm2 status
systemctl status nginx

# Test application
curl http://localhost:3000/api/health
curl https://your-domain.com/api/health
```

## Your Application URLs

After deployment, BondQuest will be available at:
- **Main App**: https://your-domain.com
- **Voice Onboarding**: https://your-domain.com/voice-onboarding  
- **Dashboard**: https://your-domain.com/dashboard
- **API Health**: https://your-domain.com/api/health

## Common Commands

```bash
# View logs
pm2 logs bondquest

# Restart app
pm2 restart bondquest

# Update app
cd /var/www/Bondquest && git pull && npm run build && pm2 restart bondquest
```

## Support

For issues:
1. Check PM2 logs: `pm2 logs bondquest`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify environment variables: `pm2 env bondquest`

**Your BondQuest is now production-ready! 🎉** 