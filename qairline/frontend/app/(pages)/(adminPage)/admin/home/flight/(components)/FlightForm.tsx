import React, { useState, useEffect } from 'react';
import styles from './styles/flightForm.module.css';
import { Flight } from '../flightObject';
import { parse, format } from 'date-fns';
import { Aircraft } from '../../aircraft/aircraftObject';

type FlightFormProps = {
  flight: Flight | null;
  onClose: () => void;
  onSubmit: (flight: Partial<Flight>) => void;
};

export default function FlightForm({ flight, onClose, onSubmit }: FlightFormProps) {
  const [formData, setFormData] = useState<Partial<Flight>>({
    FlightID: flight?.FlightID || undefined,
    AircraftModel: flight?.AircraftModel || '',
    Departure: flight?.Departure || '',
    Arrival: flight?.Arrival || '',
    DepartureTime: flight?.DepartureTime || '',
    ArrivalTime: flight?.ArrivalTime || '',
    Price: flight?.Price || 0,
    SeatsAvailable: flight?.SeatsAvailable || 0,
    Status: flight?.Status || 'Scheduled',
  });

  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);

  // Hàm lấy userID từ token trong localStorage
  const getUserID = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded.userid;
  };

  useEffect(() => {
    const fetchAircrafts = async () => {
      try {
        const userID = getUserID(); // Lấy userID từ token
        if (!userID) {
          console.error('UserID không có trong token');
          return;
        }
        const response = await fetch('http://localhost:3001/api/Aircrafts/GetAll', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userID }), // Truyền userID vào API
        });
        
        const data = await response.json();

        console.log(data);
        
        // Kiểm tra xem response có chứa "aircrafts"
        if (data && data.aircrafts && Array.isArray(data.aircrafts)) {
          setAircraftList(data.aircrafts); // Lưu dữ liệu máy bay vào state
        } else {
          console.error('Dữ liệu trả về không đúng định dạng');
        }
      } catch (error) {
        console.error('Error fetching aircraft data:', error);
      }
    };
    fetchAircrafts();
  }, []); // Chạy khi component mount

  const convertToISO = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parsedDate = parse(dateStr, 'dd/MM/yyyy HH:mm', new Date());
      return parsedDate ? parsedDate.toISOString() : '';
    } catch (error) {
      console.error('Error parsing date:', error);
      return '';
    }
  };

  const convertToDisplayFormat = (isoDate: string) => {
    if (!isoDate) return '';
    return format(new Date(isoDate), 'dd/MM/yyyy HH:mm');
  };

  useEffect(() => {
    if (flight) {
      setFormData({
        FlightID: flight.FlightID,
        AircraftModel: flight.AircraftModel,
        Departure: flight.Departure,
        Arrival: flight.Arrival,
        DepartureTime: convertToDisplayFormat(flight.DepartureTime),
        ArrivalTime: convertToDisplayFormat(flight.ArrivalTime),
        Price: flight.Price,
        SeatsAvailable: flight.SeatsAvailable,
        Status: flight.Status,
      });
    }
  }, [flight]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'Price' || name === 'SeatsAvailable' ? Number(value) : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedData = {
      ...formData,
      DepartureTime: formData.DepartureTime
        ? convertToISO(formData.DepartureTime)
        : '',
      ArrivalTime: formData.ArrivalTime
        ? convertToISO(formData.ArrivalTime)
        : '',
    };
    onSubmit(formattedData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.formContainer}>
        <h2 className={styles.title}>{flight ? 'Edit Flight' : 'Add Flight'}</h2>
        <form onSubmit={handleSubmit}>
          {flight && (
            <div className={`${styles.formGroup} ${styles.inputField}`}>
              <label htmlFor="FlightID">Flight ID</label>
              <input type="text" id="FlightID" name="FlightID" value={formData.FlightID} disabled />
            </div>
          )}
          <div className={`${styles.formGroup} ${styles.inputField}`}>
            <label htmlFor="AircraftModel">Aircraft Model</label>
            <select
              id="AircraftModel"
              name="AircraftModel"
              value={formData.AircraftModel}
              onChange={handleChange}
              required
            >
              <option value="">Select a Model</option>
              {Array.isArray(aircraftList) &&
                aircraftList.map((aircraft) => (
                  <option key={aircraft.AircraftID} value={aircraft.Model}>
                    {aircraft.Model}
                  </option>
                ))}
            </select>
          </div>
          <div className={`${styles.formGroup} ${styles.inputField}`}>
            <label htmlFor="Departure">Departure</label>
            <input
              type="text"
              id="Departure"
              name="Departure"
              value={formData.Departure}
              placeholder="Enter text here"
              onChange={handleChange}
              required
            />
          </div>
          <div className={`${styles.formGroup} ${styles.inputField}`}>
            <label htmlFor="Arrival">Arrival</label>
            <input
              type="text"
              id="Arrival"
              name="Arrival"
              placeholder="Enter text here"
              value={formData.Arrival}
              onChange={handleChange}
              required
            />
          </div>
          <div className={`${styles.formGroup} ${styles.inputField}`}>
            <label htmlFor="DepartureTime">Departure Time</label>
            <input
              type="text"
              id="DepartureTime"
              name="DepartureTime"
              value={formData.DepartureTime}
              placeholder="dd/mm/yyyy hh:mm"
              onChange={handleChange}
              required
            />
          </div>
          <div className={`${styles.formGroup} ${styles.inputField}`}>
            <label htmlFor="ArrivalTime">Arrival Time</label>
            <input
              type="text"
              id="ArrivalTime"
              name="ArrivalTime"
              value={formData.ArrivalTime}
              placeholder="dd/mm/yyyy hh:mm"
              onChange={handleChange}
              required
            />
          </div>
          <div className={`${styles.formGroup} ${styles.inputField}`}>
            <label htmlFor="Price">Price</label>
            <input
              type="number"
              id="Price"
              name="Price"
              value={formData.Price}
              onChange={handleChange}
              required
            />
          </div>
          <div className={`${styles.formGroup} ${styles.inputField}`}>
            <label htmlFor="SeatsAvailable">Seats Available</label>
            <input
              type="number"
              id="SeatsAvailable"
              name="SeatsAvailable"
              value={formData.SeatsAvailable}
              onChange={handleChange}
              required
            />
          </div>
          <div className={`${styles.formGroup} ${styles.inputField}`}>
            <label htmlFor="Status">Status</label>
            <input
              type="text"
              id="Status"
              name="Status"
              value={formData.Status}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.buttonGroup}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
