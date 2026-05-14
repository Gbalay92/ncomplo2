import { useState } from 'react'
import styles from './Login.module.css'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login({ onNavigateToRegister }) {
  const { logIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await logIn(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.loginContainer}>
      <form className={styles.loginCard} onSubmit={handleSubmit}>
        <h1 className={styles.cardTitle}>Welcome back</h1>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.formGroup}>
          <label htmlFor="email">Email</label>
          <input
            className={styles.inputField}
            type="email"
            id="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="jane@example.com"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password">Password</label>
          <input
            className={styles.inputField}
            type="password"
            id="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <button type="submit" className={styles.loginPageButton} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className={styles.registerPrompt}>
          <span>Don't have an account? </span>
          <button type="button" className={styles.loginPageButton} onClick={onNavigateToRegister}>
            Register here
          </button>
        </div>
      </form>
    </div>
  )
}
