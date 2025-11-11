'use client';

import { useEffect, useState } from 'react';
import propsSchema from '@/generated/component-props.json';
import { ContentPage, ContentSection } from '@/lib/content';

interface EditorProps {
  content?: ContentPage;
  onSave: (content: ContentPage) => void;
  onCancel: () => void;
}

export default function Editor({ content, onSave, onCancel }: EditorProps) {
  const fieldId = (field: keyof ContentPage | keyof ContentSection) => String(field);
  const fieldName = (field: keyof ContentPage | keyof ContentSection) => `./${String(field)}`;
  const bindPageField = (
    field: keyof ContentPage,
    onChange: (v: string) => void,
  ) => ({
    id: fieldId(field),
    name: fieldName(field),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(e.target.value),
  });
  const bindSectionField = (
    index: number,
    field: keyof ContentSection,
    onChange: (v: string | number | string[]) => void,
  ) => ({
    id: fieldId(field),
    name: fieldName(field),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange((field === 'level' ? parseInt(e.target.value) : e.target.value) as any),
  });
  const bindNewField = (
    field: keyof ContentSection,
    onChange: (v: string | number | string[]) => void,
  ) => ({
    id: fieldId(field),
    name: fieldName(field),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange((field === 'level' ? parseInt(e.target.value) : e.target.value) as any),
  });
  const [formData, setFormData] = useState<ContentPage>(
    content || {
      title: '',
      path: '',
      description: '',
      sections: [],
    }
  );

  const [newSection, setNewSection] = useState<ContentSection>({
    type: 'text',
    value: '',
  });

  // Dynamic props helpers driven by component prop interfaces
  const TYPE_TO_COMPONENT: Partial<Record<ContentSection['type'], string>> = {
    imagepage: 'ImagePage',
    authorpage: 'AuthorPage',
    mosaicv2: 'MosaicV2Page',
    locationcardv2: 'LocationCardV2Page',
  };

  type PropSpec = { name: string; type: string; optional?: boolean };
  const getPropSpecsForType = (type: ContentSection['type']): PropSpec[] => {
    const comp = TYPE_TO_COMPONENT[type];
    if (!comp) return [];
    const entry: any = (propsSchema as any)[comp];
    return entry?.props || [];
  };

  const coerceInput = (specType: string, raw: string) => {
    if (specType === 'number') {
      const n = Number(raw);
      return Number.isFinite(n) ? n : (raw as any);
    }
    if (specType === 'boolean' || specType === 'boolean|string') {
      if (raw === 'true') return 'true';
      if (raw === 'false') return 'false';
      return '';
    }
    return raw;
  };

  const toInputValue = (specType: string, val: any): string => {
    if (specType === 'boolean' || specType === 'boolean|string') {
      if (typeof val === 'boolean') return String(val);
      return val ?? '';
    }
    if (specType === 'number') {
      if (typeof val === 'number') return String(val);
      return val ?? '';
    }
    return (val ?? '') as string;
  };

  const renderDynamicSectionFields = (index: number, section: ContentSection) => {
    const specs = getPropSpecsForType(section.type);
    if (!specs.length) return null;
    return (
      <>
        {specs.map((spec) => {
          const key = `${index}-${spec.name}`;
          if (spec.type === 'array') {
            // Handle arrays via JSON textarea; parse into the real prop if valid
            const jsonKey = spec.name === 'tiles' ? 'tilesJson' : spec.name === 'locationItems' ? 'itemsJson' : `${spec.name}Json`;
            const current = (section as any)[jsonKey] ?? (Array.isArray((section as any)[spec.name]) ? JSON.stringify((section as any)[spec.name], null, 2) : '');
            return (
              <div key={key} className="md:col-span-2">
                <label htmlFor={fieldId(jsonKey as any)} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{spec.name} JSON</label>
                <textarea
                  id={fieldId(jsonKey as any)}
                  name={fieldName(jsonKey as any)}
                  value={current}
                  onChange={(e) => {
                    const raw = e.target.value;
                    updateSection(index, jsonKey as any, raw);
                    try {
                      const parsed = JSON.parse(raw);
                      updateSection(index, spec.name as any, parsed as any);
                    } catch {
                      // keep as string only
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={6}
                />
              </div>
            );
          }
          if (spec.type === 'object') {
            const jsonKey = `${spec.name}Json` as any;
            const current = (section as any)[jsonKey] ?? ((section as any)[spec.name] ? JSON.stringify((section as any)[spec.name], null, 2) : '');
            return (
              <div key={key} className="md:col-span-2">
                <label htmlFor={fieldId(jsonKey)} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{spec.name} JSON</label>
                <textarea
                  id={fieldId(jsonKey)}
                  name={fieldName(jsonKey)}
                  value={current}
                  onChange={(e) => {
                    const raw = e.target.value;
                    updateSection(index, jsonKey, raw);
                    try {
                      const parsed = JSON.parse(raw);
                      updateSection(index, spec.name as any, parsed as any);
                    } catch {
                      // ignore parse errors
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={6}
                />
              </div>
            );
          }
          if (spec.type === 'boolean' || spec.type === 'boolean|string') {
            const value = toInputValue(spec.type, (section as any)[spec.name]);
            return (
              <div key={key}>
                <label htmlFor={fieldId(spec.name as any)} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{spec.name}</label>
                <select
                  id={fieldId(spec.name as any)}
                  name={fieldName(spec.name as any)}
                  value={value}
                  onChange={(e) => updateSection(index, spec.name as any, coerceInput(spec.type, e.target.value) as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">(unset)</option>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </div>
            );
          }
          const value = toInputValue(spec.type, (section as any)[spec.name]);
          return (
            <div key={key} className={spec.name === 'componentTitle' ? 'md:col-span-2' : undefined}>
              <label htmlFor={fieldId(spec.name as any)} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{spec.name}</label>
              <input
                type="text"
                id={fieldId(spec.name as any)}
                name={fieldName(spec.name as any)}
                value={value}
                onChange={(e) => updateSection(index, spec.name as any, coerceInput(spec.type, e.target.value) as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          );
        })}
      </>
    );
  };

  const renderDynamicNewSectionFields = (type: ContentSection['type']) => {
    const specs = getPropSpecsForType(type);
    if (!specs.length) return null;
    return (
      <>
        {specs.map((spec) => {
          const key = `new-${spec.name}`;
          if (spec.type === 'array') {
            const jsonKey = spec.name === 'tiles' ? 'tilesJson' : spec.name === 'locationItems' ? 'itemsJson' : `${spec.name}Json`;
            const current = (newSection as any)[jsonKey] ?? (Array.isArray((newSection as any)[spec.name]) ? JSON.stringify((newSection as any)[spec.name], null, 2) : '');
            return (
              <div key={key} className="md:col-span-2">
                <label htmlFor={fieldId(jsonKey as any)} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{spec.name} JSON</label>
                <textarea
                  id={fieldId(jsonKey as any)}
                  name={fieldName(jsonKey as any)}
                  value={current}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setNewSection(prev => ({ ...prev, [jsonKey]: raw } as any));
                    try {
                      const parsed = JSON.parse(raw);
                      setNewSection(prev => ({ ...prev, [spec.name]: parsed } as any));
                    } catch {
                      // ignore parse errors
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={6}
                />
              </div>
            );
          }
          if (spec.type === 'object') {
            const jsonKey = `${spec.name}Json` as any;
            const current = (newSection as any)[jsonKey] ?? ((newSection as any)[spec.name] ? JSON.stringify((newSection as any)[spec.name], null, 2) : '');
            return (
              <div key={key} className="md:col-span-2">
                <label htmlFor={fieldId(jsonKey)} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{spec.name} JSON</label>
                <textarea
                  id={fieldId(jsonKey)}
                  name={fieldName(jsonKey)}
                  value={current}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setNewSection(prev => ({ ...prev, [jsonKey]: raw } as any));
                    try {
                      const parsed = JSON.parse(raw);
                      setNewSection(prev => ({ ...prev, [spec.name]: parsed } as any));
                    } catch {
                      // ignore parse errors
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={6}
                />
              </div>
            );
          }
          if (spec.type === 'boolean' || spec.type === 'boolean|string') {
            const value = toInputValue(spec.type, (newSection as any)[spec.name]);
            return (
              <div key={key}>
                <label htmlFor={fieldId(spec.name as any)} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{spec.name}</label>
                <select
                  id={fieldId(spec.name as any)}
                  name={fieldName(spec.name as any)}
                  value={value}
                  onChange={(e) => setNewSection(prev => ({ ...prev, [spec.name]: coerceInput(spec.type, e.target.value) } as any))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">(unset)</option>
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              </div>
            );
          }
          const value = toInputValue(spec.type, (newSection as any)[spec.name]);
          return (
            <div key={key} className={spec.name === 'componentTitle' ? 'md:col-span-2' : undefined}>
              <label htmlFor={fieldId(spec.name as any)} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{spec.name}</label>
              <input
                type="text"
                id={fieldId(spec.name as any)}
                name={fieldName(spec.name as any)}
                value={value}
                onChange={(e) => setNewSection(prev => ({ ...prev, [spec.name]: coerceInput(spec.type, e.target.value) } as any))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          );
        })}
      </>
    );
  };

  useEffect(() => {
    console.debug('[Editor] Mounted with content prop:', content ? { title: content.title, path: content.path, sections: content.sections?.length } : null);
  }, []);

  useEffect(() => {
    console.debug('[Editor] newSection changed:', newSection);
  }, [newSection]);

  useEffect(() => {
    console.debug('[Editor] formData changed:', {
      title: formData.title,
      path: formData.path,
      descriptionLength: formData.description?.length || 0,
      sections: formData.sections?.length || 0,
    });
  }, [formData]);

  const handleInputChange = (field: keyof ContentPage, value: string) => {
    console.debug('[Editor] handleInputChange:', field, value);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSection = () => {
    // Check if section has any content based on its type
    const dynamicSpecs = getPropSpecsForType(newSection.type);
    const dynamicHasContent = dynamicSpecs.some(spec => {
      const val = (newSection as any)[spec.name];
      if (spec.type === 'array') {
        const jsonKey = spec.name === 'tiles' ? 'tilesJson' : spec.name === 'locationItems' ? 'itemsJson' : `${spec.name}Json`;
        return Boolean(val && (val as any).length) || Boolean((newSection as any)[jsonKey]);
      }
      return Boolean(val);
    });
    const hasContent = 
      newSection.value || 
      newSection.src || 
      newSection.placeholder || 
      newSection.label || 
      newSection.title ||
      newSection.items ||
      // imagepage-specific fields
      newSection.componentId ||
      newSection.componentType ||
      newSection.componentTitle ||
      newSection.articleStyle ||
      newSection.quoteText ||
      // authorpage-specific fields
      newSection.firstName ||
      newSection.lastName ||
      newSection.authorTitle ||
      newSection.clickCategory ||
      newSection.clickId ||
      newSection.clickName ||
      newSection.clickTitle ||
      // mosaicv2-specific fields
      newSection.tilesJson ||
      // locationcardv2-specific fields
      newSection.lat ||
      newSection.lng ||
      newSection.itemsJson ||
      dynamicHasContent;
    
    if (hasContent) {
      console.log('[Editor] addSection with content:', newSection);
      setFormData(prev => ({
        ...prev,
        sections: [...prev.sections, { ...newSection }],
      }));
      // Reset to default based on type
      setNewSection({ 
        type: newSection.type, 
        value: '',
        placeholder: '',
        label: '',
        title: '',
        description: '',
        imageUrl: '',
        linkUrl: '',
        // imagepage defaults
        src: '',
        alt: '',
        componentType: '',
        componentId: '',
        componentTitle: '',
        articleStyle: '',
        quoteText: '',
        // authorpage defaults
        firstName: '',
        lastName: '',
        authorTitle: '',
        clickCategory: '',
        clickId: '',
        clickName: '',
        clickTitle: '',
        // mosaicv2 defaults
        tilesJson: '',
        customColor1: '',
        customColor2: ''
        ,
        // locationcardv2 defaults
        lat: '',
        lng: '',
        zoom: '',
        locationName: '',
        locationSubtitle: '',
        address: '',
        openTooltip: '',
        mapstyle: '',
        markerstyle: '',
        markerPin: '',
        newWindow: '',
        enableDirections: '',
        itemsJson: ''
      });
      console.info('[Editor] Section added. Type:', newSection.type);
    } else {
      console.warn('[Editor] addSection aborted: no content in newSection', newSection);
    }
  };

  const removeSection = (index: number) => {
    const toRemove = formData.sections[index];
    console.debug('[Editor] removeSection index:', index, 'section:', toRemove);
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const updateSection = (index: number, field: keyof ContentSection, value: string | number | string[]) => {
    console.debug('[Editor] updateSection:', { index, field, value });
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => {
        if (i === index) {
          return { ...section, [field]: value };
        }
        return section;
      }),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.debug('[Editor] handleSubmit with content:', {
        title: formData.title,
        path: formData.path,
        sections: formData.sections.length,
      });
      onSave(formData);
      console.info('[Editor] onSave called');
    } catch (err) {
      console.error('[Editor] onSave threw an error:', err);
    }
  };

  const handleCancel = () => {
    try {
      console.debug('[Editor] handleCancel invoked');
      onCancel();
    } catch (err) {
      console.error('[Editor] onCancel threw an error:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            {content ? 'Edit Content' : 'Create New Content'}
          </h2>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor={fieldId('title')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                {...bindPageField('title', (v) => handleInputChange('title', v))}
                value={formData.title}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label htmlFor={fieldId('path')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Path
              </label>
              <input
                type="text"
                {...bindPageField('path', (v) => handleInputChange('path', v))}
                value={formData.path}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="/about"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor={fieldId('description')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              {...bindPageField('description', (v) => handleInputChange('description', v))}
              value={formData.description}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
            />
          </div>

          {/* Sections */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Content Sections
            </h3>

            {formData.sections.map((section, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Section {index + 1}: {section.type}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSection(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={fieldId('type')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type
                    </label>
                    <select
                      {...bindSectionField(index, 'type', (v) => updateSection(index, 'type', v as ContentSection['type']))}
                      value={section.type}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="text">Text</option>
                      <option value="heading">Heading</option>
                      <option value="image">Image</option>
                      <option value="list">List</option>
                      <option value="searchbar">Search Bar</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="card">Card</option>
                      <option value="imagepage">Image Page</option>
                      <option value="authorpage">Author Page</option>
                      <option value="mosaicv2">Mosaic V2</option>
                      <option value="locationcardv2">Location Card V2</option>
                    </select>
                  </div>

                  {section.type === 'heading' && (
                    <div>
                      <label htmlFor={fieldId('level')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Level
                      </label>
                      <select
                        {...bindSectionField(index, 'level', (v) => updateSection(index, 'level', v as number))}
                        value={section.level || 2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value={1}>H1</option>
                        <option value={2}>H2</option>
                        <option value={3}>H3</option>
                        <option value={4}>H4</option>
                      </select>
                    </div>
                  )}

                  {(section.type === 'text' || section.type === 'heading') && (
                    <div className="md:col-span-2">
                      <label htmlFor={fieldId('value')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Content
                      </label>
                      <textarea
                        {...bindSectionField(index, 'value', (v) => updateSection(index, 'value', v as string))}
                        value={section.value || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows={3}
                      />
                    </div>
                  )}

                  {section.type === 'image' && (
                    <>
                      <div>
                        <label htmlFor={fieldId('src')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Image URL
                        </label>
                        <input
                          type="url"
                          {...bindSectionField(index, 'src', (v) => updateSection(index, 'src', v as string))}
                          value={section.src || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('alt')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Alt Text
                        </label>
                        <input
                          type="text"
                          {...bindSectionField(index, 'alt', (v) => updateSection(index, 'alt', v as string))}
                          value={section.alt || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </>
                  )}

                  {section.type === 'list' && (
                    <div className="md:col-span-2">
                      <label htmlFor={fieldId('items')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        List Items (one per line)
                      </label>
                      <textarea
                        id={fieldId('items')}
                        name={fieldName('items')}
                        value={section.items?.join('\n') || ''}
                        onChange={(e) => updateSection(index, 'items', e.target.value.split('\n').filter(item => item.trim()))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows={4}
                        placeholder="Item 1&#10;Item 2&#10;Item 3"
                      />
                    </div>
                  )}

                  {section.type === 'searchbar' && (
                    <div className="md:col-span-2">
                      <label htmlFor={fieldId('placeholder')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Placeholder Text
                      </label>
                      <input
                        type="text"
                        id={fieldId('placeholder')}
                        name={fieldName('placeholder')}
                        value={section.placeholder || ''}
                        onChange={(e) => updateSection(index, 'placeholder', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Search..."
                      />
                    </div>
                  )}

                  {section.type === 'checkbox' && (
                    <div className="md:col-span-2">
                      <label htmlFor={fieldId('label')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Checkbox Label
                      </label>
                      <input
                        type="text"
                        id={fieldId('label')}
                        name={fieldName('label')}
                        value={section.label || ''}
                        onChange={(e) => updateSection(index, 'label', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Option label"
                      />
                    </div>
                  )}

                  {section.type === 'card' && (
                    <>
                      <div>
                        <label htmlFor={fieldId('title')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Card Title
                        </label>
                        <input
                          type="text"
                          id={fieldId('title')}
                          name={fieldName('title')}
                          value={section.title || ''}
                          onChange={(e) => updateSection(index, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('imageUrl')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Image URL (optional)
                        </label>
                        <input
                          type="url"
                          id={fieldId('imageUrl')}
                          name={fieldName('imageUrl')}
                          value={section.imageUrl || ''}
                          onChange={(e) => updateSection(index, 'imageUrl', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor={fieldId('description')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          id={fieldId('description')}
                          name={fieldName('description')}
                          value={section.description || ''}
                          onChange={(e) => updateSection(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('linkUrl')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Link URL (optional)
                        </label>
                        <input
                          type="url"
                          {...bindSectionField(index, 'linkUrl', (v) => updateSection(index, 'linkUrl', v as string))}
                          value={section.linkUrl || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </>
                  )}

                  {section.type === 'imagepage' && renderDynamicSectionFields(index, section)}
                  {false && section.type === 'imagepage' && (
                    <>
                      <div>
                        <label htmlFor={fieldId('componentType')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Component Type
                        </label>
                        <input
                          type="text"
                          {...bindSectionField(index, 'componentType', (v) => updateSection(index, 'componentType', v as string))}
                          value={section.componentType || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('componentId')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Component ID
                        </label>
                        <input
                          type="text"
                          {...bindSectionField(index, 'componentId', (v) => updateSection(index, 'componentId', v as string))}
                          value={section.componentId || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('componentTitle')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Component Title
                        </label>
                        <input
                          type="text"
                          {...bindSectionField(index, 'componentTitle', (v) => updateSection(index, 'componentTitle', v as string))}
                          value={section.componentTitle || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('src')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Image URL
                        </label>
                        <input
                          type="url"
                          {...bindSectionField(index, 'src', (v) => updateSection(index, 'src', v as string))}
                          value={section.src || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('alt')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Alt Text
                        </label>
                        <input
                          type="text"
                          {...bindSectionField(index, 'alt', (v) => updateSection(index, 'alt', v as string))}
                          value={section.alt || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('articleStyle')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Article Style
                        </label>
                        <input
                          type="text"
                          {...bindSectionField(index, 'articleStyle', (v) => updateSection(index, 'articleStyle', v as string))}
                          value={section.articleStyle || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor={fieldId('quoteText')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Quote Text
                        </label>
                        <textarea
                          {...bindSectionField(index, 'quoteText', (v) => updateSection(index, 'quoteText', v as string))}
                          value={section.quoteText || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  {section.type === 'authorpage' && renderDynamicSectionFields(index, section)}
                  {false && section.type === 'authorpage' && (
                    <>
                      <div>
                        <label htmlFor={fieldId('componentType')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Component Type</label>
                        <input
                          type="text"
                          {...bindSectionField(index, 'componentType', (v) => updateSection(index, 'componentType', v as string))}
                          value={section.componentType || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('componentId')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Component ID</label>
                        <input
                          type="text"
                          {...bindSectionField(index, 'componentId', (v) => updateSection(index, 'componentId', v as string))}
                          value={section.componentId || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('componentTitle')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Component Title</label>
                        <input
                          type="text"
                          {...bindSectionField(index, 'componentTitle', (v) => updateSection(index, 'componentTitle', v as string))}
                          value={section.componentTitle || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('linkUrl')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link URL</label>
                        <input
                          type="url"
                          {...bindSectionField(index, 'linkUrl', (v) => updateSection(index, 'linkUrl', v as string))}
                          value={section.linkUrl || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('firstName')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                        <input
                          type="text"
                          {...bindSectionField(index, 'firstName', (v) => updateSection(index, 'firstName', v as string))}
                          value={section.firstName || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('lastName')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                        <input
                          type="text"
                          {...bindSectionField(index, 'lastName', (v) => updateSection(index, 'lastName', v as string))}
                          value={section.lastName || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('authorTitle')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Author Title</label>
                        <input
                          type="text"
                          {...bindSectionField(index, 'authorTitle', (v) => updateSection(index, 'authorTitle', v as string))}
                          value={section.authorTitle || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor={fieldId('description')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                          {...bindSectionField(index, 'description', (v) => updateSection(index, 'description', v as string))}
                          value={section.description || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('src')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
                        <input
                          type="url"
                          {...bindSectionField(index, 'src', (v) => updateSection(index, 'src', v as string))}
                          value={section.src || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('alt')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alt Text</label>
                        <input
                          type="text"
                          {...bindSectionField(index, 'alt', (v) => updateSection(index, 'alt', v as string))}
                          value={section.alt || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('clickCategory')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Click Category</label>
                        <input
                          type="text"
                          {...bindSectionField(index, 'clickCategory', (v) => updateSection(index, 'clickCategory', v as string))}
                          value={section.clickCategory || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('clickId')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Click ID</label>
                        <input
                          type="text"
                          {...bindSectionField(index, 'clickId', (v) => updateSection(index, 'clickId', v as string))}
                          value={section.clickId || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('clickName')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Click Name</label>
                        <input
                          type="text"
                          {...bindSectionField(index, 'clickName', (v) => updateSection(index, 'clickName', v as string))}
                          value={section.clickName || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('clickTitle')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Click Title</label>
                        <input
                          type="text"
                          {...bindSectionField(index, 'clickTitle', (v) => updateSection(index, 'clickTitle', v as string))}
                          value={section.clickTitle || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </>
                  )}

                  {section.type === 'mosaicv2' && renderDynamicSectionFields(index, section)}
                  {false && section.type === 'mosaicv2' && (
                    <>
                      <div className="md:col-span-2">
                        <label htmlFor={fieldId('componentType')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Component Type</label>
                        <input
                          type="text"
                          {...bindSectionField(index, 'componentType', (v) => updateSection(index, 'componentType', v as string))}
                          value={section.componentType || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('componentId')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Component ID</label>
                        <input
                          type="text"
                          {...bindSectionField(index, 'componentId', (v) => updateSection(index, 'componentId', v as string))}
                          value={section.componentId || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor={fieldId('componentTitle')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Component Title</label>
                        <input
                          type="text"
                          {...bindSectionField(index, 'componentTitle', (v) => updateSection(index, 'componentTitle', v as string))}
                          value={section.componentTitle || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('customColor1')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custom Color 1</label>
                        <input
                          type="text"
                          id={fieldId('customColor1')}
                          name={fieldName('customColor1')}
                          value={section.customColor1 || ''}
                          onChange={(e) => updateSection(index, 'customColor1', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="#FFEE00"
                        />
                      </div>
                      <div>
                        <label htmlFor={fieldId('customColor2')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custom Color 2</label>
                        <input
                          type="text"
                          id={fieldId('customColor2')}
                          name={fieldName('customColor2')}
                          value={section.customColor2 || ''}
                          onChange={(e) => updateSection(index, 'customColor2', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="#000000"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor={fieldId('tilesJson')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiles JSON</label>
                        <textarea
                          id={fieldId('tilesJson')}
                          name={fieldName('tilesJson')}
                          value={section.tilesJson || ''}
                          onChange={(e) => updateSection(index, 'tilesJson', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          rows={6}
                          placeholder='[
  {"tiletype":"tile-type--hero","fileReference":"/img.jpg","heading":"Heading","introText":"Intro","ctaLink":"/","ctaLabel":"Learn more","ctaNewTab":"false","overlay":"false"},
  {"tiletype":"tile-type--icon","fileReference":"/icon.png","heading":"Icon tile","isImageDecorative":"true"},
  {"tiletype":"tile-type--content","heading":"Content","introText":"Text...","ctaLink":"/","ctaLabel":"Go"},
  {"tiletype":"tile-type--profile","fileReference":"/avatar.jpg","profileName":"Jane Doe","subheading":"Professor","introText":"Bio...","ctaLink":"/","ctaLabel":"View"},
  {"tiletype":"tile-type--image","fileReference":"/photo.jpg","alt":"Alt"}
]'
                        />
                      </div>
                    </>
                  )}

                  {section.type === 'locationcardv2' && renderDynamicSectionFields(index, section)}
                  {false && section.type === 'locationcardv2' && (
                    <>
                      <div>
                        <label htmlFor={fieldId('componentType')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Component Type</label>
                        <input type="text" {...bindSectionField(index, 'componentType', (v) => updateSection(index, 'componentType', v as string))} value={section.componentType || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div>
                        <label htmlFor={fieldId('componentId')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Component ID</label>
                        <input type="text" {...bindSectionField(index, 'componentId', (v) => updateSection(index, 'componentId', v as string))} value={section.componentId || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor={fieldId('componentTitle')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Component Title</label>
                        <input type="text" {...bindSectionField(index, 'componentTitle', (v) => updateSection(index, 'componentTitle', v as string))} value={section.componentTitle || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>

                      <div>
                        <label htmlFor={fieldId('lat')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Center Latitude</label>
                        <input type="text" {...bindSectionField(index, 'lat', (v) => updateSection(index, 'lat', v as string))} value={section.lat || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div>
                        <label htmlFor={fieldId('lng')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Center Longitude</label>
                        <input type="text" {...bindSectionField(index, 'lng', (v) => updateSection(index, 'lng', v as string))} value={section.lng || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div>
                        <label htmlFor={fieldId('zoom')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zoom</label>
                        <input type="text" {...bindSectionField(index, 'zoom', (v) => updateSection(index, 'zoom', v as string))} value={section.zoom || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>

                      <div className="md:col-span-2">
                        <label htmlFor={fieldId('locationName')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location Name</label>
                        <input type="text" {...bindSectionField(index, 'locationName', (v) => updateSection(index, 'locationName', v as string))} value={section.locationName || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor={fieldId('locationSubtitle')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location Subtitle (button text)</label>
                        <input type="text" {...bindSectionField(index, 'locationSubtitle', (v) => updateSection(index, 'locationSubtitle', v as string))} value={section.locationSubtitle || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor={fieldId('address')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                        <input type="text" {...bindSectionField(index, 'address', (v) => updateSection(index, 'address', v as string))} value={section.address || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>

                      <div>
                        <label htmlFor={fieldId('openTooltip')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Open Tooltip (true/false)</label>
                        <input type="text" {...bindSectionField(index, 'openTooltip', (v) => updateSection(index, 'openTooltip', v as string))} value={(section.openTooltip as string) || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div>
                        <label htmlFor={fieldId('mapstyle')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Map Style</label>
                        <input type="text" {...bindSectionField(index, 'mapstyle', (v) => updateSection(index, 'mapstyle', v as string))} value={section.mapstyle || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div>
                        <label htmlFor={fieldId('markerstyle')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marker Style</label>
                        <input type="text" {...bindSectionField(index, 'markerstyle', (v) => updateSection(index, 'markerstyle', v as string))} value={section.markerstyle || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor={fieldId('markerPin')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marker Pin URL</label>
                        <input type="url" {...bindSectionField(index, 'markerPin', (v) => updateSection(index, 'markerPin', v as string))} value={section.markerPin || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>

                      <div>
                        <label htmlFor={fieldId('newWindow')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Open Links in New Window (true/false)</label>
                        <input type="text" {...bindSectionField(index, 'newWindow', (v) => updateSection(index, 'newWindow', v as string))} value={(section.newWindow as string) || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>
                      <div>
                        <label htmlFor={fieldId('enableDirections')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enable Directions (true/false)</label>
                        <input type="text" {...bindSectionField(index, 'enableDirections', (v) => updateSection(index, 'enableDirections', v as string))} value={(section.enableDirections as string) || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                      </div>

                      <div className="md:col-span-2">
                        <label htmlFor={fieldId('itemsJson')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Items JSON</label>
                        <textarea
                          id={fieldId('itemsJson')}
                          name={fieldName('itemsJson')}
                          value={section.itemsJson || ''}
                          onChange={(e) => updateSection(index, 'itemsJson', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          rows={6}
                          placeholder='[
  {"latitude":"-33.917","longitude":"151.231","locationTitle":"Kensington Campus","address":"High St, Kensington NSW","directionsText":"Get directions","linkLabel":"Campus page","linkUrl":"/campus","linkNewWindow":"false","linkIsExternal":"false"}
]'
                        />
                      </div>
                    </>
                  )}

                </div>
              </div>
            ))}

            {/* Add New Section */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <h4 className="text-md font-medium mb-3 text-gray-900 dark:text-white">
                Add New Section
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={fieldId('type')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    {...bindNewField('type', (v) => setNewSection(prev => ({ ...prev, type: v as ContentSection['type'] })))}
                    value={newSection.type}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="text">Text</option>
                    <option value="heading">Heading</option>
                    <option value="image">Image</option>
                    <option value="list">List</option>
                    <option value="searchbar">Search Bar</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="card">Card</option>
                    <option value="imagepage">Image Page</option>
                    <option value="authorpage">Author Page</option>
                    <option value="mosaicv2">Mosaic V2</option>
                    <option value="locationcardv2">Location Card V2</option>
                  </select>
                </div>

                {newSection.type === 'heading' && (
                  <div>
                    <label htmlFor={fieldId('level')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Level
                    </label>
                    <select
                      {...bindNewField('level', (v) => setNewSection(prev => ({ ...prev, level: v as number })))}
                      value={newSection.level || 2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value={1}>H1</option>
                      <option value={2}>H2</option>
                      <option value={3}>H3</option>
                      <option value={4}>H4</option>
                    </select>
                  </div>
                )}

                {(newSection.type === 'text' || newSection.type === 'heading') && (
                  <div className="md:col-span-2">
                    <label htmlFor={fieldId('value')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Content
                    </label>
                    <textarea
                      {...bindNewField('value', (v) => setNewSection(prev => ({ ...prev, value: v as string })))}
                      value={newSection.value || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      rows={3}
                    />
                  </div>
                )}

                {newSection.type === 'image' && (
                  <>
                    <div>
                      <label htmlFor={fieldId('src')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Image URL
                      </label>
                      <input
                        type="url"
                        {...bindNewField('src', (v) => setNewSection(prev => ({ ...prev, src: v as string })))}
                        value={newSection.src || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('alt')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Alt Text
                      </label>
                      <input
                        type="text"
                        {...bindNewField('alt', (v) => setNewSection(prev => ({ ...prev, alt: v as string })))}
                        value={newSection.alt || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </>
                )}

                {newSection.type === 'list' && (
                  <div className="md:col-span-2">
                    <label htmlFor={fieldId('items')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      List Items (one per line)
                    </label>
                    <textarea
                      id={fieldId('items')}
                      name={fieldName('items')}
                      value={newSection.items?.join('\n') || ''}
                      onChange={(e) => setNewSection(prev => ({ ...prev, items: e.target.value.split('\n').filter(item => item.trim()) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      rows={4}
                      placeholder="Item 1&#10;Item 2&#10;Item 3"
                    />
                  </div>
                )}

                {newSection.type === 'searchbar' && (
                  <div className="md:col-span-2">
                    <label htmlFor={fieldId('placeholder')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Placeholder Text
                    </label>
                    <input
                      type="text"
                      id={fieldId('placeholder')}
                      name={fieldName('placeholder')}
                      value={newSection.placeholder || ''}
                      onChange={(e) => setNewSection(prev => ({ ...prev, placeholder: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Search..."
                    />
                  </div>
                )}

                {newSection.type === 'checkbox' && (
                  <div className="md:col-span-2">
                    <label htmlFor={fieldId('label')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Checkbox Label
                    </label>
                    <input
                      type="text"
                      id={fieldId('label')}
                      name={fieldName('label')}
                      value={newSection.label || ''}
                      onChange={(e) => setNewSection(prev => ({ ...prev, label: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Option label"
                    />
                  </div>
                )}

                {newSection.type === 'card' && (
                  <>
                    <div>
                      <label htmlFor={fieldId('title')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Card Title
                      </label>
                      <input
                        type="text"
                        id={fieldId('title')}
                        name={fieldName('title')}
                        value={newSection.title || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('imageUrl')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Image URL (optional)
                      </label>
                      <input
                        type="url"
                        id={fieldId('imageUrl')}
                        name={fieldName('imageUrl')}
                        value={newSection.imageUrl || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, imageUrl: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor={fieldId('description')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        id={fieldId('description')}
                        name={fieldName('description')}
                        value={newSection.description || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('linkUrl')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Link URL (optional)
                      </label>
                      <input
                        type="url"
                        id={fieldId('linkUrl')}
                        name={fieldName('linkUrl')}
                        value={newSection.linkUrl || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, linkUrl: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </>
                )}

                {newSection.type === 'imagepage' && renderDynamicNewSectionFields(newSection.type)}
                {false && newSection.type === 'imagepage' && (
                  <>
                    <div>
                      <label htmlFor={fieldId('componentType')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Component Type
                      </label>
                      <input
                        type="text"
                        {...bindNewField('componentType', (v) => setNewSection(prev => ({ ...prev, componentType: v as string })))}
                        value={newSection.componentType || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('componentId')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Component ID
                      </label>
                      <input
                        type="text"
                        {...bindNewField('componentId', (v) => setNewSection(prev => ({ ...prev, componentId: v as string })))}
                        value={newSection.componentId || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('componentTitle')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Component Title
                      </label>
                      <input
                        type="text"
                        {...bindNewField('componentTitle', (v) => setNewSection(prev => ({ ...prev, componentTitle: v as string })))}
                        value={newSection.componentTitle || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('src')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Image URL
                      </label>
                      <input
                        type="url"
                        {...bindNewField('src', (v) => setNewSection(prev => ({ ...prev, src: v as string })))}
                        value={newSection.src || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('alt')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Alt Text
                      </label>
                      <input
                        type="text"
                        {...bindNewField('alt', (v) => setNewSection(prev => ({ ...prev, alt: v as string })))}
                        value={newSection.alt || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('articleStyle')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Article Style
                      </label>
                      <input
                        type="text"
                        {...bindNewField('articleStyle', (v) => setNewSection(prev => ({ ...prev, articleStyle: v as string })))}
                        value={newSection.articleStyle || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor={fieldId('quoteText')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quote Text
                      </label>
                      <textarea
                        id={fieldId('quoteText')}
                        name={fieldName('quoteText')}
                        value={newSection.quoteText || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, quoteText: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows={2}
                      />
                    </div>
                  </>
                )}

                {newSection.type === 'authorpage' && renderDynamicNewSectionFields(newSection.type)}
                {false && newSection.type === 'authorpage' && (
                  <>
                    <div>
                      <label htmlFor={fieldId('componentType')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Component Type</label>
                      <input
                        type="text"
                        {...bindNewField('componentType', (v) => setNewSection(prev => ({ ...prev, componentType: v as string })))}
                        value={newSection.componentType || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('componentId')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Component ID</label>
                      <input
                        type="text"
                        {...bindNewField('componentId', (v) => setNewSection(prev => ({ ...prev, componentId: v as string })))}
                        value={newSection.componentId || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('componentTitle')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Component Title</label>
                      <input
                        type="text"
                        {...bindNewField('componentTitle', (v) => setNewSection(prev => ({ ...prev, componentTitle: v as string })))}
                        value={newSection.componentTitle || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('linkUrl')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link URL</label>
                      <input
                        type="url"
                        id={fieldId('linkUrl')}
                        name={fieldName('linkUrl')}
                        value={newSection.linkUrl || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, linkUrl: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('firstName')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                      <input
                        type="text"
                        id={fieldId('firstName')}
                        name={fieldName('firstName')}
                        value={newSection.firstName || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('lastName')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                      <input
                        type="text"
                        id={fieldId('lastName')}
                        name={fieldName('lastName')}
                        value={newSection.lastName || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('authorTitle')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Author Title</label>
                      <input
                        type="text"
                        id={fieldId('authorTitle')}
                        name={fieldName('authorTitle')}
                        value={newSection.authorTitle || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, authorTitle: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor={fieldId('description')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                      <textarea
                        id={fieldId('description')}
                        name={fieldName('description')}
                        value={newSection.description || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('src')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
                      <input
                        type="url"
                        {...bindNewField('src', (v) => setNewSection(prev => ({ ...prev, src: v as string })))}
                        value={newSection.src || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('alt')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alt Text</label>
                      <input
                        type="text"
                        {...bindNewField('alt', (v) => setNewSection(prev => ({ ...prev, alt: v as string })))}
                        value={newSection.alt || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('clickCategory')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Click Category</label>
                      <input
                        type="text"
                        id={fieldId('clickCategory')}
                        name={fieldName('clickCategory')}
                        value={newSection.clickCategory || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, clickCategory: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('clickId')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Click ID</label>
                      <input
                        type="text"
                        id={fieldId('clickId')}
                        name={fieldName('clickId')}
                        value={newSection.clickId || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, clickId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('clickName')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Click Name</label>
                      <input
                        type="text"
                        id={fieldId('clickName')}
                        name={fieldName('clickName')}
                        value={newSection.clickName || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, clickName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('clickTitle')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Click Title</label>
                      <input
                        type="text"
                        id={fieldId('clickTitle')}
                        name={fieldName('clickTitle')}
                        value={newSection.clickTitle || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, clickTitle: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </>
                )}

                {newSection.type === 'mosaicv2' && renderDynamicNewSectionFields(newSection.type)}
                {false && newSection.type === 'mosaicv2' && (
                  <>
                    <div className="md:col-span-2">
                      <label htmlFor={fieldId('componentType')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Component Type</label>
                      <input
                        type="text"
                        {...bindNewField('componentType', (v) => setNewSection(prev => ({ ...prev, componentType: v as string })))}
                        value={newSection.componentType || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('componentId')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Component ID</label>
                      <input
                        type="text"
                        {...bindNewField('componentId', (v) => setNewSection(prev => ({ ...prev, componentId: v as string })))}
                        value={newSection.componentId || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor={fieldId('componentTitle')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Component Title</label>
                      <input
                        type="text"
                        {...bindNewField('componentTitle', (v) => setNewSection(prev => ({ ...prev, componentTitle: v as string })))}
                        value={newSection.componentTitle || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('customColor1')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custom Color 1</label>
                      <input
                        type="text"
                        id={fieldId('customColor1')}
                        name={fieldName('customColor1')}
                        value={newSection.customColor1 || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, customColor1: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="#FFEE00"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('customColor2')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custom Color 2</label>
                      <input
                        type="text"
                        id={fieldId('customColor2')}
                        name={fieldName('customColor2')}
                        value={newSection.customColor2 || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, customColor2: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="#000000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor={fieldId('tilesJson')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiles JSON</label>
                      <textarea
                        id={fieldId('tilesJson')}
                        name={fieldName('tilesJson')}
                        value={newSection.tilesJson || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, tilesJson: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows={6}
                        placeholder='[
  {"tiletype":"tile-type--hero","fileReference":"/img.jpg","heading":"Heading","introText":"Intro","ctaLink":"/","ctaLabel":"Learn more","ctaNewTab":"false","overlay":"false"},
  {"tiletype":"tile-type--icon","fileReference":"/icon.png","heading":"Icon tile","isImageDecorative":"true"},
  {"tiletype":"tile-type--content","heading":"Content","introText":"Text...","ctaLink":"/","ctaLabel":"Go"},
  {"tiletype":"tile-type--profile","fileReference":"/avatar.jpg","profileName":"Jane Doe","subheading":"Professor","introText":"Bio...","ctaLink":"/","ctaLabel":"View"},
  {"tiletype":"tile-type--image","fileReference":"/photo.jpg","alt":"Alt"}
]'
                      />
                    </div>
                  </>
                )}

                {newSection.type === 'locationcardv2' && renderDynamicNewSectionFields(newSection.type)}
                {false && newSection.type === 'locationcardv2' && (
                  <>
                    <div>
                      <label htmlFor={fieldId('componentType')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Component Type</label>
                      <input
                        type="text"
                        id={fieldId('componentType')}
                        name={fieldName('componentType')}
                        value={newSection.componentType || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, componentType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('componentId')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Component ID</label>
                      <input
                        type="text"
                        id={fieldId('componentId')}
                        name={fieldName('componentId')}
                        value={newSection.componentId || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, componentId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor={fieldId('componentTitle')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Component Title</label>
                      <input
                        type="text"
                        id={fieldId('componentTitle')}
                        name={fieldName('componentTitle')}
                        value={newSection.componentTitle || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, componentTitle: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label htmlFor={fieldId('lat')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Center Latitude</label>
                      <input
                        type="text"
                        {...bindNewField('lat', (v) => setNewSection(prev => ({ ...prev, lat: v as string })))}
                        value={newSection.lat || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('lng')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Center Longitude</label>
                      <input
                        type="text"
                        {...bindNewField('lng', (v) => setNewSection(prev => ({ ...prev, lng: v as string })))}
                        value={newSection.lng || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('zoom')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zoom</label>
                      <input
                        type="text"
                        {...bindNewField('zoom', (v) => setNewSection(prev => ({ ...prev, zoom: v as string })))}
                        value={newSection.zoom || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor={fieldId('locationName')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location Name</label>
                      <input
                        type="text"
                        {...bindNewField('locationName', (v) => setNewSection(prev => ({ ...prev, locationName: v as string })))}
                        value={newSection.locationName || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor={fieldId('locationSubtitle')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location Subtitle (button text)</label>
                      <input
                        type="text"
                        {...bindNewField('locationSubtitle', (v) => setNewSection(prev => ({ ...prev, locationSubtitle: v as string })))}
                        value={newSection.locationSubtitle || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor={fieldId('address')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                      <input
                        type="text"
                        {...bindNewField('address', (v) => setNewSection(prev => ({ ...prev, address: v as string })))}
                        value={newSection.address || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label htmlFor={fieldId('openTooltip')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Open Tooltip (true/false)</label>
                      <input
                        type="text"
                        {...bindNewField('openTooltip', (v) => setNewSection(prev => ({ ...prev, openTooltip: v as string })))}
                        value={(newSection.openTooltip as string) || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('mapstyle')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Map Style</label>
                      <input
                        type="text"
                        {...bindNewField('mapstyle', (v) => setNewSection(prev => ({ ...prev, mapstyle: v as string })))}
                        value={newSection.mapstyle || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('markerstyle')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marker Style</label>
                      <input
                        type="text"
                        {...bindNewField('markerstyle', (v) => setNewSection(prev => ({ ...prev, markerstyle: v as string })))}
                        value={newSection.markerstyle || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor={fieldId('markerPin')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marker Pin URL</label>
                      <input
                        type="url"
                        {...bindNewField('markerPin', (v) => setNewSection(prev => ({ ...prev, markerPin: v as string })))}
                        value={newSection.markerPin || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div>
                      <label htmlFor={fieldId('newWindow')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Open Links in New Window (true/false)</label>
                      <input
                        type="text"
                        {...bindNewField('newWindow', (v) => setNewSection(prev => ({ ...prev, newWindow: v as string })))}
                        value={(newSection.newWindow as string) || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={fieldId('enableDirections')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enable Directions (true/false)</label>
                      <input
                        type="text"
                        {...bindNewField('enableDirections', (v) => setNewSection(prev => ({ ...prev, enableDirections: v as string })))}
                        value={(newSection.enableDirections as string) || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor={fieldId('itemsJson')} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Items JSON</label>
                      <textarea
                        id={fieldId('itemsJson')}
                        name={fieldName('itemsJson')}
                        value={newSection.itemsJson || ''}
                        onChange={(e) => setNewSection(prev => ({ ...prev, itemsJson: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows={6}
                        placeholder='[
  {"latitude":"-33.917","longitude":"151.231","locationTitle":"Kensington Campus","address":"High St, Kensington NSW","directionsText":"Get directions","linkLabel":"Campus page","linkUrl":"/campus","linkNewWindow":"false","linkIsExternal":"false"}
]'
                      />
                    </div>
                  </>
                )}

              </div>
              <button
                type="button"
                onClick={addSection}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add Section
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {content ? 'Update Content' : 'Create Content'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
