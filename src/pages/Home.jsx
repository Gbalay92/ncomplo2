import { useRouter } from "../hooks/useRouter.jsx"
import styles from './Home.module.css'
import { useAuth } from "../context/AuthContext.jsx"

export default function HomePage() {
    const { navigateTo } = useRouter()
    const { isLoggedIn } = useAuth()
    //TODO get prediction status to show button only when predictions are open or user has already made a prediction
    
    return (
        <main>
            <section className={styles.presentationContainer}>
                <img src="./background.jpg" />
                <div className={styles.overlay}>
                    <h3>THE WORLD STAGE AWAITS</h3>
                    <h4>Predict winners, earn points and won prizes!</h4>
                    <span></span>
                    <button className={isLoggedIn ? styles.predictionBtn : `${styles.predictionBtn} ${styles.btnDisabled}`} 
                        onClick={() => navigateTo('/prediction')}>
                            Start Predicting
                        </button>
                </div>
            </section>
        </main>
    )
}