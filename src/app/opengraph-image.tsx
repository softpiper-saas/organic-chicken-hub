import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Organic Chicken Aggregator';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(to bottom right, #f0fdf4, #dcfce7)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#166534',
          fontFamily: 'sans-serif',
          fontWeight: 800,
          textAlign: 'center',
          padding: '40px',
        }}
      >
        <div style={{ fontSize: 60, marginBottom: 20, color: '#15803d' }}>
          Eat Healthy, Live Healthy
        </div>
        <div>Organic Chicken</div>
        <div style={{ fontSize: 40, marginTop: 20, color: '#15803d', fontWeight: 600 }}>
          Aggregator
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
