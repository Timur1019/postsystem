import StoresPage from './StoresPage';
import { usePlatformStoresPage } from '../hooks/usePlatformStoresPage';

export default function PlatformStoresPage() {
  const { companies } = usePlatformStoresPage();

  return <StoresPage showCompanySelect companies={companies} />;
}
