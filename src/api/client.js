const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getAccessToken() {
  return localStorage.getItem('access_token')
}

function getRefreshToken() {
  return localStorage.getItem('refresh_token')
}

function setTokens(accessToken, refreshToken) {
  localStorage.setItem('access_token', accessToken)
  if (refreshToken) localStorage.setItem('refresh_token', refreshToken)
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

// Refresh mutex: ensures only one /auth/refresh call is in flight at a time.
// Concurrent 401s all wait for the same refresh and share the result.
let refreshPromise = null

async function doRefresh() {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken()
    refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async res => {
        if (res.ok) {
          const data = await res.json()
          setTokens(data.access_token, data.refresh_token)
          return true
        }
        clearTokens()
        return false
      })
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

async function request(path, options = {}) {
  const token = getAccessToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  // On 401, try to refresh the token once and retry
  if (res.status === 401 && !options._retry) {
    const refreshed = await doRefresh()
    if (refreshed) {
      return request(path, { ...options, _retry: true })
    }
  }

  return res
}

export async function get(path) {
  return request(path, { method: 'GET' })
}

export async function post(path, body) {
  return request(path, { method: 'POST', body: JSON.stringify(body) })
}

export async function put(path, body) {
  return request(path, { method: 'PUT', body: JSON.stringify(body) })
}

export async function del(path) {
  return request(path, { method: 'DELETE' })
}
