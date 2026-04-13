// API root: either `https://host` or `https://host/api` — httpClient dedupes `api/` in paths.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://billspro.hmstech.org/api";

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// API Routes - Keep folder structure but routes removed
// Add your routes here as needed

export { API_BASE_URL };
export default apiConfig;

