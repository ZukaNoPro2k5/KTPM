'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./createOfferPage.module.css";

function CreateOfferPage() {
    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [userID, setUserID] = useState<string | null>(null);
    const router = useRouter();

    // Hàm giải mã token và lấy userID
    const getUserIDFromToken = () => {
        const token = localStorage.getItem("token");
        if (!token) {
            return null;
        }
        try {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            return decodedToken?.userid || null;
        } catch (error) {
            console.error("Error decoding token:", error);
            return null;
        }
    };

    // Kiểm tra token khi trang load
    useEffect(() => {
        const userID = getUserIDFromToken();
        if (!userID) {
            setError("User is not authenticated. Please log in again.");
            setLoading(false);
            router.push("/admin"); // Redirect to /admin if no valid token
            return;
        }
        setUserID(userID); // Set userID in state
        setIsAuthenticated(true);
        setLoading(false); // After checking the token, stop loading
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Reset error and success messages
        setError(null);
        setSuccessMessage(null);

        if (!isAuthenticated) {
            setError("User is not authenticated. Please log in again.");
            return;
        }

        if (!title || !description) {
            setError("Title and description are required.");
            return;
        }

        try {
            const response = await fetch("http://localhost:3001/api/Offers/CreateOffer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    content: description,
                    userID, // Send the userID directly
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage("Offer created and send Mail to Cusomter Successfully");
                setTitle(""); // Reset title
                setDescription(""); // Reset description
            } else {
                setError(data.message || "Failed to create offer. Please try again.");
            }
        } catch (error) {
            setError("An unexpected error occurred. Please try again later.");
            console.error("Error during offer creation:", error);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.heading}>Create a New Offer</h1>
            <div className={styles.formContainer}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="title" className={styles.label}>
                            Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={styles.input}
                            placeholder="Enter offer title"
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="description" className={styles.label}>
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={styles.textarea}
                            placeholder="Enter offer description"
                        />
                    </div>
                    {error && <p className={styles.error}>{error}</p>}
                    {successMessage && <p className={styles.success}>{successMessage}</p>}
                    <button type="submit" className={styles.submitButton}>
                        Submit
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreateOfferPage;
