/**
 * mashlib.js — LOSOS entry point for JSS --mashlib-module
 *
 * Usage:
 *   jss start --mashlib-module https://host/path/to/mashlib.js
 *
 * JSS generates: <div id="mashlib"></div> + <script type="module" src="...">
 * LOSOS shell auto-boots when it detects #mashlib.
 */

var base = new URL('.', import.meta.url).href
var resourceUrl = window.location.href.replace(/[?#].*$/, '')

// Inject the sibling mashlib.css so standalone consumers get default styling
var cssLink = document.createElement('link')
cssLink.rel = 'stylesheet'
cssLink.href = base + 'mashlib.css'
document.head.appendChild(cssLink)

// Inject xlogin for Solid/Nostr authentication
var xloginScript = document.createElement('script')
xloginScript.src = 'https://unpkg.com/xlogin'
document.head.appendChild(xloginScript)

// Fetch the current resource
try {
  var res = await fetch(resourceUrl, {
    headers: { 'Accept': 'application/ld+json, text/markdown, text/plain' },
    cache: 'no-store'
  })
  var contentType = (res.headers.get('content-type') || '').split(';')[0].trim()
  var data

  var playlistTypes = ['audio/mpegurl', 'application/vnd.apple.mpegurl', 'audio/x-scpls']
  var isPlaylist = playlistTypes.indexOf(contentType) !== -1 || resourceUrl.match(/\.(m3u8?|pls)$/)

  if (!res.ok && (resourceUrl.endsWith('.md') || resourceUrl.endsWith('.txt'))) {
    // 404 — offer to create the file
    data = { '@id': resourceUrl, '@type': 'TextDocument', 'content': '', 'contentType': 'text/markdown', 'resourceUrl': resourceUrl, 'isNew': true }
  } else if (isPlaylist) {
    var text = await res.text()
    data = { '@id': resourceUrl, '@type': 'Playlist', 'content': text, 'contentType': contentType, 'resourceUrl': resourceUrl }
  } else if (contentType === 'text/markdown' || contentType === 'text/plain' || resourceUrl.endsWith('.md')) {
    var text = await res.text()
    data = { '@id': resourceUrl, '@type': 'TextDocument', 'content': text, 'contentType': contentType, 'resourceUrl': resourceUrl }
  } else {
    data = await res.json()
  }

  // Inject inline data island
  var dataScript = document.createElement('script')
  dataScript.type = 'application/ld+json'
  dataScript.__jsonLd = data
  dataScript.textContent = JSON.stringify(data)
  document.head.appendChild(dataScript)
} catch (err) {
  console.warn('[losos] Failed to fetch resource:', resourceUrl, err)
}

// Register default panes
var panes = [
  'panes/home-pane.js',
  'panes/terminal-pane.js',
  'panes/profile-pane.js',
  'panes/agent-pane.js',
  'panes/folder-pane.js',
  'panes/webledger-pane.js',
  'panes/playlist-pane.js',
  'panes/markdown-pane.js',
  'panes/todo-pane.js',
  'panes/schema-pane.js',
  'panes/pod-pane.js',
  'panes/sharing-pane.js',
  'panes/source-pane.js'
]
for (var p of panes) {
  var el = document.createElement('script')
  el.setAttribute('data-pane', '')
  el.type = 'module'
  el.src = base + p
  document.head.appendChild(el)
}

// Import shell — auto-boots on detecting <div id="mashlib">
await import(base + 'losos/shell.js')
