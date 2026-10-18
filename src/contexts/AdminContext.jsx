'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { adminApi, setCsrfToken, setSessionLostHandler } from '@/lib/adminApi';

const AdminContext = createContext(null);

// The back office login state. status: 'checking' (asking the server), 'in' or 'out'.
export const AdminProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('checking');
  // Set when the server could not be reached while checking the session, shown on the login page.
  const [connectionError, setConnectionError] = useState(null);

  const signedIn = useCallback(({ user: account, csrfToken }) => {
    setCsrfToken(csrfToken);
    setUser(account);
    setStatus('in');
    setConnectionError(null);
  }, []);

  const signedOut = useCallback(() => {
    setCsrfToken(null);
    setUser(null);
    setStatus('out');
  }, []);

  useEffect(() => {
    setSessionLostHandler(signedOut);
    adminApi
      .me()
      .then(signedIn)
      .catch((err) => {
        if (err.status === 0) setConnectionError(err.message);
        signedOut();
      });
  }, [signedIn, signedOut]);

  const login = useCallback(async (username, password) => signedIn(await adminApi.login(username, password)), [signedIn]);

  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
    } finally {
      signedOut();
    }
  }, [signedOut]);

  const value = useMemo(() => ({ user, status, connectionError, login, logout }), [user, status, connectionError, login, logout]);
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => useContext(AdminContext);
