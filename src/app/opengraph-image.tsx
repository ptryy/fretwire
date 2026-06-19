import { ImageResponse } from 'next/og';

import { SITE } from '@/lib/site';

export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#14110E',
        color: '#EDE6DA',
        padding: '72px',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <svg width="60" height="60" viewBox="0 0 24 24">
          <path
            d="M12 2.2c5 0 8 2.8 8 6.4 0 4-3.2 8.9-6.2 12.3a2.4 2.4 0 0 1-3.6 0C7.2 17.5 4 12.6 4 8.6c0-3.6 3-6.4 8-6.4Z"
            fill="#E8A33D"
          />
        </svg>
        <span style={{ fontSize: '40px', fontWeight: 700 }}>{SITE.name}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{ fontSize: '88px', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.02em' }}
        >
          Guitars worth the reach.
        </span>
        <span style={{ fontSize: '32px', color: '#A99E8E', marginTop: '24px' }}>
          Electric · Acoustic · Classical · Bass — crypto checkout.
        </span>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{ width: '14px', height: '14px', borderRadius: '9999px', background: '#E8A33D' }}
          />
        ))}
      </div>
    </div>,
    size,
  );
}
