
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaMobileAlt,
  FaMapMarkerAlt,
  FaEnvelope,
  FaClinicMedical,
  FaCalendarAlt,
  FaArrowRight,
  FaUserEdit,
  FaTrash,
} from 'react-icons/fa';
import { BsTrash, BsPencilSquare } from 'react-icons/bs';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../db';
import { showToast } from './Toast';
import { useSession } from 'next-auth/react';

const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return 'N/A';
  const [day, month, year] = dateStr.split('-').map(Number);
  return `${day}-${month}-${year}`;
};

const PatientCard = ({ patient }) => {
  const {
    id,
    name,
    address,
    mobileNumber,
    email,
    treatmentStatus,
    lastVisit,
    nextVisit,
  } = patient;

  const { data: session } = useSession();
  const doctorId = session?.user?.id; 
  // Helper function to determine badge color based on treatment status
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'ongoing':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'on hold':
        return 'bg-yellow-500';
      case 'canceled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // State for Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // State for Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // State for Edit Form
  const [editFormData, setEditFormData] = useState({
    name,
    address,
    mobileNumber,
    email,
    treatmentStatus,
    lastVisit: lastVisit
      ? {
          date: lastVisit.date,
          time: lastVisit.time,
          status: lastVisit.status,
        }
      : {
          date: '',
          time: '',
          status: '',
        },
    nextVisit: nextVisit
      ? {
          date: nextVisit.date,
          time: nextVisit.time,
          status: nextVisit.status,
        }
      : {
          date: '',
          time: '',
          status: '',
        },
  });

  // Handler to open Delete Modal
  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  // Handler to close Delete Modal
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  // Handler to confirm deletion
  const confirmDelete = async () => {
    if (!doctorId) {
      showToast('Doctor ID not found. Please try again.', 'error');
      return;
    }

    try {
      // Delete the patient document
      await deleteDoc(doc(db, 'doctors', doctorId, 'patients', id));

      // Optionally, delete all visits associated with the patient
      // Implement batch deletion if necessary

      showToast('Patient deleted successfully!', 'success');
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting patient:', error);
      showToast('Error deleting patient. Please try again.', 'error');
    }
  };

  // Handler to open Edit Modal
  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  // Handler to close Edit Modal
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    // Reset form data to original
    setEditFormData({
      name,
      address,
      mobileNumber,
      email,
      treatmentStatus,
      lastVisit: lastVisit
        ? {
            date: lastVisit.date,
            time: lastVisit.time,
            status: lastVisit.status,
          }
        : {
            date: '',
            time: '',
            status: '',
          },
      nextVisit: nextVisit
        ? {
            date: nextVisit.date,
            time: nextVisit.time,
            status: nextVisit.status,
          }
        : {
            date: '',
            time: '',
            status: '',
          },
    });
  };

  // Handler for form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handler for visit input changes
  const handleVisitChange = (e, visitType) => {
    const { name, value } = e.target;
    setEditFormData((prevData) => ({
      ...prevData,
      [visitType]: {
        ...prevData[visitType],
        [name]: value,
      },
    }));
  };

  // Handler to submit the edit form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!doctorId) {
      showToast('Doctor ID not found. Please try again.', 'error');
      return;
    }

    try {
      const patientDocRef = doc(db, 'doctors', doctorId, 'patients', id);

      // Update patient details
      await updateDoc(patientDocRef, {
        name: editFormData.name,
        address: editFormData.address,
        mobileNumber: editFormData.mobileNumber,
        email: editFormData.email,
        treatmentStatus: editFormData.treatmentStatus,
      });

      // Optionally, update lastVisit and nextVisit fields
      await updateDoc(patientDocRef, {
        lastVisit: editFormData.lastVisit.date
          ? {
              date: editFormData.lastVisit.date,
              time: editFormData.lastVisit.time,
              status: editFormData.lastVisit.status,
            }
          : null,
        nextVisit: editFormData.nextVisit.date
          ? {
              date: editFormData.nextVisit.date,
              time: editFormData.nextVisit.time,
              status: editFormData.nextVisit.status,
            }
          : null,
      });

      showToast('Patient details updated successfully!', 'success');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating patient:', error);
      showToast('Error updating patient. Please try again.', 'error');
    }
  };

  return (
    <>
      {/* Patient Card */}
      <motion.div
        className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 p-1 rounded-lg shadow-lg relative"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-white rounded-lg p-6 relative h-full flex flex-col">
          {/* Treatment Status Badge */}
          <span
            className={`absolute top-4 right-4 px-3 py-1 text-xs font-semibold text-white rounded-full ${getStatusColor(
              treatmentStatus
            )} bg-opacity-80`}
          >
            {treatmentStatus}
          </span>

          {/* Patient Name */}
          <h3 className="text-2xl font-bold text-purple-700 mb-4">{name}</h3>

          {/* Patient Information */}
          <div className="flex-1">
            {/* Address */}
            <div className="flex items-center mb-3">
              <FaMapMarkerAlt className="text-purple-500 mr-2" />
              <span className="text-gray-700">{address}</span>
            </div>

            {/* Mobile Number */}
            <div className="flex items-center mb-3">
              <FaMobileAlt className="text-purple-500 mr-2" />
              <span className="text-gray-700">{mobileNumber}</span>
            </div>

            {/* Email */}
            <div className="flex items-center mb-3">
              <FaEnvelope className="text-purple-500 mr-2" />
              <span className="text-gray-700">{email}</span>
            </div>

            {/* Last Visit */}
            <div className="flex items-center mb-3">
              <FaCalendarAlt className="text-purple-500 mr-2" />
              <span className="text-gray-700">
                <strong>Last Visit:</strong>{' '}
                {lastVisit
                  ? `${formatDateForDisplay(lastVisit.date)} at ${lastVisit.time}`
                  : 'N/A'}
              </span>
            </div>

            {/* Last Visit Status */}
            {lastVisit && (
              <div className="flex items-center mb-3">
                <FaArrowRight className="text-purple-500 mr-2" />
                <span className="text-gray-700">
                  <strong>Last Visit Status:</strong> {lastVisit.status}
                </span>
              </div>
            )}

            {/* Next Visit */}
            <div className="flex items-center mb-3">
              <FaCalendarAlt className="text-purple-500 mr-2" />
              <span className="text-gray-700">
                <strong>Next Visit:</strong>{' '}
                {nextVisit
                  ? `${formatDateForDisplay(nextVisit.date)} at ${nextVisit.time}`
                  : 'N/A'}
              </span>
            </div>

            {/* Next Visit Status */}
            {nextVisit && (
              <div className="flex items-center">
                <FaArrowRight className="text-purple-500 mr-2" />
                <span className="text-gray-700">
                  <strong>Next Visit Status:</strong> {nextVisit.status}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex space-x-2">
            <button
              onClick={handleEditClick}
              className="flex-1 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors flex items-center justify-center"
              aria-label="Edit Patient"
            >
              <BsPencilSquare className="mr-2" /> Edit
            </button>
            <button
              onClick={handleDeleteClick}
              className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors flex items-center justify-center"
              aria-label="Delete Patient"
            >
              <BsTrash className="mr-2" /> Delete
            </button>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <motion.div
            className="bg-white rounded-lg p-6 w-11/12 max-w-md shadow-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-semibold mb-4 text-red-500 flex items-center">
              <FaTrash className="mr-2" /> Confirm Deletion
            </h2>
            <p className="mb-6">
              Are you sure you want to delete <strong>{name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center"
              >
                <BsTrash className="mr-2" /> Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-auto">
          <motion.div
            className="bg-gradient-to-tr from-purple-300 to-pink-200 rounded-lg p-6 w-11/12 max-w-2xl shadow-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center mb-4">
              <FaUserEdit className="text-purple-600 text-2xl mr-2" />
              <h2 className="text-xl font-semibold text-purple-800">Edit Patient Details</h2>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-gray-700 font-medium mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={editFormData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-purple-400 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-gray-700 font-medium mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={editFormData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-purple-400 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label htmlFor="mobileNumber" className="block text-gray-700 font-medium mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  id="mobileNumber"
                  name="mobileNumber"
                  value={editFormData.mobileNumber}
                  onChange={handleInputChange}
                  required
                  pattern="[0-9]{10}"
                  title="Enter a valid 10-digit mobile number"
                  className="w-full p-2 border border-purple-400 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-gray-700 font-medium mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-purple-400 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Treatment Status */}
              <div>
                <label htmlFor="treatmentStatus" className="block text-gray-700 font-medium mb-1">
                  Treatment Status
                </label>
                <select
                  id="treatmentStatus"
                  name="treatmentStatus"
                  value={editFormData.treatmentStatus}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-purple-400 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Canceled">Canceled</option>
                </select>
              </div>

              {/* Last Visit */}
              {/* <div>
                <h3 className="text-lg font-medium mb-2 text-gray-800">Last Visit</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="lastVisitDate" className="block text-gray-700 font-medium mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      id="lastVisitDate"
                      name="date"
                      value={editFormData.lastVisit.date}
                      onChange={(e) => handleVisitChange(e, 'lastVisit')}
                      className="w-full p-2 border border-purple-400 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastVisitTime" className="block text-gray-700 font-medium mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      id="lastVisitTime"
                      name="time"
                      value={editFormData.lastVisit.time}
                      onChange={(e) => handleVisitChange(e, 'lastVisit')}
                      className="w-full p-2 border border-purple-400 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastVisitStatus" className="block text-gray-700 font-medium mb-1">
                      Status
                    </label>
                    <input
                      type="text"
                      id="lastVisitStatus"
                      name="status"
                      value={editFormData.lastVisit.status}
                      onChange={(e) => handleVisitChange(e, 'lastVisit')}
                      className="w-full p-2 border border-purple-400 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>
              </div> */}

              {/* Next Visit */}
              {/* <div>
                <h3 className="text-lg font-medium mb-2 text-gray-800">Next Visit</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="nextVisitDate" className="block text-gray-700 font-medium mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      id="nextVisitDate"
                      name="date"
                      value={editFormData.nextVisit.date}
                      onChange={(e) => handleVisitChange(e, 'nextVisit')}
                      className="w-full p-2 border border-purple-400 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="nextVisitTime" className="block text-gray-700 font-medium mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      id="nextVisitTime"
                      name="time"
                      value={editFormData.nextVisit.time}
                      onChange={(e) => handleVisitChange(e, 'nextVisit')}
                      className="w-full p-2 border border-purple-400 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="nextVisitStatus" className="block text-gray-700 font-medium mb-1">
                      Status
                    </label>
                    <input
                      type="text"
                      id="nextVisitStatus"
                      name="status"
                      value={editFormData.nextVisit.status}
                      onChange={(e) => handleVisitChange(e, 'nextVisit')}
                      className="w-full p-2 border border-purple-400 rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>
              </div> */}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center"
                >
                  <FaUserEdit className="mr-2" /> Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default PatientCard;
