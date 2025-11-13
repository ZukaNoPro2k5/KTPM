import React from "react";
import styles from './styles/aircraftTable.module.css';
import { Aircraft } from "../aircraftObject";

type AircraftTableProps = {
    aircrafts: Aircraft[];
    onEdit: (aircraft: Aircraft) => void;
    onDelete: (id: number) => void;
};

export default function AircraftTable({ aircrafts, onEdit, onDelete }: AircraftTableProps) {
    return (
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Model</th>
                    <th>Manufacture</th>
                    <th>Capacity</th>
                    <th>Range</th>
                    <th>Description</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                {aircrafts.map((aircraft) => (
                    <tr key={aircraft.AircraftID}>
                        <td>{aircraft.AircraftID}</td>
                        <td>{aircraft.Model}</td>
                        <td>{aircraft.Manufacturer}</td>
                        <td>{aircraft.Capacity}</td>
                        <td>{aircraft.RangeKm}</td>
                        <td>{aircraft.Description}</td>
                        <td>
                            <button onClick={() => onEdit(aircraft)} className={styles.editButton}>Edit</button>
                            <button onClick={() => onDelete(aircraft.AircraftID)} className={styles.deleteButton}>Delete</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
