/** Карточки на странице /install — один установщик, разные бренды партнёров. */
export const INSTALLER_BRANDS = [
  {
    id: 'aurent',
    name: 'Aurent',
    accent: 'emerald',
    taglineKey: 'installer.brands.aurentTagline',
  },
  {
    id: 'dtgroup',
    name: 'DT Group',
    accent: 'blue',
    taglineKey: 'installer.brands.dtgroupTagline',
  },
  {
    id: 'pomot',
    name: 'Pomot',
    accent: 'violet',
    taglineKey: 'installer.brands.pomotTagline',
  },
];

export const INSTALLER_MANIFEST_URL = '/downloads/desktop/manifest.json';

const ACCENT_CLASSES = {
  emerald: {
    ring: 'ring-emerald-200',
    badge: 'bg-emerald-500',
    button: 'bg-emerald-600 hover:bg-emerald-700',
  },
  blue: {
    ring: 'ring-blue-200',
    badge: 'bg-blue-500',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
  violet: {
    ring: 'ring-violet-200',
    badge: 'bg-violet-500',
    button: 'bg-violet-600 hover:bg-violet-700',
  },
};

export function brandAccentClasses(accent) {
  return ACCENT_CLASSES[accent] || ACCENT_CLASSES.emerald;
}
