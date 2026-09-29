import '../theme/polish.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

export default function WebPolish() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
