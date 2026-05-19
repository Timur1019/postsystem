import { ShoppingCart } from 'lucide-react';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';

/**
 * Логотип системы: загруженный в настройках или иконка по умолчанию.
 */
export default function BrandMark({ size = 32, className = '', iconClassName = 'text-white' }) {
  const logo = useTenantDisplayStore((s) => s.systemLogoDataUrl);
  const px = typeof size === 'number' ? size : 32;

  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        className={`object-contain ${className}`}
        style={{ width: px, height: px }}
      />
    );
  }

  return <ShoppingCart size={px} className={iconClassName} strokeWidth={2} aria-hidden />;
}
