# Integration Manager Deployment Guide

## Overview
The `integration-manager` Edge Function handles all third-party API interactions for the HR platform.

## Prerequisites

Before deploying, you need to set up API credentials for the services you want to use.

### Required Secrets (Supabase Dashboard)

Navigate to: **Settings** → **Edge Functions** → **Secrets**

Add the following secrets:

#### Slack Integration
```bash
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
```

To get a Slack Bot Token:
1. Go to https://api.slack.com/apps
2. Create a new app or select existing
3. Navigate to "OAuth & Permissions"
4. Add scopes: `chat:write`, `channels:manage`, `users:read`
5. Install app to workspace
6. Copy "Bot User OAuth Token"

#### Zoom Integration
```bash
ZOOM_ACCESS_TOKEN=your-zoom-access-token
```

To get a Zoom Access Token:
1. Go to https://marketplace.zoom.us/
2. Develop → Build App → Server-to-Server OAuth
3. Create app and get credentials
4. Generate access token

#### SendGrid Email
```bash
SENDGRID_API_KEY=SG.your-api-key-here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=HR Team
```

To get SendGrid API Key:
1. Go to https://sendgrid.com/
2. Sign up for free account
3. Navigate to Settings → API Keys
4. Create API Key with "Mail Send" permissions
5. Verify sender email address

## Deployment Steps

### 1. Deploy Database Schema
```sql
-- In Supabase SQL Editor, run:
-- migrations/integrations_schema.sql
-- Then run:
-- migrations/integrations_rls.sql
```

### 2. Add Secrets
In Supabase Dashboard → Settings → Edge Functions → Secrets:
- Add each secret individually
- Click "Save" after each one

### 3. Deploy Function
```bash
# If using Supabase CLI:
supabase functions deploy integration-manager

# If using Dashboard:
1. Go to Edge Functions
2. Click "Create new function"
3. Name: integration-manager
4. Copy code from supabase/functions/integration-manager/index.ts
5. Deploy
```

## Testing

### Test Slack Message
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/integration-manager \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "slack_send_message",
    "channel": "#general",
    "text": "Test message from HR platform!"
  }'
```

### Test Email
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/integration-manager \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "email_send",
    "to": "test@example.com",
    "subject": "Test Email",
    "text": "This is a test email from the HR platform."
  }'
```

### Test Zoom Meeting
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/integration-manager \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "zoom_create_meeting",
    "topic": "Test Interview",
    "start_time": "2025-11-25T10:00:00Z",
    "duration": 60
  }'
```

## Supported Actions

| Action | Description | Required Params |
|--------|-------------|----------------|
| `slack_send_message` | Send message to Slack channel | `channel`, `text` |
| `zoom_create_meeting` | Create Zoom meeting | `topic`, `start_time` |
| `email_send` | Send plain email | `to`, `subject`, `html` or `text` |
| `email_send_template` | Send templated email | `template_name`, `to`, `variables` |
| `list_integrations` | List configured integrations | None |
| `get_integration_logs` | Get integration activity logs | `limit`, `service_name` (optional) |

## Troubleshooting

### "SLACK_BOT_TOKEN not configured"
- Add secret in Supabase Dashboard
- Redeploy function after adding secrets

### "SendGrid API error"
- Verify API key is correct
- Check sender email is verified in SendGrid
- Ensure API key has "Mail Send" permissions

### "Zoom API error"
- Regenerate access token (they expire)
- Verify app is published in Zoom Marketplace

## Monitoring

View logs in Supabase Dashboard:
- Go to **Logs** → **Edge Functions**
- Select `integration-manager`
- Filter by error level for troubleshooting

All integration activities are logged to `integration_logs` table for audit trail.

## Next Steps

1. Register integrations in database
2. Build frontend UI for integration management
3. Test each integration
4. Set up notification preferences
