import { createContext, useEffect, useState } from 'react';
import { getToken, clearToken } from './auth';
import jwtDecode from 'jwt-decode';

export const MyContext = createContext();

function AppContext({ children }) {
  const [user, setUser] = useState(null);
  const [moviesCache, setMoviesCache] = useState({ data: [], fetchedAt: 0 });

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    try {
      const raw = token.replace(/^Bearer\s+/i, '');
      const decoded = jwtDecode(raw);
      const email = decoded?.email || decoded?.sub || decoded?.username;
      const role = sessionStorage.getItem('role') || decoded?.role || 'USER';
      if (email) setUser({ email, role });
    } catch (e) {
      clearToken();
      setUser(null);
    }
  }, []);

  return (
    <MyContext.Provider value={{ user, setUser, moviesCache, setMoviesCache }}>
      {children}
    </MyContext.Provider>
  );
}

export default AppContext;