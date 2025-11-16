'use client'
import { useAdminAuth } from "@/app/hooks/useAdminAuth";
import styles from "./adminHomePage.module.css";

function HomePage() {
    const { isLoading, isAdmin } = useAdminAuth();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAdmin) {
        return null; // Will redirect automatically
    }

    return (
        <div>
            <div className={styles.blogContainer}>
                <h1 className={styles.title}>Choose To Manage</h1>
            </div>
        </div>
    );
}

export default HomePage;
