import React, { useState } from "react";
import { useUserAuth } from "../../hooks/useUserAuth";
import { ToastContainer } from "react-toastify";
import InputField from "./shared/InputField";

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
          <a href="/signup" className="no-underline text-indigo-400 hover:text-red">
            Signup
          </a>
        </p>
        <a href="/forgot-password" className="no-underline text-indigo-400 hover:underline">
          Forgot password?
        </a>
      </div>

      <button className="login-btn" type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>

      <ToastContainer />
    </form>
  );
};


export default LoginForm;