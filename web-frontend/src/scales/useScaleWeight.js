import { useCallback, useEffect, useState } from 'react';
import {
  isDesktopScaleBridge,
  scaleIsAvailable,
  scaleStart,
  scaleStop,
  subscribeScaleWeight,
} from './scaleBridge';

/**
 * Подключение к весам пока открыта модалка (enabled=true).
 */
export function useScaleWeight(enabled) {
  const [available, setAvailable] = useState(false);
  const [connected, setConnected] = useState(false);
  const [reading, setReading] = useState(null);
  const [error, setError] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [connectAttempt, setConnectAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || !isDesktopScaleBridge()) {
      setAvailable(false);
      return undefined;
    }
    let cancelled = false;
    scaleIsAvailable().then((ok) => {
      if (!cancelled) setAvailable(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !available) {
      setConnected(false);
      setReading(null);
      setError(null);
      return undefined;
    }

    let unsub = () => {};
    (async () => {
      const res = await scaleStart();
      if (res?.ok) {
        setConnected(true);
        setError(null);
        setNeedsSetup(false);
      } else {
        setConnected(false);
        setError(res?.message || 'Не удалось подключить весы');
        setNeedsSetup(Boolean(res?.suggestPicker));
      }
    })();

    unsub = subscribeScaleWeight((payload) => {
      if (payload?.kg != null) {
        setReading({
          kg: payload.kg,
          stable: Boolean(payload.stable),
          raw: payload.raw,
        });
      }
    });

    return () => {
      unsub();
      scaleStop();
      setConnected(false);
    };
  }, [enabled, available, connectAttempt]);

  const reconnect = useCallback(() => {
    setConnectAttempt((n) => n + 1);
  }, []);

  const applyToDraft = useCallback(() => {
    if (!reading?.kg) return null;
    return reading.kg;
  }, [reading]);

  return {
    available,
    connected,
    reading,
    error,
    needsSetup,
    reconnect,
    applyToDraft,
  };
}
