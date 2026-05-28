import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Loader2, SendHorizontal, Sparkles, Trash2 } from 'lucide-react';
import { aiAssistantApi } from '../../services/api';

const MAX_MESSAGES = 40;
const KEEP_LAST_MESSAGES = 24;

export default function AiAssistantWidget({ onChartDataChange }) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const listRef = useRef(null);

  const appendMessages = (nextPair) => {
    setMessages((prev) => {
      const next = [...prev, ...nextPair];
      if (next.length <= MAX_MESSAGES) return next;
      return next.slice(-KEEP_LAST_MESSAGES);
    });
  };

  const askMutation = useMutation({
    mutationFn: (text) => aiAssistantApi.chat(text).then((r) => r.data),
    onSuccess: (data, question) => {
      appendMessages([
        { role: 'user', text: question },
        { role: 'assistant', text: data.answer, meta: `${data.tool} · ${data.latencyMs}ms`, data: data.data ?? null },
      ]);
      setInput('');
    },
    onError: (e, question) => {
      const fallback = e?.response?.data?.message ?? t('aiAssistant.errors.failed');
      appendMessages([
        { role: 'user', text: question },
        { role: 'assistant', text: fallback, meta: 'error' },
      ]);
    },
  });

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const latestChartData = useMemo(() => {
    if (messages.length === 0) return null;
    const last = messages[messages.length - 1];
    const payload = last?.role === 'assistant' ? last.data : null;
    if (payload && Array.isArray(payload.chart) && payload.chart.length > 0) {
      return payload.chart;
    }
    return null;
  }, [messages]);

  useEffect(() => {
    if (onChartDataChange) {
      onChartDataChange(latestChartData ?? null);
    }
  }, [latestChartData, onChartDataChange]);

  const submit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || askMutation.isPending) return;
    askMutation.mutate(text);
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
          <Sparkles size={16} />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t('aiAssistant.title')}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('aiAssistant.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setMessages([])}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 px-2 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Trash2 size={14} />
          {t('aiAssistant.clearChat')}
        </button>
      </div>

      <div ref={listRef} className="mb-3 h-80 space-y-2 overflow-y-auto overflow-x-hidden pr-1">
        {messages.length === 0 ? (
          <p className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {t('aiAssistant.hint')}
          </p>
        ) : (
          messages.map((m, idx) => (
            <div
              key={`${m.role}-${idx}`}
              className={`rounded-lg px-3 py-2 text-sm ${
                m.role === 'user'
                  ? 'ml-6 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                  : 'mr-6 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
              }`}
            >
              <p>{m.text}</p>
              {m.meta ? <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{m.meta}</p> : null}
            </div>
          ))
        )}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('aiAssistant.inputPlaceholder')}
          className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-0 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          maxLength={600}
        />
        <button
          type="submit"
          disabled={askMutation.isPending || !input.trim()}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-3 text-white disabled:opacity-50"
        >
          {askMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <SendHorizontal size={16} />}
        </button>
      </form>
    </section>
  );
}

