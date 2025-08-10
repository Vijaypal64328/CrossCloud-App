# Local Development Guide

This guide will help you run the CloudShare app locally in VS Code.

## Running the Backend Server

1. **Navigate to the server directory:**
   ```cmd
   cd server
   ```

2. **Install dependencies (if not already done):**
   ```cmd
   npm install
   ```

3. **Start the backend server:**
   ```cmd
   npm start
   ```

   The server should start running on port 5000 (http://localhost:5000)

## Running the Frontend Client

1. **Navigate to the client directory:**
   ```cmd
   cd client
   ```

2. **Install dependencies (if not already done):**
   ```cmd
   npm install
   ```

3. **Start the development server:**
   ```cmd
   npm run dev
   ```

   The frontend should start running on port 5173 (http://localhost:5173)

## Environment Configuration

We've updated your configuration to support both local development and production:

1. **Client Environment Files:**
   - `.env.development` - Contains development settings (points to localhost:5000)
   - `.env.production` - Contains production settings (points to your Render backend)

2. **Server CORS Configuration:**
   - Updated to be more flexible and accept requests from multiple origins
   - Allows both localhost development and production deployment

## Troubleshooting

If you encounter issues:

1. **Check console logs:**
   - The apiEndpoints.js file now logs the API URL being used
   - Check your browser console to see which URL it's connecting to

2. **Verify server is running:**
   - Make sure your Node.js server is running on port 5000
   - Check the server console for any error messages

3. **Clear browser cache:**
   - Sometimes old cached files can cause issues
   - Try clearing your browser cache or use incognito mode

4. **Check CORS errors:**
   - If you see CORS errors in the console, verify that your server is running
   - Make sure the origins in server.js match your frontend URL

## Switching Between Development and Production

- The system automatically detects whether it's in development or production mode
- In development mode, it connects to localhost:5000
- In production mode, it connects to your Render backend

No manual changes are needed when switching between environments!
