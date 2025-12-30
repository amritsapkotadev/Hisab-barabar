import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Complete the auth session for web
WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration
const GOOGLE_CLIENT_ID = {
  web: '1080592315622-59udlvepkltt7h80b5vh38q2a9mdom9f.apps.googleusercontent.com',
  ios: '1080592315622-8dcon4ij4b8ioj5rmja8sgpd3qb9hh74.apps.googleusercontent.com',
  android: '1080592315622-8dcon4ij4b8ioj5rmja8sgpd3qb9hh74.apps.googleusercontent.com',
};

// ✅ Use Expo proxy for development and Expo Go
const redirectUri = AuthSession.makeRedirectUri({
  useProxy: true,
});

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://www.googleapis.com/oauth2/v4/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export const googleAuthService = {
  // Get the appropriate client ID for the current platform
  getClientId(): string {
    if (Platform.OS === 'web') {
      return GOOGLE_CLIENT_ID.web;
    } else if (Platform.OS === 'ios') {
      return GOOGLE_CLIENT_ID.ios;
    } else {
      return GOOGLE_CLIENT_ID.android;
    }
  },

  // Create auth request
  createAuthRequest() {
    return new AuthSession.AuthRequest({
      clientId: this.getClientId(),
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code,
      redirectUri,
      extraParams: {
        access_type: 'offline',
      },
    });
  },

  // Sign in with Google
  async signInWithGoogle(): Promise<{ success: boolean; user?: GoogleUser; error?: string }> {
    try {
      const request = this.createAuthRequest();
      const result = await request.promptAsync(discovery, { useProxy: true });

      if (result.type === 'success') {
        // Exchange authorization code for access token
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: this.getClientId(),
            code: result.params.code,
            extraParams: {
              code_verifier: request.codeVerifier ?? (() => { throw new Error('codeVerifier is undefined'); })(),
            },
            redirectUri,
          },
          discovery
        );

        if (tokenResult.accessToken) {
          const userInfo = await this.fetchUserInfo(tokenResult.accessToken);
          return { success: true, user: userInfo };
        } else {
          return { success: false, error: 'Failed to get access token' };
        }
      } else if (result.type === 'cancel') {
        return { success: false, error: 'User cancelled authentication' };
      } else {
        return { success: false, error: 'Authentication failed' };
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      return { success: false, error: 'Authentication error occurred' };
    }
  },

  // Fetch user information from Google API
  async fetchUserInfo(accessToken: string): Promise<GoogleUser> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo = await response.json();
    return {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      given_name: userInfo.given_name,
      family_name: userInfo.family_name,
    };
  },

  // Sign out (revoke token)
  async signOut(accessToken: string): Promise<boolean> {
    try {
      await AuthSession.revokeAsync(
        {
          token: accessToken,
          clientId: this.getClientId(),
        },
        discovery
      );
      return true;
    } catch (error) {
      console.error('Sign out error:', error);
      return false;
    }
  },
};
