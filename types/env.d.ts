declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_GOOGLE_CLIENT_ID: string;
      EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: string;
      EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: string;
    }
  }
}

export {};