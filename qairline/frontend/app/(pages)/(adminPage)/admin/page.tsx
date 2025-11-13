'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./adminLoginPage.module.css";

function AdminLoginPage() {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [showLoginRequired, setShowLoginRequired] = useState(false);
    const router = useRouter();

    // Hàm lưu token vào localStorage
    const saveTokenToLocalStorage = (token: string) => {
        localStorage.setItem("token", token);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        localStorage.clear(); // Xóa tất cả dữ liệu cũ trong localStorage
        e.preventDefault();

        // Reset error state
        setError(null);

        if (!email || !password) {
            setError("Email and password are required.");
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/api/auth/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                const token = data.token;
                saveTokenToLocalStorage(token); // Lưu token vào localStorage
                alert("Signin successful");
                router.push("/admin/home"); // Điều hướng đến trang home
            } else {
                setError(data.message || "Login failed. Please try again.");
            }
        } catch (error) {
            setError('Something went wrong. Please try again later.' + error);
        }
    };

    // Kiểm tra nếu user đã login
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            router.push("/admin/home"); // Redirect nếu đã login
        } else {
            setShowLoginRequired(true); // Hiển thị thông báo yêu cầu login
        }
    }, [router]);

    return (
        <div className={styles.container}>
            <div className={styles.loginBox}>
                <h1 className={styles.title}>Admin Login Page</h1>
                
                <form onSubmit={handleSubmit}>
                    <div className={styles.inputContainer}>
                        <label htmlFor="email" className={styles.label}>
                            Email
                        </label>
                        <input
                            type="text"
                            id="email"
                            name="email"
                            className={styles.input}
                            placeholder="Enter your Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className={styles.inputContainer}>
                        <label htmlFor="password" className={styles.label}>
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className={styles.input}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {/* Hiển thị lỗi nếu có */}
                    {error && <p className={styles.error}>{error}</p>}
                    <button type="submit" className={styles.loginButton}>
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AdminLoginPage;
