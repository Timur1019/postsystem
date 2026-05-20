import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const PosShellContext = createContext(null);

export function PosShellProvider({ children }) {
  const [shell, setShellState] = useState(null);

  const setShell = useCallback((next) => {
    setShellState(next);
  }, []);

  const value = useMemo(() => ({ shell, setShell }), [shell, setShell]);

  return <PosShellContext.Provider value={value}>{children}</PosShellContext.Provider>;
}

export function usePosShell() {
  return useContext(PosShellContext);
}
