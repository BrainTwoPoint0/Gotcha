'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HoverEffectItem {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface HoverEffectProps {
  items: HoverEffectItem[];
  className?: string;
}

export function HoverEffect({ items, className }: HoverEffectProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={cn('grid md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {items.map((item, idx) => (
        <div
          key={item.title}
          className="relative group block p-2"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-slate-200/[0.8] dark:bg-slate-800/[0.8] block rounded-2xl"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.2 },
                }}
              />
            )}
          </AnimatePresence>
          <div className="relative z-10 p-6 rounded-xl border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800 h-full">
            {item.icon && (
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 mb-4">
                {item.icon}
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {item.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
