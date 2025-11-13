'use client'
import style from "./homepage.module.css";
import React, {useEffect, useState} from "react";
import { useRouter } from "next/router";
import {jwtDecode, JwtPayload} from "jwt-decode";
import "@/app/global/global.css";
import SearchBar from "@/app/components/SearchBar";


export default function Home() {
  const [search, setSearch] = useState({
    startDestination: '',
    arriveDestination: '',
    startDate: '',
    arriveDate: '',
    startDestinationOptions: ['New York (JFK)', 'Chicago (ORD)', 'San Francisco (SFO)'],
    arriveDestinationOptions: ['Los Angeles (LAX)', 'Miami (MIA)', 'Seattle (SEA)'],
  });
    // Lấy role và name từ localStorage
    const [role, setRole] = useState<string | null>(null);
    const [name, setName] = useState<string | null>(null);

    // Lấy danh sách các điểm đi và điểm đến từ api/flights cho search bar
    useEffect(() => {
        setRole(localStorage.getItem('role'));
        setName(localStorage.getItem('name'));
        const fetchLocations = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/Flights/GetAllFlights');
                const data: { Departure: string; Arrival: string }[] = await response.json();
                
                // Đảm bảo data là array trước khi .map()
                if (Array.isArray(data) && data.length > 0) {
                    const uniqueStartDestinations = Array.from(new Set(data.map(flight => flight.Departure)));
                    const uniqueArriveDestinations = Array.from(new Set(data.map(flight => flight.Arrival)));
                    setSearch(prev => ({
                        ...prev,
                        startDestinationOptions: uniqueStartDestinations,
                        arriveDestinationOptions: uniqueArriveDestinations,
                    }));
                }
            } catch (error) {
                console.error('Error fetching locations:', error);
            }
        };
        fetchLocations();
    }, []);


    const [offers, setOffers] = useState<any[]>([]); // State lưu offers từ API
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOffers = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/Offers/GetAllOffers');
            if (!response.ok) {
            throw new Error('Failed to fetch offers');
            }
            const data = await response.json();
            
            // Đảm bảo data là array trước khi .map()
            if (Array.isArray(data)) {
                const formattedOffers = data.map((offer: any) => ({
                id: offer.PostID,
                title: offer.Title,
                description: offer.Content,
                postDate: offer.PostDate,
                }));
                setOffers(formattedOffers);
            } else {
                setOffers([]);
            }
        } catch (error: any) {
            setError(error.message);
            setOffers([]);
        } finally {
            setLoading(false);
        }
        };

        fetchOffers();
    }, []);

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setSearch((prev) => ({ ...prev, [name]: value }));
    };

    const handleSearch = () => {
        console.log(search);
    };

    // const handleViewMore = () => {
    //     router.push('/offers'); // Điều hướng đến trang /offers
    //   };

  return (
      <main>

          <div className={style.main_image}>
              <img className={style.placeholder} src={'Placeholder/plane2.jpg'} alt="Main image"></img>
              <div className={style.welcome}>
                  Welcome to
                  <img src={`/Logo/big_logo.svg`} alt="Big Logo"/>
              </div>
          </div>

          <div className={style.content}>
              <h1 className={style.title}>Book Flights</h1>
              <SearchBar
                  search={search}
                  handleInputChange={handleInputChange}
                  handleSearch={handleSearch}
                  quickSearchBar={true}
              />
          </div>

          <div className={style.content}>
              <div className={style.offers}>
                  <h1 className={style.title}>Offers</h1>
                  <div className={style.offerGrid}>
                      {loading ? (
                          <p>Loading offers...</p>
                      ) : error ? (
                          <p>{error}</p>
                      ) : (
                          offers.slice(0, 3).map((offer) => (
                              <div key={offer.id} className={style.offerCard}>
                                  <img src={'/Offer_Image/news.svg'} alt={offer.title} className={style.offerImage}/>
                                  <div className={style.offerTitle}>{offer.title}</div>
                              </div>
                          ))
                      )}
                  </div>
                  <div className="text-center mt-4">
                      <button className="viewMoreButton">
                          Xem thêm <span>&#8594;</span>
                      </button>
                  </div>
              </div>
          </div>


          <div className={style.hotDes}>
              <h1 className={style.title}>Hot Destination</h1>
              <div className={style.destinations}>
                  <div className={style.destinationCard}>
                      <img src="Placeholder/HaLongBay.png" alt="Halong Bay, Vietnam"/>
                      <div className={style.destinationInfo}>Halong Bay, Vietnam</div>
                  </div>
                  <div className={style.destinationCard}>
                      <img src="Placeholder/HaNoi.png" alt="Hanoi, Vietnam"/>
                      <div className={style.destinationInfo}>Hanoi, Vietnam</div>
                  </div>
                  <div className={style.destinationCard}>
                      <img src="Placeholder/DaNang.png" alt="Danang, Vietnam"/>
                      <div className={style.destinationInfo}>Danang, Vietnam</div>
                  </div>
              </div>
          </div>
      </main>
  );
}
