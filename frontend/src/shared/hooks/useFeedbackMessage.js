import { useCallback, useEffect, useState } from 'react';

const useFeedbackMessage = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (error || success) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error, success]);

  const showError = useCallback((message) => {
    setError(message);
    setSuccess('');
  }, []);

  const showSuccess = useCallback((message) => {
    setSuccess(message);
    setError('');
  }, []);

  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
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

