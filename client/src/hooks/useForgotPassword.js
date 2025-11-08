import { useState } from "react";
import { publicApi } from "../Api";

const useForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submtiEmail, setSubmitEmail] = useState('');
  
  const handleForgotPassword = async (email) => {
    setLoading(true);
    setError("");
    setSuccessMessage('');

    try {
      const response = await publicApi.post('/api/users/forgot-password', { email });
      setSuccessMessage(response.data.message);
      setSubmitEmail(email);
    } catch (error) {
      setError(error.response?.data?.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const resetState = () => {
    setError("");
    setSuccessMessage("");
    setLoading(false);
  }

  return {
    loading,
    error,
    successMessage,
    submtiEmail,
    handleForgotPassword,
    resetState
  };
}

export default useForgotPassword;