// MSAL (Microsoft Authentication Library) Configuration
// Azure AD SSO for Adani Flow
import { Configuration, LogLevel } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || ''}`,
    redirectUri: `${window.location.origin}/api/sso/callback`,
    postLogoutRedirectUri: `${window.location.origin}/logout`,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false, // Set to true for IE11 support
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: LogLevel, message: string) => {
        if (level === LogLevel.Error) {
          console.error('[MSAL]', message);
        }
      },
      logLevel: LogLevel.Error,
      piiLoggingEnabled: false,
    },
  },
};

// Scopes for login - requesting user profile and email
export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email'],
};

// Scopes for Microsoft Graph API calls
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};
