import { PageLayout } from '../../../components/ui';
import PlatformSecurityPasswordSection from '../components/security/PlatformSecurityPasswordSection';
import PlatformSuperAdminFormModal from '../components/security/PlatformSuperAdminFormModal';
import PlatformSuperAdminsSection from '../components/security/PlatformSuperAdminsSection';
import { usePlatformSecurityPage } from '../hooks/usePlatformSecurityPage';
import '../../../styles/platform/security.css';

export default function PlatformSecurityPage() {
  const p = usePlatformSecurityPage();

  return (
    <PageLayout
      className="platform-security"
      title={p.t('platform.security.title')}
      subtitle={p.t('platform.security.subtitle')}
    >
      <PlatformSecurityPasswordSection
        t={p.t}
        password={p.password}
        onPasswordChange={p.setPassword}
        passwordConfirm={p.passwordConfirm}
        onPasswordConfirmChange={p.setPasswordConfirm}
        passwordStatus={p.passwordStatus}
        passwordLoading={p.passwordLoading}
        onSubmit={p.handlePasswordSave}
        saving={p.passwordMutation.isPending}
      />

      <PlatformSuperAdminsSection
        t={p.t}
        adminsLoading={p.adminsLoading}
        superAdmins={p.superAdmins}
        onAdd={p.openCreateAdmin}
        onEdit={p.openEditAdmin}
      />

      <PlatformSuperAdminFormModal
        t={p.t}
        form={p.adminForm}
        onClose={p.closeAdminForm}
        onSubmit={p.handleAdminSubmit}
        onFieldChange={p.updateAdminField}
        saving={p.adminSaving}
      />
    </PageLayout>
  );
}
