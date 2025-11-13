import React, {useEffect, useState} from "react";
import styles from "@/app/components/styles/AuthenticationPopUp.module.css";
import {jwtDecode, JwtPayload} from "jwt-decode";

interface LoginPopupProps {
    visible: boolean;
    setVisible: (visible: boolean) => void;
}

interface SignUpData {
    name: string;
    username: string;
    email: string;
    password: string;
    role: string;
}

interface SignInData {
    email: string;
    password: string;
}


const AuthenticationPopUp: React.FC<LoginPopupProps> = ({ visible, setVisible }) => {
    const [isRightPanelActive, setIsRightPanelActive] = useState(false);
    const [signUpData, setSignUpData] = useState({ name: '', username: '', email: '', password: '', role: 'Customer' });
    const [signInData, setSignInData] = useState({ email: '', password: '' });
    const [error, setError] = useState<string | null>(null);

    const handleSignUpClick = () => {
        setIsRightPanelActive(true);
    };

    const handleSignInClick = () => {
        setIsRightPanelActive(false);
    };

    const closePopup = () => {
        setVisible(false);
    };

    useEffect(() => {
        // Check if token exists in local storage
        const checkToken = () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const decoded = jwtDecode<JwtPayload & { role?: string } & {name?: string} & {userid?: string}>(token);
                    localStorage.setItem('role', decoded.role as string);
                    localStorage.setItem('name', decoded.name as string);
                    localStorage.setItem('userid', decoded.userid as string);
                    console.log('Decoded token:', decoded);
                    localStorage.setItem("userid", decoded.userid? decoded.userid: "null");
                } catch (error) {
                    console.error('Error decoding token:', error);
                }
            }
        }
        checkToken();
    }, []);

    const handleSignUp = async (e: React.FormEvent) => {
        localStorage.clear();
        e.preventDefault();

        // Reset error state
        setError(null);

        if (!signUpData.name || !signUpData.username || !signUpData.email || !signUpData.password) {
            setError('All fields are required for signup');
            return;
        }
        try {
            const response = await fetch('http://localhost:3001/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(signUpData),
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                alert('Sign Up successful!');
                closePopup();
                window.location.reload();
            } else {
                setError(data.message || 'Sign up failed. Please try again.');
            }
        } catch (error) {
            setError('Something went wrong. Please try again later.');
        }
    };

    const handleSignIn = async (e: React.FormEvent) => {
        localStorage.clear();
        e.preventDefault();

        // Reset error state
        setError(null);

        if (!signInData.email || !signInData.password) {
            console.error('All fields are required for signin');
            return;
        }
        try {
            const response = await fetch('http://localhost:3001/api/auth/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(signInData),
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                alert('Signin successful');
                closePopup();
                window.location.reload();
            } else {
                setError(data.message || 'Login failed. Please try again.');
            }
        } catch (error) {
            setError('Something went wrong. Please try again later.');
        }
    };

    return (
        visible ? (
            <div className={`${styles.container} ${isRightPanelActive ? styles.containerRightPanelActive : ""}`}>
                <button className={styles.closeButton} onClick={closePopup}>X</button>
                <div className={styles.signUp}>
                    <form onSubmit={handleSignUp} className={styles.form}>
                        <h1 className={styles.formTitle}>Create Account</h1>
                        {/*<div className={styles.socialContainer}>*/}
                        {/*    <a href="#" className={styles.social}><i className="fab fa_facebook"></i></a>*/}
                        {/*    <a href="#" className={styles.social}><i className="fab fa-google-plus-g"></i></a>*/}
                        {/*    <a href="#" className={styles.social}><i className="fab fa_linkedin_in"></i></a>*/}
                        {/*</div>*/}
                        {/*<p className={styles.formText}>or use your email for registration</p>*/}
                        <input className={styles.inputField} type="text" name="name" placeholder="Name" required
                               value={signUpData.name} onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })} />
                        <input className={styles.inputField} type="text" name="username" placeholder="Username" required
                               value={signUpData.username} onChange={(e) => setSignUpData({ ...signUpData, username: e.target.value })} />
                        <input className={styles.inputField} type="email" name="email" placeholder="Email" required
                               value={signUpData.email} onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })} />
                        <input className={styles.inputField} type="password" name="password" placeholder="Password" required
                               value={signUpData.password} onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })} />
                        <button className={styles.formButton} type="submit">Sign Up</button>
                    </form>
                </div>
                <div className={styles.signIn}>
                    <form onSubmit={handleSignIn} className={styles.form}>
                        <h1 className={styles.formTitle}>Sign In</h1>

                        {/*<div className={styles.socialContainer}>*/}
                        {/*    <a href="#" className={styles.social}><i className="fab fa_facebook"></i></a>*/}
                        {/*    <a href="#" className={styles.social}><i className="fab fa-google-plus-g"></i></a>*/}
                        {/*    <a href="#" className={styles.social}><i className="fab fa_linkedin_in"></i></a>*/}
                        {/*</div>*/}
                        {/*<p className={styles.formText}>or use your account</p>*/}
                        <input className={styles.inputField} type="email" name="email" placeholder="Email" required
                               value={signInData.email}
                               onChange={(e) => setSignInData({...signInData, email: e.target.value})}/>
                        <input className={styles.inputField} type="password" name="password" placeholder="Password"
                               required
                               value={signInData.password}
                               onChange={(e) => setSignInData({...signInData, password: e.target.value})}/>
                        <a href="#" className={styles.formLink}>Forget your Password?</a>
                        <button className={styles.formButton} type="submit">Sign In</button>
                        {error && <p className={styles.errorText}>{error}</p>}
                    </form>
                </div>
                <div className={styles.overlayContainer}>
                    <div className={styles.overlay}>
                        <div className={styles.overlayLeft}>
                            <h1>Hi! Welcome to Cloud Airlines!</h1>
                            <p className={styles.overlayText}>To start booking and keep track of your flights please register with your personal info</p>
                            <p className={styles.overlayText}>Have an account already?</p>
                            <button className={styles.overlayButton} onClick={handleSignInClick}>Sign In</button>
                        </div>
                        <div className={styles.overlayRight}>
                            <h1>Welcome back!</h1>
                            <p className={styles.overlayText}>Nice to see you again. Enjoy your flights!</p>
                            <p className={styles.overlayText}>Oh. Don't have an account?</p>
                            <button className={styles.overlayButton} onClick={handleSignUpClick}>Sign Up</button>
                        </div>
                    </div>
                </div>
            </div>
        ) : null
    );
};

export default AuthenticationPopUp;