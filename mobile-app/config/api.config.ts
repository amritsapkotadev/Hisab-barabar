/**
 * API Configuration
 * 
 * This file contains the API URL configuration for the mobile app.
 * The backend is now running as a Next.js app in the /web-app folder.
 */

// Development URLs (pointing to Next.js backend in /web-app)
const LOCAL_API_URL = 'http://localhost:3000/api'
const LOCAL_API_URL_ANDROID = 'http://10.0.2.2:3000/api' // Android emulator

// Production URLs
const PRODUCTION_API_URL = 'https://your-app.vercel.app/api' // Update this with your deployed URL

/**
 * Current API URL
 * 
 * Options:
 * - LOCAL_API_URL: For iOS simulator and physical devices on same network
 * - LOCAL_API_URL_ANDROID: For Android emulator
 * - PRODUCTION_API_URL: For production/deployed Next.js app
 * 
 * To run locally:
 * 1. Start the Next.js backend: cd web-app && npm run dev
 * 2. Start the mobile app: cd mobile-app && npm start
 */

// Auto-switch based on environment
export const API_URL = __DEV__ ? LOCAL_API_URL : PRODUCTION_API_URL

// Alternative: Use environment variables (recommended for production)
// export const API_URL = process.env.EXPO_PUBLIC_API_URL || LOCAL_API_URL

export default {
  API_URL,
  LOCAL_API_URL,
  LOCAL_API_URL_ANDROID,
  PRODUCTION_API_URL,
}
