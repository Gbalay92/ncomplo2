import { Link } from "./Link";
import { useAuth } from "../context/AuthContext";
import styles from "./Header.module.css";
import { useState } from "react";

export default function Header() {
    const { isLoggedIn, handleLogin, handleLogout } = useAuth();
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
                    <Link href="./">Inicio</Link>
                    <Link href="./page1">Page1</Link>
                    <Link href="./page2">Page2</Link>
                </nav>

                {
                    isLoggedIn
                        ? <button onClick={handleLogout}>Cerrar sesión</button>
                        : <button onClick={handleLogin}>Iniciar sesión</button>
                }
            </header>
        </>
    )
}