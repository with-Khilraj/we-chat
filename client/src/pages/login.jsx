import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "react-toastify/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightToBracket } from "@fortawesome/free-solid-svg-icons";
import "../styles/auth.css";
import LoginForm from "../component/auth/LoginForm";

const Login = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, loading, navigate]);

  // const handleLogin = async (e) => {
  //   e.preventDefault();
  //   try {
  //     const response = await api.post(
  //       "/api/users/login",
  //       { email, password },
  //       { withCredentials: true }
  //     );
  //     localStorage.setItem("accessToken", response.data.accessToken);

  //     console.log("Access Token while login:::", response.data.accessToken);

  //     // sucess message using toastify
  //     toast.success("Welcome to we-chat", {
  //       position: "top-center",
  //       autoClose: 2000,
  //     });

  //     setTimeout(() => {
  //       navigate("/dashboard");
  //     }, 2500);
  //   } catch (error) {
  //     // alert( error.response?.data.erorr || "Login failed!" );
  //     toast.error(error.response?.data.error || "Login failed!", {
  //       position: "top-center",
  //       autoClose: 2100,
  //     });
  //   }
  // };

  return (
    <div className="gradient-bg auth-page">
      <div className="login-form">
        <div className="flex flex-col p-6 rounded-2xl items-center form-header">
          <div className="bg-indigo-500 p-4 rounded-full mb-4">
            <FontAwesomeIcon icon={faRightToBracket} className="text-white text-3xl" />
          </div>
          <h2 className="text-black text-xl font-semibold mb-2">Welcome Back!</h2>
          <p className="text-gray-500 text-sm">Please login to continue</p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
};

export default Login;


// const handleLogout = async () => {
//   try {
//     await api.post('/api/logout');
//     localStorage.removeItem('accessToken');
//     alert('Logged out successfully');
//   } catch (error) {
//     console.error(error);
//     alert('Logout failed');
//   }
// };
