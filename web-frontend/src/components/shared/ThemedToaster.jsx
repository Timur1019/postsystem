// src/components/shared/ThemedToaster.jsx
import { Toaster } from 'react-hot-toast';
import { useThemeStore } from '../../store/themeStore';

export default function ThemedToaster() {
  const mode = useThemeStore((s) => s.mode);
  const dark = mode === 'dark';

  return (
    <Toaster
      position="top-right"
      containerClassName="print:hidden"
      toastOptions={{
        duration: 4000,
        style: dark
          ? { background: '#1e293b', color: '#f1f5f9', fontSize: '14px' }
          : {
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '14px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)',
            },
      }}
    />
  );
}
