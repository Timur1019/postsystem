import { useTranslation } from 'react-i18next';
import { ru } from 'date-fns/locale/ru';
import { uz } from 'date-fns/locale/uz';

export function useDateFnsLocale() {
  const { i18n } = useTranslation();
  return i18n.language?.startsWith('uz') ? uz : ru;
}
