const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers }
  })

  // On 401, try to refresh the token once and retry
  if (res.status === 401 && !options._retry) {
    const refreshed = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      _retry: true
    })
    if (refreshed.ok) {
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
