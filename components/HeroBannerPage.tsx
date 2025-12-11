'use client';

import React from 'react';
import type { JSX } from 'react';

interface HeroBannerPageProps {
  componentType: string;
  componentId: string;
  componentTitle: string;
  image: string;
  alt?: string;
  altValueFromDAM?: boolean | string;
  overlay?: boolean | string;
  title?: string;
  articlePagePath?: string;
  articleDate?: string;
  showArticleDetails?: boolean | string;
  buttonCopy?: string;
  buttonColor?: string;
  buttonStyle?: string;
  copyright?: string;
  showSocialShareOnHeroBanner?: boolean | string;
  clickCategory?: string;
  clickId?: string;
  clickTitle?: string;
  clickName?: string;
}

function toBool(v: boolean | string | undefined): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'true';
  return false;
}

export default function HeroBannerPage({
  componentType,
  componentId,
  componentTitle,
  image,
  alt = '',
  altValueFromDAM,
  overlay,
  title,
  articlePagePath,
  articleDate,
  showArticleDetails,
  buttonCopy = 'Read the article',
  buttonColor = 'primary',
  buttonStyle = 'fill border',
  copyright,
  showSocialShareOnHeroBanner,
  clickCategory,
  clickId,
  clickTitle,
  clickName,
}: HeroBannerPageProps) {
  const hasOverlay = toBool(overlay);
  const showDetails = toBool(showArticleDetails);
  const showSocial = toBool(showSocialShareOnHeroBanner);
  const resolvedAlt = toBool(altValueFromDAM) ? '' : alt;
  const heading = title || componentTitle;

  const WrapperTag = (articlePagePath ? 'a' : 'div') as keyof JSX.IntrinsicElements;

  return (
    <div
      className={`hero-banner-callout${hasOverlay ? ' hero-banner-callout--overlay' : ''}`}
      data-component_type={componentType}
      data-component_id={componentId}
      data-component_title={componentTitle}
    >
      <div className="hero-banner-callout__inner">
        <WrapperTag
          className="hero-banner-callout__background"
          href={articlePagePath}
          aria-label={articlePagePath ? 'Article page' : undefined}
        >
          <img
            className="hero-banner-callout__background-image hero-banner-callout__background-image--desktop"
            src={image}
            alt={resolvedAlt}
          />
          <img
            className="hero-banner-callout__background-image hero-banner-callout__background-image--mobile"
            src={image}
            alt={resolvedAlt}
          />
        </WrapperTag>
        <div className="hero-banner-callout__background-overlay" aria-hidden="true"></div>

        <div className="hero-banner-callout__content">
          <div className="hero-banner-callout__content-inner">
            <div className="hero-banner-callout__text">
              <a
                className="hero-banner-callout__heading-anchor"
                data-click_category={clickCategory || componentType}
                data-click_id={clickId || componentId}
                data-click_title={clickTitle || componentTitle}
                data-click_name={clickName || heading}
                href={articlePagePath}
                aria-label={articlePagePath ? 'Article page' : undefined}
              >
                <h1 className="hero-banner-callout__heading">
                  <span><span><span>{heading}</span></span></span>
                </h1>
              </a>
              {articleDate ? (
                <div
                  className="hero-banner-callout__publish-time"
                  data-publish-time={articleDate}
                >
                  <span>{articleDate}</span>
                </div>
              ) : null}
            </div>

            {articlePagePath && showDetails ? (
              <a
                className={`hero-banner-callout__cta hero-banner-callout__cta--${buttonColor} hero-banner-callout__cta--${buttonStyle.replace(' ', '-')}`}
                href={articlePagePath}
                data-click_category={clickCategory || componentType}
                data-click_id={clickId || componentId}
                data-click_title={clickTitle || componentTitle}
                data-click_name={clickName || buttonCopy}
              >
                {buttonCopy}
              </a>
            ) : null}

            <img
              className="hero-banner-callout__play-icon"
              alt="Play icon"
              src="/etc.clientlibs/unsw-common/clientlibs/unsw-uds-assets/site/styles/src/assets/resources/illustrations/icon-play-circle.svg"
            />
          </div>
        </div>

        {showSocial ? (
          <div className="hero-banner__social-button-container">
            <button className="hero-banner__social-button" aria-expanded="false" aria-controls="hero-banner-social">
              <img
                className="hero-banner__social-icon"
                alt="Expand social share"
                src="/etc.clientlibs/unsw-common/clientlibs/unsw-uds-assets/site/styles/src/assets/resources/illustrations/icon-share-black.svg"
              />
              <img
                className="hero-banner__social-icon-close"
                alt="Close social share"
                src="/etc.clientlibs/unsw-common/clientlibs/unsw-uds-assets/site/styles/src/assets/resources/illustrations/cross-thin.svg"
              />
            </button>
            <div className="hero-banner__social-share-container" id="hero-banner-social"></div>
          </div>
        ) : null}
      </div>

      {copyright ? (
        <div className="hero-banner-callout__copyright" dangerouslySetInnerHTML={{ __html: copyright }} />
      ) : null}
    </div>
  );
}
