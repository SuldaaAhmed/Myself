import { AboutExcerpt } from '@/components/AboutExcerpt';
import { ContactForm } from '@/components/ContactForm';
import { Hero } from '@/components/Hero';
import { LedgerSection } from '@/components/LedgerSection';
import { SkillsManifest } from '@/components/SkillsManifest';
import { getHomePageData } from '@/lib/api';

/**
 * Home.
 *
 * A server component that fetches once and hands plain data down. The client
 * components below it (`Hero`, `LedgerSection`, `ContactForm`) receive props;
 * none of them fetches, and none of them knows whether the content came from
 * the API or from fixtures.
 *
 * The sections are numbered 001–005 and read top to bottom as a single
 * document: who this is, what they have built, what they work with, the longer
 * story, and how to start a conversation.
 *
 * The featured ledger uses `accordion` mode — a visitor skimming three
 * highlighted projects should be able to read the detail without leaving the
 * page. `/projects` uses `link` mode for the opposite reason.
 */
export default async function HomePage() {
  const { profile, featuredProjects, skills } = await getHomePageData();

  return (
    <>
      <Hero profile={profile} />

      <LedgerSection
        id="featured"
        index="002"
        title="Selected work"
        description="Open an entry to read the detail, or view the full ledger."
        projects={featuredProjects}
        mode="accordion"
        action={{ href: '/projects', label: 'All projects' }}
        // The only section that continues the hero's load sequence: its first
        // rows are above the fold on a desktop viewport, so the stagger reads
        // as one motion with the hero rather than as a separate effect.
        animateOnLoad
      />

      <SkillsManifest skills={skills} />

      <AboutExcerpt profile={profile} />

      <ContactForm email={profile.email} />
    </>
  );
}
