'use client';

import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CalendarCheck,
  Check,
  ExternalLink,
  Layers3,
  Link2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import styles from './deck.module.css';

const slides = [
  { id: 'opening', label: 'Opening' },
  { id: 'problem', label: 'Observed problem' },
  { id: 'foundation', label: 'Existing foundation' },
  { id: 'model', label: 'Continuum model' },
  { id: 'pilot', label: 'BCom pilot' },
  { id: 'demo', label: 'Live demonstration' },
  { id: 'reach', label: 'Shared access' },
  { id: 'request', label: 'Institutional request' },
] as const;

export default function ConferenceDeckPage() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.closest('button, a, input, select, textarea')) return;
      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') setActive((current) => Math.min(slides.length - 1, current + 1));
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') setActive((current) => Math.max(0, current - 1));
      if (event.key === 'Home') setActive(0);
      if (event.key === 'End') setActive(slides.length - 1);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return <main className={styles.deck}>
    <header className={styles.controls}>
      <a href="/presentation"><ArrowLeft size={17}/> Prototype</a>
      <span>{active + 1} / {slides.length}</span>
      <nav aria-label="Presentation slides">
        {slides.map((slide, index) => <button key={slide.id} type="button" aria-label={`Open slide ${index + 1}: ${slide.label}`} aria-current={active === index ? 'page' : undefined} onClick={() => setActive(index)}/>) }
      </nav>
      <button type="button" onClick={() => window.print()}>Export / print</button>
    </header>

    <div className={styles.stage} aria-live="polite">
      <section className={`${styles.slide} ${styles.opening}`} hidden={active !== 0}>
        <Image src="/brand/afda-continuum-wordmark.svg" alt="AFDA Continuum" width={680} height={382} priority/>
        <div><h1>A governed learning ecosystem for AFDA.</h1><p>Conference prototype · BCom configured pilot · fictional demonstration data</p></div>
      </section>

      <section className={styles.slide} hidden={active !== 1}>
        <SlideHeader count="01" title="The problem is fragmentation, not a shortage of software."/>
        <div className={styles.argumentGrid}>
          <article><strong>Group formation</strong><p>Multidisciplinary teams are formed in one workflow.</p></article>
          <article><strong>Scheduling</strong><p>Sessions, appointments and attendance live elsewhere.</p></article>
          <article><strong>Spaces</strong><p>Resource requests have a separate operational owner.</p></article>
          <article><strong>Academic records</strong><p>CARS remains the institutional system for the responsibilities it already owns.</p></article>
        </div>
        <p className={styles.statement}>People experience separate tools. Continuum proposes a governed front door and shared context between them.</p>
      </section>

      <section className={styles.slide} hidden={active !== 2}>
        <SlideHeader count="02" title="The pilot starts from working services."/>
        <div className={styles.foundationFlow}>
          <Service icon={<Users/>} title="Group Sync" copy="Existing team-formation service" state="Existing"/>
          <Service icon={<CalendarCheck/>} title="Schedule" copy="Existing staff and student booking workflows" state="Existing"/>
          <Service icon={<Layers3/>} title="Spaces & Resources" copy="Emerging workflow under controlled testing" state="Emerging"/>
        </div>
        <div className={styles.boundary}><ShieldCheck/><span><strong>Protected ownership</strong><small>Continuum does not recreate these workflows or take over CARS responsibilities.</small></span></div>
      </section>

      <section className={styles.slide} hidden={active !== 3}>
        <SlideHeader count="03" title="Every visible result is traced back to an input."/>
        <div className={styles.modelDiagram}>
          <div className={styles.modelCore}><Image src="/brand/afda-continuum-inverse.svg" alt="AFDA Continuum" width={300} height={90}/><span>Orchestration layer</span></div>
          <div><strong>Inputs</strong><small>Academic period · school scope · disciplines · service references</small></div>
          <div><strong>Governance rules</strong><small>Source ownership · role · activity · assessment · expiry</small></div>
          <div><strong>Visible outputs</strong><small>Workspace · task · experience preview · local audit event</small></div>
        </div>
      </section>

      <section className={styles.slide} hidden={active !== 4}>
        <SlideHeader count="04" title="BCom is the configured sandbox—not the definition of the LMS."/>
        <div className={styles.pilotLayout}>
          <div className={styles.disciplines}><span>Start-Up Finance</span><span>Marketing and Sales</span><span>U(I)X Operations and Design</span><span>Business Strategy & Management</span></div>
          <div><h2>Neighbourhood Futures</h2><p>A four-discipline team persists across the term and can be connected to assessments, sessions and resources without becoming the institution-wide academic model.</p><ul><li><Check/> Team context retained</li><li><Check/> Individual and team assessment patterns</li><li><Check/> Service ownership preserved</li></ul></div>
        </div>
      </section>

      <section className={styles.slide} hidden={active !== 5}>
        <SlideHeader count="05" title="The demo shows inputs becoming governed outcomes."/>
        <div className={styles.demoFrame}>
          <div className={styles.demoRail}><span>Institution</span><span>BCom workspace</span><strong>Assessment</strong><span>School services</span><span>Cross-school</span></div>
          <div className={styles.demoCanvas}><span>Business Concept Presentation</span><h2>Assign an ad hoc assessor with a clear boundary.</h2><div className={styles.demoFacts}><span>Criterion<strong>Market readiness</strong></span><span>Access<strong>18–24 August</strong></span><span>Scope<strong>This assessment only</strong></span></div><a href="/presentation">Open the live prototype <ExternalLink size={17}/></a></div>
        </div>
      </section>

      <section className={styles.slide} hidden={active !== 6}>
        <SlideHeader count="06" title="Other schools can gain value without a fabricated academic model."/>
        <div className={styles.reachGrid}>
          <article><Link2/><h2>Shared-service access</h2><p>Enable Group Sync or Schedule for a school workspace while its own terminology and academic configuration remain school-owned.</p></article>
          <article><Users/><h2>Cross-school facilitation</h2><p>Participants retain home school and discipline while Continuum coordinates project membership, access, scheduling and resource references.</p></article>
        </div>
        <p className={styles.statement}>Continuum facilitates participation. Schools decide curriculum, assessment and credit.</p>
      </section>

      <section className={styles.slide} hidden={active !== 7}>
        <SlideHeader count="07" title="The request is a controlled institutional pilot."/>
        <div className={styles.requestGrid}>
          <div><BookOpenCheck/><strong>Validate the learning requirements</strong><p>Confirm programme, module, assessment and feedback practices with academic owners before creating persistent academic structures.</p></div>
          <div><ShieldCheck/><strong>Validate governance</strong><p>Agree role scope, expiry, audit expectations and the boundary with CARS and Microsoft 365.</p></div>
          <div><Layers3/><strong>Validate shared services</strong><p>Connect established services incrementally, keeping their workflows independently deployable.</p></div>
        </div>
        <footer><Image src="/brand/afda-continuum-horizontal.svg" alt="AFDA Continuum" width={230} height={69}/><span>Prototype first. Validate before institutionalising.</span></footer>
      </section>
    </div>

    <footer className={styles.deckFooter}>
      <button type="button" onClick={() => setActive((current) => Math.max(0, current - 1))} disabled={active === 0}><ArrowLeft/> Previous</button>
      <span>{slides[active].label}</span>
      <button type="button" onClick={() => setActive((current) => Math.min(slides.length - 1, current + 1))} disabled={active === slides.length - 1}>Next <ArrowRight/></button>
    </footer>
  </main>;
}

function SlideHeader({ count, title }: { count: string; title: string }) {
  return <header className={styles.slideHeader}><span>{count}</span><h1>{title}</h1></header>;
}

function Service({ icon, title, copy, state }: { icon: React.ReactNode; title: string; copy: string; state: string }) {
  return <article className={styles.service}><span>{icon}</span><div><h2>{title}</h2><p>{copy}</p></div><em>{state}</em></article>;
}
