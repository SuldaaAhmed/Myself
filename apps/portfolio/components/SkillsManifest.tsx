import { SectionHeader } from '@/components/SectionHeader';
import { SKILL_CATEGORIES, type Skill, type SkillCategory } from '@/lib/types';

/**
 * The skills manifest — an architecture readout, not a scoreboard.
 *
 * Four labelled columns, one per layer of the stack, each listing what is in
 * it. There are deliberately no percentage bars, star ratings or "90% React"
 * claims: a number attached to a skill is unfalsifiable, communicates nothing a
 * reader can act on, and every portfolio that shows one is guessing. A list of
 * what someone works with is a fact.
 *
 * A server component. It receives already-sorted skills and does no work that
 * needs a browser, so none of it ships as JavaScript.
 */

/**
 * Buckets skills by category, preserving the order they arrive in — `getSkills`
 * has already sorted by the CMS `order` field, so within a column the sequence
 * is whatever the site owner chose.
 */
function groupByCategory(skills: Skill[]): Map<SkillCategory, Skill[]> {
  const groups = new Map<SkillCategory, Skill[]>();

  // Seeded from the canonical list rather than from the data, so the columns
  // always appear in stack order — Frontend, Backend, Infra, Tools — and never
  // reshuffle because a category happened to have no entries this week.
  for (const category of SKILL_CATEGORIES) groups.set(category, []);

  for (const skill of skills) {
    groups.get(skill.category)?.push(skill);
  }

  return groups;
}

export function SkillsManifest({ skills }: { skills: Skill[] }) {
  const groups = groupByCategory(skills);

  // A category with nothing in it is dropped rather than rendered as an empty
  // column, which would read as a gap in the person's ability rather than as an
  // absence of data.
  const populated = [...groups.entries()].filter(([, items]) => items.length > 0);

  return (
    <section id="skills" aria-labelledby="skills-heading" className="border-b border-border">
      <div className="mx-auto max-w-content px-6 py-12 md:py-24 lg:px-8">
        <SectionHeader
          index="003"
          title="Skills manifest"
          description="What I reach for, grouped by where it sits in the stack."
          id="skills-heading"
        />

        {populated.length === 0 ? (
          <p className="mt-10 border border-dashed border-border px-6 py-12 text-center font-mono text-label uppercase text-text-muted">
            No entries yet
          </p>
        ) : (
          /*
            One column per category on desktop, stacked below `sm`. The dividers
            switch axis with the layout — a horizontal rule between stacked
            blocks, a vertical one between columns — so the grid reads as a
            table at every width.
          */
          <div className="mt-10 grid grid-cols-1 divide-y divide-border border-t border-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
            {populated.map(([category, items], columnIndex) => (
              <div
                key={category}
                className="px-0 py-8 sm:border-b sm:border-border sm:px-6 sm:first:pl-0 lg:border-b-0 lg:border-l lg:first:border-l-0 lg:first:pl-0"
              >
                <h3 className="font-mono text-label uppercase text-text-muted">
                  <span className="text-accent-amber">
                    {String(columnIndex + 1).padStart(2, '0')}
                  </span>{' '}
                  {category}
                </h3>

                <ul className="mt-4 space-y-2">
                  {items.map((skill) => (
                    <li
                      key={skill.id}
                      className="font-mono text-sm text-text-primary"
                    >
                      {skill.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
