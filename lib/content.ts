import fs from 'fs';
import pathModule from 'path';
import { kv } from '@vercel/kv';

export interface ContentSection {
  type: 'text' | 'image' | 'heading' | 'list' | 'searchbar' | 'checkbox' | 'card' | 'imagepage' | 'authorpage' | 'mosaicv2' | 'locationcardv2' | 'herobanner';
  value?: string;
  src?: string;
  alt?: string;
  level?: number;
  items?: string[];
  // For searchbar
  placeholder?: string;
  // For checkbox
  label?: string;
  // For card
  title?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  // For imagepage (AEM-like image wrapper)
  componentType?: string;
  componentId?: string;
  componentTitle?: string;
  articleStyle?: string;
  quoteText?: string;
  // For authorpage
  firstName?: string;
  lastName?: string;
  authorTitle?: string;
  clickCategory?: string;
  clickId?: string;
  clickName?: string;
  clickTitle?: string;
  // For herobanner
  image?: string;
  altValueFromDAM?: boolean | string;
  overlay?: boolean | string;
  articlePagePath?: string;
  articleDate?: string;
  showArticleDetails?: boolean | string;
  buttonCopy?: string;
  buttonColor?: string;
  buttonStyle?: string;
  copyright?: string;
  showSocialShareOnHeroBanner?: boolean | string;
  // For mosaicv2
  tiles?: MosaicV2Tile[];
  tilesJson?: string; // alternative JSON input for tiles
  customColor1?: string;
  customColor2?: string;
  // For locationcardv2
  lat?: string;
  lng?: string;
  zoom?: string;
  locationName?: string;
  locationSubtitle?: string;
  address?: string;
  openTooltip?: boolean | string;
  mapstyle?: string;
  markerstyle?: string;
  markerPin?: string;
  newWindow?: boolean | string;
  enableDirections?: boolean | string;
  locationItems?: LocationCardItem[];
  itemsJson?: string;
  // Allow additional dynamic props so the editor can adapt to component prop name changes
  [key: string]: any;
}

export interface MosaicV2Tile {
  tiletype: 'tile-type--hero' | 'tile-type--icon' | 'tile-type--content' | 'tile-type--profile' | 'tile-type--image';
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

export interface ContentPage {
  title: string;
  path: string;
  description?: string;
  sections: ContentSection[];
  createdAt?: string;
  updatedAt?: string;
}

// Store content JSON inside the public folder so it is bundled with the app
// Note: On platforms like Vercel, the filesystem is read-only at runtime.
// This change only affects where files live in the repo/build artifact.
const CONTENT_DIR = pathModule.join(process.cwd(), 'public', 'content');
const KV_INDEX_KEY = 'content:index';
const isKVEnabled = Boolean(
  process.env.KV_REST_API_URL ||
  process.env.KV_URL ||
  process.env.KV_REST_API_TOKEN ||
  process.env.KV_REST_API_READ_ONLY_TOKEN
);

function toSlug(contentPath: string): string {
  const cleaned = (contentPath || '').trim();
  return cleaned === '/' || cleaned === '' ? 'home' : cleaned.replace(/^\//, '');
}

export async function getAllContent(): Promise<ContentPage[]> {
  try {
    if (isKVEnabled) {
      const slugsRaw = await kv.smembers(KV_INDEX_KEY);
      const slugs = (Array.isArray(slugsRaw) ? slugsRaw : []) as string[];
      const items = await Promise.all(
        slugs.map(async (s) => (await kv.get<ContentPage>(`content:${s}`)) || null)
      );
      const contentPages = items.filter(Boolean) as ContentPage[];
      const sorted = contentPages.sort((a, b) =>
        new Date(b.updatedAt || b.createdAt || '').getTime() -
        new Date(a.updatedAt || a.createdAt || '').getTime()
      );
      return sorted;
    }

    console.debug('[getAllContent] Reading content directory:', CONTENT_DIR);
    if (!fs.existsSync(CONTENT_DIR)) {
      return [];
    }
    const files = fs.readdirSync(CONTENT_DIR);
    const contentPages: ContentPage[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = pathModule.join(CONTENT_DIR, file);
        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const content = JSON.parse(fileContent) as ContentPage;
          contentPages.push(content);
        } catch (err) {
          console.error('[getAllContent] Failed to read/parse file:', filePath, err);
        }
      }
    }
    const sorted = contentPages.sort((a, b) =>
      new Date(b.updatedAt || b.createdAt || '').getTime() -
      new Date(a.updatedAt || a.createdAt || '').getTime()
    );
    return sorted;
  } catch (error) {
    console.error('Error reading content:', error);
    return [];
  }
}

export async function getContentByPath(contentPath: string): Promise<ContentPage | null> {
  try {
    const slug = toSlug(contentPath);
    if (isKVEnabled) {
      const page = await kv.get<ContentPage>(`content:${slug}`);
      return page || null;
    }
    const filePath = pathModule.join(CONTENT_DIR, `${slug}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(fileContent) as ContentPage;
    return parsed;
  } catch (error) {
    console.error('Error reading content by path:', error);
    return null;
  }
}

export async function saveContent(content: ContentPage): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    const contentToSave: ContentPage = {
      ...content,
      updatedAt: now,
      createdAt: content.createdAt || now,
    };
    const slug = toSlug(content.path);

    if (isKVEnabled) {
      await kv.set(`content:${slug}`, contentToSave);
      await kv.sadd(KV_INDEX_KEY, slug);
      return true;
    }

    const filePath = pathModule.join(CONTENT_DIR, `${slug}.json`);
    if (!fs.existsSync(CONTENT_DIR)) {
      fs.mkdirSync(CONTENT_DIR, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(contentToSave, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving content:', error);
    return false;
  }
}

export async function deleteContent(contentPath: string): Promise<boolean> {
  try {
    const slug = toSlug(contentPath);
    if (isKVEnabled) {
      await kv.del(`content:${slug}`);
      await kv.srem(KV_INDEX_KEY, slug);
      return true;
    }
    const filePath = pathModule.join(CONTENT_DIR, `${slug}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting content:', error);
    return false;
  }
}

export function getContentPaths(): string[] {
  try {
    if (isKVEnabled) {
      return [];
    }
    if (!fs.existsSync(CONTENT_DIR)) {
      return [];
    }
    const files = fs.readdirSync(CONTENT_DIR);
    const paths = files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''))
      .map(file => file === 'home' ? '/' : `/${file}`);
    return paths;
  } catch (error) {
    console.error('Error getting content paths:', error);
    return [];
  }
}
