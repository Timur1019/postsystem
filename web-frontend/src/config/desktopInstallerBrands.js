/** Карточка на странице /install — один установщик для DT Group. */
export const INSTALLER_BRANDS = [
  {
    id: 'dtgroup',
    name: 'DT Group',
    accent: 'blue',
    taglineKey: 'installer.brands.dtgroupTagline',
  },
];

export const INSTALLER_MANIFEST_URL = '/downloads/desktop/manifest.json';

const ACCENT_CLASSES = {
  blue: {
    ring: 'ring-blue-200',
    badge: 'bg-blue-500',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
};

export function brandAccentClasses(accent) {
  return ACCENT_CLASSES[accent] || ACCENT_CLASSES.blue;
}
