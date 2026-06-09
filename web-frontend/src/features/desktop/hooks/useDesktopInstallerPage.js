import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchInstallerManifest } from '../utils/installerManifestApi';
import { formatInstallerDate } from '../utils/installerFormatUtils';

export function useDesktopInstallerPage() {
  const { i18n } = useTranslation();

  const manifestQuery = useQuery({
    queryKey: ['desktop-installer-manifest'],
    queryFn: fetchInstallerManifest,
    staleTime: 60_000,
    retry: 1,
  });

  const manifest = manifestQuery.data;
  const version = manifest?.version;
  const releasedAt = formatInstallerDate(manifest?.releasedAt, i18n.language);

  return {
    manifest,
    version,
    releasedAt,
    isLoading: manifestQuery.isLoading,
    isError: manifestQuery.isError,
  };
}
