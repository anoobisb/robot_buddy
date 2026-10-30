import type { LevelId } from './core/progress';
import type { Scope } from './core/scope';

export type Route =
  | { name: 'start' }
  | { name: 'hub' }
  | { name: 'teach' }
  | { name: 'program'; puzzle?: number }
  | { name: 'safety' }
  | { name: 'sticker'; level: LevelId; again: Route; next: Route }
  | { name: 'gate' }
  | { name: 'corner' };

export interface App {
  go(route: Route): void;
}

/** A screen renders into `root`. Everything it schedules goes through `scope`. */
export type Screen = (root: HTMLElement, app: App, scope: Scope) => void;
