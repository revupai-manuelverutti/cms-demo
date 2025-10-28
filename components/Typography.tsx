'use client';

import { ElementType } from "react";

interface HeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export function Heading({ children, level = 2, className = '' }: HeadingProps) {
  const HeadingTag = `h${level}`  as ElementType;
  const sizeClasses = {
    1: 'text-5xl mb-6',
    2: 'text-4xl mb-5',
    3: 'text-3xl mb-4',
    4: 'text-2xl mb-3',
    5: 'text-xl mb-2',
    6: 'text-lg mb-2',
  };

  return (
    <HeadingTag
      className={`font-bold text-gray-900 font-sans ${sizeClasses[level]} ${className}`}
    >
      {children}
    </HeadingTag>
  );
}

interface HighlightedTextProps {
  children: React.ReactNode;
  className?: string;
}

export function HighlightedText({ children, className = '' }: HighlightedTextProps) {
  return (
    <p className={`text-blue-900 font-semibold text-lg mb-4 font-sans ${className}`}>
      {children}
    </p>
  );
}

interface BodyTextProps {
  children: React.ReactNode;
  className?: string;
}

export function BodyText({ children, className = '' }: BodyTextProps) {
  return (
    <p className={`text-gray-700 leading-relaxed font-sans ${className}`}>
      {children}
    </p>
  );
}
