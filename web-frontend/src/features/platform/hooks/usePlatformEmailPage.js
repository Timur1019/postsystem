import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { platformEmailApi, userApi } from '../../../api';
import { EMAIL_BROADCAST_TYPE } from '../utils/emailUtils';

export function usePlatformEmailPage() {
  const { t } = useTranslation();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectAllActive, setSelectAllActive] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [templateType, setTemplateType] = useState(EMAIL_BROADCAST_TYPE);
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

  const buildPreviewPayload = (overrides = {}) => ({
    templateType,
    subject: subject || t('platform.email.defaultSubject'),
    message: message || t('platform.email.defaultMessage'),
    ...overrides,
  });

  useEffect(() => {
    if (!templates.length) return;
    previewMutation.mutate(buildPreviewPayload());
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
    if (checked) setSelectedIds(new Set());
  };

  const handleSelectAllVisible = (checked) => {
    setSelectAllActive(false);
    setSelectedIds(checked ? new Set(filteredUsers.map((u) => u.id)) : new Set());
  };

  const handlePreview = () => {
    previewMutation.mutate(
      buildPreviewPayload({
        sampleUserId: selectedIds.size === 1 ? [...selectedIds][0] : undefined,
      })
    );
  };

  const handleTemplateChange = (nextType) => {
    setTemplateType(nextType);
    previewMutation.mutate(buildPreviewPayload({ templateType: nextType }));
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

  return {
    t,
    subject,
    setSubject,
    message,
    setMessage,
    selectAllActive,
    handleSelectAllActive,
    selectedIds,
    toggleUser,
    userSearch,
    setUserSearch,
    filteredUsers,
    usersLoading,
    allVisibleSelected,
    handleSelectAllVisible,
    previewHtml,
    previewSubject,
    templateType,
    templates,
    templatesError,
    activeTemplate,
    handleTemplateChange,
    handlePreview,
    handleSend,
    previewMutation,
    sendMutation,
  };
}
