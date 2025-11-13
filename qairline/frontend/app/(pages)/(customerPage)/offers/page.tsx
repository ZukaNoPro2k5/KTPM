// pages/offers/index.tsx
'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from "./offerPage.module.css";

interface Offer {
  id: number;
  title: string;
  description: string;
  postDate: string;
}


const OffersPage = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data từ API
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
            // Map dữ liệu từ API thành format của Offer
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

  if (loading) {
    return <div className={styles.container}>Loading offers...</div>;
  }

  if (error) {
    return <div className={styles.container}>Error: {error}</div>;
  }
  
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Offers</h1>
      <div className={styles.offerGrid}>
        {offers.map((offer) => (
          <Link
            href={{
              pathname: `/offers/${offer.id}`,
              query: {
                title: offer.title,
                description: offer.description,
                postDate: offer.postDate,
              },
            }}
            key={offer.id}
            passHref
          >
            <div className={styles.offerCard}>
              <img
                src="/Offer_Image/Offer_Noti.png"
                alt={`${offer.title} Image`}
                className={styles.offerImage}
              />
              <h2 className={styles.offerTitle}>{offer.title}</h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default OffersPage;

// Fetch data server-side when page is requested
// export async function getServerSideProps() {
//   const res = await fetch('https://api.example.com/offers');
//   const offers = await res.json();

//   return { props: { offers } };
// }

// export default OffersPage;