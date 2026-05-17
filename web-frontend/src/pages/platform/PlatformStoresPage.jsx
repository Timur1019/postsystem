// src/pages/platform/PlatformStoresPage.jsx
import { useQuery } from '@tanstack/react-query';
import { companyApi } from '../../services/api';
import StoresPage from '../StoresPage';

export default function PlatformStoresPage() {
  const { data: companies = [] } = useQuery({
    queryKey: ['companies-all'],
    queryFn: () => companyApi.listAll().then((r) => r.data),
  });
  return <StoresPage showCompanySelect companies={companies} />;
}
