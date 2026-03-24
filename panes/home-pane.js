import { html, render } from '../losos/html.js'

var APPS = [
  { icon: '\u{1F4C1}', label: 'Files', href: '/public/' },
  { icon: '\u{1F4DD}', label: 'Notes', href: '/public/notes/' },
  { icon: '\u{1F3B5}', label: 'Music', href: '/public/music/' },
  { icon: '\u{1F4B0}', label: 'Wallet', href: '/public/ledger/' },
  { icon: '\u{1F464}', label: 'Profile', href: '/' },
  { icon: '\u{1F4F7}', label: 'Camera', href: '/public/photos/' },
  { icon: '\u2705', label: 'Tasks', href: '/public/tasks/' },
  { icon: '\u{1F4C5}', label: 'Calendar', href: '/public/calendar/' },
  { icon: '\u{1F310}', label: 'Browse', href: 'about:blank' },
  { icon: '\u{1F91D}', label: 'Sharing', href: '/' },
  { icon: '\u{1F5A5}', label: 'Terminal', href: '/.terminal' },
  { icon: '\u2699\uFE0F', label: 'Settings', href: '/.system/' }
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
    var clockTimer = null

    function renderHome() {
      var w = document.createElement('div')
      w.style.cssText = 'min-height: 100vh; background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%); padding: 0; margin: -20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;'

      w.innerHTML = '<style>'
        + '.hm-app { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px 8px; border-radius: 16px; cursor: pointer; transition: background 0.2s; text-decoration: none; width: 80px; }'
        + '.hm-app:hover { background: rgba(255,255,255,0.08); }'
        + '.hm-app:active { transform: scale(0.95); }'
        + '.hm-icon { font-size: 32px; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); border-radius: 14px; }'
        + '.hm-label { font-size: 11px; color: rgba(255,255,255,0.7); text-align: center; }'
        + '.hm-recent { display: flex; align-items: center; padding: 10px 16px; border-radius: 10px; transition: background 0.15s; cursor: pointer; text-decoration: none; }'
        + '.hm-recent:hover { background: rgba(255,255,255,0.06); }'
        + '</style>'

      // Status bar
      var statusBar = document.createElement('div')
      statusBar.style.cssText = 'display: flex; justify-content: space-between; padding: 12px 24px; color: rgba(255,255,255,0.5); font-size: 12px; font-weight: 500;'
      statusBar.innerHTML = '<span>' + formatTime() + '</span><span>\u{1F4F6} \u{1F50B}</span>'
      w.appendChild(statusBar)

      // Clock
      var clock = document.createElement('div')
      clock.style.cssText = 'text-align: center; padding: 40px 0 16px;'
      var timeEl = document.createElement('div')
      timeEl.id = 'hm-time'
      timeEl.style.cssText = 'font-size: 64px; font-weight: 200; color: #fff; letter-spacing: -2px;'
      timeEl.textContent = formatTime()
      var dateEl = document.createElement('div')
      dateEl.id = 'hm-date'
      dateEl.style.cssText = 'font-size: 16px; color: rgba(255,255,255,0.4); margin-top: 4px;'
      dateEl.textContent = formatDate()
      clock.appendChild(timeEl)
      clock.appendChild(dateEl)
      w.appendChild(clock)

      // Update clock
      if (clockTimer) clearInterval(clockTimer)
      clockTimer = setInterval(function() {
        var t = document.getElementById('hm-time')
        var d = document.getElementById('hm-date')
        if (t) t.textContent = formatTime()
        if (d) d.textContent = formatDate()
      }, 10000)

      // App grid
      var grid = document.createElement('div')
      grid.style.cssText = 'display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; padding: 32px 16px; max-width: 400px; margin: 0 auto;'

      APPS.forEach(function(app) {
        var a = document.createElement('a')
        a.className = 'hm-app'
        a.href = app.href

        var icon = document.createElement('div')
        icon.className = 'hm-icon'
        icon.textContent = app.icon

        var label = document.createElement('div')
        label.className = 'hm-label'
        label.textContent = app.label

        a.appendChild(icon)
        a.appendChild(label)
        grid.appendChild(a)
      })

      w.appendChild(grid)

      // Quick actions
      var quick = document.createElement('div')
      quick.style.cssText = 'display: flex; justify-content: center; gap: 24px; padding: 24px 0;'

      var actions = [
        { icon: '\u{1F4DD}', label: 'New Note', action: function() { window.location.href = '/public/notes/new-' + Date.now() + '.md' } },
        { icon: '\u{1F50D}', label: 'Search', action: function() { /* todo */ } },
        { icon: '\u{1F4F7}', label: 'Photo', action: function() { window.location.href = '/public/photos/' } }
      ]

      actions.forEach(function(act) {
        var btn = document.createElement('button')
        btn.style.cssText = 'background: rgba(255,255,255,0.08); border: none; border-radius: 50%; width: 48px; height: 48px; font-size: 20px; cursor: pointer; transition: background 0.2s;'
        btn.textContent = act.icon
        btn.title = act.label
        btn.onclick = act.action
        btn.onmouseenter = function() { btn.style.background = 'rgba(255,255,255,0.15)' }
        btn.onmouseleave = function() { btn.style.background = 'rgba(255,255,255,0.08)' }
        quick.appendChild(btn)
      })

      w.appendChild(quick)

      // Pod info
      var info = document.createElement('div')
      info.style.cssText = 'text-align: center; padding: 24px 0 40px; font-size: 12px; color: rgba(255,255,255,0.2);'
      info.textContent = window.location.hostname
      w.appendChild(info)

      container.innerHTML = ''
      container.appendChild(w)
    }

    renderHome()
  }
}
