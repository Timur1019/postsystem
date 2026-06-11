/** Подвал страницы логина: только копирайт. */
export default function LoginFooter({ t }) {
  return (
    <p className="mt-6 text-center text-xs text-slate-500">
      {t('login.footer', { year: new Date().getFullYear() })}
    </p>
  );
}
