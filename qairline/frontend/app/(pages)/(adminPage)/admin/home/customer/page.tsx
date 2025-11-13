'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./customerManagement.module.css";

interface Booking {
  BookingID: number;
  UserID: string;
  UserName: string;
  BookingDate: string;
  FlightID: string;
  Departure: string;
  Arrival: string;
  DepartureTime: string;
  ArrivalTime: string;
  Price: number;
}

interface APIResponse {
  message: string;
  totalBookings: number;
  timestamp: string;
  bookings: Booking[];
}

// Hàm lấy userID từ token
const getUserID = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  const decoded = JSON.parse(atob(token.split(".")[1]));
  return decoded.userid;
};

const CustomerPage = () => {
  const [data, setData] = useState<Booking[]>([]);
  const [filteredData, setFilteredData] = useState<Booking[]>([]);
  const [searchDate, setSearchDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    totalBookings: number;
    timestamp: string;
  } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Kiểm tra xác thực người dùng
  const router = useRouter();

  // Kiểm tra token khi trang load
  useEffect(() => {
    const userID = getUserID();
    if (!userID) {
      // Nếu không có userID, điều hướng về trang /admin
      router.push("/admin");
    } else {
      setIsAuthenticated(true); // Nếu token hợp lệ, xác thực người dùng
    }
  }, [router]);

  // Fetch API khi người dùng đã được xác thực
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      try {
        const response = await fetch(
          "http://localhost:3001/api/Bookings/ViewAndSummarize",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userID: getUserID() }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          setError(result.message || "Failed to fetch data.");
          return;
        }

        setData(result.bookings || []);
        setFilteredData(result.bookings || []);
        setSummary({
          totalBookings: result.totalBookings,
          timestamp: result.timestamp,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  // Lọc dữ liệu theo `BookingDate`
  useEffect(() => {
    if (searchDate) {
      const filtered = data.filter(
        (booking) =>
          booking.BookingDate && booking.BookingDate.includes(searchDate)
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [searchDate, data]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchDate(e.target.value);
  };

  // Đếm số lượng booking khớp với searchDate
  const matchingBookingsCount = filteredData.length;

  if (loading) {
    return <div>Loading...</div>; // Chỉ render Loading khi đang kiểm tra token và fetch dữ liệu
  }

  if (error) {
    return <div>{error}</div>; // Hiển thị thông báo lỗi nếu có
  }

  return (
    <div className={styles.tableContainer}>
      <h1 className={styles.title}>---Customers Booking Management---</h1>
      {summary && (
        <div className={styles.summary}>
          <p>Total Bookings: {summary.totalBookings}</p>
          {/* <p>Last Updated: {new Date(summary.timestamp).toLocaleString()}</p> */}
          <p>Filtered Bookings: {matchingBookingsCount}</p> {/* Hiển thị số lượng bookings khớp */}
        </div>
      )}
      <input
        type="text"
        className={styles.searchBar}
        value={searchDate}
        onChange={handleSearchChange}
        placeholder="Search by Booking Date"
      />
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>BookID</th>
            <th>UserID</th>
            <th>UserName</th>
            <th>BookingDate</th>
            <th>FlightID</th>
            <th>Departure</th>
            <th>Arrival</th>
            <th>DepartureTime</th>
            <th>ArrivalTime</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((booking, index) => (
            <tr key={booking.BookingID}>
              <td>{index + 1}</td>
              <td>{booking.BookingID}</td>
              <td>{booking.UserID}</td>
              <td>{booking.UserName}</td>
              <td>{booking.BookingDate}</td>
              <td>{booking.FlightID}</td>
              <td>{booking.Departure}</td>
              <td>{booking.Arrival}</td>
              <td>{booking.DepartureTime}</td>
              <td>{booking.ArrivalTime}</td>
              <td>${booking.Price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerPage;
