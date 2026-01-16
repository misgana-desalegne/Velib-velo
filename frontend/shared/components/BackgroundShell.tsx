import type { ReactNode } from 'react';
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

  return (
    <div className={styles.shell}>
      <video autoPlay loop muted playsInline className={styles.backgroundVideo}>
        <source src={backgroundVideo} type="video/mp4" />
      </video>
      <div className={styles.overlay} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
