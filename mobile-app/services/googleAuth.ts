import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const GOOGLE_WEB_CLIENT_ID = '858936552466-749g86ogbvc27ma4c029sh3mogcca84d.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '858936552466-rfqc656f5ai8se17grq9a4989t008ni4.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = '858936552466-61hkpkq9u1o35rk43e5qb6hl0g1sm90b.apps.googleusercontent.com';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

interface GoogleAuthResult {
  success: boolean;
  user?: GoogleUser;
  error?: string;
}

class GoogleAuthService {
  private configured = false;

  configure() {
    if (this.configured) return;
    
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
      accountName: '',
      scopes: ['profile', 'email'],
    });
    
    this.configured = true;
  }

  async signInWithGoogle(): Promise<GoogleAuthResult> {
    try {
      // Ensure configuration is done
      this.configure();

      // Check if Google Play Services are available (Android)
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Sign out first to force account picker
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore if not signed in
      }

      // Sign in - this will now show account picker
      const userInfo = await GoogleSignin.signIn();

      // Check response type
      if (userInfo.type === 'cancelled') {
        return {
          success: false,
          error: 'User cancelled authentication',
        };
      }

      // Check if user data exists (v16+ returns data.user)
      const userData = userInfo.data?.user;
      if (!userData || !userData.id || !userData.email) {
        console.error('Invalid userInfo structure:', userInfo);
        return {
          success: false,
          error: 'Invalid response from Google Sign-in',
        };
      }

      // Extract user information
      const user: GoogleUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name || '',
        picture: userData.photo || undefined,
        given_name: userData.givenName || undefined,
        family_name: userData.familyName || undefined,
      };

      return {
        success: true,
        user,
      };
    } catch (error: any) {
      console.error('Google sign-in error:', error);

      // Handle specific error codes
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return {
          success: false,
          error: 'User cancelled authentication',
        };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return {
          success: false,
          error: 'Sign in already in progress',
        };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return {
          success: false,
          error: 'Google Play Services not available or outdated',
        };
      } else {
        return {
          success: false,
          error: error.message || 'Failed to sign in with Google',
        };
      }
    }
  }

  async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Error signing out from Google:', error);
    }
  }

  async getCurrentUser(): Promise<GoogleUser | null> {
    try {
      const userInfo = await GoogleSignin.signInSilently();
      const userData = userInfo?.data?.user;
      
      if (userData && userData.id && userData.email) {
        return {
          id: userData.id,
          email: userData.email,
          name: userData.name || '',
          picture: userData.photo || undefined,
          given_name: userData.givenName || undefined,
          family_name: userData.familyName || undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async isSignedIn(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }
}

export const googleAuthService = new GoogleAuthService();
