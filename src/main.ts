import './styles.css';
import type { App, Route } from './app';
import { hush, initAudio } from './core/audio';
import { resolveLang, setLang } from './core/i18n';
import { createScope, type Scope } from './core/scope';
import { colorScreen } from './levels/color/scene';
import { programScreen } from './levels/program/scene';
import { safetyScreen } from './levels/safety/scene';
import { teachScreen } from './levels/teach/scene';
import { cornerScreen } from './ui/corner';
import { gateScreen } from './ui/gate';
import { hubScreen } from './ui/hub';
import { startScreen } from './ui/start';
import { stickerScreen } from './ui/sticker';

setLang(resolveLang(location.search));
initAudio();

// Stop the browser from zooming or opening menus under small fingers.
for (const type of ['gesturestart', 'dblclick', 'contextmenu'] as const) {
  document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
}
document.addEventListener(
  'touchmove',
  (e) => {
    if (e.touches.length > 1) e.preventDefault();
  },
  { passive: false },
);

const root = document.getElementById('app')!;
let scope: Scope = createScope();

function screenFor(route: Route) {
  switch (route.name) {
    case 'start':
      return startScreen;
    case 'hub':
      return hubScreen;
    case 'teach':
      return teachScreen;
    case 'program':
      return programScreen(route.puzzle);
    case 'safety':
      return safetyScreen;
    case 'color':
      return colorScreen(route.page);
    case 'sticker':
      return stickerScreen(route.level, route.again, route.next);
    case 'gate':
      return gateScreen;
    case 'corner':
      return cornerScreen;
  }
}

const app: App = {
  go(route) {
    scope.dispose();
    hush(true);
    scope = createScope();
    root.dataset.route = route.name;
    screenFor(route)(root, app, scope);
  },
};

app.go({ name: 'start' });
