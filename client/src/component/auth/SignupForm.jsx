import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "./shared/InputField";
import { useUserAuth } from "../../hooks/useUserAuth";
import { ToastContainer } from "react-toastify";
import { checkUsernameAvailability } from "../../services/userService";
import { signupSchema } from "../../schemas/authSchema";

const SignupForm = () => {
  const { register, handleSubmit, watch, setError, clearErrors, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(signupSchema),
    mode: "onChange" // Validate on change for immediate feedback
  });

  const { loading, handleSignup } = useUserAuth();
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Watch username for availability check
  const usernameValue = watch("username");

  useEffect(() => {
    const checkAvailability = async () => {
      if (usernameValue && usernameValue.length >= 3) {
        setCheckingUsername(true);
        try {
          // Add a small delay for debounce-like effect
          await new Promise(resolve => setTimeout(resolve, 500));
          const isAvailable = await checkUsernameAvailability(usernameValue);
          setUsernameAvailable(isAvailable);
          if (!isAvailable) {
            setError("username", {
              type: "manual",
              message: "Username is already taken",
            });
          } else {
            clearErrors("username");
          }
        } catch (error) {
          console.error("Failed to check username", error);
        } finally {
          setCheckingUsername(false);
        }
      } else {
        setUsernameAvailable(null);
        clearErrors("username"); // Clear error if username is too short or empty
      }
    };

    const timer = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timer);
  }, [usernameValue, setError, clearErrors]);

  const onSubmit = async (data) => {
    if (usernameAvailable === false) return;
    await handleSignup(data);
  };

  return (
    <div className="form-container sign-up">
      <ToastContainer />
      <form onSubmit={handleSubmit(onSubmit)}>

        <InputField
          type="text"
          placeholder="Username"
          {...register("username")}
          error={errors.username?.message}
          helperText={checkingUsername ? "Checking availability..." : (usernameAvailable === true ? "Username available!" : null)}
          helperClass={checkingUsername ? "text-gray-500" : "text-green-500"}
        />

        <InputField
          type="email"
          placeholder="Email"
          {...register("email")}
          error={errors.email?.message}
        />

        <InputField
          type="tel"
          placeholder="Phone Number"
          {...register("phone")}
          error={errors.phone?.message}
        />

        <InputField
          type="password"
          placeholder="Password"
          {...register("password")}
          error={errors.password?.message}
        />

        <button className="signup-btn" type="submit" disabled={loading || !isValid || usernameAvailable === false}>
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
      <div className="ask">
        <p>
          Already have an account?{" "}
          <Link to="/login" className="no-underline text-indigo-400 hover:text-red">
            login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupForm;
