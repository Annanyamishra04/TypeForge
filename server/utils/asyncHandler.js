/**
 * Wraps an async Express handler so a rejected promise is forwarded
 * to `next(err)` instead of crashing the process or hanging the
 * request. Keeps controllers free of repetitive try/catch blocks.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
