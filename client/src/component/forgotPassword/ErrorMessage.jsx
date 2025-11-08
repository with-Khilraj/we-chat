import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

const ErrorMessage = ({ message }) => {
  return (
    <div className="p-4 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded-xl flex items-center gap-3">
      <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400" />
      <span className="text-red-200 text-sm">{message}</span>
    </div>
  )
}

export default ErrorMessage;