import React, { useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 

const VerifyPage = () => {
  const navigate = useNavigate(); 

  useEffect(() => {
    const verifyToken = async () => {
      const token = new URLSearchParams(window.location.search).get('token');
      if (!token) {
        navigate('/sign'); 
        return;
      }

      try {
        const response = await axios.get(`/api/verify?token=${token}`);
        const { redirect } = response.data;
        navigate(redirect); 
      } catch (error) {
        console.error('Verification failed:', error);
        navigate('/sign');
      }
    };

    verifyToken();
  }, [navigate]); 

  return <div>Verifying...</div>;
};

export default VerifyPage;
