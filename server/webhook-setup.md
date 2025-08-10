# Webhook Setup Guide for Cloud Share App

## Clerk Webhooks

### 1. Configure Webhook in Clerk Dashboard

1. Log in to your [Clerk Dashboard](https://dashboard.clerk.dev/)
2. Navigate to Webhooks section
3. Add a new endpoint with URL: `https://your-render-backend.onrender.com/webhooks/clerk`
4. Select these events:
   - user.created
   - user.updated
   - user.deleted
5. Copy the signing secret

### 2. Add Signing Secret to Environment Variables

Add to your Render environment variables:
```
CLERK_WEBHOOK_SECRET=your_signing_secret_from_clerk
```

### 3. Test Webhook

After deployment, go to the webhook in Clerk dashboard and click "Test" to verify it's working.

## Razorpay Webhooks

### 1. Configure Webhook in Razorpay Dashboard

1. Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to Settings > Webhooks
3. Add a new endpoint with URL: `https://your-render-backend.onrender.com/webhooks/razorpay`
4. Select relevant events:
   - payment.authorized
   - payment.captured
   - payment.failed
5. Generate a webhook secret

### 2. Add Secret to Environment Variables

Add to your Render environment variables:
```
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_from_razorpay
```

### 3. Create a Webhook Handler

Create a new route in your server to handle Razorpay webhooks with signature verification.
