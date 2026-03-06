import { Link } from "./Link"
import { useAuth } from "../context/AuthContext"
import styles from "./Header.module.css"
import { useState } from "react"

export default function Header() {
    const { isLoggedIn, handleLogin, handleLogout } = useAuth()
    const [open, setOpen] = useState(false)

    return (
        <>
            <header className={styles.header}>
                <button
                    className={`${styles.hamburger} ${open ? styles.open : ""}`}
                    onClick={() => setOpen(!open)}
                    aria-label="Open menu">
                    <span className={styles.bar}></span>
                    <span className={styles.bar}></span>
                    <span className={styles.bar}></span>
                </button>

                <h1 className={styles.logo}>World Cup 2026</h1>


                <nav className={`${styles.nav} ${open ? styles.show : ""}`}>
                    <Link onClick={() => setOpen(false)} href="./">Home</Link>
                    <Link onClick={() => setOpen(false)} href="./Leaderboard">Leaderboard</Link>
                    <Link onClick={() => setOpen(false)} href="./prediction">Prediction</Link>
                </nav>
                 <button className={styles.btnUser} onClick={
                    isLoggedIn ? handleLogin : handleLogout
                    }>
                    <svg className={styles.iconUser} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                 </button>
            </header>
        </>
    )
}