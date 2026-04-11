// Sample Custom API Call
import apiConfig from './apiConfig';

interface ApiCallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  data?: unknown;
  headers?: Record<string, string>;
}

export const customApiCall = async ({
  method = 'GET',
  endpoint,
  data,
  headers = {},
}: ApiCallOptions) => {
  try {
    const url = `${apiConfig.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      method,
      headers: {
        ...apiConfig.headers,
        ...headers,
      },
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};

export default customApiCall;

