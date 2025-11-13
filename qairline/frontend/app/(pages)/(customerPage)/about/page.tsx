import React from 'react';
import styles from './aboutpage.module.css';

const AboutPage = () => {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>About Cloud Airlines</h1>
            <p className={styles.intro}>Welcome to Cloud Airline, your trusted partner in the skies. We are committed to providing the best travel experience with our state-of-the-art fleet and exceptional customer service. Our mission is to connect people and places with the utmost comfort and reliability.</p>

            <h2 className={styles.subtitle}>Our Vision</h2>
            <p className={styles.text}>At Cloud Airline, we envision a world where air travel is accessible, affordable, and enjoyable for everyone. We strive to innovate and improve our services continuously to meet the evolving needs of our passengers.</p>

            <h2 className={styles.subtitle}>Our Services</h2>
            <p className={styles.text}>We offer a wide range of services to ensure a seamless travel experience:</p>
            <ul className={styles.list}>
                <li>Comfortable seating with ample legroom</li>
                <li>In-flight entertainment and Wi-Fi</li>
                <li>Delicious meals and beverages</li>
                <li>Friendly and professional cabin crew</li>
                <li>Easy online booking and check-in</li>
                <li>Frequent flyer program with exclusive benefits</li>
            </ul>

            <h2 className={styles.subtitle}>Our Fleet</h2>
            <p className={styles.text}>Our modern fleet consists of the latest aircraft equipped with advanced technology to ensure safety and comfort. We regularly maintain and upgrade our planes to provide the best flying experience.</p>

            <h2 className={styles.subtitle}>Our Development Team</h2>
            <p className={styles.text}>Meet the talented individuals behind Cloud Airline's digital experience:</p>
            <ul className={styles.list}>
                <li>Nguyen Thi Ngoc Mai - Frontend Developer</li>
                <li>Pham Xuan Duong - Frontend Developer</li>
                <li>Tran Khanh Duy - Backend Developer</li>
            </ul>
            <p className={styles.text}>Our team is dedicated to creating a user-friendly and efficient platform for our passengers. We work tirelessly to ensure that our website and mobile app provide a seamless booking and travel experience.</p>

            <h2 className={styles.subtitle}>Contact Us</h2>
            <p className={styles.text}>If you have any questions or need assistance, please do not hesitate to contact our customer support team. We are here to help you 24/7.</p>
        </div>
    );
}

export default AboutPage;