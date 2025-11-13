'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './aircraftPage.module.css';
import AircraftTable from './(component)/AircraftTable';
import AircraftForm from './(component)/AircraftForm';
import { Aircraft } from './aircraftObject';

export default function AircraftManagementPage() {
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Track loading state
  const router = useRouter(); // Hook để điều hướng

  // Hàm lấy userID từ token
  const getUserIDFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      return decodedToken?.userid || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Kiểm tra token khi trang load và điều hướng nếu không có token
  useEffect(() => {
    const userID = getUserIDFromToken();
    if (!userID) {
      router.push('/admin'); // Điều hướng về trang login nếu không có token
      return;
    }

    // Nếu có token, tiếp tục xử lý
    async function fetchAircrafts() {
      try {
        const response = await fetch('http://localhost:3001/api/Aircrafts/GetAll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userID }),
        });

        const data = await response.json();
        if (!response.ok || data.message !== 'Aircraft information retrieved successfully') {
          throw new Error(data.message || 'Failed to fetch aircrafts');
        }

        setAircrafts(data.aircrafts);
      } catch (error: any) {
        setErrorMessage(error.message);
        console.error('Error fetching aircrafts:', error);
      } finally {
        setLoading(false); // Dữ liệu đã được fetch xong
      }
    }

    fetchAircrafts();
  }, [router]);

  const handleAddAircraft = () => {
    setSelectedAircraft(null);
    setIsFormOpen(true);
  };

  const handleEditAircraft = (aircraft: Aircraft) => {
    setSelectedAircraft(aircraft);
    setIsFormOpen(true);
  };

  const handleDeleteAircraft = async (id: number) => {
    try {
      const userID = getUserIDFromToken();
      if (!userID) throw new Error('User not authenticated');

      const response = await fetch('http://localhost:3001/api/Aircrafts/Delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID, aircraftID: id }),
      });

      const result = await response.json();
      if (!response.ok || result.message !== 'Aircraft deleted successfully') {
        throw new Error(result.message || 'Failed to delete aircraft');
      }

      alert(result.message);
      setAircrafts(aircrafts.filter((a) => a.AircraftID !== id));
    } catch (error: any) {
      setErrorMessage(error.message);
      console.error('Error deleting aircraft:', error);
    }
  };

  const handleFormSubmit = async (formData: Aircraft) => {
    try {
      const userID = getUserIDFromToken();
      if (!userID) throw new Error('User not authenticated');

      let url = '';
      let method = '';
      let bodyData = {};

      if (selectedAircraft && formData.AircraftID) {
        url = 'http://localhost:3001/api/Aircrafts/Edit';
        method = 'POST';
        bodyData = {
          UserID: userID,
          AircraftID: formData.AircraftID,
          Model: formData.Model,
          Manufacture: formData.Manufacturer,
          Capacity: formData.Capacity,
          RangeKm: formData.RangeKm,
          Description: formData.Description,
        };
      } else {
        url = 'http://localhost:3001/api/Aircrafts/Add';
        method = 'POST';
        bodyData = {
          Model: formData.Model,
          Manufacturer: formData.Manufacturer,
          Capacity: formData.Capacity,
          RangeKm: formData.RangeKm,
          Description: formData.Description,
          UserID: userID,
        };
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const result = await response.json();
      if (!response.ok || (result.message !== 'Aircraft added successfully' && result.message !== 'Aircraft information updated successfully')) {
        throw new Error(result.message || 'Failed to save aircraft');
      }

      alert(result.message);
      if (result.aircraftID) {
        formData.AircraftID = result.aircraftID;
      }
      setAircrafts((prevAircrafts) => {
        if (selectedAircraft) {
          return prevAircrafts.map((a) => (a.AircraftID === formData.AircraftID ? formData : a));
        } else {
          return [...prevAircrafts, formData];
        }
      });
      setIsFormOpen(false); // Đóng form
    } catch (error: any) {
      setErrorMessage(error.message);
      console.error('Error submitting aircraft data:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Hiển thị loading khi đang xác thực hoặc fetch dữ liệu
  }

  if (errorMessage) {
    return <div>{errorMessage}</div>; // Hiển thị thông báo lỗi nếu có
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Aircraft Management</h1>
      <button onClick={handleAddAircraft} className={styles.addButton}>Add Aircraft</button>
      <AircraftTable
        aircrafts={aircrafts}
        onEdit={handleEditAircraft}
        onDelete={handleDeleteAircraft}
      />
      {isFormOpen && (
        <AircraftForm
          aircraft={selectedAircraft}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
        />
      )}
      {errorMessage && <div className={styles.error}>{errorMessage}</div>}
    </div>
  );
}
