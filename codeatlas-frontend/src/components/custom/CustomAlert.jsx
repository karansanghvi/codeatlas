import React, { useEffect } from "react";

const CustomAlert = ({ message, type = "info", onClose }) => {
  const bgColors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  useEffect(() => {
    if (!message) return; 
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-5 right-5 z-50">
      <div
        className={`p-4 rounded-xl shadow-lg text-white flex items-center justify-between w-80 ${bgColors[type]}`}
      >
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-4 px-2 py-1 bg-white text-black rounded-lg"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default CustomAlert;
