/** Админка — всегда светлая. */
export function syncRootTheme() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove('dark');
  document.documentElement.style.colorScheme = 'light';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', '#f1f5f9');
  }
}
