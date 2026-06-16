import axios from 'axios';

const API_BASE = 'http://localhost:8000';
const API_URL = `${API_BASE}/api/`;

// Create axios client instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to attach JWT token dynamically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiry (simplified for prototype)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear tokens if unauthorized
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    return Promise.reject(error);
  }
);

// Auth helper
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await axios.post(`${API_BASE}/api/token/`, { username, password });
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
  getMe: async () => {
    const response = await apiClient.get('users/me/');
    return response.data;
  }
};

// Group API
export const groupsApi = {
  list: async () => {
    const response = await apiClient.get('groups/');
    return response.data;
  },
  create: async ({ name, description }: { name: string; description?: string }) => {
    const response = await apiClient.post('groups/', { name, description });
    return response.data;
  },
  join: async (inviteCode: string) => {
    const response = await apiClient.post('groups/join/', { invite_code: inviteCode });
    return response.data;
  }
};

// Event API
export const eventsApi = {
  list: async (groupId: number | string | null) => {
    const response = await apiClient.get('events/', { params: { group: groupId } });
    return response.data;
  },
  create: async (eventData: any) => {
    // Convert datetimes to server-expected ISO string format
    const response = await apiClient.post('events/', eventData);
    return response.data;
  },
  update: async ({ id, ...eventData }: any) => {
    const response = await apiClient.put(`events/${id}/`, eventData);
    return response.data;
  },
  delete: async (id: number | string) => {
    const response = await apiClient.delete(`events/${id}/`);
    return response.data;
  }
};

// Template API
export const templatesApi = {
  list: async (groupId: number | string | null) => {
    const response = await apiClient.get('templates/', { params: { group: groupId } });
    return response.data;
  },
  create: async (templateData: any) => {
    const response = await apiClient.post('templates/', templateData);
    return response.data;
  }
};
