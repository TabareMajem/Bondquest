# BondQuest Deployment Guide

This guide provides step-by-step instructions for deploying the BondQuest application to a new domain.

## Prerequisites

Before deploying, ensure you have:
- Node.js (v16 or higher)
- PostgreSQL database
- Google Developer account (for OAuth)
- Access to your domain's DNS settings
- Gemini API key (for AI functionality)

## Step 1: Clone or Export the Code

Download the code from your Replit repository or clone it using Git.

## Step 2: Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL=postgresql://username:password@hostname:port/database

# Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret

# API Keys
GEMINI_API_KEY=your_gemini_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Application
NODE_ENV=production
BASE_URL=https://your-domain.com
PORT=your_port_number
```

## Step 3: Update OAuth Callback URLs

1. Go to the [Google Developer Console](https://console.developers.google.com/)
2. Select your project
3. Navigate to "Credentials" and edit your OAuth 2.0 Client IDs
4. Update the "Authorized redirect URIs" to include:
   - `https://your-domain.com/auth/google/callback`

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Database Setup

Run the database migration to create the schema:

```bash
npm run db:push
```

## Step 6: Build the Application

```bash
sh ./deploy.sh
```

This will create a `dist` directory with the compiled application.

## Step 7: Start the Server

```bash
NODE_ENV=production node dist/server/index.js
```

Consider using a process manager like PM2 for production:

```bash
npm install -g pm2
pm2 start dist/server/index.js --name bondquest
```

## Step 8: Set Up Reverse Proxy (Optional)

For production environments, consider using Nginx or Apache as a reverse proxy.

### Example Nginx Configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:your_port_number;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Step 9: Set Up HTTPS

Use Let's Encrypt to get a free SSL certificate.

## Troubleshooting

### Common Issues:

1. **Database Connection Errors**:
   - Check your DATABASE_URL is correct
   - Ensure the database server allows connections from your deployment server

2. **OAuth Authentication Problems**:
   - Verify that your callback URLs in Google Developer Console match your domain
   - Check that environment variables are correctly set

3. **Deployment Path Mismatches**:
   - Ensure that the deploy.sh script is creating the correct file structure
   - Verify that your start command points to the correct file location

## Production Checklist

- [ ] HTTPS is enabled
- [ ] Environment variables are properly set
- [ ] Database is secure and backed up
- [ ] OAuth callback URLs are correctly configured
- [ ] Error logging is set up
- [ ] Performance monitoring is configured
- [ ] Regular database backups are scheduled