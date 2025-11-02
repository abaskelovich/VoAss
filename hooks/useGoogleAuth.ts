import { useState, useEffect, useCallback } from 'react';

// You need to create a Google Cloud project and get a client ID.
// For security, this should be an environment variable.
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''; 
if (!CLIENT_ID) {
    console.error("Google Client ID is not set. Please set the GOOGLE_CLIENT_ID environment variable.");
}

// Scopes for the services we want to access.
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/spreadsheets',
  'profile',
  'email',
].join(' ');

declare global {
    interface Window {
        gapi: any;
        google: any;
        tokenClient: any;
    }
}

interface UserProfile {
    name: string;
    email: string;
    picture: string;
}

export const useGoogleAuth = () => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    const gapiLoaded = useCallback(() => {
        window.gapi.client.init({
            apiKey: process.env.API_KEY,
            clientId: CLIENT_ID,
            scope: SCOPES,
            discoveryDocs: [
                'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
                'https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest',
                'https://www.googleapis.com/discovery/v1/apis/docs/v1/rest',
                'https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest',
            ],
        }).then(() => {
             setIsInitialized(true);
        }).catch((error: any) => {
            console.error("Error initializing gapi client:", error);
        });
    }, []);
    
    const gisLoaded = useCallback(() => {
        window.tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: async (tokenResponse: any) => {
                if (tokenResponse.error) {
                    console.error('GIS Auth error:', tokenResponse.error);
                    return;
                }
                setIsSignedIn(true);
                // Fetch user profile after successful sign in
                try {
                    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                        headers: {
                            'Authorization': `Bearer ${tokenResponse.access_token}`
                        }
                    });
                    const profile = await response.json();
                    setUserProfile({ name: profile.name, email: profile.email, picture: profile.picture });
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                }
            },
        });
    }, []);

    useEffect(() => {
        const scriptGapi = document.createElement('script');
        scriptGapi.src = 'https://apis.google.com/js/api.js';
        scriptGapi.async = true;
        scriptGapi.defer = true;
        scriptGapi.onload = () => window.gapi.load('client', gapiLoaded);
        document.body.appendChild(scriptGapi);

        const scriptGis = document.createElement('script');
        scriptGis.src = 'https://accounts.google.com/gsi/client';
        scriptGis.async = true;
        scriptGis.defer = true;
        scriptGis.onload = gisLoaded;
        document.body.appendChild(scriptGis);

        return () => {
            document.body.removeChild(scriptGapi);
            document.body.removeChild(scriptGis);
        }
    }, [gapiLoaded, gisLoaded]);

    const signIn = () => {
        if (window.tokenClient) {
             // Prompt the user to select a Google Account and ask for consent to share their data
             // when establishing a new session.
            window.tokenClient.requestAccessToken({prompt: 'consent'});
        }
    };
    
    const signOut = () => {
        const token = window.gapi.client.getToken();
        if (token !== null) {
            window.google.accounts.oauth2.revoke(token.access_token, () => {
                window.gapi.client.setToken(null);
                setIsSignedIn(false);
                setUserProfile(null);
            });
        }
    };

    return {
        isInitialized,
        isSignedIn,
        userProfile,
        signIn,
        signOut,
    };
};