import { ShoppingCart } from 'lucide-react';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';

/**
 * Логотип системы: загруженный в настройках или иконка по умолчанию.
 */
export default function BrandMark({ size = 32, className = '', iconClassName = 'text-white' }) {
  const logo = useTenantDisplayStore((s) => s.committed.systemLogoDataUrl);
  const systemLogoSizePx = useTenantDisplayStore((s) => s.committed.systemLogoSizePx);
  const base = typeof size === 'number' ? size : 32;
  const px = logo && systemLogoSizePx ? systemLogoSizePx : base;

  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        className={`object-contain ${className}`}
        style={{ width: px, height: px, maxWidth: px, maxHeight: px }}
      />
    );
  }

  return <ShoppingCart size={px} className={iconClassName} strokeWidth={2} aria-hidden />;
}
