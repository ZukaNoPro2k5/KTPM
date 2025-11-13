"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles/Dropdown.module.css";

const Dropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      {/* Button chính hiển thị Manage */}
      <button onClick={toggleDropdown} className={styles.manageButton}>
        Manage
      </button>

      {/* Dropdown hiển thị các tùy chọn */}
      {isOpen && (
        <div className={styles.dropdownMenu}>
          <ul className={styles.dropdownList}>
            {["offer", "aircraft", "flight", "customer"].map((option) => (
              <li key={option} className={styles.dropdownOption}>
                <button
                  onClick={() => handleOptionClick(`/admin/home/${option}`)}
                  className={styles.optionButton}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
