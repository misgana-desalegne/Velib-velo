import { useEffect } from 'react';

/**
 * Custom hook to dynamically load landing page styles only when needed
 * This prevents loading Bootstrap CSS on dashboard pages
 */
export function useLandingStyles() {
  useEffect(() => {
    // Load Bootstrap CSS
    const bootstrapLink = document.createElement('link');
    bootstrapLink.rel = 'stylesheet';
    bootstrapLink.href = '/assets/css/bootstrap-5.0.0-beta1.min.css';
    bootstrapLink.id = 'bootstrap-css';
    document.head.appendChild(bootstrapLink);

    // Load LineIcons
    const lineIconsLink = document.createElement('link');
    lineIconsLink.rel = 'stylesheet';
    lineIconsLink.href = '/assets/css/LineIcons.2.0.css';
    lineIconsLink.id = 'lineicons-css';
    document.head.appendChild(lineIconsLink);

    // Load Animate CSS
    const animateLink = document.createElement('link');
    animateLink.rel = 'stylesheet';
    animateLink.href = '/assets/css/animate.css';
    animateLink.id = 'animate-css';
    document.head.appendChild(animateLink);

    // Load Lindy UI Kit
    const lindyLink = document.createElement('link');
    lindyLink.rel = 'stylesheet';
    lindyLink.href = '/assets/css/lindy-uikit.css';
    lindyLink.id = 'lindy-css';
    document.head.appendChild(lindyLink);

    // Load Bootstrap JS
    const bootstrapScript = document.createElement('script');
    bootstrapScript.src = '/assets/js/bootstrap-5.0.0-beta1.min.js';
    bootstrapScript.id = 'bootstrap-js';
    document.body.appendChild(bootstrapScript);

    // Load WOW.js for animations
    const wowScript = document.createElement('script');
    wowScript.src = '/assets/js/wow.min.js';
    wowScript.id = 'wow-js';
    wowScript.onload = () => {
      // Initialize WOW.js after it loads
      if (window.WOW) {
        new window.WOW().init();
      }
    };
    document.body.appendChild(wowScript);

    // Load main.js
    const mainScript = document.createElement('script');
    mainScript.src = '/assets/js/main.js';
    mainScript.id = 'main-js';
    document.body.appendChild(mainScript);

    // Cleanup function to remove styles when component unmounts
    return () => {
      document.getElementById('bootstrap-css')?.remove();
      document.getElementById('lineicons-css')?.remove();
      document.getElementById('animate-css')?.remove();
      document.getElementById('lindy-css')?.remove();
      document.getElementById('bootstrap-js')?.remove();
      document.getElementById('wow-js')?.remove();
      document.getElementById('main-js')?.remove();
    };
  }, []);
}

// Extend Window interface for WOW.js
declare global {
  interface Window {
    WOW: any;
  }
}
