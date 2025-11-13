// /app/components/AuthCheck.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {jwtDecode} from 'jwt-decode';

const AuthCheck = () => {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Chỉ sử dụng useRouter sau khi component đã mount
  useEffect(() => {
    setIsMounted(true); // Khi component mount, thay đổi trạng thái
  }, []);

  // Kiểm tra auth chỉ khi component đã mount
  useEffect(() => {
    if (!isMounted) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin'); // Redirect nếu không có token
      return;
    }

    try {
      const decodedToken: any = jwtDecode(token);
      const userID = decodedToken.userID;
      if (!userID) {
        router.push('/admin'); // Redirect nếu không có userID
      }
    } catch (error) {
      router.push('/admin'); // Redirect nếu có lỗi khi giải mã token
    }
  }, [isMounted, router]);

  return null; // Không render gì cả, chỉ redirect khi cần
};

export default AuthCheck;
