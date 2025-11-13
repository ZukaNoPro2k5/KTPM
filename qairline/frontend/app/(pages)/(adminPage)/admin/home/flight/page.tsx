'use client';
import React, { useState, useEffect } from 'react';
import { Flight } from './flightObject';
import FlightTable from './(components)/FlightTable';
import FlightForm from './(components)/FlightForm';
import styles from './flightPage.module.css';
import { useRouter } from 'next/navigation';

export default function FlightManagement() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [currentFlight, setCurrentFlight] = useState<Flight | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Thêm trạng thái loading để kiểm tra token
  const router = useRouter();

  // Lấy userID từ decodeToken trong localStorage
  const getUserID = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded.userid;
  };

  const fetchFlights = async () => {
    try {
      const userid = getUserID();
      if (!userid) throw new Error('User not authenticated');
      const response = await fetch('http://localhost:3001/api/Flights/GetAllFlights', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      setFlights(data);
    } catch (error) {
      console.error('Error fetching flights:', error);
    }
  };

  const handleAdd = () => {
    setCurrentFlight(null);
    setShowForm(true);
  };

  const handleSubmit = async (flight: Partial<Flight>) => {
    try {
        const userID = getUserID();
        if (!userID) throw new Error('User not authenticated');

        let url = '';
        let method = '';
        let bodyData = {};

        if (currentFlight && flight.FlightID) {
            // Chỉnh sửa chuyến bay
            url = 'http://localhost:3001/api/Flights/Edit';
            method = 'POST';
            bodyData = {
              userID: userID,
              flightID: flight.FlightID,
              model: flight.AircraftModel,
              departure: flight.Departure,
              arrival: flight.Arrival,
              departureTime: flight.DepartureTime,
              arrivalTime: flight.ArrivalTime,
              price: flight.Price,
              seatsAvailable: flight.SeatsAvailable,
              status: flight.Status,
          };
        } else {
            // Thêm mới chuyến bay
            url = 'http://localhost:3001/api/Flights/Add';
            method = 'POST';

            const { FlightID, ...newFlightData } = flight; // Loại bỏ FlightID
            bodyData = {
                model: newFlightData.AircraftModel,
                departure: newFlightData.Departure,
                arrival: newFlightData.Arrival,
                departureTime: newFlightData.DepartureTime,
                arrivalTime: newFlightData.ArrivalTime,
                price: newFlightData.Price,
                seatsAvailable: newFlightData.SeatsAvailable,
                status: newFlightData.Status,
                userID,
            };
        }

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData),
        });
        console.log(bodyData);
        const result = await response.json();

        if (response.ok) {
            if (result.message) alert(result.message);
            fetchFlights();
            setShowForm(false);
        } else {
            // Xử lý các lỗi từ backend
            switch (response.status) {
                case 400:
                    alert(`Input error: ${result.message || 'Invalid input data'}`);
                    break;
                case 403:
                    alert(`Permission error: ${result.message || 'You are not authorized to perform this action'}`);
                    break;
                case 404:
                    alert(`Not found: ${result.message || 'Requested resource not found'}`);
                    break;
                case 500:
                    alert(`Server error: ${result.message || 'An unexpected error occurred on the server'}`);
                    break;
                default:
                    alert(`Unexpected error: ${result.message || 'Something went wrong'}`);
            }
        }
    } catch (error) {
        console.error('Error submitting flight:', error);
        alert('An unexpected error occurred. Please try again.');
    }
};

  const handleDelete = async (flightID: number) => {
    try {
      const UserID = getUserID();
      console.log('UserID:', UserID); // Debug UserID
      if (!UserID) throw new Error('User not authenticated');

      const response = await fetch('http://localhost:3001/api/Flights/Delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flightID, UserID }), // Debug body content
      });

      console.log('FlightID:', flightID, 'UserID:', UserID); // Debug request payload

      const result = await response.json();
      console.log('Delete Response:', result);
  
      // Xử lý các trường hợp trả về
      if (response.status === 200) {
        // Trường hợp xóa thành công
        alert(result.message);
        setFlights((prevFlights) => prevFlights.filter((f) => f.FlightID !== flightID));
      } else if (response.status === 400) {
        // Trường hợp thiếu dữ liệu đầu vào
        alert(`Error: ${result.message}`);
      } else if (response.status === 403) {
        // Trường hợp quyền truy cập bị từ chối
        alert(`Permission denied: ${result.message}`);
      } else if (response.status === 404) {
        // Trường hợp không tìm thấy chuyến bay
        alert(`Not found: ${result.message}`);
      } else if (response.status === 500) {
        // Trường hợp lỗi máy chủ
        alert(`Server error: ${result.message}`);
      } else {
        // Trường hợp không xác định
        alert('Unexpected error occurred. Please try again.');
      }
  
      console.log('Delete Response:', result); // Log phản hồi để debug
    } catch (error) {
      // Xử lý lỗi trong quá trình gửi yêu cầu
      console.error('Error deleting flight:', error);
      alert('An error occurred while deleting the flight. Please try again.');
    }
  };

  // Kiểm tra token khi trang tải
  useEffect(() => {
    const userID = getUserID();
    if (!userID) {
      // Nếu không có userID trong token, điều hướng về trang login
      router.push("/admin");
    } else {
      setIsLoading(false); // Đánh dấu là đã xác thực
      fetchFlights(); // Lấy danh sách chuyến bay sau khi xác thực
    }
  }, [router]);

  if (isLoading) {
    // Hiển thị loading trong quá trình kiểm tra token
    return <div>Loading...</div>;
  }

  const handleEdit = (flight: Flight) => {
    console.log('Editing Flight:', flight); // Debug thông tin chuyến bay
    setCurrentFlight(flight);
    setShowForm(true); // Bật form khi chỉnh sửa
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Flight Management</h1>
      <button className={styles.addButton} onClick={handleAdd}>Add Flight</button>
      <FlightTable flights={flights} onEdit={handleEdit} onDelete={handleDelete} />
      {showForm && <FlightForm flight={currentFlight} onClose={() => setShowForm(false)} onSubmit={handleSubmit} />}
    </div>
  );
}
