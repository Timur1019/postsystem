import { Suspense } from 'react';

export default function LazyModalSuspense({ when, children }) {
  if (!when) return null;
  return <Suspense fallback={null}>{children}</Suspense>;
}
