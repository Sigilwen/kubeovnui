// API configuration
// In production (containerized), the API will be proxied through nginx
// In development, it will call localhost:8000 directly
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Proxied through nginx
  : 'http://localhost:8000/api';

export { API_BASE_URL };