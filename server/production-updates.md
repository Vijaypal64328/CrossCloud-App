# Production Updates for Cloud Share App

## Server Changes

### Update CORS in `server.js`

```javascript
// Replace the current CORS configuration with this:
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL
    : "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
```

### Enable Signature Verification for Webhooks

Ensure webhook signature verification is enabled in production.

### Update Clerk Authentication

Consider using the official Clerk SDK for more robust authentication in production.

## Client Changes

### Update API URL in `.env.production`

Create a `.env.production` file in your client directory with:

```
VITE_API_URL=https://your-render-app.onrender.com
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_RAZORPAY_KEY=your_razorpay_key_id
```

## Render Deployment Configuration

### Web Service for Backend

1. **Build Command:**
   ```
   cd server && npm install
   ```

2. **Start Command:**
   ```
   cd server && node server.js
   ```

3. **Environment Variables:**
   - Set all the variables from `.env.example`

### Static Site for Frontend

1. **Build Command:**
   ```
   cd client && npm install && npm run build
   ```

2. **Publish Directory:**
   ```
   client/dist
   ```

3. **Environment Variables:**
   - Set all the VITE_* variables

## Clerk Webhook Configuration

1. In your Clerk Dashboard, create a new webhook endpoint
2. Point it to `https://your-render-app.onrender.com/webhooks/clerk`
3. Select relevant events (user.created, user.updated, etc.)
4. Copy the signing secret to your server's CLERK_WEBHOOK_SECRET env variable

## Razorpay Configuration

1. Update your Razorpay account to use the production keys
2. Set the webhook URL in Razorpay dashboard to your production endpoint
3. Update environment variables with production keys

## File Storage

For MongoDB-only storage, set:

```
STORAGE_DRIVER=gridfs
MONGO_URI=your-mongodb-uri
GRIDFS_BUCKET=uploads   # optional; defaults to uploads
```
