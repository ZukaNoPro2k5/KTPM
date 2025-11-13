'use client'
import React, {Suspense, useEffect, useState} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import style from './payment.module.css';
import styles from "@/app/components/styles/AuthenticationPopUp.module.css";

const PaymentPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [UserID, setUserID] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const FlightID = searchParams.get('flightID');
    const departure = searchParams.get('departure');
    const arrival = searchParams.get('arrival');
    const departureTime = searchParams.get('departureTime');
    const arrivalTime = searchParams.get('arrivalTime');
    const duration = searchParams.get('duration');
    const price = searchParams.get('price');
    const planeType = searchParams.get('planeType')

    useEffect(() => {
        const checkAuthentication = () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/home');
            }
        }
        setUserID(localStorage.getItem('userid'));
        checkAuthentication()
    }, []);

    const handlePurchase = async () => {
        // console.log('Payment Flight ID:', FlightID);
        // console.log('Payment User ID:', UserID);
        // Reset error state
        setError(null);

        if (!UserID || !FlightID) {
            setError('User ID or Flight ID is missing');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/api/Bookings/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: JSON.stringify({
                    userID: UserID,
                    flightID: FlightID
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Purchase successful! Your booking ID is ' + data.bookingId);
                console.log(data);
                router.push('/manage-bookings');
            } else {
                setError(`Purchase failed: ${data.message}`);
            }
        } catch (error:any) {
            setError(`Error during purchase: ${error.message}`);
            alert(`An error occurred during the purchase: ${error.message}`);
        }

    };

    return (
        <div className={style.payment}>
            <h1>Payment</h1>
            <div>Flight infomation</div>
            <div className={style.flightInfo}>
                <div className={style.column}>
                    <div><strong>Departure: {departure}</strong> → <strong> Arrival: {arrival}</strong></div>
                    <div>
                        <strong>Time: </strong>{departureTime} → {arrivalTime}
                    </div>
                </div>
                <div className={style.column}>
                    <div>
                        <strong>Flight duration: </strong>{duration}
                    </div>
                    <div>
                        <strong>Plane: </strong>{planeType}
                    </div>
                </div>
                <div className={style.column}>
                    <strong>Price: ${price}</strong>
                </div>
            </div>
            <button onClick={handlePurchase} className={style.purchaseButton}>Purchase</button>
            {error && <p className={styles.errorText}>{error}</p>}
        </div>
    );
};

const WrappedPaymentPage = () => (
    <Suspense fallback={<div>Loading...</div>}>
        <PaymentPage />
    </Suspense>
);

export default WrappedPaymentPage;