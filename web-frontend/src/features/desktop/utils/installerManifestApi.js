export const INSTALLER_MANIFEST_URL = '/downloads/desktop/manifest.json';

export async function fetchInstallerManifest() {
  const res = await fetch(INSTALLER_MANIFEST_URL, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`manifest ${res.status}`);
  }
  return res.json();
}
