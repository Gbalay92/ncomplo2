import { useState } from 'react'
import styles from './Register.module.css'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register({ onNavigateToLogin }) {
  const { register } = useAuth()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { id, value } = e.target
    setForm(prev => ({ ...prev, [id]: value }))
    if (id === 'confirmPassword' || id === 'password') {
      setErrors(prev => ({ ...prev, confirmPassword: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.firstName.trim()) newErrors.firstName = 'Required'
    if (!form.lastName.trim()) newErrors.lastName = 'Required'
    if (!form.displayName.trim()) newErrors.displayName = 'Required'
    if (!emailRegex.test(form.email)) newErrors.email = 'Enter a valid email'
    if (form.password.length < 6) newErrors.password = 'Min. 6 characters'
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    setServerError('')
    setLoading(true)
    try {
      await register(form.email, form.firstName, form.lastName, form.displayName, form.password)
    } catch (err) {
      setServerError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fieldClass = (field) => {
    if (errors[field]) return `${styles.inputField} ${styles.inputError}`
    if (form[field] && !errors[field]) return `${styles.inputField} ${styles.inputSuccess}`
    return styles.inputField
  }

  return (
    <div className={styles.registerContainer}>
      <form className={styles.registerCard} onSubmit={handleSubmit} noValidate>
        <h1 className={styles.cardTitle}>Create an account</h1>

        {serverError && <div className={styles.errorBanner}>{serverError}</div>}

        <div className={styles.nameRow}>
          <div className={styles.formGroup}>
            <label htmlFor="firstName">First name</label>
            <input
              className={fieldClass('firstName')}
              type="text"
              id="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="Jane"
            />
            {errors.firstName && <span className={styles.errorMsg}>{errors.firstName}</span>}
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="lastName">Last name</label>
            <input
              className={fieldClass('lastName')}
              type="text"
              id="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Doe"
            />
            {errors.lastName && <span className={styles.errorMsg}>{errors.lastName}</span>}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="displayName">Display name <span className={styles.hint}>(shown on leaderboard)</span></label>
          <input
            className={fieldClass('displayName')}
            type="text"
            id="displayName"
            value={form.displayName}
            onChange={handleChange}
            placeholder="ElReyDelGol"
          />
          {errors.displayName && <span className={styles.errorMsg}>{errors.displayName}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email">Email</label>
          <input
            className={fieldClass('email')}
            type="email"
            id="email"
            value={form.email}
            onChange={handleChange}
            placeholder="jane@example.com"
          />
          {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password">Password</label>
          <input
            className={fieldClass('password')}
            type="password"
            id="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
          />
          {errors.password && <span className={styles.errorMsg}>{errors.password}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword">Repeat password</label>
          <input
            className={fieldClass('confirmPassword')}
            type="password"
            id="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
          />
          {errors.confirmPassword && <span className={styles.errorMsg}>{errors.confirmPassword}</span>}
        </div>

        <button type="submit" className={styles.registerButton} disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </button>

        <div className={styles.loginPrompt}>
          <span>Already have an account?</span>
          <button type="button" className={styles.loginLink} onClick={onNavigateToLogin}>
            Log in here
          </button>
        </div>
      </form>
    </div>
  )
}
