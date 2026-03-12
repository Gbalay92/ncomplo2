import styles from './Login.module.css'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
    const { isLoggedIn, logIn } = useAuth()
    console.log(isLoggedIn)
    return (
        <div className={styles.loginContainer}>
            <form className={styles.loginCard}>
                <div className={styles.formGroup}>
                    <label htmlFor="username">Username</label>
                    <input className={styles.inputField} type="text" id="username" />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="password">Password</label>
                    <input className={styles.inputField} type="password" id="password" />
                </div>
                <button type="submit" 
                className={styles.loginPageButton}
                onClick={logIn}>
                    Login</button>
                    <div className={styles.registerPrompt}>
                <div className={styles.registerPrompt}>
                    <span>Don't have an account? </span>
                    <button 
                        type="button" 
                        className={styles.loginPageButton}
                        onClick={() => alert('Registration is currently unavailable.')}>
                        Register here
                    </button>
                </div>
            </div>
            </form>
        </div>
    )
}