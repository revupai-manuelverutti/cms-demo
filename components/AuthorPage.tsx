'use client';

import React from 'react';
import type { JSX } from 'react';

interface AuthorPageProps {
  componentType: string;
  componentId: string;
  componentTitle: string;
  linkUrl?: string;
  firstName?: string;
  lastName?: string;
  authorTitle?: string;
  description?: string;
  src?: string;
  alt?: string;
  clickCategory?: string;
  clickId?: string;
  clickName?: string;
  clickTitle?: string;
}

export default function AuthorPage({
  componentType,
  componentId,
  componentTitle,
  linkUrl,
  firstName,
  lastName,
  authorTitle,
  description,
  src,
  alt = '',
  clickCategory,
  clickId,
  clickName,
  clickTitle,
}: AuthorPageProps) {
  const OuterTag = (linkUrl ? 'a' : 'div') as keyof JSX.IntrinsicElements;
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();

  const commonProps = {
    className: 'author-v3 author-v3--long-variation',
    'data-component_type': componentType,
    'data-component_id': componentId,
    'data-component_title': componentTitle,
    'data-click_category': clickCategory || componentType,
    'data-click_id': clickId || componentId,
    'data-click_name': clickName || authorTitle || name,
    'data-click_title': clickTitle || componentTitle,
  } as any;

  return (
    <OuterTag {...commonProps} href={linkUrl}>
      {src ? (
        <div className="author-v3__icon-container">
          <div className="author-v3__icon-inner">
            <img alt={alt} src={src} />
          </div>
        </div>
      ) : null}
      <div className="author-v3__text-container">
        {name ? <div className="author-v3__name">{name}</div> : null}
        {authorTitle ? <div className="author-v3__title">{authorTitle}</div> : null}
        {description ? (
          <div className="author-v3__content">{description}</div>
        ) : null}
      </div>
    </OuterTag>
  );
}
