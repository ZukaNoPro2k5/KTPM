'use client'
import styles from "./styles/AdminHeader.module.css";
import Link from "next/link";
import { useRouter } from 'next/navigation';


const Header = () => {
    const router = useRouter();

    // Xử lý khi nhấn Admin
    const handleAdminClick = () => {
        localStorage.clear(); // Xóa toàn bộ localStorage
        router.push('/admin'); // Điều hướng đến trang admin
    };

    return(
        <header className={styles.header}>
            <div className={styles.logoContainer}>
                <Link href="/admin/home">
                    <img 
                        src="/Logo/logo.svg"
                        alt="Cloud Airlines Logo"
                        className={styles.logo}
                        // onClick={handleOptionClick}
                    />
                </Link>
            </div>
            <div 
                className={styles.textContainer} 
                onClick={handleAdminClick} // Thêm sự kiện onClick vào textContainer
                style={{ cursor: 'pointer' }} // Thêm con trỏ dạng pointer khi hover
            >
                <h1 className={styles.text}>Administrator</h1>
            </div>
        </header>
    )
}

export default Header;

