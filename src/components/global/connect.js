// Centralized API configuration for the backend service (port 8086).
// In development, CRA proxy in package.json sends unknown requests to 8086.
// So use relative paths starting with `/`.

export const API = "/";

// Endpoint paths (adjust if your backend uses different routes)
export const AUTH_SIGNIN = "auth/signin";
export const AUTH_SIGNUP = "auth/signup";

// Helper to build URLs
export const apiUrl = (path) => `${API}${path}`;