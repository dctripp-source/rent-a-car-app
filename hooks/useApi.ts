// hooks/useApi.ts
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';

export function useApi() {
  const { user } = useAuth();

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    try {
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Get fresh token
      const token = await user.getIdToken();

      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok && response.status === 401) {
        // Token might be expired, try to refresh
        const newToken = await user.getIdToken(true);
        
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
          },
        });

        return retryResponse;
      }

      return response;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  };

  return { fetchWithAuth };
}