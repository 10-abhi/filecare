// api configuration utility
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  ENDPOINTS: {
    AUTH: {
      GOOGLE: '/auth/google',
      CALLBACK: '/auth/google/callback',
      ME: '/auth/me',
    },
    DRIVE: {
      SCAN: '/drive/scan',
      STATS: '/drive/stats',
      UNUSED: '/drive/unused',
      DELETE: '/drive/delete',
      TRASH: '/drive/trash',
      REMOVE: '/drive/remove',
      SHARED: '/drive/shared',
      LARGE: '/drive/large',
    }
  }
} as const;

export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// helper function for API requests with credentials
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  return fetch(buildApiUrl(url), {
    ...defaultOptions,
    ...options,
  });
};
