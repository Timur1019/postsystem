import { useTranslation } from 'react-i18next';
import AiAssistantWidget from '../components/AiAssistantWidget';
import AiAssistantChartPanel from '../components/AiAssistantChartPanel';
import { useAiAssistantPage } from '../hooks/useAiAssistantPage';

export default function AiAssistantPage() {
  const { t } = useTranslation();
  const { chartData, setChartData } = useAiAssistantPage();

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('aiAssistant.pageTitle')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('aiAssistant.pageIntro')}</p>
      </div>
      <AiAssistantWidget onChartDataChange={setChartData} />
      <AiAssistantChartPanel data={chartData} />
    </div>
  );
}
