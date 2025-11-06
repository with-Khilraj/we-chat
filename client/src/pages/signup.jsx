import React from "react";
import "react-toastify/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUnlockAlt } from "@fortawesome/free-solid-svg-icons";
import "../styles/auth.css";
import SingupForm from "../component/auth/SignupForm";

const Signup = () => {

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   try {
  //     const response = await api.post("http://localhost:5000/api/users/signup", formData);

  //     // show success message using toastify
  //     toast.success(response.data.message, {
  //       position: "top-center",
  //       autoClose: 1800, // 1.8 sec
  //     });

  //     // Redirect to email verify after 1.9 second
  //     setTimeout(() => {
  //       navigate("/verify-email", { state: { email: formData.email } });
  //     }, 1900);
  //   } catch (error) {
  //     console.error("Signup error:", error);
  //     toast.error(error.response.data.error || "Something went wrong", {
  //       position: "top-right",
  //       autoClose: 3000,
  //     });
  //   }
  // };

  return (
    <div className="gradient-bg auth-page">
      <div className="glass-card signup-form">
        <div className="flex flex-col p-6 rounded-2xl items-center form-header">
          <div className="bg-indigo-500 p-4 rounded-full mb-4">
            <FontAwesomeIcon icon={faUnlockAlt} className="text-white text-3xl" />
          </div>
          <h2 className="text-black text-xl font-semibold mb-2">Create Your Account</h2>
          <p className="text-gray-500 text-sm">Join us and get Started today</p>
        </div>

        <SingupForm />
      </div>
    </div>
  );
};

export default Signup;
