'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  x: number;
  y: number;
  children: React.ReactNode;
}

export function Tooltip({ x, y, children }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed z-50 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-lg"
      style={{ left: x + 12, top: y - 10 }}
    >
      {children}
    </div>,
    document.body
  );
}
