"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { showToast } from "../components/Toast";
import PatientSidebar from "../components/PatientSidebar";
import ProtectedRoute from "../components/ProtectedRoute";
import MedicalSpinner from "../components/MedicalSpinner";
import PatientChatComponent from "../components/PatientChatComponent";
import { decryptData } from "../../lib/encryption";
import { db } from "../../db";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { motion } from "framer-motion";
import Modal from "react-modal";
import {
  FaHeart,
  FaCalendarAlt,
  FaFileMedical,
  FaStickyNote,
  FaStopCircle,
} from "react-icons/fa";
import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiUser,
  FiMap,
  FiPhone,
  FiMail,
  FiFilter,
  FiSun,
} from "react-icons/fi";

// Formatting Function
const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}`;
};

// Custom Styles for Modal
const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    transform: "translate(-50%, -50%)",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "80vh",
    overflowY: "auto",
    borderRadius: "1.5rem",
    padding: "2rem",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    zIndex: 1000,
  },
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  if (!status) return null;

  const statusMap = {
    completed: {
      color:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      Icon: FiCheckCircle,
    },
    missed: {
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      Icon: FaHeart,
    },
    upcoming: {
      color:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      Icon: FiClock,
    },
    rescheduled: {
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      Icon: FiCalendar,
    },
    "rescheduled but missed": {
      color:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
      Icon: FaHeart,
    },
    stopped: {
      color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      Icon: FaStopCircle,
    },
    hold: {
      color:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100",
      Icon: FiFilter,
    },
    default: {
      color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      Icon: FiClock,
    },
  };

  const { color, Icon } =
    statusMap[status.toLowerCase()] || statusMap["default"];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}
    >
      <Icon className="mr-1 text-sm" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Info Card Component
const InfoCard = React.memo(({ label, value, icon, gradient }) => (
  <motion.div
    className={`flex items-center p-4 rounded-lg shadow hover:shadow-lg transition-shadow bg-gradient-to-r ${gradient} text-white`}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="text-3xl mr-4">{icon}</div>
    <div>
      <p className="font-semibold">{label}</p>
      <p className="text-lg">{value}</p>
    </div>
  </motion.div>
));

// Treatment Status Card Component
const TreatmentStatusCard = React.memo(({ status, icon }) => (
  <motion.div
    className="flex items-center p-4 rounded-lg shadow-lg bg-white dark:bg-gray-800"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="text-3xl mr-4 text-indigo-500">{icon}</div>
    <div>
      <p className="font-semibold capitalize">{status}</p>
    </div>
  </motion.div>
));

// Timeline Component
const Timeline = React.memo(({ visits, onViewDetails }) => {
  return (
    <div className="relative">
      <div className="border-l-2 border-gray-300 dark:border-gray-700">
        {visits.map((visit, index) => (
          <div key={visit.id} className="mb-8 ml-4">
            <div className="absolute -left-3.5 mt-1.5 w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center">
              <FiCalendar className="text-xl" />
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-semibold">
                    Visit on {formatDateToDDMMYYYY(visit.visitDate)} at{" "}
                    {visit.visitTime}
                  </h4>
                  <div className="flex items-center mt-1">
                    <StatusBadge status={visit.visitStatus} />
                    <span className="ml-2">{visit.visitReason}</span>
                  </div>
                </div>
                <button
                  onClick={() => onViewDetails(visit)}
                  className="text-blue-500 hover:text-blue-700 font-medium focus:outline-none"
                >
                  View Details
                </button>
              </div>
              {visit.notes && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  <strong>Notes:</strong> {visit.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const PatientDashboardContent = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedMenuItem, setSelectedMenuItem] = useState("dashboard");
  const [doctorId, setDoctorId] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [patientData, setPatientData] = useState({
    name: "",
    age: "",
    gender: "",
    address: "",
    mobileNumber: "",
    email: "",
    disease: "",
    notes: "",
  });
  const [doctorData, setDoctorData] = useState({
    doctorName: "",
    clinicName: "",
    clinicLocation: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [visits, setVisits] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [treatmentStatuses, setTreatmentStatuses] = useState([]);
  const [totalCompletedVisits, setTotalCompletedVisits] = useState(0);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Set the app element for React Modal
  useEffect(() => {
    if (typeof document !== "undefined") {
      const appElement = document.querySelector("#__next") || document.body;
      Modal.setAppElement(appElement);
    }
  }, []);

  // Initialize dark mode based on current class
  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    }
  }, []);

  // Dark Mode Toggle Handler
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return newMode;
    });
  };

  useEffect(() => {
    const fetchPatientAndDoctorData = async () => {
      if (status === "authenticated" && session) {
        // Check if the user has the 'patient' role
        if (session.user.role !== "patient") {
          showToast("Access denied. Patients only.", "error");
          router.push("/patient-login"); // Redirect to login or appropriate page
          return;
        }

        try {
          const userId = session.user.id; // Patient's user ID
          setPatientId(userId); // Set patientId in state
          let fetchedDoctorId = null;

          // Fetch patient data from 'users' collection to get doctorId
          const patientUserDocRef = doc(db, "users", userId);
          const patientUserDoc = await getDoc(patientUserDocRef);

          if (patientUserDoc.exists()) {
            const userData = patientUserDoc.data();
            fetchedDoctorId = userData.doctorId;

            if (fetchedDoctorId) {
              setDoctorId(fetchedDoctorId); // Set doctorId in state

              // Fetch patient data from 'doctors/{doctorId}/patients/{patientId}'
              const patientDocRef = doc(
                db,
                "doctors",
                fetchedDoctorId,
                "patients",
                userId
              );
              const patientDoc = await getDoc(patientDocRef);

              if (patientDoc.exists()) {
                const data = patientDoc.data();
                const decryptedData = {};
                for (const key in data) {
                  // Decrypt only necessary fields
                  if (
                    key !== "treatmentStatus" &&
                    key !== "createdAt" &&
                    key !== "visitTimestamp" &&
                    key !== "visitStatus" &&
                    key !== "visitNumber" &&
                    key !== "missedCount" &&
                    key !== "rescheduledStatus"
                  ) {
                    decryptedData[key] = decryptData(data[key]);
                  } else {
                    decryptedData[key] = data[key];
                  }
                }
                setPatientData({
                  name: decryptedData.name || "",
                  age: decryptedData.age || "",
                  gender: decryptedData.gender || "",
                  address: decryptedData.address || "",
                  mobileNumber: decryptedData.mobileNumber || "",
                  email: decryptedData.email || "",
                  disease: decryptedData.disease || "",
                  notes: decryptedData.notes || "",
                });
              } else {
                showToast("Patient data not found", "error");
              }

              // Fetch doctor's data from 'users' collection
              const doctorDocRef = doc(db, "users", fetchedDoctorId);
              const doctorDoc = await getDoc(doctorDocRef);

              if (doctorDoc.exists()) {
                const data = doctorDoc.data();
                const decryptedData = {};
                for (const key in data) {
                  if (
                    key !== "createdAt" &&
                    key !== "username" &&
                    key !== "password" &&
                    key !== "role"
                  ) {
                    decryptedData[key] = decryptData(data[key]);
                  } else {
                    decryptedData[key] = data[key];
                  }
                }
                setDoctorData({
                  doctorName: decryptedData.doctorName || "",
                  clinicName: decryptedData.clinicName || "",
                  clinicLocation: decryptedData.clinicLocation || "",
                });
              } else {
                showToast("Doctor data not found", "error");
              }

              // Fetch visits data ordered by createdAt descending
              const visitsRef = collection(
                db,
                "doctors",
                fetchedDoctorId,
                "patients",
                userId,
                "visits"
              );
              const visitsSnapshot = await getDocs(
                query(visitsRef, orderBy("createdAt", "desc"))
              );

              const visitsData = visitsSnapshot.docs.map((visitDoc) => {
                const visitData = visitDoc.data();

                // Handle encrypted and plaintext fields
                const decryptedVisit = {
                  id: visitDoc.id,
                  visitDate: visitData.visitDate || "N/A",
                  visitTime: visitData.visitTime || "N/A",
                  visitStatus: visitData.visitStatus
                    ? visitData.visitStatus
                    : "N/A",
                  treatmentStatus: visitData.treatmentStatus
                    ? visitData.treatmentStatus
                    : "N/A",
                  symptoms: decryptData(visitData.symptoms || "N/A"),
                  notes: decryptData(visitData.notes || "N/A"),
                  amountPaid: visitData.amountPaid || "0",
                  totalAmount: visitData.totalAmount || "0",
                  medicines: visitData.medicines
                    ? JSON.parse(decryptData(visitData.medicines))
                    : [],
                  visitNumber: visitData.visitNumber || "N/A",
                  visitReason: visitData.visitReason || "N/A",
                  missedCount: visitData.missedCount || "0",
                  rescheduledStatus: visitData.rescheduledStatus || "",
                  createdAt: visitData.createdAt
                    ? visitData.createdAt.toDate()
                    : null,
                };
                return decryptedVisit;
              });

              setVisits(visitsData);

              // Extract unique treatment statuses
              const uniqueTreatmentStatuses = [
                ...new Set(visitsData.map((visit) => visit.treatmentStatus)),
              ].filter((status) => status && status !== "N/A");

              setTreatmentStatuses(uniqueTreatmentStatuses);

              // Calculate Total Completed Visits
              const completedVisits = visitsData.filter(
                (visit) => visit.visitStatus.toLowerCase() === "completed"
              ).length;

              setTotalCompletedVisits(completedVisits);

              // Find all appointments with status not 'Completed'
              const pendingAppointments = visitsData.filter((visit) => {
                return (
                  visit.visitStatus &&
                  visit.visitStatus.toLowerCase() !== "completed"
                );
              });

              // Sort the pending appointments by date ascending
              pendingAppointments.sort((a, b) => {
                const [dayA, monthA, yearA] = a.visitDate
                  .split("-")
                  .map(Number);
                const [hoursA, minutesA] = a.visitTime.split(":").map(Number);
                const visitDateTimeA = new Date(
                  yearA,
                  monthA - 1,
                  dayA,
                  hoursA,
                  minutesA
                );

                const [dayB, monthB, yearB] = b.visitDate
                  .split("-")
                  .map(Number);
                const [hoursB, minutesB] = b.visitTime.split(":").map(Number);
                const visitDateTimeB = new Date(
                  yearB,
                  monthB - 1,
                  dayB,
                  hoursB,
                  minutesB
                );

                return visitDateTimeA - visitDateTimeB;
              });

              setPendingAppointments(pendingAppointments);
            } else {
              showToast("Doctor ID not found in user data", "error");
            }
          } else {
            showToast("User data not found", "error");
          }

          setIsLoading(false);
        } catch (error) {
          console.error(error);
          showToast(
            "Error fetching your data. Please contact support.",
            "error"
          );
          setIsLoading(false);
        }
      };
    };

    fetchPatientAndDoctorData();
  }, [status, session, router]);

  // Modal functions
  const openModal = (visit) => {
    setSelectedVisit(visit);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedVisit(null);
  };

  // Function to get appointment message based on status
  const getAppointmentMessage = (appointment) => {
    const { visitStatus, visitDate, visitTime, missedCount } = appointment;
    const dateMessage = `on ${formatDateToDDMMYYYY(
      appointment.visitDate
    )} at ${appointment.visitTime}`;
    switch (visitStatus.toLowerCase()) {
      case "upcoming":
        return `Your upcoming appointment is scheduled ${dateMessage}.`;
      case "missed":
        return `You missed your appointment ${dateMessage}. Please contact your doctor to reschedule.`;
      case "rescheduled":
        return `Your appointment has been rescheduled to ${dateMessage}.`;
      case "rescheduled but missed":
        return `You missed your rescheduled appointment ${dateMessage}. Please contact your doctor.`;
      default:
        return `Your appointment is scheduled ${dateMessage}.`;
    }
  };

  // Memoized Components for Performance
  const memoizedTreatmentStatusCards = useMemo(() => {
    return treatmentStatuses.map((status, index) => (
      <TreatmentStatusCard
        key={index}
        status={status}
        icon={
          status.toLowerCase() === "completed" ? (
            <FiCheckCircle />
          ) : status.toLowerCase() === "ongoing" ? (
            <FiClock />
          ) : status.toLowerCase() === "stopped" ? (
            <FaStopCircle />
          ) : status.toLowerCase() === "hold" ? (
            <FiFilter />
          ) : (
            <FiCalendar />
          )
        }
      />
    ));
  }, [treatmentStatuses]);

  if (isLoading) {
    return <MedicalSpinner />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <PatientSidebar
        selectedMenuItem={selectedMenuItem}
        onMenuItemClick={setSelectedMenuItem}
      />

      {/* Main Content */}
      <motion.div
        className="flex-1 overflow-auto ml-0 md:ml-64 transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Conditional Rendering Based on Selected Menu Item */}
        {selectedMenuItem === "dashboard" && (
          <div className="p-6">
            {/* Welcome Banner */}
            <motion.div
              className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-6 rounded-lg shadow-md mb-6 w-full mt-10 sm:mt-0"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold mb-2">
                Welcome, {patientData.name}!
              </h2>
              <p className="text-lg">Managing your health has never been easier.</p>
              {doctorData.doctorName && (
                <p className="mt-2">
                  Your assigned doctor:{" "}
                  <span className="font-semibold">{doctorData.doctorName}</span>
                </p>
              )}
              {doctorData.clinicName && (
                <p className="mt-1">
                  Clinic Name:{" "}
                  <span className="font-semibold">{doctorData.clinicName}</span>
                </p>
              )}
              {doctorData.clinicLocation && (
                <p className="mt-1">
                  Clinic Location:{" "}
                  <span className="font-semibold">{doctorData.clinicLocation}</span>
                </p>
              )}
            </motion.div>

            {/* Treatment Status Section */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Treatment Status
              </h3>
              {treatmentStatuses.length > 0 ? (
                <div className="flex flex-wrap items-center gap-4">
                  {memoizedTreatmentStatusCards}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  No treatment statuses available.
                </p>
              )}
            </motion.div>

            {/* Patient Information Cards */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <InfoCard
                label="Total Completed Visits"
                value={totalCompletedVisits}
                icon={<FiCheckCircle />}
                gradient="from-purple-500 to-pink-500"
              />
              <InfoCard
                label="Name"
                value={patientData.name}
                icon={<FiUser />}
                gradient="from-purple-500 to-pink-500"
              />
              <InfoCard
                label="Age"
                value={patientData.age}
                icon={<FiUser />}
                gradient="from-blue-500 to-green-500"
              />
              <InfoCard
                label="Gender"
                value={patientData.gender}
                icon={<FiUser />}
                gradient="from-red-500 to-yellow-500"
              />
              <InfoCard
                label="Address"
                value={patientData.address}
                icon={<FiMap />}
                gradient="from-teal-500 to-cyan-500"
              />
              <InfoCard
                label="Mobile Number"
                value={patientData.mobileNumber}
                icon={<FiPhone />}
                gradient="from-indigo-500 to-purple-500"
              />
              <InfoCard
                label="Email"
                value={patientData.email}
                icon={<FiMail />}
                gradient="from-orange-500 to-pink-500"
              />
              <InfoCard
                label="Disease/Condition"
                value={patientData.disease}
                icon={<FaFileMedical />}
                gradient="from-green-500 to-lime-500"
              />
              <InfoCard
                label="Notes"
                value={patientData.notes}
                icon={<FaStickyNote />}
                gradient="from-pink-500 to-red-500"
              />
            </motion.div>

            {/* Pending Appointments */}
            <motion.div
              className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h3 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Pending Appointments
              </h3>
              {pendingAppointments && pendingAppointments.length > 0 ? (
                pendingAppointments.map((appointment) => (
                  <motion.div
                    key={appointment.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center text-gray-600 dark:text-gray-300 mb-4 p-4 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <StatusBadge status={appointment.visitStatus} />
                    <p className="ml-0 sm:ml-4 mt-2 sm:mt-0">
                      {getAppointmentMessage(appointment)}
                      {appointment.visitStatus.toLowerCase() ===
                        "rescheduled but missed" && (
                        <span className="ml-2 text-sm text-red-600 dark:text-red-400">
                          (Missed {appointment.missedCount} times)
                        </span>
                      )}
                    </p>
                  </motion.div>
                ))
              ) : (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FiClock className="text-2xl mr-2 animate-pulse" />
                  <p>You have no pending appointments.</p>
                </div>
              )}
            </motion.div>

            {/* Health Records Timeline */}
            <motion.div
              className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <h3 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Health Records
              </h3>
              {visits.length > 0 ? (
                <Timeline visits={visits} onViewDetails={openModal} />
              ) : (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <FaHeart className="text-2xl mr-2 animate-pulse" />
                  <p>Your health records will appear here once available.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Chat Component */}
        {selectedMenuItem === "chat" && (
          <PatientChatComponent />
        )}
      </motion.div>

      {/* Modal for Visit Details */}
      {selectedMenuItem === "dashboard" && (
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          style={customStyles}
          contentLabel="Visit Details"
        >
          {selectedVisit && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  Visit Details
                </h2>
                <button
                  onClick={closeModal}
                  className="text-white bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 rounded-full w-8 h-8 flex items-center justify-center focus:outline-none"
                  aria-label="Close modal"
                >
                  &times;
                </button>
              </div>
              <div className="space-y-4">
                <p className="flex items-center">
                  <FiCalendar className="mr-2 text-blue-500 dark:text-blue-300" />
                  <strong>Date:</strong> {formatDateToDDMMYYYY(selectedVisit.visitDate)}
                </p>
                <p className="flex items-center">
                  <FiClock className="mr-2 text-blue-500 dark:text-blue-300" />
                  <strong>Time:</strong> {selectedVisit.visitTime}
                </p>
                <p>
                  <strong>Visit Number:</strong> {selectedVisit.visitNumber}
                </p>
                <p className="flex items-center">
                  <StatusBadge status={selectedVisit.visitStatus} />
                  <strong className="ml-2">Visit Status:</strong> {selectedVisit.visitStatus}
                </p>
                <p className="flex items-center">
                  <StatusBadge status={selectedVisit.treatmentStatus} />
                  <strong className="ml-2">Treatment Status:</strong> {selectedVisit.treatmentStatus}
                </p>
                {selectedVisit.rescheduledStatus && (
                  <p className="flex items-center">
                    <strong>Rescheduled Status:</strong> {selectedVisit.rescheduledStatus}
                  </p>
                )}
                <p>
                  <strong>Reason for Visit:</strong> {selectedVisit.visitReason}
                </p>
                <p>
                  <strong>Symptoms:</strong> {selectedVisit.symptoms}
                </p>
                <p>
                  <strong>Medicines Prescribed:</strong>
                </p>
                <ul className="list-disc list-inside">
                  {selectedVisit.medicines.map((med, index) => (
                    <li key={index}>
                      {med.name} -{" "}
                      {[
                        med.timings.morning && "Morning",
                        med.timings.afternoon && "Afternoon",
                        med.timings.night && "Night",
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </li>
                  ))}
                </ul>
                <p>
                  <strong>Total Amount:</strong> ₹{selectedVisit.totalAmount}
                </p>
                <p>
                  <strong>Amount Paid:</strong> ₹{selectedVisit.amountPaid}
                </p>
                {selectedVisit.notes && (
                  <p>
                    <strong>Notes:</strong> {selectedVisit.notes}
                  </p>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

// Wrap the content with ProtectedRoute
const PatientDashboardPage = () => {
  return (
    <ProtectedRoute>
      <PatientDashboardContent />
    </ProtectedRoute>
  );
};

export default PatientDashboardPage;
