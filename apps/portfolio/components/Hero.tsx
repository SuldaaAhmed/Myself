'use client';

import { motion } from 'framer-motion';
import { ArrowDownToLine, ArrowRight } from 'lucide-react';
import { ButtonLink } from '@/components/Button';
import { riseIn, staggerContainer } from '@/lib/motion';
import type { Profile } from '@/lib/types';
import { firstSentence } from '@/lib/utils';

/**
 * The opening block: who this is, what they do, and the two things a visitor
 * most likely came to do.
 *
 * This is the origin of the page-load motion sequence — the only animation on
 * the site. The eyebrow, name, role, pitch and CTA row are children of one
 * stagger container, so they arrive 60ms apart as a single gesture rather than
 * as five independent effects.
 *
 * A client component because Framer Motion needs the browser. Its data still
 * comes from a server component (`app/page.tsx`) as props, so nothing here
 * fetches and nothing here decides what the copy is.
 */
export function Hero({ profile }: { profile: Profile }) {
  // The API stores one long biography. The hero shows its opening sentence, so
  // editing the bio in the admin panel updates both the hero and `/about`
  // without anyone maintaining a second "short bio" field that drifts.
  const pitch = firstSentence(profile.bio, 200);

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="border-b border-border"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto max-w-content px-6 py-16 md:py-24 lg:px-8">
        <motion.p
          variants={riseIn}
          className="font-mono text-label uppercase text-accent-amber"
        >
          {/* A ledger header, not a greeting. */}
          Index — 001 · Engineer
        </motion.p>

        <motion.h1
          variants={riseIn}
          id="hero-heading"
          className="mt-6 font-display text-4xl font-semibold leading-[1.05] text-text-primary md:text-6xl"
        >
          {profile.fullName}
        </motion.h1>

        <motion.p
          variants={riseIn}
          className="mt-4 font-display text-lg text-text-muted md:text-xl"
        >
          {profile.role}
        </motion.p>

        <motion.p
          variants={riseIn}
          className="mt-8 max-w-2xl font-body text-base leading-relaxed text-text-muted md:text-lg"
        >
          {pitch}
        </motion.p>

        <motion.div variants={riseIn} className="mt-10 flex flex-wrap items-center gap-3">
          <ButtonLink href="/projects">
            View projects
            <ArrowRight size={16} aria-hidden />
          </ButtonLink>

          {/*
            The résumé button only renders when the profile actually carries a
            URL. A disabled or dead "Download résumé" is worse than no button:
            it promises something the content does not have.
          */}
          {profile.resumeUrl ? (
            <ButtonLink
              href={profile.resumeUrl}
              variant="secondary"
              download
              // Screen readers otherwise announce "Download résumé, link" with
              // no hint that it leaves the page as a file.
              aria-label={`Download the résumé of ${profile.fullName} (PDF)`}
            >
              <ArrowDownToLine size={16} aria-hidden />
              Download résumé
            </ButtonLink>
          ) : null}
        </motion.div>
      </div>
    </motion.section>
  );
}
