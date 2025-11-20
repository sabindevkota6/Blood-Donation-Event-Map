/*
 * Async Handler wrapper
 * Wraps an async controller to automatically forward errors to Express error middleware.
 */
module.exports = (handler) => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};
