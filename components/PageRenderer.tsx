'use client';

import type { ContentPage, ContentSection } from '@/lib/content';
import SearchBar from './SearchBar';
import Checkbox from './Checkbox';
import Card from './Card';
import ImagePage from './ImagePage';
import AuthorPage from './AuthorPage';
import MosaicV2Page from './MosaicV2Page';
import LocationCardV2Page from './LocationCardV2Page';
import HeroBannerPage from './HeroBannerPage';
import propsSchema from '@/generated/component-props.json';
import { ElementType, JSX } from 'react';

interface PageRendererProps {
  content: ContentPage;
}

export default function PageRenderer({ content }: PageRendererProps) {
  console.debug('[PageRenderer] rendering page:', content?.title, 'sections:', content?.sections?.length);
  const TYPE_TO_COMPONENT = {
    imagepage: { Comp: ImagePage, name: 'ImagePage' },
    authorpage: { Comp: AuthorPage, name: 'AuthorPage' },
    mosaicv2: { Comp: MosaicV2Page, name: 'MosaicV2Page' },
    locationcardv2: { Comp: LocationCardV2Page, name: 'LocationCardV2Page' },
    herobanner: { Comp: HeroBannerPage, name: 'HeroBannerPage' },
  } as const;

  function buildProps(section: ContentSection, type: keyof typeof TYPE_TO_COMPONENT) {
    const entry: any = (propsSchema as any)[TYPE_TO_COMPONENT[type].name];
    const specs: Array<{ name: string; type: string }> = entry?.props || [];
    const out: Record<string, any> = {};
    for (const spec of specs) {
      let val = (section as any)[spec.name];
      if ((val === undefined || val === null) && spec.type === 'array') {
        if (spec.name === 'tiles' && section.tilesJson) {
          try { val = JSON.parse(section.tilesJson); } catch {}
        }
        if (spec.name === 'locationItems' && section.itemsJson) {
          try { val = JSON.parse(section.itemsJson); } catch {}
        }
      }
      out[spec.name] = val;
    }
    // Sensible defaults for common props
    if (out.componentType == null) out.componentType = TYPE_TO_COMPONENT[type].name;
    if (out.componentId == null) out.componentId = '';
    if (out.componentTitle == null) out.componentTitle = content.title;
    return out;
  }
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
      case 'imagepage': {
        const props = buildProps(section, 'imagepage');
        return (
          <div key={index} className="mb-6">
            <ImagePage {...(props as any)} />
          </div>
        );
      }

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
      case 'authorpage': {
        const props = buildProps(section, 'authorpage');
        return (
          <div key={index} className="mb-6">
            <AuthorPage {...(props as any)} />
          </div>
        );
      }
      case 'mosaicv2':
        // Parse tiles from either structured array or JSON string
        {
          const props = buildProps(section, 'mosaicv2');
          if ((!props.tiles || (props.tiles as any).length === 0) && section.tilesJson) {
            try { props.tiles = JSON.parse(section.tilesJson); } catch {}
          }
          return (
            <div key={index} className="mb-6">
              <MosaicV2Page {...(props as any)} />
            </div>
          );
        }
      case 'locationcardv2': {
        const props = buildProps(section, 'locationcardv2');
        if ((!props.locationItems || (props.locationItems as any).length === 0) && section.itemsJson) {
          try { props.locationItems = JSON.parse(section.itemsJson); } catch {}
        }
        return (
          <div key={index} className="mb-6">
            <LocationCardV2Page {...(props as any)} />
          </div>
        );
      }
      case 'herobanner': {
        const props = buildProps(section, 'herobanner');
        return (
          <div key={index} className="mb-6">
            <HeroBannerPage {...(props as any)} />
          </div>
        );
      }

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
