import { ContentStatus, PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const RESOURCES = [
  'projects',
  'case-studies',
  'services',
  'skills',
  'technologies',
  'experience',
  'education',
  'certificates',
  'testimonials',
  'blog',
  'categories',
  'gallery',
  'faq',
  'messages',
  'media',
  'settings',
  'seo',
  'users',
  'roles',
  'analytics',
  'audit',
];

const ACTIONS = ['read', 'write', 'delete'];

const CONTENT_RESOURCES = RESOURCES.filter(
  (resource) => !['users', 'roles', 'audit'].includes(resource),
);

async function seedAccessControl() {
  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      const key = `${resource}:${action}`;
      await prisma.permission.upsert({
        where: { key },
        create: { key, resource, action, description: `${action} ${resource}` },
        update: {},
      });
    }
  }

  // Wildcard for the owner role.
  await prisma.permission.upsert({
    where: { key: '*' },
    create: { key: '*', resource: '*', action: '*', description: 'Full access' },
    update: {},
  });

  const owner = await prisma.role.upsert({
    where: { name: 'owner' },
    create: {
      name: 'owner',
      description: 'Full control over content, users and settings',
      isSystem: true,
      permissions: { connect: [{ key: '*' }] },
    },
    update: { permissions: { connect: [{ key: '*' }] } },
  });

  await prisma.role.upsert({
    where: { name: 'editor' },
    create: {
      name: 'editor',
      description: 'Creates and publishes content, cannot manage accounts',
      isSystem: true,
      permissions: {
        connect: CONTENT_RESOURCES.flatMap((resource) => [
          { key: `${resource}:read` },
          { key: `${resource}:write` },
        ]),
      },
    },
    update: {},
  });

  await prisma.role.upsert({
    where: { name: 'viewer' },
    create: {
      name: 'viewer',
      description: 'Read-only access to the dashboard',
      isSystem: true,
      permissions: { connect: RESOURCES.map((resource) => ({ key: `${resource}:read` })) },
    },
    update: {},
  });

  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: process.env.SEED_ADMIN_NAME ?? 'Suldaa Ahmed',
      jobTitle: 'Full-stack engineer',
      passwordHash: await hash(password, 12),
      roles: { connect: [{ id: owner.id }] },
    },
    update: { roles: { connect: [{ id: owner.id }] } },
  });

  console.log(`✓ access control ready — owner login: ${email} / ${password}`);
  return user;
}

async function seedSettings() {
  const documents: { key: string; group: string; label: string; value: object }[] = [
    {
      key: 'hero',
      group: 'hero',
      label: 'Hero section',
      value: {
        eyebrow: 'Full-stack engineer · Available for select work',
        headline: 'I build software that behaves well under pressure.',
        subheadline:
          'Platform architecture, interface craft and the unglamorous performance work that makes products feel instant.',
        primaryCta: { label: 'Start a project', href: '/contact' },
        secondaryCta: { label: 'See selected work', href: '/projects' },
        availability: 'Taking new projects from August',
        location: 'Remote · GMT+3',
      },
    },
    {
      key: 'about',
      group: 'about',
      label: 'About page',
      value: {
        title: 'About',
        lead: 'I design and build web platforms end to end — from the schema to the last pixel.',
        body: [
          'I have spent the last several years working on products where correctness and speed are not optional: dashboards that operators stare at all day, checkout flows that cannot drop a request, content platforms that non-technical teams have to own without engineers.',
          'My work usually starts at the data model and ends with the details nobody notices until they are missing — empty states, keyboard paths, the shape of an error message.',
          'Outside client work I write about interface performance and mentor engineers moving from tutorials into production codebases.',
        ],
        principles: [
          { title: 'Boring where it counts', body: 'Predictable data flow, obvious names, no cleverness in the critical path.' },
          { title: 'Measured, not guessed', body: 'Every performance claim comes with a number and the trace behind it.' },
          { title: 'Owned by the team', body: 'If the client needs an engineer to change a headline, the job is unfinished.' },
        ],
        portraitUrl: null,
      },
    },
    {
      key: 'contact',
      group: 'contact',
      label: 'Contact details',
      value: {
        email: 'hello@example.com',
        phone: null,
        location: 'Remote · GMT+3',
        responseTime: 'Replies within two business days',
        calendarUrl: null,
        formHeading: 'Tell me about the work',
        formSubheading: 'A few sentences about the problem is plenty to start.',
        budgetOptions: ['Under $5k', '$5k – $15k', '$15k – $40k', '$40k+', 'Not sure yet'],
      },
    },
    {
      key: 'social',
      group: 'social',
      label: 'Social links',
      value: {
        links: [
          { label: 'GitHub', href: 'https://github.com/', icon: 'Github' },
          { label: 'LinkedIn', href: 'https://linkedin.com/', icon: 'Linkedin' },
          { label: 'X', href: 'https://x.com/', icon: 'Twitter' },
        ],
      },
    },
    {
      key: 'theme',
      group: 'theme',
      label: 'Theme',
      value: {
        defaultMode: 'dark',
        accent: '#ff5f38',
        accentSecondary: '#3ddc97',
        radius: '1rem',
        showGrain: true,
        showSpotlight: true,
      },
    },
    {
      key: 'resume',
      group: 'resume',
      label: 'Résumé',
      value: {
        headline: 'Full-stack engineer — platforms, interfaces, performance',
        summary:
          'Engineer with a product bias: I ship the schema, the API and the interface, then tune what turns out to be slow.',
        fileUrl: null,
        highlights: [
          'Led the rebuild of an operations dashboard used by 400 daily operators',
          'Cut p95 render time on a content platform from 3.1s to 0.9s',
          'Built the CMS that lets a non-technical team own every page of their site',
        ],
      },
    },
    {
      key: 'navigation',
      group: 'general',
      label: 'Navigation',
      value: {
        primary: [
          { label: 'Work', href: '/projects' },
          { label: 'Case studies', href: '/case-studies' },
          { label: 'Services', href: '/services' },
          { label: 'About', href: '/about' },
          { label: 'Writing', href: '/blog' },
          { label: 'Contact', href: '/contact' },
        ],
        footer: [
          { label: 'Skills', href: '/skills' },
          { label: 'Technologies', href: '/technologies' },
          { label: 'Experience', href: '/experience' },
          { label: 'Education', href: '/education' },
          { label: 'Certificates', href: '/certificates' },
          { label: 'Testimonials', href: '/testimonials' },
          { label: 'Gallery', href: '/gallery' },
          { label: 'Résumé', href: '/resume' },
          { label: 'FAQ', href: '/faq' },
        ],
      },
    },
    {
      key: 'identity',
      group: 'general',
      label: 'Site identity',
      value: {
        name: process.env.SEED_ADMIN_NAME ?? 'Suldaa Ahmed',
        initials: 'SA',
        role: 'Full-stack engineer',
        tagline: 'Platforms, interfaces, performance',
        footerNote: 'Designed and built from scratch — every page editable from the dashboard.',
      },
    },
  ];

  for (const document of documents) {
    await prisma.setting.upsert({
      where: { key: document.key },
      create: document,
      update: { value: document.value, group: document.group, label: document.label },
    });
  }

  console.log(`✓ ${documents.length} setting documents`);
}

async function seedSeo() {
  const records = [
    {
      path: '/',
      title: 'Suldaa Ahmed — Full-stack engineer',
      description:
        'Full-stack engineer building web platforms that stay fast under load. Selected work, case studies and writing.',
      keywords: ['full-stack engineer', 'web platforms', 'performance', 'portfolio'],
    },
    {
      path: '/projects',
      title: 'Selected work — Suldaa Ahmed',
      description: 'Products, platforms and interfaces I have designed and shipped end to end.',
      keywords: ['projects', 'portfolio', 'software engineering'],
    },
    {
      path: '/blog',
      title: 'Writing — Suldaa Ahmed',
      description: 'Notes on interface performance, data modelling and shipping software that lasts.',
      keywords: ['engineering blog', 'web performance'],
    },
    {
      path: '/contact',
      title: 'Contact — Suldaa Ahmed',
      description: 'Tell me about the work. Replies within two business days.',
      keywords: ['hire engineer', 'contact'],
    },
  ];

  for (const record of records) {
    await prisma.seoMeta.upsert({
      where: { path: record.path },
      create: record,
      update: record,
    });
  }

  console.log(`✓ ${records.length} SEO records`);
}

async function seedTaxonomy() {
  const categories = [
    { name: 'Web platforms', slug: 'web-platforms', color: '#ff5f38', order: 0 },
    { name: 'Developer tools', slug: 'developer-tools', color: '#3ddc97', order: 1 },
    { name: 'Data & dashboards', slug: 'data-dashboards', color: '#7c8cff', order: 2 },
    { name: 'Engineering notes', slug: 'engineering-notes', color: '#f7c948', order: 3 },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: category,
      update: category,
    });
  }

  const technologies = [
    { name: 'TypeScript', group: 'tooling', level: 95, color: '#3178c6' },
    { name: 'Next.js', group: 'frontend', level: 93, color: '#000000' },
    { name: 'React', group: 'frontend', level: 94, color: '#61dafb' },
    { name: 'Tailwind CSS', group: 'frontend', level: 90, color: '#38bdf8' },
    { name: 'NestJS', group: 'backend', level: 90, color: '#e0234e' },
    { name: 'Node.js', group: 'backend', level: 92, color: '#5fa04e' },
    { name: 'PostgreSQL', group: 'backend', level: 88, color: '#336791' },
    { name: 'Prisma', group: 'backend', level: 89, color: '#2d3748' },
    { name: 'Redis', group: 'backend', level: 80, color: '#dc382d' },
    { name: 'Docker', group: 'devops', level: 84, color: '#2496ed' },
    { name: 'GitHub Actions', group: 'devops', level: 82, color: '#2088ff' },
    { name: 'Figma', group: 'design', level: 78, color: '#a259ff' },
  ];

  const created: Record<string, string> = {};
  for (const [index, technology] of technologies.entries()) {
    const slug = technology.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const row = await prisma.technology.upsert({
      where: { slug },
      create: { ...technology, slug, order: index, status: ContentStatus.PUBLISHED },
      update: { ...technology, order: index },
    });
    created[technology.name] = row.id;
  }

  console.log(`✓ ${categories.length} categories, ${technologies.length} technologies`);
  return { technologyIds: created };
}

async function seedSkills() {
  const groups = [
    {
      name: 'Engineering',
      slug: 'engineering',
      icon: 'Code2',
      skills: [
        { name: 'System design', level: 92, years: 6, description: 'Boundaries, contracts and failure modes before code.' },
        { name: 'API design', level: 94, years: 7, description: 'REST surfaces that stay obvious as they grow.' },
        { name: 'Data modelling', level: 90, years: 6, description: 'Schemas that make the wrong state impossible.' },
        { name: 'Testing strategy', level: 85, years: 6, description: 'Unit where logic lives, e2e where money moves.' },
      ],
    },
    {
      name: 'Interface',
      slug: 'interface',
      icon: 'Palette',
      skills: [
        { name: 'Design systems', level: 88, years: 5, description: 'Tokens, primitives and the discipline to reuse them.' },
        { name: 'Motion & interaction', level: 84, years: 4, description: 'Animation that explains state, never decorates it.' },
        { name: 'Accessibility', level: 86, years: 5, description: 'Keyboard-first, screen-reader tested, contrast checked.' },
      ],
    },
    {
      name: 'Operations',
      slug: 'operations',
      icon: 'Server',
      skills: [
        { name: 'Performance tuning', level: 89, years: 5, description: 'Profiles first, then the fix, then the proof.' },
        { name: 'CI/CD', level: 83, years: 5, description: 'Pipelines that fail loudly and deploy quietly.' },
        { name: 'Observability', level: 80, years: 4, description: 'Logs, traces and dashboards worth paging on.' },
      ],
    },
  ];

  for (const [groupIndex, group] of groups.entries()) {
    const row = await prisma.skillGroup.upsert({
      where: { slug: group.slug },
      create: { name: group.name, slug: group.slug, icon: group.icon, order: groupIndex },
      update: { name: group.name, icon: group.icon, order: groupIndex },
    });

    for (const [skillIndex, skill] of group.skills.entries()) {
      const slug = skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await prisma.skill.upsert({
        where: { slug },
        create: { ...skill, slug, order: skillIndex, groupId: row.id, status: ContentStatus.PUBLISHED },
        update: { ...skill, order: skillIndex, groupId: row.id },
      });
    }
  }

  console.log(`✓ ${groups.length} skill groups`);
}

async function seedServices() {
  const services = [
    {
      title: 'Product engineering',
      slug: 'product-engineering',
      description:
        'End-to-end delivery of a web product: data model, API, interface and the deployment pipeline that ships it.',
      icon: 'Layers',
      features: ['Architecture and schema design', 'Next.js + NestJS implementation', 'CI/CD and observability'],
      priceFrom: 'from $6k',
    },
    {
      title: 'Performance audits',
      slug: 'performance-audits',
      description:
        'A measured pass over an existing product: traces, budgets, and a prioritised list of fixes with expected impact.',
      icon: 'Gauge',
      features: ['Core Web Vitals baseline', 'Database and query review', 'Written report with before/after numbers'],
      priceFrom: 'from $2.5k',
    },
    {
      title: 'Design systems',
      slug: 'design-systems',
      description:
        'A token-driven component library your team actually reuses, documented and wired into your codebase.',
      icon: 'Palette',
      features: ['Token architecture', 'Accessible component primitives', 'Usage documentation'],
      priceFrom: 'from $4k',
    },
    {
      title: 'CMS & platform work',
      slug: 'cms-platform-work',
      description:
        'Hand the content back to the people who own it: a dashboard where every page, section and image is editable.',
      icon: 'LayoutDashboard',
      features: ['Role-based admin dashboard', 'Draft/publish workflows', 'Media library and audit trail'],
      priceFrom: 'from $5k',
    },
  ];

  for (const [index, service] of services.entries()) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      create: { ...service, order: index, status: ContentStatus.PUBLISHED },
      update: { ...service, order: index },
    });
  }

  console.log(`✓ ${services.length} services`);
}

async function seedWork(technologyIds: Record<string, string>) {
  const webPlatforms = await prisma.category.findUnique({ where: { slug: 'web-platforms' } });
  const dashboards = await prisma.category.findUnique({ where: { slug: 'data-dashboards' } });
  const tools = await prisma.category.findUnique({ where: { slug: 'developer-tools' } });

  const link = (names: string[]) => ({
    connect: names.filter((name) => technologyIds[name]).map((name) => ({ id: technologyIds[name] })),
  });

  const projects = [
    {
      title: 'Logistics control tower',
      slug: 'logistics-control-tower',
      summary:
        'A realtime operations dashboard replacing a spreadsheet workflow for a freight team of 400 daily users.',
      content:
        '## The brief\n\nOperators tracked 2,000 daily shipments across four spreadsheets and a chat channel. Nothing was authoritative.\n\n## What I built\n\nA single control tower: an event-sourced timeline per shipment, live exception queues, and a permissions model that matches how the depot actually works.\n\n## Result\n\nException resolution time dropped by 41%, and the spreadsheet was retired in the first month.',
      coverUrl: null,
      client: 'Freight operator (NDA)',
      role: 'Lead engineer',
      year: 2025,
      metrics: [
        { label: 'Exception resolution', value: '-41%' },
        { label: 'p95 load', value: '0.9s' },
        { label: 'Daily operators', value: '400' },
      ],
      featured: true,
      categoryId: dashboards?.id,
      technologies: link(['Next.js', 'NestJS', 'PostgreSQL', 'Redis', 'TypeScript']),
    },
    {
      title: 'Composable checkout',
      slug: 'composable-checkout',
      summary:
        'A checkout rebuilt as a state machine, taking a three-step form from 62% to 81% completion.',
      content:
        '## The brief\n\nThe existing checkout dropped a fifth of its sessions between address and payment.\n\n## What I built\n\nAn explicit state machine with resumable sessions, optimistic validation and a payment layer that retries idempotently.\n\n## Result\n\nCompletion rose 19 points; support tickets about "lost" orders stopped.',
      client: 'D2C retailer',
      role: 'Contract engineer',
      year: 2024,
      metrics: [
        { label: 'Completion', value: '62% → 81%' },
        { label: 'Failed payments retried', value: '99.4%' },
      ],
      featured: true,
      categoryId: webPlatforms?.id,
      technologies: link(['React', 'Node.js', 'PostgreSQL', 'TypeScript']),
    },
    {
      title: 'Schema drift detector',
      slug: 'schema-drift-detector',
      summary:
        'A CLI that diffs a Prisma schema against a live database and fails CI when they disagree.',
      content:
        '## Why\n\nStaging and production had drifted three migrations apart, and nobody knew until a deploy failed.\n\n## What it does\n\nIntrospects the live database, compares it to the committed schema, and prints a migration plan — or exits non-zero in CI.',
      role: 'Author',
      year: 2024,
      repoUrl: 'https://github.com/',
      metrics: [{ label: 'CI runs protected', value: '3.2k' }],
      featured: true,
      categoryId: tools?.id,
      technologies: link(['TypeScript', 'Prisma', 'PostgreSQL', 'GitHub Actions']),
    },
    {
      title: 'Editorial platform rebuild',
      slug: 'editorial-platform-rebuild',
      summary:
        'Migrated a 12,000-article publication onto a CMS its editors could run without engineering support.',
      content:
        '## The brief\n\nEvery layout change went through a developer. Editors waited days for a headline fix.\n\n## What I built\n\nA content model with drafts, scheduled publishing and a block-based page composer, plus an import pipeline for the archive.',
      client: 'Independent publication',
      role: 'Platform engineer',
      year: 2023,
      metrics: [
        { label: 'Articles migrated', value: '12,400' },
        { label: 'Editor-led changes', value: '100%' },
      ],
      categoryId: webPlatforms?.id,
      technologies: link(['Next.js', 'NestJS', 'PostgreSQL', 'Docker']),
    },
  ];

  for (const [index, project] of projects.entries()) {
    const { technologies, ...data } = project;
    await prisma.project.upsert({
      where: { slug: project.slug },
      create: {
        ...data,
        order: index,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - index * 86_400_000 * 30),
        technologies,
      },
      update: { ...data, order: index, technologies },
    });
  }

  const controlTower = await prisma.project.findUnique({ where: { slug: 'logistics-control-tower' } });
  const checkout = await prisma.project.findUnique({ where: { slug: 'composable-checkout' } });

  const caseStudies = [
    {
      title: 'Retiring the spreadsheet: a control tower for freight operations',
      slug: 'retiring-the-spreadsheet',
      summary: 'How four spreadsheets and a chat channel became one authoritative operations view.',
      context:
        'A freight operator moving ~2,000 shipments a day, with a depot team of 400 and no single source of truth. Six-month engagement, team of three.',
      problem:
        'Shipment state lived in spreadsheets that operators edited simultaneously. Exceptions were discovered by customers before staff, and no one could reconstruct what had happened to a shipment.',
      approach:
        'I modelled each shipment as an append-only event timeline, then built read models for the three questions operators actually ask. Exceptions became a queue with ownership, and permissions were mapped to real depot roles rather than to job titles.',
      outcome:
        'Exception resolution time fell 41%. The spreadsheets were switched off within a month, and every state change is now attributable to a person and a timestamp.',
      metrics: [
        { label: 'Exception resolution', value: '-41%', delta: 'down' },
        { label: 'p95 dashboard load', value: '0.9s', delta: 'down' },
        { label: 'Audit coverage', value: '100%', delta: 'up' },
      ],
      projectId: controlTower?.id,
    },
    {
      title: 'Nineteen points of checkout completion',
      slug: 'nineteen-points-of-checkout',
      summary: 'Turning an ambiguous three-step form into an explicit, resumable state machine.',
      context:
        'A direct-to-consumer retailer with roughly 40,000 monthly checkouts and a 62% completion rate. Eight-week contract.',
      problem:
        'The checkout kept its state in component-local React state. A refresh, a slow payment provider or a validation error all lost the session, and each failure looked identical in the logs.',
      approach:
        'I extracted the flow into a serialisable state machine persisted per session, made every transition idempotent, and instrumented each edge so drop-off could be attributed to a specific transition rather than a step.',
      outcome:
        'Completion moved from 62% to 81% over six weeks. Payment retries now succeed 99.4% of the time, and "lost order" support tickets went to zero.',
      metrics: [
        { label: 'Completion', value: '+19pts', delta: 'up' },
        { label: 'Retry success', value: '99.4%', delta: 'up' },
        { label: 'Lost-order tickets', value: '0', delta: 'down' },
      ],
      projectId: checkout?.id,
    },
  ];

  for (const [index, caseStudy] of caseStudies.entries()) {
    await prisma.caseStudy.upsert({
      where: { slug: caseStudy.slug },
      create: {
        ...caseStudy,
        order: index,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - index * 86_400_000 * 45),
      },
      update: { ...caseStudy, order: index },
    });
  }

  console.log(`✓ ${projects.length} projects, ${caseStudies.length} case studies`);
}

async function seedResume() {
  const experience = [
    {
      company: 'Northwind Labs',
      role: 'Senior Full-Stack Engineer',
      slug: 'northwind-labs',
      location: 'Remote — EU',
      employmentType: 'full-time',
      startDate: new Date('2023-02-01'),
      current: true,
      summary: 'Platform work on operations tooling used by logistics teams across three countries.',
      highlights: [
        'Led the control tower rebuild now used by 400 daily operators',
        'Cut p95 dashboard render from 3.1s to 0.9s',
        'Introduced the review and release process the team still runs on',
      ],
      stack: ['Next.js', 'NestJS', 'PostgreSQL', 'Redis'],
    },
    {
      company: 'Kite & Compass',
      role: 'Full-Stack Engineer',
      slug: 'kite-and-compass',
      location: 'Hybrid — Nairobi',
      employmentType: 'full-time',
      startDate: new Date('2021-03-01'),
      endDate: new Date('2023-01-31'),
      summary: 'Product engineering for commerce clients, from schema to storefront.',
      highlights: [
        'Rebuilt a checkout flow, taking completion from 62% to 81%',
        'Built the shared component library used across five client sites',
      ],
      stack: ['React', 'Node.js', 'PostgreSQL'],
    },
    {
      company: 'Independent',
      role: 'Freelance Engineer',
      slug: 'independent-freelance',
      location: 'Remote',
      employmentType: 'freelance',
      startDate: new Date('2019-06-01'),
      endDate: new Date('2021-02-28'),
      summary: 'Websites, internal tools and migrations for small teams without in-house engineering.',
      highlights: ['Delivered 20+ projects', 'Migrated a 12,000-article publication onto a self-serve CMS'],
      stack: ['TypeScript', 'React', 'Docker'],
    },
  ];

  for (const [index, row] of experience.entries()) {
    await prisma.experience.upsert({
      where: { slug: row.slug },
      create: { ...row, order: index, status: ContentStatus.PUBLISHED },
      update: { ...row, order: index },
    });
  }

  const education = [
    {
      institution: 'University of Hargeisa',
      degree: 'BSc Computer Science',
      slug: 'bsc-computer-science',
      field: 'Software Engineering',
      location: 'Hargeisa',
      startDate: new Date('2015-09-01'),
      endDate: new Date('2019-06-30'),
      grade: 'First class',
      summary: 'Focus on distributed systems and databases; final project on incremental view maintenance.',
    },
    {
      institution: 'Interaction Design Foundation',
      degree: 'UI Design Patterns for Successful Software',
      slug: 'ui-design-patterns',
      field: 'Interaction design',
      startDate: new Date('2021-01-01'),
      endDate: new Date('2021-04-30'),
    },
  ];

  for (const [index, row] of education.entries()) {
    await prisma.education.upsert({
      where: { slug: row.slug },
      create: { ...row, order: index, status: ContentStatus.PUBLISHED },
      update: { ...row, order: index },
    });
  }

  const certificates = [
    {
      title: 'AWS Certified Solutions Architect — Associate',
      slug: 'aws-solutions-architect-associate',
      issuer: 'Amazon Web Services',
      issuedAt: new Date('2024-05-20'),
      expiresAt: new Date('2027-05-20'),
      credentialId: 'AWS-SAA-000000',
      credentialUrl: 'https://aws.amazon.com/certification/',
    },
    {
      title: 'PostgreSQL Performance Tuning',
      slug: 'postgresql-performance-tuning',
      issuer: 'EDB',
      issuedAt: new Date('2023-11-02'),
    },
    {
      title: 'Accessibility for Web Developers',
      slug: 'accessibility-for-web-developers',
      issuer: 'Deque University',
      issuedAt: new Date('2023-03-15'),
    },
  ];

  for (const [index, row] of certificates.entries()) {
    await prisma.certificate.upsert({
      where: { slug: row.slug },
      create: { ...row, order: index, status: ContentStatus.PUBLISHED },
      update: { ...row, order: index },
    });
  }

  console.log(`✓ ${experience.length} roles, ${education.length} education entries, ${certificates.length} certificates`);
}

async function seedSocialProof() {
  const testimonials = [
    {
      name: 'Amina Yusuf',
      slug: 'amina-yusuf',
      role: 'VP Engineering',
      company: 'Northwind Labs',
      quote:
        'He arrived, read the codebase, and came back with the three changes that mattered instead of the twenty that did not. The dashboard has not had an incident since.',
      rating: 5,
      featured: true,
    },
    {
      name: 'Daniel Okoro',
      slug: 'daniel-okoro',
      role: 'Founder',
      company: 'Kite & Compass',
      quote:
        'Our checkout had quietly leaked revenue for a year. Six weeks later we had numbers, not theories, and 19 more points of completion.',
      rating: 5,
      featured: true,
    },
    {
      name: 'Leila Hassan',
      slug: 'leila-hassan',
      role: 'Managing Editor',
      company: 'Independent publication',
      quote:
        'For the first time my team can publish a change without asking a developer. That alone paid for the project.',
      rating: 5,
      featured: true,
    },
  ];

  for (const [index, row] of testimonials.entries()) {
    await prisma.testimonial.upsert({
      where: { slug: row.slug },
      create: { ...row, order: index, status: ContentStatus.PUBLISHED },
      update: { ...row, order: index },
    });
  }

  const faqs = [
    {
      question: 'How do you price a project?',
      slug: 'how-do-you-price-a-project',
      answer:
        'Fixed price for a defined scope, weekly rate for open-ended platform work. Either way you get the estimate before anything starts, and I flag scope changes rather than absorbing them silently.',
      category: 'Working together',
    },
    {
      question: 'What does a typical engagement look like?',
      slug: 'what-does-a-typical-engagement-look-like',
      answer:
        'A short discovery pass to agree on the problem and success measures, then weekly shipping with a demo at the end of each week. You always have a running deployment to look at.',
      category: 'Working together',
    },
    {
      question: 'Do you work with existing codebases?',
      slug: 'do-you-work-with-existing-codebases',
      answer:
        'Most of my work is on systems that already exist. I start with a read-only audit — architecture, hot paths, test coverage — and hand over a prioritised plan before touching anything.',
      category: 'Working together',
    },
    {
      question: 'Who owns the code and the content?',
      slug: 'who-owns-the-code-and-the-content',
      answer:
        'You do, from the first commit. Everything ships in your repository, with documentation and a deployment guide, and every page is editable from the admin dashboard without a developer.',
      category: 'Practicalities',
    },
    {
      question: 'What is your availability?',
      slug: 'what-is-your-availability',
      answer:
        'I take on two concurrent projects. Current availability is shown at the top of the home page and kept up to date.',
      category: 'Practicalities',
    },
  ];

  for (const [index, row] of faqs.entries()) {
    await prisma.faq.upsert({
      where: { slug: row.slug },
      create: { ...row, order: index, status: ContentStatus.PUBLISHED },
      update: { ...row, order: index },
    });
  }

  console.log(`✓ ${testimonials.length} testimonials, ${faqs.length} FAQ entries`);
}

async function seedWriting(authorId: string) {
  const category = await prisma.category.findUnique({ where: { slug: 'engineering-notes' } });

  const posts = [
    {
      title: 'The first 400 milliseconds',
      slug: 'the-first-400-milliseconds',
      excerpt:
        'Everything a visitor decides about your product happens before your JavaScript finishes parsing. Here is where that time actually goes.',
      content:
        '## Where the time goes\n\nMost teams measure the wrong end of the request. By the time your bundle executes, the visitor has already formed an opinion.\n\n### Measure the sequence, not the total\n\nSplit the first paint into DNS, TLS, TTFB, and render, then look at which one you can actually move. On most sites it is TTFB, and the fix is caching rather than code.\n\n### Budget, then enforce\n\nA performance budget nobody fails is decoration. Wire it into CI and let it block a merge once — the team will remember.',
      tags: ['performance', 'web vitals'],
      readingTime: 6,
      featured: true,
    },
    {
      title: 'Schemas that make bad states impossible',
      slug: 'schemas-that-make-bad-states-impossible',
      excerpt:
        'Most validation code exists because the schema allowed something it should not have. A few constraints remove entire categories of bug.',
      content:
        '## Constraints are cheaper than code\n\nEvery nullable column is a branch somewhere in your application, forever.\n\n### Prefer enums to strings\n\nA status column with five valid values should not accept "pendign". The database can enforce that for free.\n\n### Let the unique index do the work\n\nApplication-level uniqueness checks race. A unique index does not.',
      tags: ['databases', 'postgres'],
    },
    {
      title: 'A CMS your client can actually run',
      slug: 'a-cms-your-client-can-actually-run',
      excerpt:
        'If changing a headline needs a developer, the project is unfinished. What it takes to hand a site back to its owners.',
      content:
        '## The handover test\n\nCan the person who paid for the site change its home page on a Friday afternoon without calling you? If not, you have shipped a prototype.\n\n### Draft, preview, publish\n\nThose three states cover almost every editorial workflow. Add scheduling only when someone asks twice.\n\n### Audit everything\n\nWhen a client asks "who changed this?", an answer builds more trust than any feature.',
      tags: ['cms', 'product'],
    },
  ];

  for (const [index, post] of posts.entries()) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      create: {
        ...post,
        authorId,
        categoryId: category?.id,
        order: index,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - index * 86_400_000 * 12),
      },
      update: { ...post, categoryId: category?.id, order: index },
    });
  }

  const gallery = [
    { title: 'Whiteboard: event timeline model', slug: 'whiteboard-event-timeline', album: 'Process' },
    { title: 'Control tower, exception queue', slug: 'control-tower-exception-queue', album: 'Work' },
    { title: 'Design tokens, second pass', slug: 'design-tokens-second-pass', album: 'Process' },
    { title: 'Talk: measuring what users feel', slug: 'talk-measuring-what-users-feel', album: 'Speaking' },
  ];

  for (const [index, item] of gallery.entries()) {
    await prisma.galleryItem.upsert({
      where: { slug: item.slug },
      create: {
        ...item,
        imageUrl: `/placeholder/gallery-${index + 1}.svg`,
        tags: [item.album.toLowerCase()],
        order: index,
        status: ContentStatus.PUBLISHED,
      },
      update: { ...item, order: index },
    });
  }

  console.log(`✓ ${posts.length} posts, ${gallery.length} gallery items`);
}

async function main() {
  console.log('Seeding Aurora portfolio…\n');
  const owner = await seedAccessControl();
  await seedSettings();
  await seedSeo();
  const { technologyIds } = await seedTaxonomy();
  await seedSkills();
  await seedServices();
  await seedWork(technologyIds);
  await seedResume();
  await seedSocialProof();
  await seedWriting(owner.id);
  console.log('\nDone. Sign in at /admin/login and change the seeded password.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
