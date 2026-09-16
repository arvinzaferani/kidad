'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function SplitQr({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setDataUrl(null);
    setFailed(false);
    console.log(value)
    QRCode.toDataURL(value, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (alive) setDataUrl(url);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [value]);

  if (failed) {
    return <div className="notice notice-error">امکان ساخت QR وجود ندارد.</div>;
  }
  if (!dataUrl) {
    return <div className="placeholder">در حال ساخت QR...</div>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={dataUrl}
      alt="QR کد دعوت به اسپلیت"
      style={{ width: '100%', maxWidth: 280, borderRadius: '0.9rem' }}
    />
  );
}