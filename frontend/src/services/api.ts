import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const { tokens } = useAuthStore.getState()
    if (tokens?.access_token) {
      config.headers.Authorization = `Bearer ${tokens.access_token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const { tokens, user, clearAuth } = useAuthStore.getState()
        
        if (tokens?.refresh_token) {
          // Attempt to refresh token
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: tokens.refresh_token
          })

          const { tokens: newTokens } = response.data.data
          useAuthStore.setState({ 
            tokens: newTokens,
            user: user ? { ...user } : null
          })

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`
          return api(originalRequest)
        } else {
          // No refresh token, clear auth and redirect to login
          clearAuth()
          window.location.href = '/auth/login'
        }
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        useAuthStore.getState().clearAuth()
        window.location.href = '/auth/login'
      }
    }

    // Handle other errors
    if (error.response?.data?.error?.message) {
      toast.error(error.response.data.error.message)
    } else if (error.message) {
      toast.error(error.message)
    } else {
      toast.error('An unexpected error occurred')
    }

    return Promise.reject(error)
  }
)

// API service functions
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken })
    return response.data
  },

  logout: async (refreshToken: string) => {
    await api.post('/auth/logout', { refresh_token: refreshToken })
  },

  getProfile: async () => {
    const response = await api.get('/users/profile')
    return response.data
  },

  updateProfile: async (userData: any) => {
    const response = await api.put('/users/profile', userData)
    return response.data
  }
}

export const workOrderAPI = {
  getWorkOrders: async (params?: any) => {
    const response = await api.get('/work-orders', { params })
    return response.data
  },

  getWorkOrder: async (id: number) => {
    const response = await api.get(`/work-orders/${id}`)
    return response.data
  },

  createWorkOrder: async (workOrderData: any) => {
    const response = await api.post('/work-orders', workOrderData)
    return response.data
  },

  updateWorkOrder: async (id: number, workOrderData: any) => {
    const response = await api.put(`/work-orders/${id}`, workOrderData)
    return response.data
  },

  assignWorkOrder: async (id: number, assignmentData: any) => {
    const response = await api.post(`/work-orders/${id}/assign`, assignmentData)
    return response.data
  },

  completeWorkOrder: async (id: number, completionData: any) => {
    const response = await api.post(`/work-orders/${id}/complete`, completionData)
    return response.data
  },

  getWorkOrderHistory: async (id: number) => {
    const response = await api.get(`/work-orders/${id}/history`)
    return response.data
  }
}

export const aiAPI = {
  processIntake: async (params: { description: string; site_id: number }) => {
    const response = await api.post('/ai/intake', params)
    return response.data
  },

  getDispatchRecommendations: async (workOrderId: number) => {
    const response = await api.post('/ai/dispatch', { 
      work_order_id: workOrderId 
    })
    return response.data
  },

  suggestPMTemplate: async (params: any) => {
    const response = await api.post('/ai/pm-suggest', params)
    return response.data
  },

  suggestPriority: async (params: any) => {
    const response = await api.post('/ai/priority', params)
    return response.data
  },

  submitFeedback: async (logId: number, feedback: string, corrections?: any) => {
    const response = await api.post('/ai/feedback', {
      processing_log_id: logId,
      feedback,
      corrections
    })
    return response.data
  }
}

export const pmAPI = {
  getUpcomingPM: async (daysAhead: number = 30) => {
    const response = await api.get('/pm/upcoming', { 
      params: { days_ahead: daysAhead } 
    })
    return response.data
  },

  createPMSchedule: async (scheduleData: any) => {
    const response = await api.post('/pm/schedules', scheduleData)
    return response.data
  },

  getPMSchedules: async (params?: any) => {
    const response = await api.get('/pm/schedules', { params })
    return response.data
  },

  completePM: async (scheduleId: number, completionData: any) => {
    const response = await api.post(`/pm/schedules/${scheduleId}/complete`, completionData)
    return response.data
  },

  getPMTemplates: async () => {
    const response = await api.get('/pm/templates')
    return response.data
  },

  createPMTemplate: async (templateData: any) => {
    const response = await api.post('/pm/templates', templateData)
    return response.data
  },

  schedulePM: async (scheduleData: any) => {
    const response = await api.post('/pm/schedule', scheduleData)
    return response.data
  }
}

export const assetAPI = {
  getAssets: async (params?: any) => {
    const response = await api.get('/assets', { params })
    return response.data
  },

  getAsset: async (id: number) => {
    const response = await api.get(`/assets/${id}`)
    return response.data
  },

  createAsset: async (assetData: any) => {
    const response = await api.post('/assets', assetData)
    return response.data
  },

  updateAsset: async (id: number, assetData: any) => {
    const response = await api.put(`/assets/${id}`, assetData)
    return response.data
  },

  deleteAsset: async (id: number) => {
    const response = await api.delete(`/assets/${id}`)
    return response.data
  }
}

export const siteAPI = {
  getSites: async () => {
    const response = await api.get('/sites')
    return response.data
  }
}

export const userAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  getTechnicians: async () => {
    const response = await api.get('/users/technicians')
    return response.data
  },

  getVendors: async () => {
    const response = await api.get('/vendors')
    return response.data
  },

  updateProfile: async (profileData: any) => {
    const response = await api.put('/users/profile', profileData)
    return response.data
  },

  updatePreferences: async (preferences: any) => {
    const response = await api.put('/users/preferences', preferences)
    return response.data
  },

  changePassword: async (passwordData: { current_password: string; new_password: string }) => {
    const response = await api.post('/auth/change-password', passwordData)
    return response.data
  }
}