// src/utils/locationDisclosure.ts
//
// "Use Your Location" prominent disclosure, shown before the system location prompt
// (Java: RuntimePermissionActivity; Google Play requires it for background location).
// LocationDisclosureHost (mounted in App.tsx) registers the presenter and calls resolve.

type Presenter = () => void;

let presenter: Presenter | null = null;
let resolver: ((agreed: boolean) => void) | null = null;
let pending: Promise<boolean> | null = null;

export function setLocationDisclosurePresenter(next: Presenter | null): void {
  presenter = next;
}

/** Resolves true when the user taps Turn on, false for No thanks or dismiss. */
export function showLocationDisclosure(): Promise<boolean> {
  if (pending) return pending;
  if (!presenter) return Promise.resolve(false); // host not mounted: never prompt without the disclosure
  pending = new Promise<boolean>(resolve => {
    resolver = resolve;
    presenter?.();
  });
  return pending;
}

export function resolveLocationDisclosure(agreed: boolean): void {
  const resolve = resolver;
  resolver = null;
  pending = null;
  resolve?.(agreed);
}