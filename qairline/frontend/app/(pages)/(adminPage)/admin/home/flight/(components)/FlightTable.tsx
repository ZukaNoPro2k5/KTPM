import React from 'react';
import styles from './styles/flightTable.module.css';
import { Flight } from '../flightObject';
import { parse, format } from 'date-fns';

type FlightTableProps = {
  flights: Flight[];
  onEdit: (flight: Flight) => void;
  onDelete: (id: number) => void;
};

export default function FlightTable({ flights, onEdit, onDelete }: FlightTableProps) {
  // Hàm định dạng thời gian
  const formatDate = (dateString: string) => {
    try {
      // Nếu là ISO, dùng trực tiếp
      const date = dateString.includes('T')
        ? new Date(dateString)
        : parse(dateString, 'dd/MM/yyyy HH:mm', new Date()); // Chuyển chuỗi "22/12/2024 04:15"
      return format(date, 'dd/MM/yyyy HH:mm'); // Định dạng lại nếu cần
    } catch (error) {
      console.error('Invalid date:', dateString);
      return 'Invalid date';
    }
  };
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>ID</th>
          <th>AircraftModel</th>
          <th>Departure</th>
          <th>Arrival</th>
          <th>Departure  Time</th>
          <th>Arrival  Time</th>
          <th>Price</th>
          <th>SeatsAvail</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {flights.map((flight) => (
          <tr key={flight.FlightID}>
            <td>{flight.FlightID}</td>
            <td>{flight.AircraftModel}</td>
            <td>{flight.Departure}</td>
            <td>{flight.Arrival}</td>
            <td>{formatDate(flight.DepartureTime)}</td>
            <td>{formatDate(flight.ArrivalTime)}</td>
            <td>{flight.Price}</td>
            <td>{flight.SeatsAvailable}</td>
            <td>{flight.Status}</td>
            <td>
              <button className={`${styles.button} ${styles.editButton}` } onClick={() => onEdit(flight)}>Edit</button>
              <button className={`${styles.button} ${styles.deleteButton}`} onClick={() => onDelete(flight.FlightID)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
