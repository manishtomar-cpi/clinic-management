
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // For navigation
import {
  FiUser,
  FiMapPin,
  FiCalendar,
  FiMail,
  FiPhone,
  FiSearch,
  FiMap 
} from 'react-icons/fi';
import { TailSpin } from 'react-loader-spinner';
import { useSession } from 'next-auth/react';
import { db } from '../../db';
import { collection, getDocs } from 'firebase/firestore';
import { decryptData } from '../../lib/encryption';

const SearchPatient = () => {
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');

  const router = useRouter();

  // Validation: At least one field must be filled
  const isFormValid = () => {
    return name.trim() !== '' || address.trim() !== '' || visitDate.trim() !== '';
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    // If form is invalid, set error and return
    if (!isFormValid()) {
      setError('Please fill at least one field to perform a search.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSearchResults([]);

    try {
      if (!session || !session.user || !session.user.id) {
        setError('User session not found.');
        setIsLoading(false);
        return;
      }

      const doctorId = session.user.id;
      const patientsRef = collection(db, 'doctors', doctorId, 'patients');
      const patientsSnapshot = await getDocs(patientsRef);

      const patients = patientsSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Decrypt patient data
      const decryptedPatients = patients.map((patient) => ({
        id: patient.id,
        name: decryptData(patient.name),
        address: decryptData(patient.address),
        email: decryptData(patient.email || 'Not Provided'),
        phone: decryptData(patient.mobileNumber || 'Not Provided'),
        age: decryptData(patient.age || 'N/A'),
        gender: decryptData(patient.gender || 'N/A'),
        disease: decryptData(patient.disease || 'N/A'),
        notes: decryptData(patient.notes || 'N/A'),
        treatmentStatus: patient.treatmentStatus || 'N/A', // Assuming plaintext
      }));

      // Filter patients based on search criteria
      let filteredPatients = decryptedPatients.filter((patient) => {
        const nameMatch =
          name.trim() === '' ||
          patient.name.toLowerCase().includes(name.toLowerCase());
        const addressMatch =
          address.trim() === '' ||
          patient.address.toLowerCase().includes(address.toLowerCase());
        return nameMatch && addressMatch;
      });

      // Note: We're not filtering by visitDate here, since visits are not fetched at this point.

      setSearchResults(filteredPatients);
    } catch (err) {
      console.error('Error searching patients:', err);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (patientId) => {
    // Navigate to the search-result page with the patientId as a query parameter
    router.push(`/search-result?patientId=${patientId}`);
  };

  return (
    <div className="p-6 bg-gradient-to-r from-blue-100 to-blue-200 min-h-screen">
      <h2 className="text-4xl font-bold mb-8 text-center text-blue-800">
        Search Patients
      </h2>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white p-8 rounded-xl shadow-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Name Input */}
          <div className="relative">
            <FiUser className="absolute top-3 left-3 text-indigo-500" />
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Patient Name"
              className="pl-10 pr-4 py-3 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
              aria-label="Search by patient name"
            />
          </div>

          {/* Address Input */}
          <div className="relative">
            <FiMapPin className="absolute top-3 left-3 text-green-500" />
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Patient Address"
              className="pl-10 pr-4 py-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
              aria-label="Search by patient address"
            />
          </div>

          {/* Visit Date Input */}
          <div className="relative">
            <FiCalendar className="absolute top-3 left-3 text-red-500" />
            <input
              type="date"
              id="visitDate"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="pl-10 pr-4 py-3 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full"
              aria-label="Search by visit date"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Search Button */}
        <div className="mt-6 flex justify-center">
          <button
            type="submit"
            disabled={!isFormValid() || isLoading}
            className={`flex items-center justify-center px-6 py-3 rounded-xl text-white font-semibold transition-colors duration-300 ${
              isFormValid()
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-500 hover:to-purple-500'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            aria-label="Search patients"
          >
            {isLoading ? (
              <>
                <TailSpin
                  height="20"
                  width="20"
                  color="#FFFFFF"
                  ariaLabel="loading"
                  className="mr-2"
                />
                Searching...
              </>
            ) : (
              <>
                <FiSearch className="mr-2" />
                Search
              </>
            )}
          </button>
        </div>
      </form>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center items-center mb-8">
          <span className="text-xl text-blue-700">Loading...</span>
        </div>
      )}

      {/* Search Results */}
      {!isLoading && searchResults.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          {searchResults.map((patient, index) => (
            <div key={patient.id} className="mb-8">
              {/* Patient Information Card */}
              <div className="flex flex-col md:flex-row items-center bg-gradient-to-r from-green-100 to-green-200 p-6 rounded-xl shadow-lg">
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-green-800">{patient.name}</h3>
                  <p className="text-green-700">{patient.age} years old | {patient.gender}</p>
                  <p className="flex items-center text-green-700 mt-2">
                    <FiMap className="mr-2 text-green-600" />
                    {patient.address}
                  </p>
                  <p className="flex items-center text-green-700 mt-1">
                    <FiMail className="mr-2 text-green-600" />
                    {patient.email}
                  </p>
                  <p className="flex items-center text-green-700 mt-1">
                    <FiPhone className="mr-2 text-green-600" />
                    {patient.phone}
                  </p>
                </div>
                <div className="mt-4 md:mt-0 md:ml-6">
                  <button
                    onClick={() => handleViewDetails(patient.id)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-pink-500 hover:to-purple-500 transition-colors duration-300"
                    aria-label="View Patient Details"
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* Horizontal Line */}
              {index !== searchResults.length - 1 && (
                <hr className="my-8 border-gray-300" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {!isLoading && searchResults.length === 0 && (
        <p className="text-center text-gray-700 mt-12">No patients found matching the search criteria.</p>
      )}
    </div>
  );
};

export default SearchPatient;
