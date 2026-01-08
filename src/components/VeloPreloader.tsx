import React, { useEffect, useState } from 'react';

export const VeloPreloader: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="preloader" style={{ opacity: isVisible ? 1 : 0 }}>
      <div className="loader">
        <div className="spinner">
          <div className="spinner-container">
            <div className="spinner-rotator">
              <div className="spinner-left">
                <div className="spinner-circle"></div>
              </div>
              <div className="spinner-right">
                <div className="spinner-circle"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
