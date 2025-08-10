# CORS and API URL Fix Guide

This guide will help you fix the CORS and API URL issues for your deployed CloudShare application.

## Server-Side Fixes

1. **Update CORS Configuration in server.js**

   We've updated the CORS configuration in your server.js file to accept requests from both your local development environment and your deployed frontend:

   ```javascript
   app.use(cors({
     origin: ["http://localhost:5173", "https://crosscloud-app-frontend.onrender.com"],
     credentials: true,
     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
     allowedHeaders: ["Content-Type", "Authorization"]
   }));
   ```

   If your frontend URL is different, you should update the origin array accordingly.

2. **Verify Environment Variables on the Server**

   Make sure your server deployment on Render has the following environment variables set:
   - `NODE_ENV=production`
   - `CLIENT_URL=https://crosscloud-app-frontend.onrender.com` (replace with your actual frontend URL)

## Client-Side Fixes

1. **Environment Variables**

   We've verified that your `.env` and `.env.production` files contain the correct API URL:
   ```
   VITE_API_URL=https://crosscloud-app-backend.onrender.com
   ```

2. **Updated apiEndpoints.js**

   We've updated the `apiEndpoints.js` file to use the production URL as a fallback instead of localhost:

   ```javascript
   const BASE_URL = import.meta.env.VITE_API_URL || 'https://crosscloud-app-backend.onrender.com';
   ```

3. **Improved Vite Configuration**

   We've updated your Vite config to explicitly define environment variables:

   ```javascript
   export default defineConfig(({ mode }) => {
     const env = loadEnv(mode, process.cwd(), '')
     
     return {
       plugins: [react(), tailwindcss()],
       define: {
         'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'https://crosscloud-app-backend.onrender.com'),
       },
     }
   })
   ```

4. **Deploy Fix Script**

   We've created a `deploy-fix.js` script that:
   - Checks your environment files
   - Creates a script that displays the API URL being used in the browser
   - Helps you debug the environment variable issue

## Deployment Steps

1. **Rebuild and Deploy the Frontend**

   ```bash
   # In the client folder
   npm run build
   ```

   Then deploy the updated build to Render.

2. **Restart the Backend Server**

   Go to your Render dashboard and restart the backend service to apply the CORS changes.

3. **Verify the Fix**

   After deploying, open your browser's developer tools (F12) and check the console for:
   - The API URL being used (should show the Render backend URL)
   - Any remaining CORS errors (should be gone)

4. **Debugging Tools**

   If you still see issues, the deploy-fix script has added a small overlay to your app that displays the API URL being used. This helps confirm whether your environment variables are correctly applied.

## Checking the Configuration

To run the deploy-fix script:

```bash
cd client
node deploy-fix.js
```

Then rebuild and deploy your application.
