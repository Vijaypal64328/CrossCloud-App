# CloudShare App: Quick Reference Guide

## Switching Between Environments

This guide provides a quick reference for switching between local development and production deployment on Render.

### Environment Configuration Files

| Environment | Frontend Files          | Backend Files        |
|------------|------------------------|---------------------|
| Local      | .env.development       | .env                |
| Production | .env.production        | (Render env vars)   |

### Configuration Quick Checklist

#### For Local Development:

1. **Backend (Server)**
   - ✅ `.env` file has `NODE_ENV=development`
   - ✅ CORS allows `localhost:5173`
   - ✅ MongoDB connection is set to development database

2. **Frontend (Client)**
   - ✅ `.env.development` has `VITE_API_URL=http://localhost:5000`
   - ✅ Using development Clerk and Razorpay keys

#### For Production Deployment:

1. **Backend (Server)**
   - ✅ Render environment variables set correctly
   - ✅ `NODE_ENV=production`
   - ✅ CORS allows production frontend URL
   - ✅ `CLIENT_URL` points to production frontend

2. **Frontend (Client)**
   - ✅ `.env.production` has `VITE_API_URL=https://crosscloud-app-backend.onrender.com`
   - ✅ Using production Clerk and Razorpay keys

### Starting Local Environment

```bash
# Start backend server
cd server
npm start

# In a separate terminal, start frontend
cd client
npm run dev
```

### Deploying to Render

1. Push changes to GitHub
2. Render will automatically deploy from your connected repository

---

© 2025 CloudShare App
