import React from 'react';
import { useRouter } from 'next/navigation';
import { format, parse } from 'date-fns';
import styles from './styles/SearchBar.module.css';

interface SearchProps {
    search: {
        startDestination: string;
        arriveDestination: string;
        startDate: string;
        arriveDate: string;
        startDestinationOptions: string[];
        arriveDestinationOptions: string[];
    };
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleSearch: () => void;
    quickSearchBar?: boolean;
}

const SearchBar: React.FC<SearchProps> = ({ search, handleInputChange, handleSearch, quickSearchBar = true }) => {
    const router = useRouter();

    const executeSearch = () => {
        if (quickSearchBar) {
            const query = new URLSearchParams({
                startDestination: search.startDestination || '',
                arriveDestination: search.arriveDestination || '',
                startDate: search.startDate || '',
                arriveDate: search.arriveDate || '',
            }).toString();
            router.push(`/bookings/search?${query}`);
        }
        handleSearch();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (e.key === 'Enter') {
            executeSearch();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.searchbar}>
                <div className={styles.searchitem}>
                    <label htmlFor="startDestination" className={styles.label}>Departure:</label>
                    <select
                        id="startDestination"
                        name="startDestination"
                        value={search.startDestination}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                    >
                        <option value="">Select</option>
                        {search.startDestinationOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={styles.searchitem}>
                    <label htmlFor="arriveDestination" className={styles.label}>Arrival:</label>
                    <select
                        id="arriveDestination"
                        name="arriveDestination"
                        value={search.arriveDestination}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                    >
                        <option value="">Select</option>
                        {search.arriveDestinationOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={styles.searchitem}>
                    <label htmlFor="startDate" className={styles.label}>Start Date:</label>
                    <input
                        id="startDate"
                        type="date"
                        name="startDate"
                        placeholder="Start Date"
                        value={search.startDate}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <div className={styles.searchitem}>
                    <label htmlFor="arriveDate" className={styles.label}>Arrive Date:</label>
                    <input
                        id="arriveDate"
                        type="date"
                        name="arriveDate"
                        placeholder="Arrive Date"
                        value={search.arriveDate}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <button className={styles.searchButton} onClick={executeSearch}>Search</button>
            </div>
        </div>
    );
};

export default SearchBar;