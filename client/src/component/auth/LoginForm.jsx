import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useUserAuth } from "../../hooks/useUserAuth";
import { ToastContainer } from "react-toastify";
import InputField from "./shared/InputField";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { loading, handleLogin } = useUserAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(email, password);
  }

  return (
    <form onSubmit={handleSubmit}>
      <InputField
        type='email'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        name='email'
        label="Email"
      />

      <InputField
        type='password'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        name='password'
        label="Password"
      />

      <div className="flex justify-between items-center text-sm ask">
        <p>
          Don’t have an account?{" "}
          <Link to="/signup" className="no-underline text-indigo-400 hover:text-red">
            Signup
          </Link>
        </p>
        <Link to="/forgot-password" className="no-underline text-indigo-400 hover:underline">
          Forgot password?
        </Link>
      </div>

      <button className="login-btn" type="submit" disabled={loading}>
        {loading
          ? <FontAwesomeIcon icon={faSpinner} className="fas fa-spinner animate-spin ml-2" />
          : "Login"
        }
      </button>

      <ToastContainer />
    </form>
  );
};


export default LoginForm;