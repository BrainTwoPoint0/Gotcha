'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Spotlight } from '@/app/components/ui/aceternity/spotlight';
import { Button } from '@/components/ui/button';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 20 } },
};

function CopyCommand() {
  const [copied, setCopied] = useState(false);
  const command = 'npm install gotcha-feedback';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="group inline-flex items-center gap-3 bg-gray-900 text-gray-100 pl-5 pr-3 py-3 rounded-lg font-mono text-sm mb-4 cursor-pointer hover:bg-gray-800 transition-colors"
    >
      <span className="text-green-400">$</span>
      <code>{command}</code>
      <span className="ml-1 text-gray-400 group-hover:text-gray-200 transition-colors">
        {copied ? (
          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </span>
    </button>
  );
}

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-white to-gray-50 py-20 sm:py-32 overflow-hidden">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="#475569" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              A direct line between <span className="text-slate-600">your users</span> and{' '}
              <span className="text-slate-600">your team</span>
            </h1>
          </motion.div>
          <motion.div variants={itemVariants}>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Attach feedback to any component — right where your users experience your features. No
              surveys. No guessing.
            </p>
          </motion.div>
          <motion.div variants={itemVariants}>
            <CopyCommand />
          </motion.div>
          <motion.div variants={itemVariants}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button
                size="lg"
                className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-slate-900/10 transition-colors"
                asChild
              >
                <Link href="/signup">Add Feedback in 5 Minutes</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-slate-900/10 transition-colors"
                asChild
              >
                <Link href="/demo">Try the Demo</Link>
              </Button>
            </div>
          </motion.div>
          <motion.div variants={itemVariants}>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required. Free tier available.
            </p>
          </motion.div>
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-center gap-3 mt-6">
              <a
                href="https://www.npmjs.com/package/gotcha-feedback"
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://img.shields.io/npm/dt/gotcha-feedback?style=for-the-badge&logo=npm&label=downloads&color=1e293b&labelColor=334155"
                  alt="npm downloads"
                  className="inline-block h-7"
                />
              </a>
              <a
                href="https://www.npmjs.com/package/gotcha-feedback"
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://img.shields.io/npm/v/gotcha-feedback?style=for-the-badge&logo=npm&color=1e293b&labelColor=334155"
                  alt="npm version"
                  className="inline-block h-7"
                />
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
