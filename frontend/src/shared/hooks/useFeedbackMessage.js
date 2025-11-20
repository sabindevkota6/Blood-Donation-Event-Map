/*
 * useFeedbackMessage hook
 * Simple helper for showing transient success/error messages in components.
 * It also auto-scrolls to the top when a message is shown, so users see feedback.
 */
import { useCallback, useEffect, useState } from "react";

const useFeedbackMessage = () => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Auto-scroll when a message is shown so users notice feedback
  useEffect(() => {
    if (error || success) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [error, success]);

  // Show an error and clear any success message
  const showError = useCallback((message) => {
    setError(message);
    setSuccess("");
  }, []);

  // Show success and clear any error message
  const showSuccess = useCallback((message) => {
    setSuccess(message);
    setError("");
  }, []);

  // Clear both messages
  const clearMessages = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  return {
    error,
    success,
    showError,
    showSuccess,
    clearMessages,
  };
};

export default useFeedbackMessage;
