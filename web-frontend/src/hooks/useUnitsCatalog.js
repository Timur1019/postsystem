import { useQuery } from '@tanstack/react-query';
import { unitsApi } from '../services/api';
import { hydrateUnitsCatalog } from '../utils/unitConfig';
import { useAuthStore } from '../store/authStore';

export function useUnitsCatalog() {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: ['units-catalog'],
    queryFn: async () => {
      const [unitsRes, convRes] = await Promise.all([
        unitsApi.list({ stockOnly: false }),
        unitsApi.conversions(),
      ]);
      const payload = { units: unitsRes.data, conversions: convRes.data };
      hydrateUnitsCatalog(payload);
      return payload;
    },
    staleTime: 600_000,
    enabled: !!token,
  });
}
