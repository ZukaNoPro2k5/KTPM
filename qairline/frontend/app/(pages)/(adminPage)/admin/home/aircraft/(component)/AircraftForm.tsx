import React, { useState } from 'react';
import styles from './styles/aircraftForm.module.css';
import { Aircraft } from '../aircraftObject';

type AircraftFormProps = {
    aircraft: Aircraft | null;
    onClose: () => void;
    onSubmit: (aircraft: Aircraft) => void;
};

export default function AircraftForm({ aircraft, onClose, onSubmit }: AircraftFormProps) {
    const [formData, setFormData] = useState<Aircraft>({
        AircraftID: aircraft?.AircraftID || Date.now(),
        Model: aircraft?.Model || '',
        Manufacturer: aircraft?.Manufacturer || '',
        Capacity: aircraft?.Capacity || 0,
        RangeKm: aircraft?.RangeKm || 0,
        Description: aircraft?.Description || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData); // Pass data back to page
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.formContainer}>
                <h2 className={styles.title}>{aircraft ? 'Edit Aircraft' : 'Add Aircraft'}</h2>
                <form onSubmit={handleSubmit}>
                    <label>
                        Model:
                        <input
                            type='text'
                            name='Model'
                            value={formData.Model}
                            placeholder='Enter text here'
                            onChange={handleChange}
                            className={styles.inputField}
                            required
                        />
                    </label>
                    <label>
                        Manufacturer:
                        <input
                            type="text"
                            name="Manufacturer"
                            value={formData.Manufacturer}
                            placeholder='Enter text here'
                            onChange={handleChange}
                            className={styles.inputField}
                            required
                        />
                    </label>
                    <label>
                        Capacity:
                        <input
                            type="number"
                            name="Capacity"
                            value={formData.Capacity}
                            onChange={handleChange}
                            className={styles.inputField}
                            required
                        />
                    </label>
                    <label>
                        Range:
                        <input
                            type="number"
                            name="RangeKm"
                            value={formData.RangeKm}
                            onChange={handleChange}
                            className={styles.inputField}
                            required
                        />
                    </label>
                    <label>
                        Description:
                        <textarea
                            name="Description"
                            value={formData.Description}
                            onChange={handleChange}
                            placeholder='Enter text here'
                            className={styles.inputField}
                            required
                        />
                    </label>
                    <div className={styles.buttons}>
                        <button type="button" onClick={onClose} className={styles.cancelButton}>Cancel</button>
                        <button type="submit" className={styles.submitButton}>Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
