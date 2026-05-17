/** Формат отображения: +998 (__) ___-__-__ (9 цифр после кода страны) */

const MAX_LOCAL = 9;

export function digitsAfter998(value) {
  let d = String(value || '').replace(/\D/g, '');
  if (d.startsWith('998')) d = d.slice(3);
  return d.slice(0, MAX_LOCAL);
}

export function formatUzPhone(value) {
  const d = digitsAfter998(value);
  if (d.length === 0) return '+998 ';
  const a = d.slice(0, 2);
  const b = d.slice(2, 5);
  const c = d.slice(5, 7);
  const e = d.slice(7, 9);
  let out = '+998 (' + a;
  if (a.length < 2) return out;
  out += ') ' + b;
  if (b.length < 3) return out;
  out += '-' + c;
  if (c.length < 2) return out;
  out += '-' + e;
  return out;
}

export function isCompleteUzPhone(formatted) {
  return digitsAfter998(formatted).length === MAX_LOCAL;
}
