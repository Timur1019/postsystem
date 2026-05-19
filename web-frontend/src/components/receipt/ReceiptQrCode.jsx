import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/**
 * QR на чеке — для проверки и участия в призовых играх ГНК.
 */
export default function ReceiptQrCode({ value, sizePx = 120 }) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    if (!value) {
      setSrc('');
      return undefined;
    }
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: sizePx,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc('');
      });
    return () => {
      cancelled = true;
    };
  }, [value, sizePx]);

  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      className="receipt-qr mx-auto block max-w-full"
      width={sizePx}
      height={sizePx}
      style={{ width: sizePx, height: sizePx, maxWidth: '100%' }}
    />
  );
}
