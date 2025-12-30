declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL: string;
      EXPO_PUBLIC_APP_DOMAIN: string;
      MONGO_URI: string;
      JWT_SECRET: string;
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      APP_DOMAIN: string;
      GOOGLE_CLIENT_ID_WEB: string;
      GOOGLE_CLIENT_ID_IOS: string;
      GOOGLE_CLIENT_ID_ANDROID: string;
    }
  }
}

// Ensure this file is treated as a module
export {};