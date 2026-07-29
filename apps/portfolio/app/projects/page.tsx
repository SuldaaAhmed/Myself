import type { Metadata } from 'next';
import { ProjectLedger } from '@/components/ProjectLedger';
import { SectionHeader } from '@/components/SectionHeader';
import { getProjects } from '@/lib/api';

/**
 * `/projects` — the full ledger.
 *
 * The page itself is a server component: it fetches every project and renders
 * the heading. Only `ProjectLedger` is a client component, because only the
 * filters need state. The rows arrive in the initial HTML, so the list is
 * readable and crawlable before any JavaScript runs, and the filters activate
 * on top of it.
 */

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'Every project, filterable by stack and status — remittance infrastructure, internal tooling and the services behind them.',
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <section aria-labelledby="projects-heading">
      <div className="mx-auto max-w-content px-6 py-12 md:py-20 lg:px-8">
        <SectionHeader
          index="001"
          title="Project ledger"
          description="Every entry, newest first. Filter by status or by what it is built with."
          as="h1"
          id="projects-heading"
        />

        <ProjectLedger projects={projects} />
      </div>
    </section>
  );
}
