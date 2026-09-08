'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { demoPersonaOptions, resolveDemoPersona } from '@/lib/demo-personas';

export function PersonaSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const persona = resolveDemoPersona(searchParams.get('persona') || undefined);

  function changePersona(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set('persona', resolveDemoPersona(value));
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return <div className="continuum-demo-persona"><strong>Demo Mode</strong><label htmlFor="continuum-persona">View as</label><select id="continuum-persona" value={persona} onChange={(event) => changePersona(event.target.value)}>{demoPersonaOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><span aria-hidden="true">DEMO</span></div>;
}
