'use client';

import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

export function Qr({ value, size = 200 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, { width: size, margin: 1 })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className="animate-pulse rounded-lg bg-white/10"
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt="Payment address QR code"
      width={size}
      height={size}
      className="rounded-lg bg-white p-2"
    />
  );
}
