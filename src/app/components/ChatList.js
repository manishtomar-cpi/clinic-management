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
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { decryptData } from "../../lib/encryption";
import { FaUserCircle } from "react-icons/fa";
import { FiTrash2 } from "react-icons/fi";
import { format } from "date-fns";
import { showToast } from "./Toast";
import { motion } from "framer-motion";

const ChatList = ({ doctorId, onSelectChat }) => {
  const [chats, setChats] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  useEffect(() => {
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

            // Fetch patient data from doctors/{doctorId}/patients/{patientId}
            const patientDocRef = doc(
              db,
              "doctors",
              doctorId,
              "patients",
              patientId
            );
            const patientDoc = await getDoc(patientDocRef);

            let patientName = "Unknown Patient";
            if (patientDoc.exists()) {
              const data = patientDoc.data();
              patientName = data.name ? decryptData(data.name) : "Patient";
            }

            // Unread messages count from the chat document
            const unreadCount = chatData.unreadCount || 0;

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
            setChats(chatsData);
          } catch (error) {
            console.error("Error fetching chat data:", error);
            showToast("Error fetching chat data.", "error");
          }
        },
        (error) => {
          console.error("Error fetching chats:", error);
          showToast("Error fetching chats.", "error");
        }
      );

      return () => unsubscribe();
    };

    fetchChats();
  }, [doctorId]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return format(date, "PPpp"); // Example: Jan 1, 2024, 12:00 PM
  };

  const openModal = (chat) => {
    setChatToDelete(chat);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setChatToDelete(null);
    setIsModalOpen(false);
  };

  const handleDeleteChat = async () => {
    if (!chatToDelete) return;

    try {
      const chatId = chatToDelete.id;

      // Delete all messages in the chat
      const messagesRef = collection(db, "chats", chatId, "messages");
      const messagesSnapshot = await getDocs(messagesRef);
      const batch = writeBatch(db);

      messagesSnapshot.docs.forEach((docSnap) => {
        batch.delete(doc(db, "chats", chatId, "messages", docSnap.id));
      });

      // Delete the chat document
      batch.delete(doc(db, "chats", chatId));

      await batch.commit();

      showToast("Chat deleted successfully.", "success");
      closeModal();
    } catch (error) {
      console.error("Error deleting chat:", error);
      showToast("Error deleting chat.", "error");
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-4 mt-4">
        <h2 className="text-2xl font-semibold mb-4">Messages</h2>
        {chats.length > 0 ? (
          <ul>
            {chats.map((chat) => (
              <li
                key={chat.id}
                className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg"
              >
                <div
                  className="flex items-center flex-grow cursor-pointer"
                  onClick={() => onSelectChat(chat)}
                >
                  <FaUserCircle className="text-3xl text-blue-500 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium">{chat.patientName}</h3>
                    <p className="text-sm text-gray-600 truncate">
                      {chat.lastMessage || "No messages yet."}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {chat.unreadCount > 0 && (
                    <span className="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {chat.unreadCount}
                    </span>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimestamp(chat.lastMessageTimestamp)}
                  </p>
                </div>
                {/* Delete Button */}
                <button
                  onClick={() => openModal(chat)}
                  className="ml-2 text-red-500 hover:text-red-700 focus:outline-none"
                  aria-label="Delete Chat"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No chats available.</p>
        )}
      </div>

      {/* Modal for Delete Confirmation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <motion.div
            className="bg-white rounded-lg p-6 w-11/12 max-w-md shadow-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-semibold mb-4">Delete Chat</h2>
            <p>
              Are you sure you want to delete the chat with{" "}
              <strong>{chatToDelete?.patientName}</strong>?
            </p>
            <div className="flex justify-end mt-6">
              <button
                onClick={closeModal}
                className="mr-4 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChat}
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 focus:outline-none"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default ChatList;
