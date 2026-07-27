/**
 * The CMS is data-driven: one registry describes every collection, and the
 * admin dashboard renders its tables and forms from these definitions. Adding a
 * field to a resource is a one-line change here, not a new screen.
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'markdown'
  | 'number'
  | 'boolean'
  | 'date'
  | 'select'
  | 'tags'
  | 'image'
  | 'relation'
  | 'metrics';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: { label: string; value: string }[];
  /** For `relation` fields: which resource to load and how to label it. */
  relation?: { resource: string; labelKey: string; multiple?: boolean };
  /** Layout hint — 1 or 2 columns of the form grid. */
  span?: 1 | 2;
  min?: number;
  max?: number;
}

export interface ColumnDef {
  key: string;
  label: string;
  type?: 'text' | 'status' | 'date' | 'boolean' | 'number' | 'image' | 'badge';
  width?: string;
}

export interface ResourceDef {
  /** URL segment and API path, e.g. `projects` → `/api/v1/projects`. */
  key: string;
  label: string;
  singular: string;
  icon: string;
  group: 'Content' | 'Portfolio' | 'Taxonomy' | 'System';
  /** Permission prefix; defaults to `key`. */
  permission?: string;
  titleField: string;
  hasStatus?: boolean;
  orderable?: boolean;
  columns: ColumnDef[];
  fields: FieldDef[];
}

const STATUS_OPTIONS = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

const statusField: FieldDef = {
  name: 'status',
  label: 'Status',
  type: 'select',
  options: STATUS_OPTIONS,
  help: 'Only published records appear on the public website.',
};

const orderField: FieldDef = {
  name: 'order',
  label: 'Display order',
  type: 'number',
  help: 'Lower numbers appear first.',
};

export const RESOURCES: ResourceDef[] = [
  {
    key: 'projects',
    label: 'Projects',
    singular: 'Project',
    icon: 'FolderKanban',
    group: 'Portfolio',
    titleField: 'title',
    hasStatus: true,
    orderable: true,
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'category.name', label: 'Category', type: 'badge' },
      { key: 'year', label: 'Year', type: 'number', width: '80px' },
      { key: 'featured', label: 'Featured', type: 'boolean', width: '90px' },
      { key: 'views', label: 'Views', type: 'number', width: '80px' },
      { key: 'status', label: 'Status', type: 'status', width: '110px' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, span: 2 },
      { name: 'summary', label: 'Summary', type: 'textarea', required: true, span: 2, help: 'Shown on cards and in search results.' },
      { name: 'content', label: 'Body', type: 'markdown', span: 2 },
      { name: 'coverUrl', label: 'Cover image', type: 'image', span: 2 },
      { name: 'client', label: 'Client', type: 'text' },
      { name: 'role', label: 'Your role', type: 'text' },
      { name: 'year', label: 'Year', type: 'number', min: 1990, max: 2100 },
      { name: 'liveUrl', label: 'Live URL', type: 'text' },
      { name: 'repoUrl', label: 'Repository URL', type: 'text' },
      { name: 'categoryId', label: 'Category', type: 'relation', relation: { resource: 'categories', labelKey: 'name' } },
      {
        name: 'technologyIds',
        label: 'Technologies',
        type: 'relation',
        relation: { resource: 'technologies', labelKey: 'name', multiple: true },
        span: 2,
      },
      { name: 'metrics', label: 'Impact metrics', type: 'metrics', span: 2, help: 'Label / value pairs rendered as a stat row.' },
      { name: 'featured', label: 'Feature on the home page', type: 'boolean' },
      orderField,
      statusField,
    ],
  },
  {
    key: 'case-studies',
    label: 'Case studies',
    singular: 'Case study',
    icon: 'BookOpen',
    group: 'Portfolio',
    titleField: 'title',
    hasStatus: true,
    orderable: true,
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'project.title', label: 'Project', type: 'badge' },
      { key: 'order', label: 'Order', type: 'number', width: '80px' },
      { key: 'status', label: 'Status', type: 'status', width: '110px' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, span: 2 },
      { name: 'summary', label: 'Summary', type: 'textarea', required: true, span: 2 },
      { name: 'context', label: 'Context', type: 'textarea', required: true, span: 2, help: 'Client, timeline, team size.' },
      { name: 'problem', label: 'Problem', type: 'textarea', required: true, span: 2 },
      { name: 'approach', label: 'Approach', type: 'textarea', required: true, span: 2 },
      { name: 'outcome', label: 'Outcome', type: 'textarea', required: true, span: 2 },
      { name: 'metrics', label: 'Metrics', type: 'metrics', span: 2 },
      { name: 'coverUrl', label: 'Cover image', type: 'image', span: 2 },
      { name: 'projectId', label: 'Related project', type: 'relation', relation: { resource: 'projects', labelKey: 'title' } },
      orderField,
      statusField,
    ],
  },
  {
    key: 'services',
    label: 'Services',
    singular: 'Service',
    icon: 'Layers',
    group: 'Portfolio',
    titleField: 'title',
    hasStatus: true,
    orderable: true,
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'priceFrom', label: 'From' },
      { key: 'order', label: 'Order', type: 'number', width: '80px' },
      { key: 'status', label: 'Status', type: 'status', width: '110px' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, span: 2 },
      { name: 'description', label: 'Description', type: 'textarea', required: true, span: 2 },
      { name: 'features', label: 'What is included', type: 'tags', span: 2, help: 'Press Enter after each item.' },
      { name: 'icon', label: 'Icon', type: 'text', help: 'A lucide-react icon name, e.g. Layers.' },
      { name: 'priceFrom', label: 'Price from', type: 'text' },
      orderField,
      statusField,
    ],
  },
  {
    key: 'skills',
    label: 'Skills',
    singular: 'Skill',
    icon: 'Sparkles',
    group: 'Portfolio',
    titleField: 'name',
    hasStatus: true,
    orderable: true,
    columns: [
      { key: 'name', label: 'Skill' },
      { key: 'group.name', label: 'Group', type: 'badge' },
      { key: 'level', label: 'Level', type: 'number', width: '80px' },
      { key: 'years', label: 'Years', type: 'number', width: '80px' },
      { key: 'status', label: 'Status', type: 'status', width: '110px' },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'groupId', label: 'Group', type: 'relation', relation: { resource: 'skill-groups', labelKey: 'name' } },
      { name: 'level', label: 'Level (0–100)', type: 'number', min: 0, max: 100 },
      { name: 'years', label: 'Years of practice', type: 'number', min: 0 },
      { name: 'description', label: 'Description', type: 'textarea', span: 2 },
      orderField,
      statusField,
    ],
  },
  {
    key: 'skill-groups',
    label: 'Skill groups',
    singular: 'Skill group',
    icon: 'Group',
    group: 'Taxonomy',
    permission: 'skills',
    titleField: 'name',
    orderable: true,
    columns: [
      { key: 'name', label: 'Group' },
      { key: 'order', label: 'Order', type: 'number', width: '80px' },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'icon', label: 'Icon', type: 'text' },
      orderField,
    ],
  },
  {
    key: 'technologies',
    label: 'Technologies',
    singular: 'Technology',
    icon: 'Cpu',
    group: 'Taxonomy',
    titleField: 'name',
    hasStatus: true,
    orderable: true,
    columns: [
      { key: 'name', label: 'Technology' },
      { key: 'group', label: 'Group', type: 'badge' },
      { key: 'level', label: 'Level', type: 'number', width: '80px' },
      { key: 'status', label: 'Status', type: 'status', width: '110px' },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      {
        name: 'group',
        label: 'Group',
        type: 'select',
        options: ['frontend', 'backend', 'devops', 'design', 'tooling'].map((value) => ({
          label: value,
          value,
        })),
      },
      { name: 'level', label: 'Proficiency (0–100)', type: 'number', min: 0, max: 100 },
      { name: 'color', label: 'Brand colour', type: 'text', placeholder: '#336791' },
      { name: 'iconUrl', label: 'Icon', type: 'image', span: 2 },
      orderField,
      statusField,
    ],
  },
  {
    key: 'experience',
    label: 'Experience',
    singular: 'Role',
    icon: 'Briefcase',
    group: 'Portfolio',
    titleField: 'role',
    hasStatus: true,
    orderable: true,
    columns: [
      { key: 'role', label: 'Role' },
      { key: 'company', label: 'Company' },
      { key: 'startDate', label: 'From', type: 'date', width: '120px' },
      { key: 'endDate', label: 'To', type: 'date', width: '120px' },
      { key: 'status', label: 'Status', type: 'status', width: '110px' },
    ],
    fields: [
      { name: 'role', label: 'Role', type: 'text', required: true },
      { name: 'company', label: 'Company', type: 'text', required: true },
      { name: 'location', label: 'Location', type: 'text' },
      {
        name: 'employmentType',
        label: 'Employment type',
        type: 'select',
        options: ['full-time', 'part-time', 'contract', 'freelance', 'internship'].map((value) => ({
          label: value,
          value,
        })),
      },
      { name: 'startDate', label: 'Start date', type: 'date', required: true },
      { name: 'endDate', label: 'End date', type: 'date' },
      { name: 'current', label: 'This is my current role', type: 'boolean' },
      { name: 'url', label: 'Company URL', type: 'text' },
      { name: 'summary', label: 'Summary', type: 'textarea', span: 2 },
      { name: 'highlights', label: 'Highlights', type: 'tags', span: 2, help: 'One measurable outcome per line.' },
      { name: 'stack', label: 'Stack', type: 'tags', span: 2 },
      { name: 'logoUrl', label: 'Company logo', type: 'image', span: 2 },
      orderField,
      statusField,
    ],
  },
  {
    key: 'education',
    label: 'Education',
    singular: 'Education entry',
    icon: 'GraduationCap',
    group: 'Portfolio',
    titleField: 'degree',
    hasStatus: true,
    orderable: true,
    columns: [
      { key: 'degree', label: 'Qualification' },
      { key: 'institution', label: 'Institution' },
      { key: 'startDate', label: 'From', type: 'date', width: '120px' },
      { key: 'endDate', label: 'To', type: 'date', width: '120px' },
      { key: 'status', label: 'Status', type: 'status', width: '110px' },
    ],
    fields: [
      { name: 'degree', label: 'Qualification', type: 'text', required: true },
      { name: 'institution', label: 'Institution', type: 'text', required: true },
      { name: 'field', label: 'Field of study', type: 'text' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'startDate', label: 'Start date', type: 'date', required: true },
      { name: 'endDate', label: 'End date', type: 'date' },
      { name: 'grade', label: 'Grade', type: 'text' },
      { name: 'summary', label: 'Summary', type: 'textarea', span: 2 },
      { name: 'logoUrl', label: 'Logo', type: 'image', span: 2 },
      orderField,
      statusField,
    ],
  },
  {
    key: 'certificates',
    label: 'Certificates',
    singular: 'Certificate',
    icon: 'Award',
    group: 'Portfolio',
    titleField: 'title',
    hasStatus: true,
    orderable: true,
    columns: [
      { key: 'title', label: 'Certificate' },
      { key: 'issuer', label: 'Issuer' },
      { key: 'issuedAt', label: 'Issued', type: 'date', width: '120px' },
      { key: 'status', label: 'Status', type: 'status', width: '110px' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, span: 2 },
      { name: 'issuer', label: 'Issuer', type: 'text', required: true },
      { name: 'issuedAt', label: 'Issued on', type: 'date', required: true },
      { name: 'expiresAt', label: 'Expires on', type: 'date' },
      { name: 'credentialId', label: 'Credential ID', type: 'text' },
      { name: 'credentialUrl', label: 'Verification URL', type: 'text', span: 2 },
      { name: 'imageUrl', label: 'Certificate image', type: 'image', span: 2 },
      orderField,
      statusField,
    ],
  },
  {
    key: 'testimonials',
    label: 'Testimonials',
    singular: 'Testimonial',
    icon: 'Quote',
    group: 'Portfolio',
    titleField: 'name',
    hasStatus: true,
    orderable: true,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'company', label: 'Company' },
      { key: 'rating', label: 'Rating', type: 'number', width: '80px' },
      { key: 'featured', label: 'Featured', type: 'boolean', width: '90px' },
      { key: 'status', label: 'Status', type: 'status', width: '110px' },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'role', label: 'Job title', type: 'text' },
      { name: 'company', label: 'Company', type: 'text' },
      { name: 'rating', label: 'Rating (1–5)', type: 'number', min: 1, max: 5 },
      { name: 'quote', label: 'Quote', type: 'textarea', required: true, span: 2 },
      { name: 'avatarUrl', label: 'Photo', type: 'image', span: 2 },
      { name: 'featured', label: 'Feature on the home page', type: 'boolean' },
      orderField,
      statusField,
    ],
  },
  {
    key: 'blog',
    label: 'Blog',
    singular: 'Post',
    icon: 'PenLine',
    group: 'Content',
    titleField: 'title',
    hasStatus: true,
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'category.name', label: 'Category', type: 'badge' },
      { key: 'readingTime', label: 'Read', type: 'number', width: '80px' },
      { key: 'views', label: 'Views', type: 'number', width: '80px' },
      { key: 'publishedAt', label: 'Published', type: 'date', width: '130px' },
      { key: 'status', label: 'Status', type: 'status', width: '110px' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, span: 2 },
      { name: 'excerpt', label: 'Excerpt', type: 'textarea', required: true, span: 2, help: 'Also used as the meta description.' },
      { name: 'content', label: 'Body', type: 'markdown', required: true, span: 2 },
      { name: 'coverUrl', label: 'Cover image', type: 'image', span: 2 },
      { name: 'categoryId', label: 'Category', type: 'relation', relation: { resource: 'categories', labelKey: 'name' } },
      { name: 'tags', label: 'Tags', type: 'tags' },
      { name: 'featured', label: 'Feature this post', type: 'boolean' },
      statusField,
    ],
  },
  {
    key: 'gallery',
    label: 'Gallery',
    singular: 'Gallery item',
    icon: 'Images',
    group: 'Content',
    titleField: 'title',
    hasStatus: true,
    orderable: true,
    columns: [
      { key: 'imageUrl', label: '', type: 'image', width: '64px' },
      { key: 'title', label: 'Title' },
      { key: 'album', label: 'Album', type: 'badge' },
      { key: 'order', label: 'Order', type: 'number', width: '80px' },
      { key: 'status', label: 'Status', type: 'status', width: '110px' },
    ],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'album', label: 'Album', type: 'text' },
      { name: 'imageUrl', label: 'Image', type: 'image', required: true, span: 2 },
      { name: 'description', label: 'Caption', type: 'textarea', span: 2 },
      { name: 'tags', label: 'Tags', type: 'tags', span: 2 },
      orderField,
      statusField,
    ],
  },
  {
    key: 'faq',
    label: 'FAQ',
    singular: 'Question',
    icon: 'HelpCircle',
    group: 'Content',
    titleField: 'question',
    hasStatus: true,
    orderable: true,
    columns: [
      { key: 'question', label: 'Question' },
      { key: 'category', label: 'Group', type: 'badge' },
      { key: 'order', label: 'Order', type: 'number', width: '80px' },
      { key: 'status', label: 'Status', type: 'status', width: '110px' },
    ],
    fields: [
      { name: 'question', label: 'Question', type: 'text', required: true, span: 2 },
      { name: 'answer', label: 'Answer', type: 'textarea', required: true, span: 2 },
      { name: 'category', label: 'Group', type: 'text' },
      orderField,
      statusField,
    ],
  },
  {
    key: 'categories',
    label: 'Categories',
    singular: 'Category',
    icon: 'Tags',
    group: 'Taxonomy',
    titleField: 'name',
    orderable: true,
    columns: [
      { key: 'name', label: 'Category' },
      { key: '_count.projects', label: 'Projects', type: 'number', width: '90px' },
      { key: '_count.posts', label: 'Posts', type: 'number', width: '90px' },
      { key: 'order', label: 'Order', type: 'number', width: '80px' },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'color', label: 'Colour', type: 'text', placeholder: '#6366f1' },
      { name: 'description', label: 'Description', type: 'textarea', span: 2 },
      orderField,
    ],
  },
];

export const resourceByKey = (key: string): ResourceDef | undefined =>
  RESOURCES.find((resource) => resource.key === key);

export const permissionFor = (resource: ResourceDef, action: 'read' | 'write' | 'delete'): string =>
  `${resource.permission ?? resource.key}:${action}`;

/** Settings documents editable from the dashboard, described the same way. */
export interface SettingsFormDef {
  key: string;
  label: string;
  description: string;
  group: string;
  fields: FieldDef[];
}

export const SETTINGS_FORMS: SettingsFormDef[] = [
  {
    key: 'identity',
    label: 'Identity',
    description: 'Your name and the one-liners that appear in the header and footer.',
    group: 'general',
    fields: [
      { name: 'name', label: 'Display name', type: 'text', required: true },
      { name: 'initials', label: 'Monogram', type: 'text' },
      { name: 'role', label: 'Role', type: 'text' },
      { name: 'tagline', label: 'Tagline', type: 'text', span: 2 },
      { name: 'footerNote', label: 'Footer note', type: 'textarea', span: 2 },
    ],
  },
  {
    key: 'hero',
    label: 'Home hero',
    description: 'The first screen of the website.',
    group: 'hero',
    fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'text', span: 2 },
      { name: 'headline', label: 'Headline', type: 'textarea', required: true, span: 2 },
      { name: 'subheadline', label: 'Subheadline', type: 'textarea', span: 2 },
      { name: 'availability', label: 'Availability note', type: 'text' },
      { name: 'location', label: 'Location', type: 'text' },
    ],
  },
  {
    key: 'about',
    label: 'About page',
    description: 'Long-form introduction and working principles.',
    group: 'about',
    fields: [
      { name: 'title', label: 'Page title', type: 'text' },
      { name: 'lead', label: 'Lead paragraph', type: 'textarea', span: 2 },
      { name: 'body', label: 'Paragraphs', type: 'tags', span: 2, help: 'One paragraph per entry.' },
      { name: 'portraitUrl', label: 'Portrait', type: 'image', span: 2 },
    ],
  },
  {
    key: 'contact',
    label: 'Contact',
    description: 'How people reach you, and what the contact form offers.',
    group: 'contact',
    fields: [
      { name: 'email', label: 'Email', type: 'text', required: true },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'responseTime', label: 'Response time', type: 'text' },
      { name: 'calendarUrl', label: 'Booking link', type: 'text', span: 2 },
      { name: 'formHeading', label: 'Form heading', type: 'text', span: 2 },
      { name: 'formSubheading', label: 'Form subheading', type: 'textarea', span: 2 },
      { name: 'budgetOptions', label: 'Budget options', type: 'tags', span: 2 },
    ],
  },
  {
    key: 'resume',
    label: 'Résumé',
    description: 'Summary and downloadable file for the résumé page.',
    group: 'resume',
    fields: [
      { name: 'headline', label: 'Headline', type: 'text', span: 2 },
      { name: 'summary', label: 'Summary', type: 'textarea', span: 2 },
      { name: 'highlights', label: 'Highlights', type: 'tags', span: 2 },
      { name: 'fileUrl', label: 'PDF file', type: 'image', span: 2, help: 'Upload a PDF in the media library and paste its URL.' },
    ],
  },
  {
    key: 'theme',
    label: 'Theme',
    description: 'Accent colours and the ambient effects used across the site.',
    group: 'theme',
    fields: [
      {
        name: 'defaultMode',
        label: 'Default mode',
        type: 'select',
        options: [
          { label: 'Dark', value: 'dark' },
          { label: 'Light', value: 'light' },
          { label: "Follow the visitor's system", value: 'system' },
        ],
      },
      { name: 'accent', label: 'Accent colour', type: 'text', placeholder: '#ff5f38' },
      { name: 'accentSecondary', label: 'Secondary accent', type: 'text', placeholder: '#3ddc97' },
      { name: 'showGrain', label: 'Film grain overlay', type: 'boolean' },
      { name: 'showSpotlight', label: 'Cursor spotlight', type: 'boolean' },
    ],
  },
];
