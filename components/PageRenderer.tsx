'use client';

import type { ContentPage, ContentSection } from '@/lib/content';
import SearchBar from './SearchBar';
import Checkbox from './Checkbox';
import Card from './Card';
import ImagePage from './ImagePage';
import AuthorPage from './AuthorPage';
import MosaicV2Page from './MosaicV2Page';
import LocationCardV2Page from './LocationCardV2Page';
import { ElementType, JSX } from 'react';

interface PageRendererProps {
  content: ContentPage;
}

export default function PageRenderer({ content }: PageRendererProps) {
  console.debug('[PageRenderer] rendering page:', content?.title, 'sections:', content?.sections?.length);
  const renderSection = (section: ContentSection, index: number) => {
    console.debug('[PageRenderer] section', index, 'type:', section.type);
    switch (section.type) {
      case 'heading':
        const HeadingTag = `h${section.level || 2}` as ElementType;
        return (
          <HeadingTag 
            key={index}
            className={`font-bold text-gray-900 dark:text-gray-100 mb-4 ${
              section.level === 1 ? 'text-4xl' : 
              section.level === 2 ? 'text-3xl' : 
              section.level === 3 ? 'text-2xl' : 'text-xl'
            }`}
          >
            {section.value}
          </HeadingTag>
        );

      case 'text':
        return (
          <p 
            key={index}
            className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed"
          >
            {section.value}
          </p>
        );

      case 'image':
        return (
          <div key={index} className="mb-6">
            <img
              src={section.src}
              alt={section.alt || ''}
              className="w-full h-auto rounded-lg shadow-md"
            />
            {section.alt && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                {section.alt}
              </p>
            )}
          </div>
        );
      case 'imagepage':
        return (
          <div key={index} className="mb-6">
            <ImagePage
              componentType={section.componentType || 'ImagePage'}
              componentId={section.componentId || ''}
              componentTitle={section.componentTitle || content.title}
              src={section.src || ''}
              alt={section.alt}
              articleStyle={section.articleStyle}
              quoteText={section.quoteText}
            />
          </div>
        );

      case 'list':
        return (
          <ul key={index} className="list-disc list-inside mb-4 text-gray-700 dark:text-gray-300">
            {section.items?.map((item, itemIndex) => (
              <li key={itemIndex} className="mb-2">
                {item}
              </li>
            ))}
          </ul>
        );

      case 'searchbar':
        return (
          <div key={index} className="mb-6">
            <SearchBar 
              placeholder={section.placeholder || 'Search...'} 
              onSearch={(query) => console.log('Search:', query)}
            />
          </div>
        );

      case 'checkbox':
        return (
          <div key={index} className="mb-4">
            <Checkbox 
              label={section.label || 'Checkbox option'} 
              checked={false}
            />
          </div>
        );

      case 'card':
        return (
          <div key={index} className="mb-6">
            <Card
              title={section.title || 'Card Title'}
              description={section.description || section.value}
              image={section.imageUrl}
              href={section.linkUrl}
            />
          </div>
        );
      case 'authorpage':
        return (
          <div key={index} className="mb-6">
            <AuthorPage
              componentType={section.componentType || 'AuthorPage'}
              componentId={section.componentId || ''}
              componentTitle={section.componentTitle || content.title}
              linkUrl={section.linkUrl}
              firstNamesssasiasjas={section.firstName}
              lastName={section.lastName}
              authorTitle={section.authorTitle}
              description={section.description}
              src={section.src}
              alt={section.alt}
              clickCategory={section.clickCategory}
              clickId={section.clickId}
              clickName={section.clickName}
              clickTitle={section.clickTitle}
            />
          </div>
        );
      case 'mosaicv2':
        // Parse tiles from either structured array or JSON string
        let tiles = section.tiles || [];
        if ((!tiles || tiles.length === 0) && section.tilesJson) {
          try {
            const parsed = JSON.parse(section.tilesJson);
            if (Array.isArray(parsed)) tiles = parsed;
          } catch (e) {
            console.warn('Invalid tilesJson for mosaicv2 section:', e);
          }
        }
        return (
          <div key={index} className="mb-6">
            <MosaicV2Page
              tiles={tiles as any}
              componentType={section.componentType || 'MosaicV2'}
              componentId={section.componentId || ''}
              componentTitle={section.componentTitle || content.title}
              customColor1={section.customColor1}
              customColor2={section.customColor2}
            />
          </div>
        );
      case 'locationcardv2':
        // Parse items from either structured array or JSON string
        let items = section.locationItems || [];
        if ((!items || (items as any).length === 0) && section.itemsJson) {
          try {
            const parsed = JSON.parse(section.itemsJson);
            if (Array.isArray(parsed)) items = parsed as any;
          } catch (e) {
            console.warn('Invalid itemsJson for locationcardv2 section:', e);
          }
        }
        return (
          <div key={index} className="mb-6">
            <LocationCardV2Page
              componentType={section.componentType || 'LocationCardV2'}
              componentId={section.componentId || ''}
              componentTitle={section.componentTitle || content.title}
              lat={section.lat || ''}
              lng={section.lng || ''}
              zoom={section.zoom}
              locationName={section.locationName}
              locationSubtitle={section.locationSubtitle}
              address={section.address}
              openTooltip={section.openTooltip}
              mapstyle={section.mapstyle}
              markerstyle={section.markerstyle}
              markerPin={section.markerPin}
              newWindow={section.newWindow}
              enableDirections={section.enableDirections}
              locationItems={items as any}
            />
          </div>
        );

      default:
        console.warn('[PageRenderer] unknown section type:', (section as any)?.type);
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <article className="prose prose-lg max-w-none">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {content.title}
          </h1>
          {content.description && (
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {content.description}
            </p>
          )}
        </header>

        <div className="space-y-6">
          {content.sections.map((section, index) => renderSection(section, index))}
        </div>

        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            {content.createdAt && (
              <span>Created: {new Date(content.createdAt).toLocaleDateString()}</span>
            )}
            {content.updatedAt && (
              <span>Updated: {new Date(content.updatedAt).toLocaleDateString()}</span>
            )}
          </div>
        </footer>
      </article>
    </div>
  );
}
