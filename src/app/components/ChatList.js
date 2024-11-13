// src/app/components/ChatList.jsx

"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../db";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  getDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { decryptData } from "../../lib/encryption";
import {
  FaUserCircle,
  FaPlay,
  FaPause,
  FaCheck,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const ChatList = ({ doctorId, onSelectChat }) => {
  const [patients, setPatients] = useState([]);
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal] = useState({
    isOpen: false,
    chatId: null,
    patientName: "",
  });

  useEffect(() => {
    // Fetch Patients for Horizontal Scroll
    const fetchPatients = () => {
      const patientsRef = collection(db, "doctors", doctorId, "patients");
      const q = query(patientsRef, orderBy("name", "asc"));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const patientPromises = snapshot.docs.map(async (patientDoc) => {
            const patientData = patientDoc.data();
            const patientId = patientDoc.id;
            const name = decryptData(patientData.name || "Patient");
            const treatmentStatus = patientData.treatmentStatus || "Unknown";

            return {
              id: patientId,
              name,
              treatmentStatus,
            };
          });

          Promise.all(patientPromises)
            .then((patientsData) => {
              setPatients(patientsData);
            })
            .catch((error) => {
              console.error("Error fetching patients data:", error);
              // Implement your toast notification here
            });
        },
        (error) => {
          console.error("Error fetching patients:", error);
          // Implement your toast notification here
        }
      );

      return () => unsubscribe();
    };

    fetchPatients();
  }, [doctorId]);

  useEffect(() => {
    // Fetch Chats for Vertical List
    const fetchChats = () => {
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("doctorId", "==", doctorId),
        orderBy("lastMessageTimestamp", "desc")
      );

      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          const chatPromises = snapshot.docs.map(async (chatDoc) => {
            const chatData = chatDoc.data();
            const patientId = chatData.patientId;

            // Fetch patient data
            const patientDocRef = doc(db, "doctors", doctorId, "patients", patientId);
            const patientDoc = await getDoc(patientDocRef);

            let patientName = "Unknown Patient";
            if (patientDoc.exists()) {
              const data = patientDoc.data();
              patientName = data.name ? decryptData(data.name) : "Patient";
            }

            // Unread messages count from the chat document
            const unreadCounts = chatData.unreadCounts || {};
            const unreadCount = unreadCounts[doctorId] || 0;

            // Only include chats with at least one message
            if (!chatData.lastMessage) return null;

            return {
              id: chatDoc.id,
              patientId,
              patientName,
              lastMessage: decryptData(chatData.lastMessage || ""),
              lastMessageTimestamp: chatData.lastMessageTimestamp,
              unreadCount,
            };
          });

          try {
            const chatsData = await Promise.all(chatPromises);
            // Filter out null entries (chats with no messages)
            setChats(chatsData.filter((chat) => chat !== null));
          } catch (error) {
            console.error("Error fetching chat data:", error);
            // Implement your toast notification here
          }
        },
        (error) => {
          console.error("Error fetching chats:", error);
          // Implement your toast notification here
        }
      );

      return () => unsubscribe();
    };

    fetchChats();
  }, [doctorId]);

  // Filter patients and chats based on search term
  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredChats = chats.filter((chat) =>
    chat.patientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Map treatment status to color
  const statusColorMap = {
    Ongoing: "border-green-500",
    "On Hold": "border-yellow-500",
    Completed: "border-blue-500",
    Canceled: "border-red-500",
    Unknown: "border-gray-500",
  };

  // Map treatment status to icon
  const statusIconMap = {
    Ongoing: <FaPlay className="text-green-500 text-xs" />,
    "On Hold": <FaPause className="text-yellow-500 text-xs" />,
    Completed: <FaCheck className="text-blue-500 text-xs" />,
    Canceled: <FaTimes className="text-red-500 text-xs" />,
    Unknown: null,
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleString(); // Adjust format as needed
  };

  // Handle Delete Chat
  const handleDeleteChat = async (chatId) => {
    try {
      await deleteDoc(doc(db, "chats", chatId));
      // Implement your toast notification here
      setModal({ isOpen: false, chatId: null, patientName: "" });
    } catch (error) {
      console.error("Error deleting chat:", error);
      // Implement your toast notification here
      setModal({ isOpen: false, chatId: null, patientName: "" });
    }
  };

  return (
    <>
      {/* Modal for Delete Confirmation */}
      <AnimatePresence>
        {modal.isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-md"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl font-semibold mb-4">Delete Chat</h2>
              <p className="mb-6">
                Are you sure you want to delete the chat with{" "}
                <span className="font-bold">{modal.patientName}</span>? This action
                cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setModal({ isOpen: false, chatId: null, patientName: "" })}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteChat(modal.chatId)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-lg shadow-md p-4 mt-4 flex flex-col h-full">
        <h2 className="text-2xl font-semibold mb-4">Messages</h2>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search patients or chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
            <FiSearch className="absolute left-3 top-2.5 text-gray-500" />
          </div>
        </div>

        {/* Horizontal Scrollable Patient Avatars */}
        <div className="flex overflow-x-auto space-x-4 pb-4 mb-4 border-b border-gray-200">
          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="flex-shrink-0 flex flex-col items-center cursor-pointer group"
                onClick={() =>
                  onSelectChat({
                    id: `chat_${patient.id}_${doctorId}`,
                    patientId: patient.id,
                    patientName: patient.name,
                  })
                }
              >
                <div
                  className={`w-16 h-16 rounded-full border-4 ${statusColorMap[patient.treatmentStatus]} flex items-center justify-center relative transition-transform transform group-hover:scale-105`}
                >
                  <FaUserCircle className="text-4xl text-gray-500" />
                  {/* Status Icon */}
                  {statusIconMap[patient.treatmentStatus] && (
                    <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 border border-gray-200">
                      {statusIconMap[patient.treatmentStatus]}
                    </div>
                  )}
                </div>
                <span className="mt-2 text-sm text-center w-20 truncate">
                  {patient.name}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No patients found.</p>
          )}
        </div>

        {/* Vertical Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length > 0 ? (
            <ul>
              {filteredChats.map((chat) => (
                <li
                  key={chat.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div
                    className="flex items-center flex-grow cursor-pointer group"
                    onClick={() => onSelectChat(chat)}
                  >
                    <FaUserCircle className="text-3xl text-blue-500 mr-3" />
                    <div className="flex flex-col">
                      <h3 className="text-lg font-medium group-hover:text-blue-600">
                        {chat.patientName}
                      </h3>
                      <p
                        className={`text-sm truncate ${
                          chat.unreadCount > 0
                            ? "font-bold text-black"
                            : "text-gray-600"
                        } group-hover:text-blue-600`}
                      >
                        {chat.lastMessage || "No messages yet."}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center space-x-2">
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering chat selection
                          setModal({
                            isOpen: true,
                            chatId: chat.id,
                            patientName: chat.patientName,
                          });
                        }}
                        className="text-red-500 hover:text-red-700 focus:outline-none"
                        aria-label={`Delete chat with ${chat.patientName}`}
                      >
                        <FaTrash size={16} />
                      </button>
                      {/* Unread Count Badge */}
                      {chat.unreadCount > 0 && (
                        <span className="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimestamp(chat.lastMessageTimestamp)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No chats available.</p>
          )}
        </div>
      </div>
    </>
  );
}; 

export default ChatList;
