// Centralized API configuration for the backend service (port 8086).
// In development, CRA proxy in package.json sends unknown requests to 8086.
// So use relative paths starting with `/`.

export const API = "http://localhost:8085";
export const AUTH_SIGNIN = "/auth/signin";
export const apiUrl = (path) => API + path;