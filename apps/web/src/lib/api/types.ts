export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type MessageStatus = 'NEW' | 'READ' | 'REPLIED' | 'ARCHIVED' | 'SPAM';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pageCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

interface Timestamped {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category extends Timestamped {
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  order: number;
  _count?: { projects: number; posts: number };
}

export interface Technology extends Timestamped {
  name: string;
  slug: string;
  group?: string | null;
  iconUrl?: string | null;
  color?: string | null;
  level?: number | null;
  order: number;
  status: ContentStatus;
}

export interface Metric {
  label: string;
  value: string;
  delta?: string;
}

export interface Project extends Timestamped {
  title: string;
  slug: string;
  summary: string;
  content?: string | null;
  coverUrl?: string | null;
  gallery: string[];
  repoUrl?: string | null;
  liveUrl?: string | null;
  client?: string | null;
  role?: string | null;
  year?: number | null;
  metrics?: Metric[] | null;
  featured: boolean;
  order: number;
  status: ContentStatus;
  views: number;
  publishedAt?: string | null;
  category?: Category | null;
  technologies?: Technology[];
}

export interface CaseStudy extends Timestamped {
  title: string;
  slug: string;
  summary: string;
  context: string;
  problem: string;
  approach: string;
  outcome: string;
  metrics?: Metric[] | null;
  coverUrl?: string | null;
  gallery: string[];
  order: number;
  status: ContentStatus;
  publishedAt?: string | null;
  project?: Pick<Project, 'id' | 'title' | 'slug' | 'coverUrl'> | null;
}

export interface Service extends Timestamped {
  title: string;
  slug: string;
  description: string;
  icon?: string | null;
  features: string[];
  priceFrom?: string | null;
  order: number;
  status: ContentStatus;
}

export interface Skill extends Timestamped {
  name: string;
  slug: string;
  level: number;
  years?: number | null;
  description?: string | null;
  icon?: string | null;
  order: number;
  status: ContentStatus;
  groupId?: string | null;
  group?: SkillGroup | null;
}

export interface SkillGroup extends Timestamped {
  name: string;
  slug: string;
  icon?: string | null;
  order: number;
  skills?: Skill[];
}

export interface Experience extends Timestamped {
  company: string;
  role: string;
  slug: string;
  location?: string | null;
  employmentType?: string | null;
  startDate: string;
  endDate?: string | null;
  current: boolean;
  summary?: string | null;
  highlights: string[];
  stack: string[];
  logoUrl?: string | null;
  url?: string | null;
  order: number;
  status: ContentStatus;
}

export interface Education extends Timestamped {
  institution: string;
  degree: string;
  slug: string;
  field?: string | null;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  grade?: string | null;
  summary?: string | null;
  logoUrl?: string | null;
  order: number;
  status: ContentStatus;
}

export interface Certificate extends Timestamped {
  title: string;
  slug: string;
  issuer: string;
  issuedAt: string;
  expiresAt?: string | null;
  credentialId?: string | null;
  credentialUrl?: string | null;
  imageUrl?: string | null;
  order: number;
  status: ContentStatus;
}

export interface Testimonial extends Timestamped {
  name: string;
  slug: string;
  role?: string | null;
  company?: string | null;
  quote: string;
  avatarUrl?: string | null;
  rating?: number | null;
  featured: boolean;
  order: number;
  status: ContentStatus;
}

export interface Post extends Timestamped {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverUrl?: string | null;
  tags: string[];
  readingTime?: number | null;
  views: number;
  featured: boolean;
  order: number;
  status: ContentStatus;
  publishedAt?: string | null;
  category?: Category | null;
  author?: { id: string; name: string; avatarUrl?: string | null; jobTitle?: string | null } | null;
}

export interface GalleryItem extends Timestamped {
  title: string;
  slug: string;
  description?: string | null;
  imageUrl: string;
  thumbUrl?: string | null;
  album?: string | null;
  tags: string[];
  width?: number | null;
  height?: number | null;
  order: number;
  status: ContentStatus;
}

export interface Faq extends Timestamped {
  question: string;
  slug: string;
  answer: string;
  category?: string | null;
  order: number;
  status: ContentStatus;
}

export interface Message extends Timestamped {
  name: string;
  email: string;
  subject?: string | null;
  company?: string | null;
  budget?: string | null;
  body: string;
  status: MessageStatus;
  notes?: string | null;
  repliedAt?: string | null;
}

export interface MediaItem {
  id: string;
  url: string;
  publicId?: string | null;
  provider: 'LOCAL' | 'CLOUDINARY';
  filename: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
  folder?: string | null;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  roles: string[];
  permissions: string[];
}

export interface AdminUser extends Timestamped {
  email: string;
  name: string;
  jobTitle?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  roles: { id: string; name: string }[];
}

export interface Role extends Timestamped {
  name: string;
  description?: string | null;
  isSystem: boolean;
  permissions: { id: string; key: string; resource: string; action: string }[];
  _count?: { users: number };
}

export interface AuditEntry {
  id: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  ip?: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
}

export interface SeoRecord extends Timestamped {
  path: string;
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string | null;
  canonical?: string | null;
  noIndex: boolean;
  structuredData?: Record<string, unknown> | null;
}

export interface Setting {
  id: string;
  key: string;
  group: string;
  label?: string | null;
  value: Record<string, unknown>;
  updatedAt: string;
}

/** `GET /settings/public` — a flat map keyed by setting name. */
export interface SiteSettings {
  identity?: {
    name?: string;
    initials?: string;
    role?: string;
    tagline?: string;
    footerNote?: string;
  };
  hero?: {
    eyebrow?: string;
    headline?: string;
    subheadline?: string;
    primaryCta?: { label: string; href: string };
    secondaryCta?: { label: string; href: string };
    availability?: string;
    location?: string;
  };
  about?: {
    title?: string;
    lead?: string;
    body?: string[];
    principles?: { title: string; body: string }[];
    portraitUrl?: string | null;
  };
  contact?: {
    email?: string;
    phone?: string | null;
    location?: string;
    responseTime?: string;
    calendarUrl?: string | null;
    formHeading?: string;
    formSubheading?: string;
    budgetOptions?: string[];
  };
  social?: { links?: { label: string; href: string; icon?: string }[] };
  theme?: {
    defaultMode?: 'light' | 'dark' | 'system';
    accent?: string;
    accentSecondary?: string;
    radius?: string;
    showGrain?: boolean;
    showSpotlight?: boolean;
  };
  resume?: {
    headline?: string;
    summary?: string;
    fileUrl?: string | null;
    highlights?: string[];
  };
  navigation?: {
    primary?: { label: string; href: string }[];
    footer?: { label: string; href: string }[];
  };
}

export interface HomePayload {
  settings: SiteSettings;
  featuredProjects: Project[];
  services: Service[];
  skillGroups: SkillGroup[];
  technologies: Technology[];
  testimonials: Testimonial[];
  posts: Post[];
  experience: Experience[];
  stats: { projects: number; certificates: number; posts: number; testimonials: number };
}

export interface AnalyticsOverview {
  range: { days: number; since: string };
  traffic: {
    views: number;
    visitors: number;
    daily: { day: string; views: number }[];
    topPages: { path: string; views: number }[];
    topReferrers: { referrer: string | null; views: number }[];
    devices: { device: string; views: number }[];
  };
  content: {
    projects: number;
    posts: number;
    caseStudies: number;
    testimonials: number;
    certificates: number;
    drafts: number;
  };
  inbox: { unread: number; recent: Message[] };
}
