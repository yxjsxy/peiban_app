import axios from 'axios'

const API_BASE = '/api'

export const authAPI = {
  sendCode: (phone) => axios.post(`${API_BASE}/auth/send-code`, { phone }),
  verifyPhone: (phone, code) => axios.post(`${API_BASE}/auth/verify-phone`, { phone, code }),
  wechatLogin: (code) => axios.post(`${API_BASE}/auth/wechat`, { code }),
  getMe: () => axios.get(`${API_BASE}/auth/me`)
}

export const userAPI = {
  getProfile: () => axios.get(`${API_BASE}/user/profile`),
  updateProfile: (data) => axios.put(`${API_BASE}/user/profile`, data),
  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return axios.post(`${API_BASE}/user/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export const checkinAPI = {
  checkin: () => axios.post(`${API_BASE}/checkin`),
  getStatus: () => axios.get(`${API_BASE}/checkin/status`),
  getCalendar: () => axios.get(`${API_BASE}/checkin/calendar`)
}

export const logAPI = {
  getLogs: (page = 1, perPage = 20) => 
    axios.get(`${API_BASE}/logs`, { params: { page, per_page: perPage } }),
  createLog: (content, images) => {
    const formData = new FormData()
    formData.append('content', content)
    images.forEach((file, index) => {
      formData.append(`image${index}`, file)
    })
    return axios.post(`${API_BASE}/logs`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  getLog: (id) => axios.get(`${API_BASE}/logs/${id}`),
  deleteLog: (id) => axios.delete(`${API_BASE}/logs/${id}`)
}

export const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `/uploads/${path}`
}

