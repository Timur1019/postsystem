import { Eye } from 'lucide-react';
import { BaseSelect } from '../../../../components/ui';
import { templateLabel } from '../../utils/emailUtils';

export default function PlatformEmailPreviewPanel({
  t,
  previewSubject,
  templateType,
  templates,
  templatesError,
  activeTemplate,
  onTemplateChange,
  previewHtml,
  previewPending,
}) {
  return (
    <section className="platform-email-card">
      <div className="platform-email-card__head">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <Eye size={16} />
          {t('platform.email.previewTitle')}
        </div>
        {previewSubject ? (
          <span className="truncate text-xs text-slate-500">{previewSubject}</span>
        ) : null}
      </div>
      <div className="platform-email-card__body">
        <div className="platform-email-field">
          {templatesError ? (
            <p className="platform-email-hint text-red-500">{t('platform.email.templatesLoadFailed')}</p>
          ) : null}
          <BaseSelect
            id="email-template-type"
            label={t('platform.email.templateType')}
            value={templateType}
            disabled={!templates.length}
            onChange={(e) => onTemplateChange(e.target.value)}
            placeholder={t('common.loading')}
            options={
              templates.length === 0
                ? [{ value: '', label: t('common.loading') }]
                : templates.map((tpl) => ({
                    value: tpl.type,
                    label: templateLabel(t, tpl),
                  }))
            }
          />
        </div>

        {activeTemplate ? (
          <div className="platform-email-template">
            <div className="platform-email-template__title">{templateLabel(t, activeTemplate)}</div>
            <div className="platform-email-template__desc">{activeTemplate.description}</div>
            <div className="platform-email-template__vars">
              {activeTemplate.variables?.map((v) => (
                <span key={v} className="platform-email-template__var">{`{{${v}}}`}</span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="platform-email-preview">
          {previewHtml ? (
            <iframe title={t('platform.email.previewTitle')} srcDoc={previewHtml} />
          ) : (
            <div className="flex min-h-[24rem] items-center justify-center p-6 text-sm text-slate-500">
              {previewPending ? t('common.loading') : t('platform.email.previewEmpty')}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
