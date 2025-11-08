import React from "react";
import Button from "./shared/Button";
import InputField from "../forgotPassword/shared/InputField";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faKey } from "@fortawesome/free-solid-svg-icons";
import ErrorMessage from "./ErrorMessage";
import useForgotPassword from "../../hooks/useForgotPassword";

const ForgotPassForm = () => {
  const {
    loading,
    successMsg,
    errorMsg,
    handleForgotPassword,
    resetState
  } = useForgotPassword();

  const [email, setEmail] = React.useState("");
  const [fieldError, setFieldError] = React.useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setFieldError("Email is required");
      return;
    };
    setFieldError("");
    await handleForgotPassword(email);
  };

  if (successMsg) return null;

  return (
    <div>
      <div className="mb-8 animate-fade-in">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 rounded-2xl inline-block mb-4">
          <FontAwesomeIcon icon={faKey} className="text-white text-3xl" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
        <p className="text-white text-opacity-70">No worries, we'll send you reset instructions</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <InputField
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError}
        />

        {errorMsg && <ErrorMessage message={errorMsg} onClose={resetState} />}
        <Button type="submit" className="btn-primary w-full py-3 rounded-xl text-white font-medium" disabled={loading}>
          {loading
            ? <FontAwesomeIcon icon={faSpinner} />
            : "Send Reset Instruction"
          }
        </Button>
      </form>
    </div>

  );
};

export default ForgotPassForm;