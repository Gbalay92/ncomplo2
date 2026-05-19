import { useAuth } from '../context/AuthContext'
import styles from './Profile.module.css'

export default function Profile() {
  const { user, handleLogout } = useAuth()

  const initial = user?.display_name?.[0]?.toUpperCase() ?? '?'

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.avatar}>{initial}</div>
        <h2 className={styles.displayName}>{user?.display_name}</h2>
        <p className={styles.email}>{user?.email}</p>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Log out
        </button>
      </div>
    </div>
  )
}
