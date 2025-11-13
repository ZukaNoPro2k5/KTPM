'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./adminHomePage.module.css";

// Hàm giải mã token và lấy userID
const getUserIDFromToken = () => {
    const token = localStorage.getItem("token"); // Lấy token từ localStorage
    if (!token) {
        return null; // Nếu không có token, trả về null
    }

    try {
        const decodedToken = JSON.parse(atob(token.split('.')[1])); // Giải mã payload của JWT
        return decodedToken?.userid || null; // Trả về userID nếu có
    } catch (error) {
        console.error("Error decoding token:", error);
        return null; // Nếu giải mã lỗi, trả về null
    }
};

function HomePage() {
    const [isLoading, setIsLoading] = useState(true); // State để kiểm tra quá trình giải mã
    const router = useRouter();

    // Kiểm tra token và điều hướng nếu không có userID
    useEffect(() => {
        const userID = getUserIDFromToken();
        if (!userID) {
            // Nếu không có userID, điều hướng về trang /admin và thêm tham số 'loginRequired=true'
            router.push("/admin");
        } else {
            setIsLoading(false); // Đánh dấu là đã kiểm tra xong
        }
    }, [router]);

    if (isLoading) {
        // Hiển thị loading cho đến khi kiểm tra xong token
        return <div>Loading...</div>;
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
