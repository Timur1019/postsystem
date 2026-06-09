import { useState } from 'react';

export function useAiAssistantPage() {
  const [chartData, setChartData] = useState(null);

  return { chartData, setChartData };
}
