// CORS Update for Production
// Replace the current CORS configuration in server.js with this:

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL || "https://crosscloud-app.onrender.com"  // Your frontend URL
    : "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// If your frontend is hosted at a different URL, make sure to update the URL above
// or set the CLIENT_URL environment variable in your Render dashboard
