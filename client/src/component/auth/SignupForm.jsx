import React from "react";
import InputField from "../shared/InputField";
import { useUserAuth } from "../../hooks/useUserAuth";
import { ToastContainer } from "react-toastify";

const SingupForm = () => {

  const {
    loading,
    handleSignup,
    userData,
    checkingUsername,
    usernameAvailable,
    handleChange
  } = useUserAuth();

  const handleSumbit = (e) => {
    e.preventDefault();
    if (!usernameAvailable) return; // prevent submission if username is not available
    handleSignup(userData);
  }


  return (
    <form onSubmit={handleSumbit} >
      <InputField
        type='email'
        value={userData.email}
        onChange={handleChange}
        name='email'
        label="Email"
      />

      <div className="relative">
        <InputField
          type='text'
          value={userData.username}
          onChange={handleChange}
          name='username'
          label="Username"
        />

        {checkingUsername && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}

         {/* Checkmark */}
        {!checkingUsername && usernameAvailable && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            ✅
          </div>
        )}

        {/* Cross */}
        {!checkingUsername && usernameAvailable === false && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
            ❌
          </div>
        )}

      </div>


      <InputField
        type='text'
        value={userData.phone}
        onChange={handleChange}
        name='phone'
        label="Phone"
      />

      <InputField
        type='password'
        value={userData.password}
        onChange={handleChange}
        name='password'
        label="Password"
      />

      <div className="ask">
        <p>
          Already have an account?{" "}
          <a href="/login" className="no-underline text-indigo-400 hover:text-red">
            login
          </a>
        </p>
      </div>
      <button className="signup-btn" type="submit" disabled={loading}>
        {loading ? "Signing up..." : "Signup"}
      </button>

      <ToastContainer />
    </form>
  )
}

export default SingupForm;