import { useState, useEffect } from "react";
import { loginUser, signupUser, checkUsernameAvailability } from "../services/userService";
import { showSuccessToast, showErrorToast } from "../utils/toastConfig";
import { useNavigate } from "react-router-dom";


export const useUserAuth = () => {
  const [loading, setLoading] = useState(false);

  const [userData, setUserData] = useState({
    email: "",
    username: "",
    phone: "",
    password: "",
  });
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
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
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (userData) => {
    setLoading(true);
    try {
      const response = await signupUser(userData);
      showSuccessToast(response.data.message || "Signup successful! Please verify your email.");

      setTimeout(() => {
        navigate("/verify-email");
      }, 2000);
    } catch (error) {
      showErrorToast(error.response?.data.error || "Signup failed!");
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    if (userData.username.trim().length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);

    const checkAvailability = async () => {
      try {
        const available = await checkUsernameAvailability(userData.username);
        setUsernameAvailable(available);
      } catch (error) {
        console.error("Username check failed:", error);
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    };

    const debounce = setTimeout(checkAvailability, 500); // debounce for UX
    return () => clearTimeout(debounce);
  }, [userData.username]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  return { loading, handleLogin, handleSignup, userData, checkingUsername, usernameAvailable, handleChange };

}


