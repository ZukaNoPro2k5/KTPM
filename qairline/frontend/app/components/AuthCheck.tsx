// /app/components/AuthCheck.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {jwtDecode} from 'jwt-decode';

interface AuthCheckProps {
  requireAdmin?: boolean;
}

const AuthCheck = ({ requireAdmin = false }: AuthCheckProps) => {
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
      router.push(requireAdmin ? '/admin' : '/home'); // Redirect nếu không có token
      return;
    }

    try {
      const decodedToken: any = jwtDecode(token);
      const userID = decodedToken.userid; // Backend uses 'userid' not 'userID'
      const role = decodedToken.role;
      
      if (!userID) {
        router.push(requireAdmin ? '/admin' : '/home'); // Redirect nếu không có userID
        return;
      }

      // If admin is required, check role
      if (requireAdmin && role !== 'Admin') {
        alert('You do not have permission to access this page. Admin access only.');
        router.push('/home'); // Redirect to customer home if not admin
        return;
      }
    } catch (error) {
      router.push(requireAdmin ? '/admin' : '/home'); // Redirect nếu có lỗi khi giải mã token
    }
  }, [isMounted, router, requireAdmin]);

  return null; // Không render gì cả, chỉ redirect khi cần
};

export default AuthCheck;
