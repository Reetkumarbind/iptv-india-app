
import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

interface ScrollToTopProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({ containerRef }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const toggleVisibility = () => {
      if (container.scrollTop > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    container.addEventListener('scroll', toggleVisibility);
    return () => container.removeEventListener('scroll', toggleVisibility);
  }, [containerRef]);

  const scrollToTop = () => {
    containerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 z-[100] p-4 bg-blue-600 text-white rounded-2xl shadow-2xl shadow-blue-600/40 transition-all duration-500 transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-50 pointer-events-none'
      } hover:bg-blue-500 active:scale-90`}
      aria-label="Scroll to top"
    >
      <ChevronUp size={24} strokeWidth={3} />
    </button>
  );
};

export default ScrollToTop;
