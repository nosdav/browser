import { html, render } from '../losos/html.js'

var TOOL_ICONS = {
  Bash: '\u{1F4BB}', Edit: '\u270F\uFE0F', Write: '\u{1F4DD}', Read: '\u{1F4C4}',
  Grep: '\u{1F50D}', Glob: '\u{1F4C2}', Agent: '\u{1F916}', WebFetch: '\u{1F310}',
  WebSearch: '\u{1F50E}', Skill: '\u26A1', idle: '\u{1F4A4}', unknown: '\u2699\uFE0F'
}

var TOOL_COLORS = {
  Bash: '#f59e0b', Edit: '#8b5cf6', Write: '#8b5cf6', Read: '#3b82f6',
  Grep: '#10b981', Glob: '#10b981', Agent: '#ec4899', WebFetch: '#06b6d4',
  WebSearch: '#06b6d4', Skill: '#f97316'
}

var CATEGORIES = {
  Read: 'Analyze', Grep: 'Analyze', Glob: 'Analyze', WebFetch: 'Analyze', WebSearch: 'Analyze',
  Edit: 'Code', Write: 'Code',
  Bash: 'Execute',
  Agent: 'Delegate'
}

var CAT_COLORS = { Analyze: '#3b82f6', Code: '#8b5cf6', Execute: '#f59e0b', Delegate: '#ec4899' }
var CAT_ICONS = { Analyze: '\u{1F50D}', Code: '\u270F\uFE0F', Execute: '\u{1F4BB}', Delegate: '\u{1F916}' }

function timeAgo(ts) {
  var diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 5) return 'just now'
  if (diff < 60) return Math.floor(diff) + 's ago'
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago'
  return Math.floor(diff / 3600) + 'h ago'
}

export default {
  label: 'Agent',
  icon: '\u{1F916}',

  canHandle(subject, store) {
    var node = store.get(subject.value)
    if (!node) { for (var entry of store.nodes) { node = entry[1]; break } }
    if (!node) return false
    return (node['@type'] || '') === 'AgentStatus'
  },

  render(subject, store, container, rawData) {
    var data = rawData
    if (!data) return

    var tool = data.currentTool || 'idle'
    var detail = data.currentDetail || ''
    var timestamp = data.timestamp
    var history = data.history || []

    var resourceUrl = window.location.href.replace(/[?#].*$/, '')
    setInterval(function() {
      fetch(resourceUrl, { headers: { 'Accept': 'application/ld+json' }, cache: 'no-store' })
        .then(function(r) { return r.json() })
        .then(function(d) {
          if (d.timestamp !== timestamp) {
            tool = d.currentTool || 'idle'
            detail = d.currentDetail || ''
            timestamp = d.timestamp
            history = d.history || []
            renderAgent()
          }
        }).catch(function() {})
    }, 2000)

    function renderAgent() {
      var isRecent = timestamp && (Date.now() - new Date(timestamp).getTime()) < 30000

      // Build kanban columns from history
      var columns = { Analyze: [], Code: [], Execute: [], Delegate: [] }
      history.forEach(function(h) {
        var cat = CATEGORIES[h.tool] || 'Execute'
        if (columns[cat].length < 6) {
          columns[cat].push(h)
        }
      })

      var w = document.createElement('div')
      w.innerHTML = '<style>'
        + '@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}'
        + '@keyframes cardIn{from{opacity:0;transform:translateY(-12px) scale(.95)}to{opacity:1;transform:none}}'
        + '@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}'
        + '.ag-card{background:#fff;border-radius:8px;padding:10px 12px;margin-bottom:6px;box-shadow:0 1px 3px rgba(0,0,0,.06);animation:cardIn .4s ease;transition:transform .15s,box-shadow .15s;cursor:default;}'
        + '.ag-card:hover{transform:translateY(-1px);box-shadow:0 3px 8px rgba(0,0,0,.1)}'
        + '.ag-col{flex:1;min-width:0;padding:0 6px;}'
        + '.ag-badge{display:inline-block;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700;color:#fff;}'
        + '.ag-current{background:linear-gradient(90deg,rgba(124,58,237,.1),rgba(124,58,237,.02),rgba(124,58,237,.1));background-size:200% 100%;animation:shimmer 3s infinite;}'
        + '</style>'

      w.style.cssText = 'max-width: 960px; margin: 0 auto; padding: 24px 24px 80px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;'

      // Top bar - current action
      var top = document.createElement('div')
      top.style.cssText = 'display: flex; align-items: center; gap: 16px; padding: 16px 20px; border-radius: 12px; margin-bottom: 20px; background: #fafaf8; border: 1px solid #eee;'
      if (isRecent) top.className = 'ag-current'

      var dot = document.createElement('div')
      dot.style.cssText = 'width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; background: ' + (isRecent ? '#4ade80' : '#ccc') + ';'
      if (isRecent) dot.style.animation = 'pulse 2s infinite'

      var topInfo = document.createElement('div')
      topInfo.style.cssText = 'flex: 1; min-width: 0;'

      var topTool = document.createElement('span')
      topTool.style.cssText = 'font-size: 14px; font-weight: 700; color: #1a1a1a;'
      topTool.textContent = (TOOL_ICONS[tool] || '') + ' ' + tool

      var topDetail = document.createElement('span')
      topDetail.style.cssText = 'font-size: 12px; color: #999; margin-left: 12px; font-family: monospace;'
      topDetail.textContent = detail.length > 60 ? detail.slice(0, 60) + '\u2026' : detail

      topInfo.appendChild(topTool)
      if (detail) topInfo.appendChild(topDetail)

      var topTime = document.createElement('span')
      topTime.style.cssText = 'font-size: 11px; color: #bbb; flex-shrink: 0;'
      topTime.textContent = timestamp ? timeAgo(timestamp) : ''

      var topBadge = document.createElement('span')
      topBadge.style.cssText = 'font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; flex-shrink: 0; background: ' + (isRecent ? '#ecfdf5' : '#f5f5f5') + '; color: ' + (isRecent ? '#059669' : '#999') + ';'
      topBadge.textContent = isRecent ? 'Live' : 'Idle'

      top.appendChild(dot)
      top.appendChild(topInfo)
      top.appendChild(topTime)
      top.appendChild(topBadge)
      w.appendChild(top)

      // Kanban board
      var board = document.createElement('div')
      board.style.cssText = 'display: flex; gap: 12px;'

      ;['Analyze', 'Code', 'Execute', 'Delegate'].forEach(function(cat) {
        var col = document.createElement('div')
        col.className = 'ag-col'

        // Column header
        var hdr = document.createElement('div')
        hdr.style.cssText = 'display: flex; align-items: center; gap: 6px; padding: 8px 4px; margin-bottom: 8px; border-bottom: 2px solid ' + CAT_COLORS[cat] + ';'

        var hdrIcon = document.createElement('span')
        hdrIcon.textContent = CAT_ICONS[cat]

        var hdrName = document.createElement('span')
        hdrName.style.cssText = 'font-size: 12px; font-weight: 700; color: #444; letter-spacing: .03em; text-transform: uppercase;'
        hdrName.textContent = cat

        var hdrCount = document.createElement('span')
        hdrCount.style.cssText = 'margin-left: auto; font-size: 11px; font-weight: 700; color: #fff; background: ' + CAT_COLORS[cat] + '; border-radius: 10px; padding: 1px 7px;'
        hdrCount.textContent = columns[cat].length

        hdr.appendChild(hdrIcon)
        hdr.appendChild(hdrName)
        hdr.appendChild(hdrCount)
        col.appendChild(hdr)

        // Cards
        columns[cat].forEach(function(h) {
          var card = document.createElement('div')
          card.className = 'ag-card'

          var cardTool = document.createElement('div')
          cardTool.style.cssText = 'display: flex; align-items: center; gap: 6px; margin-bottom: 4px;'

          var tb = document.createElement('span')
          tb.className = 'ag-badge'
          tb.style.background = TOOL_COLORS[h.tool] || '#888'
          tb.textContent = h.tool

          var ct = document.createElement('span')
          ct.style.cssText = 'font-size: 10px; color: #bbb; margin-left: auto;'
          ct.textContent = timeAgo(h.timestamp)

          cardTool.appendChild(tb)
          cardTool.appendChild(ct)
          card.appendChild(cardTool)

          if (h.detail) {
            var cardDetail = document.createElement('div')
            cardDetail.style.cssText = 'font-size: 11px; color: #888; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'
            cardDetail.textContent = h.detail
            cardDetail.title = h.detail
            card.appendChild(cardDetail)
          }

          col.appendChild(card)
        })

        if (columns[cat].length === 0) {
          var empty = document.createElement('div')
          empty.style.cssText = 'padding: 20px 0; text-align: center; font-size: 12px; color: #ddd;'
          empty.textContent = '\u2014'
          col.appendChild(empty)
        }

        board.appendChild(col)
      })

      w.appendChild(board)

      // Activity feed
      var feedLabel = document.createElement('div')
      feedLabel.style.cssText = 'font-size: 12px; font-weight: 700; color: #888; letter-spacing: .05em; text-transform: uppercase; padding: 20px 0 10px;'
      feedLabel.textContent = 'Activity Feed (' + history.length + ')'
      w.appendChild(feedLabel)

      history.slice(0, 12).forEach(function(h) {
        var row = document.createElement('div')
        row.style.cssText = 'display: flex; align-items: center; padding: 6px 8px; gap: 10px; border-radius: 6px; transition: background .1s; animation: cardIn .3s;'
        row.onmouseenter = function() { row.style.background = '#f8f7ff' }
        row.onmouseleave = function() { row.style.background = 'none' }

        var tb = document.createElement('span')
        tb.className = 'ag-badge'
        tb.style.cssText += 'background:' + (TOOL_COLORS[h.tool] || '#888') + '; font-size: 10px;'
        tb.textContent = h.tool

        var det = document.createElement('span')
        det.style.cssText = 'flex: 1; font-size: 12px; color: #777; font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'
        det.textContent = h.detail || ''
        det.title = h.detail || ''

        var time = document.createElement('span')
        time.style.cssText = 'font-size: 10px; color: #ccc; flex-shrink: 0;'
        time.textContent = timeAgo(h.timestamp)

        row.appendChild(tb)
        row.appendChild(det)
        row.appendChild(time)
        w.appendChild(row)
      })

      container.innerHTML = ''
      container.appendChild(w)
    }

    renderAgent()
  }
}
