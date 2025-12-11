'use client';

import React from 'react';

interface ImagePageProps {
  componentType: string;
  componentId: string;
  componentTitle: string;
  src_change_11_12_2025: string;
  alt?: string;
  articleStyle?: string;
  quoteText?: string;
}

export default function ImagePage({
  componentType,
  componentId,
  componentTitle,
  src_change_11_12_2025: src_change_11_12_2025,
  alt = '',
  articleStyle,
  quoteText,
}: ImagePageProps) {
  const styleClass = ['full-width', articleStyle].filter(Boolean).join(' ');

  return (
    <span
      data-component_type={componentType}
      data-component_id={componentId}
      data-component_title={componentTitle}
    >
      <div className={styleClass}>
        <img src={src_change_11_12_2025} alt={alt} className="w-full h-auto" />
        {quoteText ? (
          <p className="mt-2 text-sm text-gray-600 italic">{quoteText}</p>
        ) : null}
      </div>
    </span>
  );
}

