"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "../../db"; // Adjust the path as per your project structure
import { useSession } from "next-auth/react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  setDoc,
  getDoc,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
  increment,
} from "firebase/firestore";
import { encryptData, decryptData } from "../../lib/encryption";
import {
  FiSend,
  FiCheckCircle,
  FiCheck,
  FiEdit2,
  FiX,
} from "react-icons/fi";
import { FaUserMd } from "react-icons/fa"; // Ensure FaUserMd exists in react-icons/fa
import { showToast } from "./Toast"; // Ensure Toast component is correctly exported
import { motion } from "framer-motion";

const PatientChatComponent = () => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const messagesEndRef = useRef(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOptions, setDeleteOptions] = useState({});

  const userId = session?.user?.id; // Patient's user ID
  const [doctorId, setDoctorId] = useState(null);
  const [chatId, setChatId] = useState(null);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640); // Adjust breakpoint as needed
    };
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!userId) return; // Ensure userId is available

    const initializeChat = async () => {
      // Fetch doctorId from patient's user data
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        showToast("User data not found.", "error");
        return;
      }
      const userData = userDoc.data();
      const fetchedDoctorId = userData.doctorId;

      if (!fetchedDoctorId) {
        showToast("Doctor not assigned to this patient.", "error");
        return;
      }

      setDoctorId(fetchedDoctorId);

      // Generate chatId based on patientId and doctorId
      const generatedChatId = `chat_${userId}_${fetchedDoctorId}`;
      setChatId(generatedChatId);

      const chatDocRef = doc(db, "chats", generatedChatId);
      const chatDoc = await getDoc(chatDocRef);

      if (!chatDoc.exists()) {
        await setDoc(chatDocRef, {
          participants: [userId, fetchedDoctorId],
          doctorId: fetchedDoctorId,
          patientId: userId,
          lastMessage: "",
          lastMessageTimestamp: null,
          unreadCount: 0,
        });
      }

      // Fetch doctor's name
      const doctorDocRef = doc(db, "users", fetchedDoctorId);
      const doctorDoc = await getDoc(doctorDocRef);
      if (doctorDoc.exists()) {
        const data = doctorDoc.data();
        const decryptedName = data.doctorName
          ? decryptData(data.doctorName)
          : "Doctor";
        setDoctorName(decryptedName);
      } else {
        setDoctorName("Doctor");
      }

      // Real-time listener for messages
      const messagesRef = collection(db, "chats", generatedChatId, "messages");
      const q = query(messagesRef, orderBy("timestamp", "asc"));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const msgs = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              senderId: data.senderId,
              message: data.deleted
                ? data.deletedBy === userId
                  ? "You deleted this message."
                  : `${doctorName} deleted this message.`
                : decryptData(data.message),
              timestamp: data.timestamp,
              read: data.read,
              deleted: data.deleted || false,
              deletedBy: data.deletedBy || null,
              deletedFor: data.deletedFor || {},
            };
          });
          setMessages(msgs);
          scrollToBottom();
        },
        (error) => {
          console.error("Error fetching messages:", error);
          showToast("Error fetching messages.", "error");
        }
      );

      return () => unsubscribe();
    };

    initializeChat();
  }, [userId, doctorName]);

  // Mark messages as read when component mounts or messages update
  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (!chatId || !doctorId) return;

      const messagesRef = collection(db, "chats", chatId, "messages");
      const q = query(
        messagesRef,
        where("read", "==", false),
        where("senderId", "==", doctorId)
      );

      try {
        const snapshot = await getDocs(q);
        if (snapshot.empty) return;

        const batch = writeBatch(db);

        snapshot.docs.forEach((doc) => {
          batch.update(doc.ref, { read: true });
        });

        // Update unreadCount in chat document
        const chatDocRef = doc(db, "chats", chatId);
        batch.set(
          chatDocRef,
          { unreadCount: increment(-snapshot.size) },
          { merge: true }
        );

        await batch.commit();
      } catch (error) {
        console.error("Error updating read status:", error);
        if (error.code === "failed-precondition") {
          console.log(
            "Firestore requires an index for this query. Please create it using the provided link."
          );
          showToast(
            "An error occurred while updating read status. Please check Firestore indexes.",
            "error"
          );
        } else {
          showToast("An error occurred while updating read status.", "error");
        }
      }
    };

    markMessagesAsRead();
  }, [chatId, doctorId, messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;

    const encryptedMessage = encryptData(inputMessage);

    const messageData = {
      senderId: userId,
      message: encryptedMessage,
      timestamp: serverTimestamp(),
      read: false,
    };

    try {
      await addDoc(collection(db, "chats", chatId, "messages"), messageData);

      // Update lastMessage, lastMessageTimestamp
      await setDoc(
        doc(db, "chats", chatId),
        {
          lastMessage: encryptedMessage,
          lastMessageTimestamp: serverTimestamp(),
        },
        { merge: true }
      );

      setInputMessage("");
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
      showToast("Error sending message.", "error");
    }
  };

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedMessages([]);
  };

  const handleSelectMessage = (messageId) => {
    if (selectedMessages.includes(messageId)) {
      setSelectedMessages(selectedMessages.filter((id) => id !== messageId));
    } else {
      setSelectedMessages([...selectedMessages, messageId]);
    }
  };

  const handleDeleteMessages = () => {
    if (selectedMessages.length === 0) {
      showToast("No messages selected.", "info");
      return;
    }

    // Determine if own messages are selected
    const ownMessagesSelected = messages.some(
      (msg) =>
        selectedMessages.includes(msg.id) &&
        msg.senderId === userId &&
        !msg.deleted
    );

    const othersMessagesSelected = messages.some(
      (msg) =>
        selectedMessages.includes(msg.id) &&
        msg.senderId !== userId &&
        !msg.deleted
    );

    setDeleteOptions({
      ownMessagesSelected,
      othersMessagesSelected,
    });

    setShowDeleteModal(true);
  };

  const confirmDeleteMessages = async (deleteForEveryone) => {
    try {
      const batch = writeBatch(db);

      selectedMessages.forEach((messageId) => {
        const message = messages.find((msg) => msg.id === messageId);
        const messageRef = doc(db, "chats", chatId, "messages", messageId);

        if (message.senderId === userId) {
          if (deleteForEveryone) {
            // Delete for everyone
            batch.update(messageRef, {
              deleted: true,
              deletedBy: userId,
            });
          } else {
            // Delete for me (remove from local view)
            batch.update(messageRef, {
              [`deletedFor.${userId}`]: true,
            });
          }
        } else {
          // Others' messages can only be deleted for self
          batch.update(messageRef, {
            [`deletedFor.${userId}`]: true,
          });
        }
      });

      await batch.commit();

      showToast("Messages deleted.", "success");
      setSelectMode(false);
      setSelectedMessages([]);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting messages:", error);
      showToast("Error deleting messages.", "error");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleString();
  };

  return (
    <>
      <div
        className={`flex flex-col h-screen ${
          isMobile ? "mt-16" : "mt-4"
        } px-4 md:px-8 lg:px-16 xl:px-32`} // Adjust padding for different screen sizes
      >
        {/* Header */}
        <div className="flex items-center p-4 bg-white shadow rounded-lg mb-4">
          <FaUserMd className="text-2xl text-teal-500 mr-2" />
          <h2 className="text-xl font-bold text-black">
            Chat with {doctorName || "Loading..."}
          </h2>
          <button
            onClick={toggleSelectMode}
            className="ml-auto text-teal-500 hover:text-teal-700 focus:outline-none"
            aria-label="Select Messages"
          >
            {selectMode ? <FiX className="h-5 w-5" /> : <FiEdit2 className="h-5 w-5" />}
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100 space-y-4 rounded-lg">
          {messages.length > 0 ? (
            messages.map((msg) => {
              // Check if message is deleted for this user
              const isDeletedForUser = msg.deletedFor?.[userId];
              if (isDeletedForUser) return null;

              const isOwnMessage = msg.senderId === userId;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`relative max-w-lg ${
                      selectedMessages.includes(msg.id)
                        ? "border-2 border-green-500 rounded-lg"
                        : ""
                    }`}
                    onClick={() => {
                      if (selectMode) {
                        handleSelectMessage(msg.id);
                      }
                    }}
                  >
                    {/* Selection Checkbox */}
                    {selectMode && (
                      <input
                        type="checkbox"
                        className="absolute -top-2 -left-6 h-4 w-4"
                        checked={selectedMessages.includes(msg.id)}
                        onChange={() => handleSelectMessage(msg.id)}
                        aria-label={`Select message ${msg.id}`}
                      />
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`p-4 rounded-lg shadow-md ${
                        isOwnMessage
                          ? "bg-gradient-to-r from-teal-200 via-teal-300 to-teal-400 text-black font-bold"
                          : "bg-gradient-to-r from-blue-200 via-blue-300 to-blue-400 text-black font-bold"
                      } ${msg.deleted ? "italic text-gray-500" : ""}`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-black font-bold">
                          {formatTimestamp(msg.timestamp)}
                        </span>
                        {isOwnMessage && (
                          <span
                            className={`text-xs flex items-center text-green-700`}
                          >
                            {msg.read ? (
                              <>
                                <FiCheckCircle className="inline mr-1" /> Read
                              </>
                            ) : (
                              <>
                                <FiCheck className="inline mr-1" /> Sent
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Message Tail */}
                    <div
                      className={`absolute w-0 h-0 border-t-8 border-b-8 ${
                        isOwnMessage
                          ? "border-l-8 border-l-teal-400 border-t-transparent border-b-transparent right-0"
                          : "border-r-8 border-r-blue-400 border-t-transparent border-b-transparent left-0"
                      }`}
                      style={{ top: "10px" }}
                    ></div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No messages yet.</p>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {!selectMode ? (
          <div className="p-4 bg-white shadow rounded-lg mt-4">
            <div className="flex items-center">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-full p-3 mr-2 focus:outline-none focus:ring-2 focus:ring-teal-300"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
              />
              <button
                onClick={handleSendMessage}
                className="bg-teal-500 text-white rounded-full p-3 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-300"
                aria-label="Send Message"
              >
                <FiSend size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white shadow rounded-lg mt-4 flex justify-between items-center">
            <p className="text-gray-700">{selectedMessages.length} selected</p>
            <button
              onClick={handleDeleteMessages}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
              aria-label="Delete Messages"
            >
              Delete
            </button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <motion.div
              className="bg-white rounded-lg p-6 w-11/12 max-w-md shadow-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold mb-4">Delete Messages</h2>
              {deleteOptions.ownMessagesSelected && !deleteOptions.othersMessagesSelected && (
                <>
                  <p>
                    You have selected your own messages. Would you like to delete them
                    for everyone or just for yourself?
                  </p>
                  <div className="flex justify-end mt-6 space-x-4">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => confirmDeleteMessages(false)}
                      className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                    >
                      Delete for me
                    </button>
                    <button
                      onClick={() => confirmDeleteMessages(true)}
                      className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                    >
                      Delete for everyone
                    </button>
                  </div>
                </>
              )}

              {deleteOptions.othersMessagesSelected && !deleteOptions.ownMessagesSelected && (
                <>
                  <p>You can only delete others' messages for yourself.</p>
                  <div className="flex justify-end mt-6 space-x-4">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => confirmDeleteMessages(false)}
                      className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                    >
                      Delete for me
                    </button>
                  </div>
                </>
              )}

              {deleteOptions.ownMessagesSelected && deleteOptions.othersMessagesSelected && (
                <>
                  <p>
                    You have selected your own messages and others' messages.
                    <br />
                    You can delete your own messages for everyone or just for yourself.
                    Others' messages can only be deleted for yourself.
                  </p>
                  <div className="flex justify-end mt-6 space-x-4">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => confirmDeleteMessages(false)}
                      className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                    >
                      Delete for me
                    </button>
                    <button
                      onClick={() => confirmDeleteMessages(true)}
                      className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                    >
                      Delete for everyone
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
};

export default PatientChatComponent;
