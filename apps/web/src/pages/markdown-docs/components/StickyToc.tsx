import React, { useEffect, useState } from 'react';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface StickyTocProps {
  headings: TocItem[];
  activeId?: string;
  onHeadingClick?: (id: string) => void;
  className?: string;
}

export const StickyToc: React.FC<StickyTocProps> = ({
  headings,
  activeId,
  onHeadingClick,
  className = '',
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  // 스크롤 진행률 계산
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        setScrollProgress(0);
        return;
      }
      const currentScroll = window.scrollY;
      const progress = Math.min(100, Math.max(0, (currentScroll / totalHeight) * 100));
      setScrollProgress(Math.round(progress));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (onHeadingClick) {
      onHeadingClick(id);
    } else {
      const el = document.getElementById(id);
      if (el) {
        const yOffset = -80; // 상단 스티키 헤더 여백
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  };

  if (headings.length === 0) {
    return (
      <nav className={`toc-container p-4 rounded border border-outline-variant bg-surface-container text-label-sm font-label-sm text-outline ${className}`}>
        <div className="font-semibold text-outline mb-2 uppercase tracking-wider text-[10px]">
          TABLE OF CONTENTS
        </div>
        <p className="italic">문서에 제목(Heading)이 없습니다.</p>
      </nav>
    );
  }

  return (
    <nav className={`toc-container flex flex-col gap-3 p-4 rounded border border-outline-variant bg-surface-container/80 backdrop-blur-sm text-label-sm font-label-sm sticky top-24 ${className}`}>
      {/* 목차 헤더 & 진행률 바 */}
      <div className="flex flex-col gap-1.5 pb-2 border-b border-outline-variant">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-on-surface uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-primary">
              toc
            </span>
            <span>On This Page</span>
          </span>
          <span className="text-[10px] font-mono text-outline">
            {scrollProgress}%
          </span>
        </div>
        {/* Progress Bar */}
        <div className="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-150 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </div>

      {/* 헤딩 링크 목록 */}
      <ul className="toc-list space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
        {headings.map((item) => {
          const isActive = activeId === item.id;
          const indentClass =
            item.level === 1
              ? 'pl-1 font-medium'
              : item.level === 2
              ? 'pl-3'
              : item.level === 3
              ? 'pl-5 text-outline'
              : 'pl-7 text-outline';

          return (
            <li key={item.id} className="relative">
              <a
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                className={`group flex items-center py-1 transition-colors rounded ${indentClass} ${
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary rounded-full" />
                )}
                <span className="truncate">{item.text}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
