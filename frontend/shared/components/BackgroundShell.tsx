import type { ReactNode } from 'react';
import styles from './BackgroundShell.module.css';

type BackgroundShellProps = {
  children: ReactNode;
};

export function BackgroundShell({ children }: BackgroundShellProps) {
  return (
    <div className={styles.shell}>
      <video autoPlay loop muted playsInline className={styles.backgroundVideo}>
        <source src="/Data-Analysis-Dashboard/assets/background video.mp4" type="video/mp4" />
      </video>
      <div className={styles.overlay} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
