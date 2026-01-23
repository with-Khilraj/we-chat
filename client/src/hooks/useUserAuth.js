import { useState, useEffect } from "react";
import { loginUser, signupUser, checkUsernameAvailability } from "../services/userService";
import { showSuccessToast, showErrorToast } from "../utils/toastConfig";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


export const useUserAuth = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [shouldNavigate, setShouldNavigate] = useState(null);

  const [userData, setUserData] = useState({
    email: "",
    username: "",
    phone: "",
    password: "",
  });
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (shouldNavigate) {
      const timer = setTimeout(() => {
        navigate(shouldNavigate.path, shouldNavigate.state);
        setShouldNavigate(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [shouldNavigate, navigate]);

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const response = await loginUser(email, password);
      // localStorage.setItem("accessToken", response.data.accessToken);
      await login(response.data.accessToken);

      // sucess message using toastify
      showSuccessToast("Welcome to we-chat");
      setShouldNavigate({ path: "/dashboard", state: {} });
    } catch (error) {
      if (error.response?.data?.isUnverified) {
        showErrorToast("Your account is not verified. Redirecting...");
        setShouldNavigate({
          path: "/verify-email",
          state: { state: { email: error.response.data.email } }
        });
      } else {
        showErrorToast(error.response?.data.error || "Login failed!");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (userData) => {
    setLoading(true);
    try {
      const response = await signupUser(userData);
      showSuccessToast(response.data.message || "Signup successful! Please verify your email.");

      setShouldNavigate({
        path: "/verify-email",
        state: { state: { email: userData.email } }
      });
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


