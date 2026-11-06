import { useState, useEffect } from 'react';
import { useScrollY } from '../../../hooks';
import './BackToTop.css';

export const BackToTop = () => {
  const scrollY = useScrollY();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(scrollY > 500);
  }, [scrollY]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button className="back-to-top" onClick={scrollToTop} aria-label="Back to top">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
    </button>
  );
};
