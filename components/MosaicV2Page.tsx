'use client';

import React from 'react';

type TileType = 'tile-type--hero' | 'tile-type--icon' | 'tile-type--content' | 'tile-type--profile' | 'tile-type--image';

export interface MosaicV2Tile {
  tiletype: TileType;
  overlay?: boolean | string;
  fileReference?: string;
  alt?: string;
  isImageDecorative?: boolean | string;
  heading?: string;
  introText?: string;
  subheading?: string;
  profileName?: string;
  ctaLink?: string;
  ctaNewTab?: boolean | string;
  ctaLabel?: string;
  faculty?: string;
  headingBgColor?: string;
  tileBgColor?: string;
  clickCategory?: string;
  clickId?: string;
  clickTitle?: string;
  clickName?: string;
}

interface MosaicV2PageProps {
  tiles: MosaicV2Tile[];
  componentType?: string;
  componentId?: string;
  componentTitle?: string;
  customColorA_change_11_12_2025?: string;
  customColorB_change_11_12_2025?: string;
}

function toBool(v: boolean | string | undefined): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'true';
  return false;
}

export default function MosaicV2Page({
  tiles,
  componentType,
  componentId,
  componentTitle,
  customColorA_change_11_12_2025: customColorA_change_11_12_2025,
  customColorB_change_11_12_2025: customColorB_change_11_12_2025,
}: MosaicV2PageProps) {
  return (
    <section
      className="cmp-mosaic-v2 prettier-animation"
      data-cmp-is="cmp-mosaic-v2"
      data-component_type={componentType}
      data-component_id={componentId}
      data-component_title={componentTitle}
    >
      <div className="cmp-mosaic-v2__tiles">
        {tiles?.map((item, index) => {
          const idxClass = `cmp-mosaic-v2__tile-wrapper-${index}`;
          const overlayClass = toBool(item.overlay) ? 'cmp-mosaic-v2-tile--overlay' : '';

          const newTab = toBool(item.ctaNewTab);
          const isDecorative = toBool(item.isImageDecorative);

          return (
            <div key={index} className={`cmp-mosaic-v2__tile-wrapper ${idxClass}`}>
              {/* Hero tile */}
              {item.tiletype === 'tile-type--hero' && (
                <div className={`cmp-mosaic-v2-tile cmp-mosaic-v2-tile--hero ${overlayClass}`}>
                  {item.fileReference && (
                    <img src={item.fileReference} alt={item.alt || ''} />
                  )}
                  <div className="cmp-mosaic-v2-tile__image-overlay"></div>
                  <div className="cmp-mosaic-v2-tile__text-content">
                    <div className="cmp-mosaic-v2-tile__heading-wrapper">
                      <div
                        className="cmp-mosaic-v2-tile__heading"
                        style={{ backgroundColor: item.headingBgColor || customColorA_change_11_12_2025 || undefined }}
                      >
                        {item.heading}
                      </div>
                    </div>
                    {item.introText ? (
                      <div className="cmp-mosaic-v2-tile__intro-text">{item.introText}</div>
                    ) : null}
                  </div>
                  {item.ctaLink && (
                    <a
                      href={item.ctaLink}
                      target={newTab ? '_blank' : '_self'}
                      className="cmp-mosaic-v2-tile__cta uds-brand-button light fill border large"
                      data-click_category={item.clickCategory || componentType}
                      data-click_id={item.clickId || componentId}
                      data-click_title={item.clickTitle || componentTitle}
                      data-click_name={item.clickName || item.ctaLabel}
                    >
                      <div className="inner">
                        <div className="text">{item.ctaLabel}</div>
                        <span className="cmp-mosaic-v2-tile__cta-icon"></span>
                      </div>
                    </a>
                  )}
                </div>
              )}

              {/* Icon tile */}
              {item.tiletype === 'tile-type--icon' && (
                <div
                  className="cmp-mosaic-v2-tile cmp-mosaic-v2-tile--icon"
                  style={{ backgroundColor: customColorA_change_11_12_2025 || undefined }}
                  tabIndex={0}
                >
                  <div className="cmp-mosaic-v2-tile__content">
                    {item.fileReference && (
                      <img
                        src={item.fileReference}
                        alt={isDecorative ? '' : item.alt || ''}
                        aria-hidden={isDecorative ? true : undefined}
                      />
                    )}
                    <div className="cmp-mosaic-v2-tile__heading-wrapper">
                      <div className="cmp-mosaic-v2-tile__heading">{item.heading}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content tile */}
              {item.tiletype === 'tile-type--content' && (
                <div
                  className="cmp-mosaic-v2-tile cmp-mosaic-v2-tile--content"
                  style={{ backgroundColor: item.tileBgColor || customColorA_change_11_12_2025 || customColorB_change_11_12_2025 || undefined }}
                >
                  <div className="cmp-mosaic-v2-tile__heading-wrapper">
                    <div className="cmp-mosaic-v2-tile__heading">{item.heading}</div>
                  </div>
                  <div className="cmp-mosaic-v2-tile__text-content">
                    {item.introText && (
                      <div className="cmp-mosaic-v2-tile__intro-text">{item.introText}</div>
                    )}
                  </div>
                  <div className="cmp-mosaic-v2-tile__bottom-content">
                    {item.faculty && (
                      <div className="cmp-mosaic-v2-tile__faculty" data-faculty-data={item.faculty}>
                        <img className="cmp-mosaic-v2-tile__faculty-icon-image" />
                        <div className="cmp-mosaic-v2-tile__faculty-name"></div>
                      </div>
                    )}
                    {item.ctaLink && (
                      <a
                        href={item.ctaLink}
                        target={newTab ? '_blank' : '_self'}
                        className="cmp-mosaic-v2-tile__cta"
                        data-click_category={item.clickCategory || componentType}
                        data-click_id={item.clickId || componentId}
                        data-click_title={item.clickTitle || componentTitle}
                        data-click_name={item.clickName || item.ctaLabel}
                        tabIndex={0}
                      >
                        <div className="cmp-mosaic-v2-tile__cta-label-wrapper">
                          <span className="cmp-mosaic-v2-tile__cta-label">{item.ctaLabel}</span>
                        </div>
                        <div className="cmp-mosaic-v2-tile__cta-icon-wrapper">
                          <span className="cmp-mosaic-v2-tile__cta-icon"></span>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Profile tile */}
              {item.tiletype === 'tile-type--profile' && (
                <div className="cmp-mosaic-v2-tile cmp-mosaic-v2-tile--profile">
                  <div className="cmp-mosaic-v2-tile__profile">
                    <div className="cmp-mosaic-v2-tile__profile-image">
                      {item.fileReference && (
                        <img src={item.fileReference} alt={item.alt || ''} />
                      )}
                    </div>
                    <div className="cmp-mosaic-v2-tile__profile-content">
                      <div className="cmp-mosaic-v2-tile__name">{item.profileName}</div>
                      <div className="cmp-mosaic-v2-tile__subheading">{item.subheading}</div>
                    </div>
                  </div>
                  <div className="cmp-mosaic-v2-tile__intro-text">{item.introText}</div>
                  <div className="cmp-mosaic-v2-tile__bottom-content">
                    {item.faculty && (
                      <div className="cmp-mosaic-v2-tile__faculty" data-faculty-data={item.faculty}>
                        <img className="cmp-mosaic-v2-tile__faculty-icon-image" />
                        <div className="cmp-mosaic-v2-tile__faculty-name"></div>
                      </div>
                    )}
                    {item.ctaLink && (
                      <a
                        href={item.ctaLink}
                        target={newTab ? '_blank' : '_self'}
                        className="cmp-mosaic-v2-tile__cta"
                        data-click_category={item.clickCategory || componentType}
                        data-click_id={item.clickId || componentId}
                        data-click_title={item.clickTitle || componentTitle}
                        data-click_name={item.clickName || item.ctaLabel}
                        tabIndex={0}
                      >
                        <div className="cmp-mosaic-v2-tile__cta-label-wrapper">
                          <span className="cmp-mosaic-v2-tile__cta-label">{item.ctaLabel}</span>
                        </div>
                        <div className="cmp-mosaic-v2-tile__cta-icon-wrapper">
                          <span className="cmp-mosaic-v2-tile__cta-icon"></span>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Image tile */}
              {item.tiletype === 'tile-type--image' && (
                <div className="cmp-mosaic-v2-tile cmp-mosaic-v2-tile--image">
                  {item.fileReference && (
                    <img src={item.fileReference} alt={item.alt || ''} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="cmp-mosaic-v2__controls">
        <div className="cmp-mosaic-v2__pagination"></div>
        <div className="cmp-mosaic-v2__prev-next">
          <button type="button" className="cmp-mosaic-v2__button-prev">
            <i className="fa fa-chevron-left" aria-hidden="true"></i>
          </button>
          <button type="button" className="cmp-mosaic-v2__button-next">
            <i className="fa fa-chevron-right" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </section>
  );
}

