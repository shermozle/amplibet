// Where an event happened. AmpliBet's whole reason for existing is cross-surface
// analysis, so every event carries one of these and no event may omit it.
//
// 'web' and 'kiosk' are emitted by this app. 'in_store' and 'call_centre' are
// emitted server-side by the simulation script — they are listed here so the
// union is the single definition of the surface vocabulary and the script and
// the app cannot drift apart.
export type Surface = 'web' | 'kiosk' | 'in_store' | 'call_centre';

// Surfaces this build can actually run as.
export type ClientSurface = Extract<Surface, 'web' | 'kiosk'>;

// The kiosk is the same bundle served under a different route, so the surface is
// decided by the URL rather than by a build flag. Under HashRouter the path
// lives in the fragment, so that is what we read.
export const detectSurface = (): ClientSurface =>
  window.location.hash.startsWith('#/kiosk') ? 'kiosk' : 'web';
