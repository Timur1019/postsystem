// src/pages/platform/PlatformEmailPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Eye, Mail, Send, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { platformEmailApi, userApi } from '../../services/api';
import '../../styles/platform-email.css';

const BROADCAST_TYPE = 'BROADCAST';

export default function PlatformEmailPage() {
  const { t } = useTranslation();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [templateType, setTemplateType] = useState(BROADCAST_TYPE);
  const [userSearch, setUserSearch] = useState('');

  const { data: users = [], isPending: usersLoading } = useQuery({
    queryKey: ['platform-email-users'],
    queryFn: () => userApi.getAll().then((r) => r.data),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['platform-email-templates'],
    queryFn: () => platformEmailApi.templates().then((r) => r.data),
  });

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.fullName, u.username, u.email, u.role, u.companyName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [users, userSearch]);

  const previewMutation = useMutation({
    mutationFn: (payload) => platformEmailApi.preview(payload).then((r) => r.data),
    onSuccess: (data) => {
      setPreviewHtml(data.html || '');
      setPreviewSubject(data.subject || '');
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.email.previewFailed')),
  });

  const sendMutation = useMutation({
    mutationFn: (payload) => platformEmailApi.broadcast(payload).then((r) => r.data),
    onSuccess: (data) => {
      toast.success(
        t('platform.email.sentSummary', {
          sent: data.sent,
          skipped: data.skipped,
        })
      );
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('platform.email.sendFailed')),
  });

  useEffect(() => {
    if (!templates.length) return;
    previewMutation.mutate({
      templateType,
      subject: subject || t('platform.email.defaultSubject'),
      message: message || t('platform.email.defaultMessage'),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates.length]);

  const toggleUser = (id) => {
    setSelectAll(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedIds(new Set());
    }
  };

  const handlePreview = () => {
    previewMutation.mutate({
      templateType,
      subject: subject || t('platform.email.defaultSubject'),
      message: message || t('platform.email.defaultMessage'),
      sampleUserId: selectedIds.size === 1 ? [...selectedIds][0] : undefined,
    });
  };

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) {
      toast.error(t('platform.email.fillSubjectMessage'));
      return;
    }
    if (!selectAll && selectedIds.size === 0) {
      toast.error(t('platform.email.pickRecipients'));
      return;
    }
    sendMutation.mutate({
      subject: subject.trim(),
      message: message.trim(),
      selectAll,
      userIds: selectAll ? [] : [...selectedIds],
    });
  };

  return (
    <div className="platform-email-page">
      <div className="platform-email-page__header">
        <div>
          <h1 className="platform-email-page__title">{t('platform.email.title')}</h1>
          <p className="platform-email-hint">{t('platform.email.subtitle')}</p>
        </div>
      </div>

      <div className="platform-email-page__grid">
        <section className="platform-email-card">
          <div className="platform-email-card__head">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <Send size={16} />
              {t('platform.email.broadcastTitle')}
            </div>
          </div>
          <div className="platform-email-card__body">
            <div className="platform-email-field">
              <label htmlFor="email-subject">{t('platform.email.subject')}</label>
              <input
                id="email-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t('platform.email.subjectPlaceholder')}
              />
            </div>

            <div className="platform-email-field">
              <label htmlFor="email-message">{t('platform.email.message')}</label>
              <textarea
                id="email-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('platform.email.messagePlaceholder')}
              />
            </div>

            <div className="platform-email-field">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <Users size={14} />
                {t('platform.email.selectAll')}
              </label>
              <p className="platform-email-hint">{t('platform.email.selectAllHint')}</p>
            </div>

            {!selectAll ? (
              <div className="platform-email-field">
                <label htmlFor="email-user-search">{t('platform.email.recipients')}</label>
                <input
                  id="email-user-search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={t('platform.email.recipientSearch')}
                />
                <div className="platform-email-users">
                  {usersLoading ? (
                    <p className="platform-email-hint">{t('common.loading')}</p>
                  ) : filteredUsers.length === 0 ? (
                    <p className="platform-email-hint">{t('platform.email.noUsers')}</p>
                  ) : (
                    filteredUsers.map((user) => (
                      <label key={user.id} className="platform-email-user-row">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(user.id)}
                          onChange={() => toggleUser(user.id)}
                        />
                        <span className="min-w-0 flex-1 truncate">
                          <strong>{user.fullName}</strong>
                          <span className="text-slate-500"> — {user.email || t('platform.email.noEmail')}</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            <div className="platform-email-actions">
              <button
                type="button"
                className="platform-email-btn platform-email-btn--secondary"
                onClick={handlePreview}
                disabled={previewMutation.isPending}
              >
                <Eye size={15} />
                {t('platform.email.preview')}
              </button>
              <button
                type="button"
                className="platform-email-btn platform-email-btn--primary"
                onClick={handleSend}
                disabled={sendMutation.isPending}
              >
                <Mail size={15} />
                {t('platform.email.send')}
              </button>
            </div>
          </div>
        </section>

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
              <label htmlFor="email-template-type">{t('platform.email.templateType')}</label>
              <select
                id="email-template-type"
                value={templateType}
                onChange={(e) => {
                  const next = e.target.value;
                  setTemplateType(next);
                  previewMutation.mutate({
                    templateType: next,
                    subject: subject || t('platform.email.defaultSubject'),
                    message: message || t('platform.email.defaultMessage'),
                  });
                }}
              >
                {templates.map((tpl) => (
                  <option key={tpl.type} value={tpl.type}>
                    {tpl.title}
                  </option>
                ))}
              </select>
            </div>

            {templates.map((tpl) => (
              <div key={tpl.type} className="platform-email-template">
                <div className="platform-email-template__title">{tpl.title}</div>
                <div className="platform-email-template__desc">{tpl.description}</div>
                <div className="platform-email-template__vars">
                  {tpl.variables?.map((v) => (
                    <span key={v} className="platform-email-template__var">{`{{${v}}}`}</span>
                  ))}
                </div>
              </div>
            ))}

            <div className="platform-email-preview">
              {previewHtml ? (
                <iframe title={t('platform.email.previewTitle')} srcDoc={previewHtml} />
              ) : (
                <div className="flex min-h-[24rem] items-center justify-center p-6 text-sm text-slate-500">
                  {previewMutation.isPending ? t('common.loading') : t('platform.email.previewEmpty')}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
