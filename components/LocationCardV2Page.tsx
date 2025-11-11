'use client';

import React from 'react';

export interface LocationCardItem {
  latitude: string;
  longitude: string;
  locationTitle?: string;
  address?: string;
  directionsText?: string;
  linkLabel?: string;
  linkUrl?: string;
  linkNewWindow?: boolean | string;
  linkIsExternal?: boolean | string;
}

interface LocationCardV2PageProps {
  componentType: string;
  componentId: string;
  componentTitle: string;
  lat: string;
  lng: string;
  zoom?: string;
  locationName?: string;
  addressLocations?: string;
  locationItems?: LocationCardItem[];
  locationSubtitle?: string;
  openTooltip?: boolean | string;
  mapstyle?: string;
  markerstyle?: string;
  markerPin?: string;
  newWindow?: boolean | string;
  enableDirections?: boolean | string;
}

// Mocked map implementation to avoid external map libraries
export default function LocationCardV2Page({
  componentType,
  componentId,
  componentTitle,
  lat,
  lng,
  zoom = '10',
  locationName,
  addressLocations: addressLocations,
  markerPin = '/etc.clientlibs/unsw-common/clientlibs/unsw-uds-assets/site/styles/src/assets/resources/icons/google-pin.svg',
  locationItems: items = [],
}: LocationCardV2PageProps) {
  const latNum = Number.parseFloat(lat);
  const lngNum = Number.parseFloat(lng);
  const zoomNum = Number.parseInt(zoom as string, 10);

  return (
    <span
      data-component_type={componentType}
      data-component_id={componentId}
      data-component_title={componentTitle}
    >
      {/* Mocked map container (no external libraries) */}
      <div
        className="w-full h-[400px] rounded-md border border-gray-300 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center relative overflow-hidden"
        aria-label="Map preview"
      >
        {/* Decorative mock grid */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="relative z-10 text-center">
          <div className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">Map Mock</div>
          <div className="mt-1 font-medium text-gray-800 dark:text-gray-200">
            {Number.isFinite(latNum) && Number.isFinite(lngNum)
              ? `Center: (${latNum.toFixed(4)}, ${lngNum.toFixed(4)})`
              : 'Invalid coordinates'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Zoom: {Number.isFinite(zoomNum) ? zoomNum : '-'}</div>

          {/* Primary marker info */}
          {(locationName || addressLocations) && (
            <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
              {locationName && <div className="font-semibold">{locationName}</div>}
              {addressLocations && <div><div>{addressLocations}</div></div>}
            </div>
          )}
        </div>

        {/* Mocked pin icon overlay */}
        {Number.isFinite(latNum) && Number.isFinite(lngNum) && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              className="w-5 h-5 rounded-full bg-red-600 shadow-md ring-2 ring-white dark:ring-gray-800"
              title={locationName || 'Selected location'}
              aria-label="Primary marker"
            />
          </div>
        )}
      </div>

      {/* Additional markers list (mock) */}
      {items && items.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Locations</div>
          <ul className="space-y-2">
            {items.map((m, idx) => {
              const la = Number.parseFloat(m.latitude);
              const lo = Number.parseFloat(m.longitude);
              const coords = Number.isFinite(la) && Number.isFinite(lo)
                ? `${la.toFixed(4)}, ${lo.toFixed(4)}`
                : 'Invalid coordinates';
              const newWindow = typeof m.linkNewWindow === 'string' ? m.linkNewWindow === 'true' : !!m.linkNewWindow;
              const isExternal = typeof m.linkIsExternal === 'string' ? m.linkIsExternal === 'true' : !!m.linkIsExternal;
              return (
                <li key={idx} className="p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{m.locationTitle || `Marker #${idx + 1}`}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{coords}</div>
                      {m.address && <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">{m.address}</div>}
                    </div>
                    {m.linkUrl && (
                      <a
                        href={m.linkUrl}
                        target={newWindow ? '_blank' : '_self'}
                        rel={isExternal ? 'noopener noreferrer' : undefined}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                      >
                        {m.linkLabel || 'View'}
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </span>
  );
}

