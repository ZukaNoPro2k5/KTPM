'use client';
import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from 'next/navigation';
import style from "./styles/CustomerHeader.module.css";
import AuthenticationPopUp from "@/app/components/AuthenticationPopUp";

export default function Header() {
  const [isVisible, setIsVisible] = useState(false);
  const [userID, setUserID] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const router = useRouter();
  const currentRoute = usePathname();

  // Lấy userID từ localStorage khi component được mount
  useEffect(() => {
    const storedUserID = localStorage.getItem("userid");
    setUserID(storedUserID);
    const storedName = localStorage.getItem("name");
    setName(storedName);
  }, []);

  // Hàm xử lý khi nhấn nút Login
  const handleLoginClick = () => {
    setIsVisible(true);
  };

  // Hàm xử lý khi nhấn nút Sign Out
  const handleSignOut = () => {
    localStorage.clear();
    setUserID(null); // Cập nhật state userID
    setName(null); // Cập nhật state username
    router.push(`/`); // Chuyển hướng về trang Home
  };

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const toHomePage = () => router.push(`/home`);
  const toBookFlights = () => router.push(`/bookings/search`);
  const toManageBooking = () => {
    if (!userID) {
      alert("Please sign in to see your bookings.");
    } else {
      router.push(`/manage-bookings`);
    }
  };
  const toOffers = () => router.push(`/offers`);
  const toAbout = () => router.push(`/about`);

  return (
    <header className={style.header}>
      <div className={style.wrapper}>
        <div className={style.logo}>
          <img src={`/Logo/mini_logo.svg`} style={{ cursor: 'pointer' }} alt="Cloud Airlines Logo"
            onClick={toHomePage} />
        </div>
        <div className={style.container}>
          <nav className={style.nav}>
            <ul className={style.navList}>
              <li className={currentRoute === '/home' ? style.active : ''}
                onClick={toHomePage}>Home</li>
              <li className={currentRoute === '/bookings/search' ? style.active : ''}
                onClick={toBookFlights}>Book Flights</li>
              <li className={currentRoute === '/offers' ? style.active : ''}
                onClick={toOffers}>Offers</li>
              <li className={currentRoute === '/manage-bookings' ? style.active : ''}
                onClick={toManageBooking}>Manage Booking</li>
              <li className={currentRoute === '/about' ? style.active : ''}
                onClick={toAbout}>About</li>
              {userID === null || userID === "null" ? (
                <li onClick={handleLoginClick}>Login | Register</li>
              ) : (
                  // <li onClick={handleSignOut} className={style.signOutButton}>Sign Out</li>
                  <li className={style.accountButton} onClick={toggleDropdown}>
                    Account
                    {dropdownVisible && (
                        <ul className={style.dropdownMenu}>
                          <li>Name: {name}</li>
                          <li className={style.signOutButton} onClick={handleSignOut}>Logout</li>
                        </ul>
                    )}
                  </li>
              )}
            </ul>
          </nav>
          <AuthenticationPopUp visible={isVisible} setVisible={setIsVisible}/>
        </div>
      </div>
    </header>
  );
}
