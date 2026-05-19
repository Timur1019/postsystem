// src/components/shared/ThemedToaster.jsx
import { Toaster } from 'react-hot-toast';

export default function ThemedToaster() {
  return (
    <Toaster
      position="top-right"
      containerClassName="print:hidden"
      toastOptions={{
        duration: 4000,
        style: {
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
