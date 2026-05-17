// src/components/shared/ThemeSync.jsx
import { useEffect } from 'react';
import { useThemeStore, syncRootTheme } from '../../store/themeStore';

export default function ThemeSync() {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    syncRootTheme(mode);
  }, [mode]);

  return null;
}
