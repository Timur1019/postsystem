import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function HtmlLangSync() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language?.split('-')[0] ?? 'ru';
    document.documentElement.lang = lang === 'uz' ? 'uz' : 'ru';
  }, [i18n.language]);

  return null;
}
