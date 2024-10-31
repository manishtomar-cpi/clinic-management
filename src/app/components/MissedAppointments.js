
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../db";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useSession } from "next-auth/react";
import { decryptData } from "../../lib/encryption";
import { FiAlertCircle } from "react-icons/fi";
import { BsSearch } from "react-icons/bs";
import { motion } from "framer-motion";
import { showToast } from "./Toast";

const MissedAppointments = () => {
  const { data: session } = useSession();
  const [allAppointments, setAllAppointments] = useState([]);
  const [patientsMap, setPatientsMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("Today"); // Default to 'Today'
  const [searchTerm, setSearchTerm] = useState("");
  const [activeRescheduleId, setActiveRescheduleId] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Helper function to format dates from 'dd-mm-yyyy' to 'dd-mm-yyyy' (for display)
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return "N/A";
    const [day, month, year] = dateStr.split("-").map(Number);
    return `${day}-${month}-${year}`;
  };

  // Helper function to format dates from Date object to 'dd-mm-yyyy' for storage
  const formatDateForStorage = (dateObj) => {
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const yyyy = String(dateObj.getFullYear());
    return `${dd}-${mm}-${yyyy}`;
  };

  // Helper function to categorize appointments based on visitDate
  const categorizeAppointment = (appointment) => {
    const { visitDate } = appointment;
    if (!visitDate) return "All";

    const now = new Date();
    const [day, month, year] = visitDate.split("-").map(Number);
    const visitDateObj = new Date(year, month - 1, day);

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const appointmentDateOnly = new Date(
      visitDateObj.getFullYear(),
      visitDateObj.getMonth(),
      visitDateObj.getDate()
    );

    if (appointmentDateOnly.toDateString() === today.toDateString()) {
      return "Today";
    }

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as first day

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

    if (appointmentDateOnly >= startOfWeek && appointmentDateOnly <= endOfWeek) {
      return "This Week";
    }

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    if (appointmentDateOnly >= startOfMonth && appointmentDateOnly <= endOfMonth) {
      return "This Month";
    }

    return "All";
  };

  // Function to determine if an appointment is missed based on visitStatus
  const isMissedAppointment = (appointment) => {
    const { visitStatus } = appointment;
    const status = visitStatus.toLowerCase();
    return status === "missed" || status === "rescheduled but missed";
  };

  // Filter appointments based on selected filter and search term
  const filteredAppointments = useMemo(() => {
    return allAppointments.filter((appointment) => {
      const category = categorizeAppointment(appointment);
      const matchesFilter =
        selectedFilter === "All" || category === selectedFilter;
      const matchesSearch = appointment.patientName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch && isMissedAppointment(appointment);
    });
  }, [allAppointments, selectedFilter, searchTerm]);

  // Handle automatic status updates
  useEffect(() => {
    const checkMissedAppointments = async () => {
      const now = new Date();
      for (const appointment of allAppointments) {
        const { visitDate, visitTime, visitStatus } = appointment;

        let scheduledDateTime;
        if (
          visitStatus.toLowerCase() === "upcoming" ||
          visitStatus.toLowerCase() === "rescheduled"
        ) {
          const [day, month, year] = visitDate.split("-").map(Number);
          const [hours, minutes] = visitTime.split(":").map(Number);
          scheduledDateTime = new Date(year, month - 1, day, hours, minutes);
        } else {
          continue; // Skip other statuses
        }

        if (scheduledDateTime < now) {
          let newStatus = "";
          let updateFields = {};

          if (visitStatus.toLowerCase() === "upcoming") {
            newStatus = "Missed";
            updateFields = {
              visitStatus: newStatus,
              missedCount: (appointment.missedCount || 0) + 1,
            };
          } else if (visitStatus.toLowerCase() === "rescheduled") {
            newStatus = "Rescheduled but Missed";
            updateFields = {
              visitStatus: newStatus,
              missedCount: (appointment.missedCount || 0) + 1,
              rescheduledButMissed: true,
            };
          }

          if (newStatus) {
            try {
              const doctorId = session.user.id;
              const visitRef = doc(
                db,
                "doctors",
                doctorId,
                "patients",
                appointment.patientId,
                "visits",
                appointment.id
              );

              await updateDoc(visitRef, updateFields);

              // Update state locally
              setAllAppointments((prevAppointments) =>
                prevAppointments.map((appt) =>
                  appt.id === appointment.id
                    ? { ...appt, ...updateFields }
                    : appt
                )
              );

              showToast(
                `Appointment for ${appointment.patientName} marked as ${newStatus}.`,
                "info"
              );
            } catch (error) {
              console.error("Error updating appointment status:", error);
              showToast("Error updating appointment status.", "error");
            }
          }
        }
      }
    };

    if (
      allAppointments.length > 0 &&
      session &&
      session.user &&
      session.user.id
    ) {
      checkMissedAppointments();
      const intervalId = setInterval(checkMissedAppointments, 60000); // Check every minute
      return () => clearInterval(intervalId);
    }
  }, [allAppointments, session]);

  // Fetch patients and their appointments
  useEffect(() => {
    if (!session || !session.user || !session.user.id) {
      console.log("No valid session found.");
      return;
    }

    const doctorId = session.user.id;
    const patientsRef = collection(db, "doctors", doctorId, "patients");

    const unsubscribePatients = onSnapshot(patientsRef, (patientsSnapshot) => {
      const patientData = {};
      patientsSnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const decryptedName = data.name ? decryptData(data.name) : "Unknown";
        const decryptedAddress = data.address ? decryptData(data.address) : "N/A";
        const decryptedMobileNumber = data.mobileNumber
          ? decryptData(data.mobileNumber)
          : "N/A";
        const decryptedDisease = data.disease ? decryptData(data.disease) : "N/A";
        patientData[docSnap.id] = {
          name: decryptedName,
          address: decryptedAddress,
          mobileNumber: decryptedMobileNumber,
          disease: decryptedDisease,
        };
      });
      setPatientsMap(patientData);

      const patientIds = patientsSnapshot.docs.map((docSnap) => docSnap.id);
      setAllAppointments([]); // Reset appointments

      patientIds.forEach((patientId) => {
        const visitsRef = collection(
          db,
          "doctors",
          doctorId,
          "patients",
          patientId,
          "visits"
        );

        onSnapshot(visitsRef, (visitsSnapshot) => {
          const visits = visitsSnapshot.docs.map((visitDoc) => {
            const data = visitDoc.data();
            return {
              id: visitDoc.id,
              patientId,
              ...data,
              patientName: patientData[patientId]?.name || "Unknown",
              address: patientData[patientId]?.address || "N/A",
              mobileNumber: patientData[patientId]?.mobileNumber || "N/A",
              disease: patientData[patientId]?.disease || "N/A",
            };
          });

          setAllAppointments((prevAppointments) => {
            // Remove previous appointments of this patient
            const filteredPrev = prevAppointments.filter(
              (appt) => appt.patientId !== patientId
            );
            // Add updated visits
            return [...filteredPrev, ...visits];
          });
        });
      });
    });

    return () => {
      unsubscribePatients();
    };
  }, [session]);

  // Handle reschedule button click
  const handleRescheduleClick = (appointment) => {
    setActiveRescheduleId(appointment.id);
    setNewDate("");
    setNewTime("");
    setErrorMessage("");
  };

  // Handle reschedule form submission
  const handleRescheduleSubmit = async (appointment) => {
    if (!newDate) {
      setErrorMessage("Please select a new date.");
      return;
    }

    if (!newTime) {
      setErrorMessage("Please select a new time.");
      return;
    }

    try {
      setIsLoading(true);
      const doctorId = session.user.id;
      const patientId = appointment.patientId;
      const visitRef = doc(
        db,
        "doctors",
        doctorId,
        "patients",
        patientId,
        "visits",
        appointment.id
      );

      const newDateObj = new Date(newDate);
      const [resHours, resMinutes] = newTime.split(":").map(Number);
      newDateObj.setHours(resHours, resMinutes);

      const formattedDate = formatDateForStorage(newDateObj);
      const formattedTime = newTime;

      const updateObj = {
        visitDate: formattedDate,
        visitTime: formattedTime,
        visitStatus: "Rescheduled",
        rescheduled: true,
        rescheduledButMissed: false,
      };

      await updateDoc(visitRef, updateObj);

      showToast("Appointment rescheduled successfully!", "success");

      // Update state locally
      setAllAppointments((prev) =>
        prev.map((appt) =>
          appt.id === appointment.id
            ? {
                ...appt,
                visitDate: formattedDate,
                visitTime: formattedTime,
                visitStatus: "Rescheduled",
                rescheduled: true,
                rescheduledButMissed: false,
              }
            : appt
        )
      );

      // Reset reschedule state
      setActiveRescheduleId(null);
      setNewDate("");
      setNewTime("");
      setErrorMessage("");
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      showToast("Error rescheduling appointment. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const getFilterCategories = () => ["Today", "This Week", "This Month", "All"];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <FiAlertCircle className="text-3xl text-red-500 mr-2" />
        <h2 className="text-2xl font-bold">Missed Appointments</h2>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search appointments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="Search Missed Appointments"
        />
        <BsSearch className="absolute left-4 top-3 text-gray-400" />
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {getFilterCategories().map((filter) => (
          <button
            key={filter}
            onClick={() => setSelectedFilter(filter)}
            className={`px-4 py-2 rounded-xl transition-colors duration-300 ${
              selectedFilter === filter
                ? "bg-red-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            aria-label={`Filter appointments by ${filter}`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Appointments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => {
            const {
              patientName,
              address,
              mobileNumber,
              disease,
              visitDate,
              visitTime,
              visitStatus,
              missedCount = 0,
              rescheduled,
              rescheduledButMissed,
            } = appointment;

            // Determine badge color and text based on status
            let badge = { text: "", color: "" };
            switch (visitStatus.toLowerCase()) {
              case "completed":
                badge = { text: "Completed", color: "bg-green-500" };
                break;
              case "missed":
                badge = { text: "Missed", color: "bg-red-500" };
                break;
              case "rescheduled":
                badge = { text: "Rescheduled", color: "bg-teal-500" };
                break;
              case "rescheduled but missed":
                badge = { text: "Rescheduled but Missed", color: "bg-red-700" };
                break;
              case "upcoming":
                badge = {
                  text: "Upcoming",
                  color: "bg-yellow-200 text-yellow-800",
                };
                break;
              default:
                badge = { text: "Pending", color: "bg-gray-500" };
                break;
            }

            return (
              <motion.div
                key={appointment.id}
                className="bg-gradient-to-r from-red-100 to-red-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* Appointment Status Badge */}
                {badge.text && (
                  <span
                    className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded ${badge.color}`}
                  >
                    {badge.text}
                  </span>
                )}

                {/* Appointment Details */}
                <h3 className="text-xl font-semibold mb-2">{patientName}</h3>
                <p>
                  <strong>Address:</strong> {address}
                </p>
                <p>
                  <strong>Mobile:</strong> {mobileNumber}
                </p>
                <p>
                  <strong>Disease:</strong> {disease}
                </p>
                <p>
                  <strong>Visit Date:</strong> {formatDateForDisplay(visitDate)}
                </p>
                <p>
                  <strong>Visit Time:</strong> {visitTime || "N/A"}
                </p>
                <p>
                  <strong>Missed Count:</strong> {missedCount}
                </p>

                {/* Conditional Message */}
                {(visitStatus.toLowerCase() === "missed" ||
                  visitStatus.toLowerCase() === "rescheduled but missed") && (
                  <p className="mt-2 text-red-700">
                    This visit is <strong>{visitStatus}</strong>. Please reschedule it.
                  </p>
                )}

                {/* Reschedule Button */}
                <button
                  onClick={() => handleRescheduleClick(appointment)}
                  className={`mt-4 w-full bg-teal-500 text-white py-2 px-4 rounded hover:bg-teal-600 transition-colors`}
                >
                  Reschedule
                </button>

                {/* Inline Reschedule Form */}
                {activeRescheduleId === appointment.id && (
                  <div className="mt-4 p-4 bg-white rounded shadow">
                    <h4 className="text-lg font-semibold mb-2">
                      Reschedule Appointment
                    </h4>

                    {/* Error Message */}
                    {errorMessage && (
                      <p className="mb-4 text-red-600">{errorMessage}</p>
                    )}

                    {/* New Date Input */}
                    <div className="mb-4">
                      <label className="block text-gray-700 font-medium mb-1">
                        New Date
                      </label>
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => {
                          setNewDate(e.target.value);
                          setErrorMessage("");
                        }}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-400"
                        aria-label="New Date"
                      />
                    </div>

                    {/* New Time Input - Only show if New Date is selected */}
                    {newDate && (
                      <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-1">
                          New Time
                        </label>
                        <input
                          type="time"
                          value={newTime}
                          onChange={(e) => {
                            setNewTime(e.target.value);
                            setErrorMessage("");
                          }}
                          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-400"
                          aria-label="New Time"
                        />
                      </div>
                    )}

                    {/* Reschedule Button */}
                    <div className="flex flex-col sm:flex-row sm:justify-end sm:gap-2 mt-4">
                      <button
                        onClick={() => {
                          setActiveRescheduleId(null);
                          setNewDate("");
                          setNewTime("");
                          setErrorMessage("");
                        }}
                        className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors mb-2 sm:mb-0"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleRescheduleSubmit(appointment)}
                        className={`bg-teal-500 text-white py-2 px-4 rounded hover:bg-teal-600 transition-colors ${
                          (!newDate || !newTime) &&
                          "opacity-50 cursor-not-allowed"
                        }`}
                        disabled={!newDate || !newTime || isLoading}
                      >
                        {isLoading ? "Rescheduling..." : "Reschedule"}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        ) : (
          <p className="col-span-full text-center text-gray-500">
            No missed appointments found.
          </p>
        )}
      </div>
    </div>
  );
};

export default MissedAppointments;
