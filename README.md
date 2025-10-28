# Mini CMS - Adobe Experience Manager Clone

A lightweight content management system built with Next.js 14 that mimics Adobe Experience Manager functionality. This mini-CMS demonstrates dynamic content rendering, admin interface, and file-based content storage.

## Features

- **Dynamic Content Rendering**: Pages are rendered dynamically from JSON files stored in the `/content` directory
- **Admin Interface**: Complete CMS interface for creating, editing, and managing content
- **RESTful API**: Full CRUD operations for content management
- **File-based Storage**: Content stored as JSON files (similar to JCR in AEM)
- **Responsive Design**: Built with TailwindCSS for modern, responsive UI
- **TypeScript Support**: Full type safety throughout the application

## Project Structure

```
├── /app
│   ├── /[slug]/page.tsx         # Dynamic page renderer
│   ├── /admin/page.tsx          # CMS admin interface
│   ├── /api/content/            # REST API endpoints
│   └── layout.tsx               # Root layout with navigation
├── /content                     # Content storage (JSON files)
│   ├── home.json
│   └── about.json
├── /components
│   ├── Editor.tsx               # Content editor component
│   ├── Navigation.tsx           # Site navigation
│   └── PageRenderer.tsx        # Dynamic content renderer
├── /lib
│   └── content.ts               # Content management utilities
└── /public/images               # Image assets
```

## Content Model

Each page is represented by a JSON file with the following structure:

```json
{
  "title": "Page Title",
  "path": "/page-path",
  "description": "Page description",
  "sections": [
    {
      "type": "heading",
      "value": "Heading Text",
      "level": 2
    },
    {
      "type": "text",
      "value": "Paragraph content..."
    },
    {
      "type": "image",
      "src": "/images/photo.jpg",
      "alt": "Image description"
    },
    {
      "type": "list",
      "items": ["Item 1", "Item 2", "Item 3"]
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Supported Section Types

- **text**: Plain text paragraphs
- **heading**: Headings (H1-H4)
- **image**: Images with alt text
- **list**: Unordered lists

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Access the Application**
   - Main site: http://localhost:3000
   - Admin panel: http://localhost:3000/admin

## API Endpoints

- `GET /api/content` - List all content
- `POST /api/content` - Create new content
- `GET /api/content/[slug]` - Get specific content
- `PUT /api/content/[slug]` - Update content
- `DELETE /api/content/[slug]` - Delete content

## Usage

### Creating Content

1. Navigate to `/admin`
2. Click "Create New Content"
3. Fill in the title, path, and description
4. Add sections using the editor
5. Save the content

### Editing Content

1. Go to `/admin`
2. Click "Edit" on any existing content
3. Modify the content using the editor
4. Save changes

### Viewing Content

- Content is automatically available at the specified path
- Home page content is accessible at `/home`
- All content is rendered dynamically using the PageRenderer component

## Technology Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **TailwindCSS** for styling
- **Node.js fs API** for file operations
- **React hooks** for state management

## Design Philosophy

This mini-CMS follows AEM's core concepts:

- **Content Repository**: `/content` directory acts as JCR
- **Author Environment**: `/admin` interface for content creation
- **Publish Environment**: Dynamic rendering for end users
- **Component-based**: Modular architecture with reusable components

## Future Enhancements

- Markdown support alongside JSON
- Image upload functionality
- Content versioning
- User authentication
- Content preview mode
- Rich text editor integration
- Content templates
- SEO optimization features

## License

This project is for demonstration purposes and educational use.