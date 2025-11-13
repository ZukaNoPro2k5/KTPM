//Option 1: Dùng getStaticProps + getStaticPaths (SSG)
// // Nếu dữ liệu của bạn không thay đổi thường xuyên, bạn có thể sử dụng getStaticProps và getStaticPaths để render trang tĩnh 
// cho từng offer. Điều này giúp cải thiện hiệu suất vì dữ liệu chỉ được fetch khi build, không phải mỗi lần người dùng truy cập 
// trang.

'use client';
import styles from '@/app/(pages)/(customerPage)/offers/[id]/offerDetailPage.module.css';
import { useSearchParams } from 'next/navigation';
import {Suspense} from "react";
import {format} from "date-fns";


const OfferDetailPage = () => { //{ offer }: { offer: { id: number; title: string; description: string } }
  const searchParams = useSearchParams();
  const title = searchParams.get('title');
  const description = searchParams.get('description');
  const postDate = searchParams.get('postDate');

    const formatedDate = (datetime: string) => {
        return format(new Date(datetime), 'HH:mm dd/MM/yyyy');
    };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.postDate}>Posted on: {formatedDate(postDate as string)}</p>
      <hr className={styles.divider} />
      <p className={styles.description}>{description}</p>
    </div>
  );
};

const WrappedOfferDetailPage = () => (
    <Suspense fallback={<div>Loading...</div>}>
        <OfferDetailPage />
    </Suspense>
);

export default WrappedOfferDetailPage;

// export const getStaticPaths: GetStaticPaths = async () => {
//   // Fetch tất cả các ID của offers để tạo ra các path cho các trang offer chi tiết
//   const offers = await fetch('https://api.example.com/offers')
//     .then((res) => res.json());

//   const paths = offers.map((offer) => ({
//     params: { id: offer.id.toString() },
//   }));

//   return {
//     paths,
//     fallback: 'blocking', // "blocking" giúp render trang khi dữ liệu đã được fetch
//   };
// };

// export const getStaticProps: GetStaticProps = async ({ params }) => {
//   const { id } = params as { id: string };
  
//   // Fetch dữ liệu offer từ API hoặc từ cơ sở dữ liệu của bạn
//   const offer = await fetch(`https://api.example.com/offers/${id}`)
//     .then((res) => res.json())
//     .catch((err) => null); // Handle error nếu có

//   if (!offer) {
//     return { notFound: true };
//   }

//   return {
//     props: { offer },
//   };
// };



//Dùng getServerSideProps (SSR)
//Nếu bạn cần fetch dữ liệu từ server mỗi khi người dùng truy cập trang, bạn có thể sử dụng getServerSideProps.

// import { GetServerSideProps } from 'next';

// const OfferDetailPage = ({ offer }: { offer: { id: number; title: string; description: string } }) => {
//   return (
//     <div>
//       <h1>{offer.title}</h1>
//       <p>{offer.description}</p>
//     </div>
//   );
// };

// export const getServerSideProps: GetServerSideProps = async (context) => {
//   const { id } = context.params as { id: string };
  
//   // Fetch dữ liệu offer từ API hoặc từ cơ sở dữ liệu của bạn
//   const offer = await fetch(`https://api.example.com/offers/${id}`)
//     .then((res) => res.json())
//     .catch((err) => null); // Handle error nếu có
  
//   if (!offer) {
//     return { notFound: true };
//   }

//   return {
//     props: { offer },
//   };
// };

// export default OfferDetailPage;
