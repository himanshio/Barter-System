const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://barter-system-2ml4.onrender.com';

export const api = {
  // Auth endpoints
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    logout: `${API_BASE_URL}/api/auth/logout`,
    profile: `${API_BASE_URL}/api/auth/profile`,
  },
  
  // User endpoints
  users: {
    recommendations: `${API_BASE_URL}/api/users/recommendations`,
    nearby: `${API_BASE_URL}/api/users/nearby`,
    wallet: `${API_BASE_URL}/api/users/wallet`,
    sessions: `${API_BASE_URL}/api/users/sessions`,
    profile: `${API_BASE_URL}/api/users/profile`,
    updateProfile: `${API_BASE_URL}/api/users/profile`,
    connections: `${API_BASE_URL}/api/users/connections`,
    avatar: `${API_BASE_URL}/api/users/avatar`,
    search: `${API_BASE_URL}/api/users/search`,
  },
  
  // Skills endpoints
  skills: {
    all: `${API_BASE_URL}/api/skills`,
    create: `${API_BASE_URL}/api/skills`,
  },
  
  // AI endpoints
  ai: {
    bio: `${API_BASE_URL}/api/ai/bio`,
    match: `${API_BASE_URL}/api/ai/match`,
  },
  
  // Health check
  health: `${API_BASE_URL}/api/health`,
};

export default api;
