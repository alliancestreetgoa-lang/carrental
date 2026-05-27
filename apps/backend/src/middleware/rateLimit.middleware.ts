import rateLimit from 'express-rate-limit';

// Generous limit for general API traffic. A dashboard SPA fans out many
// reads per page (and calls /auth/me on navigation), so keep this high.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Stricter limit for login to bound brute-force attempts. Successful logins
// are not counted, so legitimate users are never locked out.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});
