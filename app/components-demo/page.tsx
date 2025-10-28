'use client';

import SearchBar from '@/components/SearchBar';
import Checkbox, { FilterGroup } from '@/components/Checkbox';
import Card, { NewsCard } from '@/components/Card';
import { Heading, HighlightedText, BodyText } from '@/components/Typography';
import Logo from '@/components/Logo';

export default function ComponentsDemoPage() {
  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <Heading level={1}>Component Library Demo</Heading>
          <BodyText className="text-gray-600 mt-4">
            Showcase of reusable UI components with professional styling
          </BodyText>
        </div>

        {/* Search Bar */}
        <section className="mb-12">
          <Heading level={2}>Search Bar</Heading>
          <div className="mt-4 max-w-md">
            <SearchBar 
              placeholder="Search content, pages, or articles..."
              onSearch={handleSearch}
            />
          </div>
        </section>

        {/* Checkboxes and Filters */}
        <section className="mb-12">
          <Heading level={2}>Checkboxes & Filters</Heading>
          <div className="mt-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <FilterGroup title="Content Type">
              <Checkbox label="Articles" />
              <Checkbox label="News" />
              <Checkbox label="Blog Posts" />
            </FilterGroup>
            
            <FilterGroup title="Category">
              <Checkbox label="Technology" />
              <Checkbox label="Design" />
              <Checkbox label="Business" />
            </FilterGroup>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-12">
          <Heading level={2}>Card Components</Heading>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card
              title="Sample Card"
              description="A basic card component with shadow, rounded borders, and hover effects."
              image="/next.svg"
            />
            
            <NewsCard
              title="Latest News"
              description="Stay updated with the latest developments and industry insights."
              date="2024-01-15"
            />
            
            <Card
              title="Featured Content"
              description="Highlights important content with professional styling and layout."
            />
          </div>
        </section>

        {/* Typography */}
        <section className="mb-12">
          <Heading level={2}>Typography</Heading>
          <div className="mt-4 space-y-6">
            <div>
              <Heading level={3}>Professional Headings</Heading>
              <BodyText>
                Clean, professional typography using sans-serif fonts with proper spacing and hierarchy.
              </BodyText>
            </div>
            
            <HighlightedText>
              Important information highlighted in blue
            </HighlightedText>
            
            <BodyText className="text-lg">
              Regular body text with comfortable line spacing and readable font sizes.
              This text demonstrates proper margins and vertical rhythm throughout the document.
            </BodyText>
          </div>
        </section>

        {/* Logo */}
        <section className="mb-12">
          <Heading level={2}>Logos & Images</Heading>
          <div className="mt-4 bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-center">
              <Logo 
                src="/next.svg" 
                alt="Next.js Logo"
                width={200}
                height={50}
                href="/"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
