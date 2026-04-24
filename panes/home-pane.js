import { html, render } from '../losos/html.js'

// SVG icons — simple, consistent, white on colored background
var I = {
  files: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>',
  notes: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>',
  music: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/><circle cx="16" cy="14" r="1.5"/></svg>',
  profile: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  tasks: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><text x="12" y="17" text-anchor="middle" fill="#fff" stroke="none" font-size="7" font-weight="700">24</text></svg>',
  browse: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15 15 0 014 10 15 15 0 01-4 10 15 15 0 01-4-10A15 15 0 0112 2z"/></svg>',
  sharing: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>',
  terminal: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>'
}

var APPS = [
  { svg: I.files, label: 'Files', href: '/public/', color: '#3b82f6' },
  { svg: I.notes, label: 'Notes', href: '/public/notes/', color: '#8b5cf6' },
  { svg: I.music, label: 'Music', href: '/public/music/', color: '#ec4899' },
  { svg: I.wallet, label: 'Wallet', href: '/public/ledger/', color: '#f59e0b' },
  { svg: I.profile, label: 'Profile', href: '/', color: '#7c3aed' },
  { svg: I.camera, label: 'Camera', href: '/public/photos/', color: '#10b981' },
  { svg: I.tasks, label: 'Tasks', href: '/public/tasks/', color: '#06b6d4' },
  { svg: I.calendar, label: 'Calendar', href: '/public/calendar/', color: '#f97316' },
  { svg: I.browse, label: 'Browse', href: 'about:blank', color: '#6366f1' },
  { svg: I.sharing, label: 'Sharing', href: '/', color: '#14b8a6' },
  { svg: I.terminal, label: 'Terminal', href: '/.terminal', color: '#334155' },
  { svg: I.settings, label: 'Settings', href: '/.system/', color: '#64748b' }
]

function formatTime() {
  var d = new Date()
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function formatDate() {
  var d = new Date()
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

export default {
  label: 'Home',
  icon: '\u{1F3E0}',

  canHandle(subject, store) {
    return window.location.pathname === '/home/'
      || window.location.pathname === '/home'
  },

  render(subject, store, container, rawData) {
    // Hide the tab bar — home screen IS the chrome
    var tabs = document.getElementById('pane-tabs')
    if (tabs) tabs.style.display = 'none'

    var clockTimer = null

    function renderHome() {
      var w = document.createElement('div')
      w.style.cssText = 'position: fixed; inset: 0; background: linear-gradient(160deg, #0a0a14 0%, #12122a 40%, #1a1038 70%, #0f1628 100%); overflow-y: auto; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased;'

      w.innerHTML = '<style>'
        + '@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }'
        + '.hm-app { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 12px; border-radius: 18px; cursor: pointer; transition: all 0.2s; text-decoration: none; width: 76px; animation: fadeIn 0.4s ease backwards; }'
        + '.hm-app:hover { background: rgba(255,255,255,0.06); transform: scale(1.05); }'
        + '.hm-app:active { transform: scale(0.92); }'
        + '.hm-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); padding: 12px; }'
        + '.hm-icon svg { width: 100%; height: 100%; }'
        + '.hm-label { font-size: 11px; color: rgba(255,255,255,0.6); text-align: center; font-weight: 500; }'
        + '.hm-dock { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: center; gap: 20px; padding: 14px 24px 24px; background: linear-gradient(transparent, rgba(0,0,0,0.6)); }'
        + '.hm-dock-btn { width: 52px; height: 52px; border-radius: 14px; border: none; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #fff; cursor: pointer; transition: all 0.2s; background: rgba(255,255,255,0.12); backdrop-filter: blur(12px); }'
        + '.hm-dock-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.08); }'
        + '.hm-dock-btn:active { transform: scale(0.92); }'
        + '</style>'

      // Status bar
      var statusBar = document.createElement('div')
      statusBar.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 14px 28px 0; color: rgba(255,255,255,0.4); font-size: 12px; font-weight: 600; letter-spacing: 0.02em;'
      var timeSmall = document.createElement('span')
      timeSmall.id = 'hm-time-small'
      timeSmall.textContent = formatTime()
      var indicators = document.createElement('div')
      indicators.style.cssText = 'display: flex; gap: 6px; align-items: center;'
      indicators.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"><path d="M1 6l5-4 5 4M3 10l3-2.5L9 10M5.5 14v0"/></svg>'
        + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2"><rect x="2" y="7" width="18" height="12" rx="2"/><line x1="22" y1="11" x2="22" y2="15"/></svg>'
      statusBar.appendChild(timeSmall)
      statusBar.appendChild(indicators)
      w.appendChild(statusBar)

      // Clock
      var clock = document.createElement('div')
      clock.style.cssText = 'text-align: center; padding: 48px 0 12px; animation: fadeIn 0.6s ease;'
      var timeEl = document.createElement('div')
      timeEl.id = 'hm-time'
      timeEl.style.cssText = 'font-size: 72px; font-weight: 100; color: rgba(255,255,255,0.95); letter-spacing: -3px; line-height: 1;'
      timeEl.textContent = formatTime()
      var dateEl = document.createElement('div')
      dateEl.id = 'hm-date'
      dateEl.style.cssText = 'font-size: 15px; color: rgba(255,255,255,0.3); margin-top: 8px; font-weight: 400; letter-spacing: 0.03em;'
      dateEl.textContent = formatDate()
      clock.appendChild(timeEl)
      clock.appendChild(dateEl)
      w.appendChild(clock)

      // Update clock
      if (clockTimer) clearInterval(clockTimer)
      clockTimer = setInterval(function() {
        var t = document.getElementById('hm-time')
        var d = document.getElementById('hm-date')
        var ts = document.getElementById('hm-time-small')
        if (t) t.textContent = formatTime()
        if (d) d.textContent = formatDate()
        if (ts) ts.textContent = formatTime()
      }, 10000)

      // App grid
      var grid = document.createElement('div')
      grid.style.cssText = 'display: grid; grid-template-columns: repeat(4, 76px); justify-content: center; gap: 12px; padding: 40px 16px 120px;'

      APPS.forEach(function(app, i) {
        var a = document.createElement('a')
        a.className = 'hm-app'
        a.href = app.href
        a.style.animationDelay = (i * 0.04) + 's'

        var icon = document.createElement('div')
        icon.className = 'hm-icon'
        icon.style.background = 'linear-gradient(135deg, ' + app.color + ', ' + app.color + 'aa)'
        icon.innerHTML = app.svg

        var label = document.createElement('div')
        label.className = 'hm-label'
        label.textContent = app.label

        a.appendChild(icon)
        a.appendChild(label)
        grid.appendChild(a)
      })

      w.appendChild(grid)

      // Dock
      var dock = document.createElement('div')
      dock.className = 'hm-dock'

      var dockApps = [
        { svg: I.files, color: '#3b82f6', href: '/public/' },
        { svg: I.notes, color: '#8b5cf6', href: '/public/notes/' },
        { svg: I.browse, color: '#6366f1', href: 'about:blank' },
        { svg: I.profile, color: '#7c3aed', href: '/' }
      ]

      dockApps.forEach(function(app) {
        var btn = document.createElement('a')
        btn.className = 'hm-dock-btn'
        btn.href = app.href
        btn.style.background = 'linear-gradient(135deg, ' + app.color + '44, ' + app.color + '22)'
        btn.style.padding = '13px'
        btn.innerHTML = app.svg
        dock.appendChild(btn)
      })

      w.appendChild(dock)

      container.innerHTML = ''
      container.appendChild(w)
    }

    renderHome()
  }
}
