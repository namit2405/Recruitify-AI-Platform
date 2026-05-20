import { createContext, useContext, useState } from "react";

const InternetIdentityContext = createContext(null);

export function InternetIdentityProvider({ children }) {
  const [identity, setIdentity] = useState(null);
  const [loginStatus, setLoginStatus] = useState("idle");

  const login = async () => {
    setLoginStatus("logging-in");

    // MOCK login (no DFX)
    setTimeout(() => {
      setIdentity({ principal: "mock-user" });
      setLoginStatus("idle");
    }, 500);
  };

  const logout = () => {
    setIdentity(null);
  };

  return (
    <InternetIdentityContext.Provider
      value={{ identity, login, logout, loginStatus }}
    >
      {children}
    </InternetIdentityContext.Provider>
  );
}

export function useInternetIdentity() {
  const ctx = useContext(InternetIdentityContext);

  // ✅ CRITICAL: never return null
  if (!ctx) {
    return {
      identity: null,
      login: async () => {},
      logout: () => {},
      loginStatus: "idle",
    };
  }

  return ctx;
}
