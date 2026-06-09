import { useCashierDesktopMenu } from '../hooks/useCashierDesktopMenu';
import CashierDesktopMenuPanel from './desktop-menu/CashierDesktopMenuPanel';

export default function CashierDesktopMenu({ appName }) {
  const menu = useCashierDesktopMenu();
  if (!menu) return null;
  return <CashierDesktopMenuPanel appName={appName} menu={menu} />;
}
