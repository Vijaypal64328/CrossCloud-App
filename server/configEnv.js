import dotenv from "dotenv";
import path from "path";

// Determine the environment and load the appropriate .env file
const env = process.env.NODE_ENV || "development";
const envPath = path.resolve(process.cwd(), `server/.env.${env}`);

// Load the specific .env file if it exists, otherwise load the default .env
dotenv.config({ path: envPath });
dotenv.config(); // Load default .env as a fallback

