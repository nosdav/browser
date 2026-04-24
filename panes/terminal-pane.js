import { html, render } from '../losos/html.js'

var xtermReady = null
function ensureXterm() {
  if (xtermReady) return xtermReady
  xtermReady = new Promise(function(resolve) {
    if (window.Terminal) { resolve(); return }
    var css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = 'https://cdn.jsdelivr.net/npm/xterm@5/css/xterm.min.css'
    document.head.appendChild(css)
    var s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/xterm@5/lib/xterm.min.js'
    s.onload = function() {
      var fit = document.createElement('script')
      fit.src = 'https://cdn.jsdelivr.net/npm/xterm-addon-fit@0/lib/xterm-addon-fit.min.js'
      fit.onload = function() { resolve() }
      document.head.appendChild(fit)
    }
    document.head.appendChild(s)
  })
  return xtermReady
}

export default {
  label: 'Terminal',
  icon: '\u{1F5A5}',

  canHandle(subject, store) {
    return window.location.pathname === '/terminal/'
      || window.location.pathname === '/terminal'
      || window.location.pathname === '/.terminal'
      || window.location.pathname === '/.terminal/'
  },

  render(subject, store, container, rawData) {
    // Hide tab bar
    var tabs = document.getElementById('pane-tabs')
    if (tabs) tabs.style.display = 'none'

    var w = document.createElement('div')
    w.style.cssText = 'position: fixed; inset: 0; background: #0a0a0a; display: flex; flex-direction: column; font-family: -apple-system, sans-serif;'

    // Title bar
    var bar = document.createElement('div')
    bar.style.cssText = 'display: flex; align-items: center; padding: 8px 16px; background: #1a1a1a; gap: 12px; flex-shrink: 0;'

    var dots = document.createElement('div')
    dots.style.cssText = 'display: flex; gap: 6px;'
    dots.innerHTML = '<span style="width:12px;height:12px;border-radius:50%;background:#ff5f57"></span>'
      + '<span style="width:12px;height:12px;border-radius:50%;background:#febc2e"></span>'
      + '<span style="width:12px;height:12px;border-radius:50%;background:#28c840"></span>'

    var title = document.createElement('span')
    title.style.cssText = 'color: rgba(255,255,255,0.5); font-size: 13px; flex: 1; text-align: center;'
    title.textContent = window.location.hostname + ' — terminal'

    bar.appendChild(dots)
    bar.appendChild(title)
    w.appendChild(bar)

    // Terminal container
    var termDiv = document.createElement('div')
    termDiv.id = 'terminal-container'
    termDiv.style.cssText = 'flex: 1; padding: 4px;'
    w.appendChild(termDiv)

    container.innerHTML = ''
    container.appendChild(w)

    ensureXterm().then(function() {
      var term = new window.Terminal({
        theme: {
          background: '#0a0a0a',
          foreground: '#e0e0e0',
          cursor: '#7c3aed',
          selectionBackground: '#7c3aed44',
          black: '#0a0a0a',
          red: '#ff5f57',
          green: '#28c840',
          yellow: '#febc2e',
          blue: '#3b82f6',
          magenta: '#8b5cf6',
          cyan: '#06b6d4',
          white: '#e0e0e0'
        },
        fontSize: 14,
        fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Fira Code", monospace',
        cursorBlink: true,
        cursorStyle: 'bar'
      })

      var fitAddon = new window.FitAddon.FitAddon()
      term.loadAddon(fitAddon)
      term.open(termDiv)
      fitAddon.fit()

      window.addEventListener('resize', function() { fitAddon.fit() })

      // Connect WebSocket
      var protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      var wsUrl = protocol + '//' + window.location.host + '/.terminal'
      var ws = new WebSocket(wsUrl)

      ws.onopen = function() {
        term.write('\r\n\x1b[1;35m  Connected to ' + window.location.hostname + '\x1b[0m\r\n\r\n')
      }

      ws.onmessage = function(e) {
        if (typeof e.data === 'string') {
          term.write(e.data)
        } else {
          e.data.arrayBuffer().then(function(buf) {
            term.write(new Uint8Array(buf))
          })
        }
      }

      ws.onclose = function() {
        term.write('\r\n\x1b[1;31m  Disconnected\x1b[0m\r\n')
      }

      ws.onerror = function() {
        term.write('\r\n\x1b[1;31m  Connection failed — is --terminal enabled?\x1b[0m\r\n')
      }

      term.onData(function(data) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data)
        }
      })

      term.focus()
    })
  }
}
