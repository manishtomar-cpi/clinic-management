'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import MedicalSpinner from './MedicalSpinner'; // Ensure this component exists

/**
 * ProtectedRoute Component
 *
 * This component wraps around other components to enforce authentication
 * and role-based access control. It ensures that only authenticated users
 * with the specified role can access the wrapped content.
 *
 * Props:
 * - children: The component(s) to render if access is granted.
 * - requiredRole: (Optional) The role required to access the children.
 *
 * Usage:
 * <ProtectedRoute requiredRole="patient">
 *   <PatientDashboardContent />
 * </ProtectedRoute>
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // While authentication status is loading, do nothing.
    if (status === 'loading') return;

    // If the user is not authenticated, redirect to the appropriate login page.
    if (status === 'unauthenticated') {
      // Redirect based on the required role
      if (requiredRole === 'doctor') {
        router.push('/login'); // Doctor login page
      } else if (requiredRole === 'patient') {
        router.push('/patient-login'); // Patient login page
      } else {
        router.push('/login'); // Default login page
      }
      return;
    }

    // If a requiredRole is specified, check if the user's role matches.
    if (requiredRole && session.user.role !== requiredRole) {
      router.push('/unauthorized'); // Redirect to an unauthorized access page.
      return;
    }

    // If authenticated and (if required) role matches, allow access.
  }, [status, router, requiredRole, session]);

  // While checking authentication or redirection, show a loading spinner.
  if (status === 'loading') {
    return <MedicalSpinner />;
  }

  // If the user is authenticated and has the required role (if any), render the children.
  if (status === 'authenticated') {
    if (requiredRole && session.user.role !== requiredRole) {
      return null; // Optionally, you can render a message or component here.
    }
    return children;
  }

  // In any other case (shouldn't occur), render nothing.
  return null;
};

export default ProtectedRoute;
