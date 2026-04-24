# NosDav Browser

A data browser for [NosDav](https://nosdav.com) pods — load a pod URL, see a usable UI.

NosDav Browser turns raw JSON-LD resources on a pod into interactive views: tasks, folders, profiles, playlists, markdown, and more. It ships as the default UI for [`nosdav-server`](https://github.com/nosdav/server), so every resource on the pod becomes a small app without a build step, a bundler, or a server restart.

The whole thing is ~1,100 lines of vanilla JavaScript. No dependencies. No framework.

---

## Try it

```bash
npm install -g nosdav-server
nosdav
```

Open <http://localhost:3000/> and you're running it — `nosdav-server` wires this browser in as its default `--mashlib-module`. Every pod URL you visit is rendered by the pane that matches its `@type`.

To pin a specific build, pass it through explicitly:

```bash
nosdav --mashlib-module https://nosdav.github.io/browser/mashlib.js
```

The browser also works as a plain [JSS](https://github.com/JavaScriptSolidServer/JavaScriptSolidServer) `--mashlib-module`, so any Solid pod running JSS can load it unchanged.

---

## How it works

Three layers, each standalone and replaceable:

```
┌─────────────────────────────────────────────────────────────┐
│  mashlib.js           entry point: fetch → JSON-LD island   │
├─────────────────────────────────────────────────────────────┤
│  losos/               shell: load panes, route by @type     │
│                       (~600 LOC, template renderer + boot)  │
├─────────────────────────────────────────────────────────────┤
│  lion/                JSON-LD store, rdflib-compatible API  │
│                       (~175 LOC, replaces ~300 KB rdflib)   │
└─────────────────────────────────────────────────────────────┘
```

**mashlib.js** fetches the current URL (JSON-LD, markdown, or playlist), injects it as an inline `<script type="application/ld+json">` data island, registers pane modules, and imports the shell.

**LOSOS** (Linked Objects OS) loads every pane, finds the primary subject in the store, and renders a tab bar. Each pane decides for itself whether it can handle the subject. The first match wins.

**LION** (Linked Objects Notation) is a drop-in subset of rdflib: `match`, `any`, `each`, `holds`, `statementsMatching` — just enough for existing rdflib-based panes to work unchanged, without shipping 300 KB of triple-store code to the browser.

### Pane resolution

For each resource, the shell tries three sources in order:

1. **Local panes** — any pane whose `canHandle(subject, store)` returns `true`.
2. **`ui:view`** — if the node itself declares a view URL, load it dynamically.
3. **Registry** — `@type` → pane URL mapping (`losos/registry.js`).

The active tab is persisted per path in `localStorage`, so your pod remembers where you were.

---

## Writing a pane

A pane is a single ES module with two methods:

```js
import { html, render } from '../losos/html.js'

export default {
  label: 'Profile',
  icon: '\u{1F464}',                       // optional

  canHandle(subject, store) {
    const type = store.type(subject.value)
    return type && type.includes('Person')
  },

  render(subject, store, container, rawData) {
    const name = store.prop(subject.value, 'name')
    render(container, html`<h1>${name}</h1>`)
  }
}
```

Register it in `mashlib.js` (or publish it anywhere and reference it via `ui:view`):

```js
var panes = [
  'panes/profile-pane.js',
  // ...
]
```

That's the whole contract.

---

## Project layout

```
mashlib.js         entry point for --mashlib-module
mashlib.css        minimal default styling
index.html         standalone demo page
lion/
  index.js         JSON-LD store with rdflib-compatible methods
losos/
  shell.js         pane loader, tab bar, data resolution
  html.js          tagged-template → DOM renderer (no VDOM)
  registry.js      default @type → pane URL mappings
  losos.js         public API barrel
panes/
  home-pane.js     home screen: app grid, clock
  todo-pane.js     wf:Tracker / ical:Vtodo
  profile-pane.js  foaf:Person / schema:Person
  folder-pane.js   LDP containers
  markdown-pane.js text/markdown documents
  playlist-pane.js m3u / pls
  pod-pane.js      pod overview for Tracker docs
  sharing-pane.js  .acl editor (works on any resource)
  source-pane.js   raw JSON-LD view (catch-all)
  schema-pane.js   schema.org types
  agent-pane.js, webledger-pane.js, terminal-pane.js, …
```

---

## Development

Clone and serve the directory over HTTP — there is nothing to install, compile, or bundle:

```bash
git clone https://github.com/nosdav/browser
cd browser
python3 -m http.server 8000
```

Then point `nosdav-server` (or any JSS instance) at `http://localhost:8000/mashlib.js`, or open `index.html` directly.

The default branch is `gh-pages`, so pushing to it publishes immediately at `https://nosdav.github.io/browser/`.

---

## Why

`rdflib.js` + the original `mashlib.js` are ~300 KB and load N-Triples, Turtle, RDF/XML, SPARQL, patches, signing, pub-sub — a lot of surface for showing a to-do list. JSON-LD is now ubiquitous, browsers parse JSON natively, and most pods only need a handful of predicates. So:

- **LION** keeps the rdflib shape so existing panes port cleanly, but reads JSON-LD directly and drops everything else.
- **LOSOS** keeps panes isolated — any pane can live on any URL, referenced via `ui:view`. Data declares its own view.
- **mashlib.js** is the glue. 79 lines. Swap out either layer.

The result: pods stay small, boot fast, and anyone can fork a pane.

---

## License

[AGPL-3.0](LICENSE)
