'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

export const useAdminAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/admin');
      return;
    }

    try {
      const decodedToken: any = jwtDecode(token);
      const userid = decodedToken.userid;
      const role = decodedToken.role;

      if (!userid) {
        router.push('/admin');
        return;
      }

      // Check if user is Admin
      if (role !== 'Admin') {
        alert('You do not have permission to access this page. Admin access only.');
        router.push('/home');
        return;
      }

      setIsAdmin(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error decoding token:', error);
      router.push('/admin');
    }
  }, [router]);

  return { isLoading, isAdmin };
};
