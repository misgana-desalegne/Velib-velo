import type { ReactNode } from 'react';
import { useEffect } from 'react';
import styles from './BackgroundShell.module.css';
import backgroundVideo from '@/assets/background video.mp4';

type BackgroundShellProps = {
  children: ReactNode;
  showBackground?: boolean;
};

export function BackgroundShell({ children, showBackground = true }: BackgroundShellProps) {
  if (!showBackground) {
    return <div className={styles.contentOnly}>{children}</div>;
  }

  useEffect(() => {
    const v = document.getElementById('background-video') as HTMLVideoElement | null;
    if (v) {
      v.muted = true;
      v.playsInline = true;
      v.play().catch((err) => {
        // Log but don't break the UI
        // eslint-disable-next-line no-console
        console.warn('Background video play prevented:', err);
      });
    }
  }, []);

  return (
    <div className={styles.shell}>
      <video id="background-video" autoPlay loop muted playsInline className={styles.backgroundVideo}>
        <source src={backgroundVideo} type="video/mp4" />
      </video>
      <div className={styles.overlay} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
