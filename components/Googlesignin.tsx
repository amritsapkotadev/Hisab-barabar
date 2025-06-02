import React from 'react';
import { Button } from 'react-native';
import * as AuthSession from 'expo-auth-session';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export default function GoogleSignIn() {
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: '1080592315622-kurttuc2tjadl05sftpcedd9qckasv9f.apps.googleusercontent.com', // e.g. from Google Cloud Console (Web client ID)
      redirectUri: AuthSession.makeRedirectUri(),
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code, // PKCE flow
    },
    discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      console.log('Authorization code:', code);
      // Here you can exchange the code for tokens (ID token, access token)
      // Ideally, do this on your backend for security
    }
  }, [response]);

  return (
    <Button
      disabled={!request}
      title="Sign in with Google"
      onPress={() => promptAsync({ useProxy: true })}
    />
  );
}
