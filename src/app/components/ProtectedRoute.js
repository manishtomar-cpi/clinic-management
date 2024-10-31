
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import MedicalSpinner from './MedicalSpinner'; // Ensure this component exists

const ProtectedRoute = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Do nothing while loading
    if (status === 'unauthenticated') {
      router.push('/login'); // Redirect to login if not authenticated
    }
    // If authenticated, do nothing
  }, [status, router]);

  if (status === 'loading') {
    return <MedicalSpinner />; // Show a loading spinner while checking auth
  }

  if (status === 'authenticated') {
    return children; // Render the protected component
  }

  return null; // Render nothing while redirecting
};

export default ProtectedRoute;
