import { PageLayout } from '../../../components/ui';
import PlatformEmailBroadcastForm from '../components/email/PlatformEmailBroadcastForm';
import PlatformEmailPreviewPanel from '../components/email/PlatformEmailPreviewPanel';
import { usePlatformEmailPage } from '../hooks/usePlatformEmailPage';
import '../../../styles/platform/email.css';

export default function PlatformEmailPage() {
  const p = usePlatformEmailPage();

  return (
    <PageLayout
      className="platform-email-page"
      title={p.t('platform.email.title')}
      subtitle={p.t('platform.email.subtitle')}
    >
      <div className="platform-email-page__grid">
        <PlatformEmailBroadcastForm
          t={p.t}
          subject={p.subject}
          onSubjectChange={p.setSubject}
          message={p.message}
          onMessageChange={p.setMessage}
          selectAllActive={p.selectAllActive}
          onSelectAllActive={p.handleSelectAllActive}
          userSearch={p.userSearch}
          onUserSearchChange={p.setUserSearch}
          filteredUsers={p.filteredUsers}
          usersLoading={p.usersLoading}
          allVisibleSelected={p.allVisibleSelected}
          onSelectAllVisible={p.handleSelectAllVisible}
          selectedIds={p.selectedIds}
          onToggleUser={p.toggleUser}
          onPreview={p.handlePreview}
          onSend={p.handleSend}
          previewPending={p.previewMutation.isPending}
          sendPending={p.sendMutation.isPending}
        />
        <PlatformEmailPreviewPanel
          t={p.t}
          previewSubject={p.previewSubject}
          templateType={p.templateType}
          templates={p.templates}
          templatesError={p.templatesError}
          activeTemplate={p.activeTemplate}
          onTemplateChange={p.handleTemplateChange}
          previewHtml={p.previewHtml}
          previewPending={p.previewMutation.isPending}
        />
      </div>
    </PageLayout>
  );
}
