export const EMAIL_BROADCAST_TYPE = 'BROADCAST';

export function templateLabel(t, tpl) {
  if (!tpl) return '';
  return t(`platform.email.templates.${tpl.type}`, { defaultValue: tpl.title || tpl.type });
}

export function userDisplayName(user) {
  const name = String(user?.fullName || '').trim();
  if (name) return name;
  const username = String(user?.username || '').trim();
  if (username) return username;
  const email = String(user?.email || '').trim();
  if (email) return email;
  return `#${String(user?.id || '').slice(0, 8)}`;
}

export function userMetaLine(user, t) {
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
