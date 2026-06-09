import { Shield } from 'lucide-react';
import { PageLayout } from '../../../components/ui';
import PlatformModuleAccessCompanySelect from '../components/module-access/PlatformModuleAccessCompanySelect';
import PlatformModuleAccessWorkspace from '../components/module-access/PlatformModuleAccessWorkspace';
import { usePlatformModuleAccessPage } from '../hooks/usePlatformModuleAccessPage';
import '../../../styles/platform/module-access.css';

export default function PlatformModuleAccessPage() {
  const p = usePlatformModuleAccessPage();

  return (
    <PageLayout
      className="mx-auto max-w-6xl"
      spacing="space-y-4"
      title={(
        <span className="flex items-center gap-2">
          <Shield className="text-emerald-500" size={24} />
          {p.t('platform.moduleAccess.title')}
        </span>
      )}
      subtitle={p.t('platform.moduleAccess.subtitle')}
    >
      <PlatformModuleAccessCompanySelect
        t={p.t}
        companies={p.companies}
        companyId={p.companyId}
        onChange={p.handleCompanyChange}
      />

      {p.companyId ? <PlatformModuleAccessWorkspace p={p} /> : null}
    </PageLayout>
  );
}
