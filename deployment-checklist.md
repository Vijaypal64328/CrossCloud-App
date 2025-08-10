# Deployment Checklist for Cloud Share App

## Before Deployment

- [ ] Update all environment variables to production values
- [ ] Remove any hardcoded secrets or test keys
- [ ] Test all features in a production-like environment
- [ ] Ensure MongoDB Atlas connection is set up
- [ ] Configure Clerk for production
- [ ] Set up Razorpay with production keys
- [ ] Check all API endpoints use the correct production URLs

## Backend Preparation

- [ ] Create a production MongoDB database (preferably MongoDB Atlas)
- [ ] Update CORS to accept requests from production frontend URL
- [ ] Enable proper error logging
- [ ] Verify webhook signature verification is working
- [ ] Set up proper file storage solution (S3 recommended for production)

## Frontend Preparation

- [ ] Create `.env.production` with production values
- [ ] Build and test the production bundle locally
- [ ] Remove any console.log statements
- [ ] Verify all API calls use environment variables for URLs

## Render Deployment

### Backend Service

- [ ] Deploy as a Web Service
- [ ] Set all environment variables
- [ ] Verify logs after deployment
- [ ] Test API endpoints

### Frontend Service

- [ ] Deploy as a Static Site
- [ ] Set all environment variables
- [ ] Configure build command: `npm install && npm run build`
- [ ] Set publish directory to: `dist`
- [ ] Add rewrites for client-side routing: `/* /index.html 200`

## Post-Deployment

- [ ] Test user registration/login flow
- [ ] Verify file uploads work correctly
- [ ] Test credit system and purchases
- [ ] Verify webhook integrations are working
- [ ] Set up monitoring for the application
- [ ] Configure backup strategy for database

## Security Considerations

- [ ] Ensure all API endpoints are properly authenticated
- [ ] Validate and sanitize all user inputs
- [ ] Set appropriate CORS headers
- [ ] Enable rate limiting for API endpoints
- [ ] Set up proper error handling to prevent information leakage
