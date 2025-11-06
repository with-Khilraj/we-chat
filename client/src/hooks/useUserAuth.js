import { useState } from "react";
import { loginUser } from "../services/userService";
import { showSuccessToast, showErrorToast } from "../utils/toastConfig";
import { useNavigate } from "react-router-dom";


export const useUserAuth = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


   const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const response = await loginUser(email, password);
      localStorage.setItem("accessToken", response.data.accessToken);

      // sucess message using toastify
      showSuccessToast("Welcome to we-chat");

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error) {
      // alert( error.response?.data.erorr || "Login failed!" );
      showErrorToast(error.response?.data.error || "Login failed!");
    }finally {
      setLoading(false);
    }
  };

  return { loading, handleLogin };
}