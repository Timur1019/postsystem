// src/pages/platform/PlatformEmailPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Eye, Mail, Send, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { platformEmailApi, userApi } from '../../services/api';
import '../../styles/platform-email.css';

const BROADCAST_TYPE = 'BROADCAST';

function templateLabel(t, tpl) {
  if (!tpl) return '';
  return t(`platform.email.templates.${tpl.type}`, { defaultValue: tpl.title || tpl.type });
}

function userDisplayName(user) {
  const name = String(user?.fullName || '').trim();
  if (name) return name;
  const username = String(user?.username || '').trim();
  if (username) return username;
  const email = String(user?.email || '').trim();
  if (email) return email;
  return `#${String(user?.id || '').slice(0, 8)}`;
}

function userMetaLine(user, t) {
  const parts = [];
  const username = String(user?.username || '').trim();
  const email = String(user?.email || '').trim();
  const role = String(user?.role || '').trim();
  const company = String(user?.companyName || '').trim();
  if (username) parts.push(username);
  if (email) parts.push(email);
  else parts.push(t('platform.email.noEmail'));
  if (role) parts.push(role);
  if (company) parts.push(company);
  return parts.join(' · ');
}

export default function PlatformEmailPage() {
  const { t } = useTranslation();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectAllActive, setSelectAllActive] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [templateType, setTemplateType] = useState(BROADCAST_TYPE);
  const [userSearch, setUserSearch] = useState('');

  const { data: users = [], isPending: usersLoading } = useQuery({
    queryKey: ['platform-email-users'],
    queryFn: () => userApi.getAll().then((r) => r.data),
  });

  const { data: templates = [], isError: templatesError } = useQuery({
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

  const activeTemplate = useMemo(
    () => templates.find((tpl) => tpl.type === templateType) ?? templates[0] ?? null,
    [templates, templateType]
  );

  const allVisibleSelected =
    filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.has(u.id));

  useEffect(() => {
    if (!templates.length) return;
    if (!templates.some((tpl) => tpl.type === templateType)) {
      setTemplateType(templates[0].type);
    }
  }, [templates, templateType]);

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
    setSelectAllActive(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllActive = (checked) => {
    setSelectAllActive(checked);
    if (checked) {
      setSelectedIds(new Set());
    }
  };

  const handleSelectAllVisible = (checked) => {
    setSelectAllActive(false);
    if (checked) {
      setSelectedIds(new Set(filteredUsers.map((u) => u.id)));
    } else {
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
    if (!selectAllActive && selectedIds.size === 0) {
      toast.error(t('platform.email.pickRecipients'));
      return;
    }
    sendMutation.mutate({
      subject: subject.trim(),
      message: message.trim(),
      selectAll: selectAllActive,
      userIds: selectAllActive ? [] : [...selectedIds],
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
                  checked={selectAllActive}
                  onChange={(e) => handleSelectAllActive(e.target.checked)}
                />
                <Users size={14} />
                {t('platform.email.selectAll')}
              </label>
              <p className="platform-email-hint">{t('platform.email.selectAllHint')}</p>
            </div>

            {!selectAllActive ? (
              <div className="platform-email-field">
                <label htmlFor="email-user-search">{t('platform.email.recipients')}</label>
                <input
                  id="email-user-search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={t('platform.email.recipientSearch')}
                />
                <label className="platform-email-select-all">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(e) => handleSelectAllVisible(e.target.checked)}
                  />
                  {t('platform.email.selectAllVisible', { count: filteredUsers.length })}
                </label>
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
                        <span className="platform-email-user-row__text">
                          <span className="platform-email-user-row__name">{userDisplayName(user)}</span>
                          <span className="platform-email-user-row__meta">{userMetaLine(user, t)}</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {selectedIds.size > 0 ? (
                  <p className="platform-email-hint">{t('platform.email.selectedCount', { count: selectedIds.size })}</p>
                ) : null}
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
              {templatesError ? (
                <p className="platform-email-hint text-red-500">{t('platform.email.templatesLoadFailed')}</p>
              ) : null}
              <select
                id="email-template-type"
                value={templateType}
                disabled={!templates.length}
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
                {templates.length === 0 ? (
                  <option value="">{t('common.loading')}</option>
                ) : (
                  templates.map((tpl) => (
                    <option key={tpl.type} value={tpl.type}>
                      {templateLabel(t, tpl)}
                    </option>
                  ))
                )}
              </select>
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
