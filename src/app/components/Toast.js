// src/app/components/Toast.jsx

"use client";

import React from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const showToast = (message, type = "info") => {
  switch (type) {
    case "success":
      toast.success(message, {
        position: toast.POSITION.TOP_RIGHT,
      });
      break;
    case "error":
      toast.error(message, {
        position: toast.POSITION.TOP_RIGHT,
      });
      break;
    case "warning":
      toast.warning(message, {
        position: toast.POSITION.TOP_RIGHT,
      });
      break;
    case "info":
    default:
      toast.info(message, {
        position: toast.POSITION.TOP_RIGHT,
      });
      break;
  }
};

const ToastComponent = () => {
  return <ToastContainer />;
};

export default ToastComponent;
