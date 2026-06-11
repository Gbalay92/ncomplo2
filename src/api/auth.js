import { get, post, clearTokens } from './client.js'

export async function login(email, password) {
  const res = await post('/auth/login', { email, password })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Login failed')
  localStorage.setItem('access_token', data.access_token)
  localStorage.setItem('refresh_token', data.refresh_token)
  return data.user
}

export async function register(email, first_name, last_name, display_name, password) {
  const res = await post('/auth/register', { email, first_name, last_name, display_name, password })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Registration failed')
  localStorage.setItem('access_token', data.access_token)
  localStorage.setItem('refresh_token', data.refresh_token)
  return data.user
}

export async function logout() {
  const refreshToken = localStorage.getItem('refresh_token')
  await post('/auth/logout', { refresh_token: refreshToken })
  clearTokens()
}

export async function getMe() {
  const res = await get('/auth/me')
  if (!res.ok) return null
  const data = await res.json()
  return data.user
}
