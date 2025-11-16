'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/app/hooks/useAdminAuth";
import styles from "./createOfferPage.module.css";

function CreateOfferPage() {
    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [userID, setUserID] = useState<string | null>(null);
    const router = useRouter();
    const { isLoading: authLoading, isAdmin } = useAdminAuth();

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

    // Get userID when admin auth is verified
    useEffect(() => {
        if (authLoading || !isAdmin) return;
        const id = getUserIDFromToken();
        if (id) {
            setUserID(id);
        }
    }, [authLoading, isAdmin]);

    if (authLoading) {
        return <div>Loading...</div>;
    }

    if (!isAdmin) {
        return null; // Will redirect automatically
    }

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
