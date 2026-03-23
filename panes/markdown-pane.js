import { html, render } from '../losos/html.js'

var markedReady = null
function ensureMarked() {
  if (markedReady) return markedReady
  markedReady = new Promise(function(resolve) {
    if (window.marked) { resolve(); return }
    var s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js'
    s.onload = function() { resolve() }
    document.head.appendChild(s)
  })
  return markedReady
}

export default {
  label: 'Document',
  icon: '\u{1F4DD}',

  canHandle(subject, store) {
    for (var entry of store.nodes) {
      var node = entry[1]
      if (node['@type'] === 'TextDocument' || node['contentType'] === 'text/markdown') return true
    }
    return false
  },

  render(subject, store, container, rawData) {
    var data = rawData
    if (!data || !data['content']) {
      for (var entry of store.nodes) {
        if (entry[1]['@type'] === 'TextDocument') { data = entry[1]; break }
      }
    }
    if (!data) { container.textContent = 'No data'; return }

    var content = data['content'] || ''
    var resourceUrl = data['resourceUrl'] || window.location.href.replace(/[?#].*$/, '')
    var editing = !!data['isNew']
    var saveTimer = null

    function save(text) {
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(function() {
        var af = (window.xlogin && window.xlogin.authFetch) || fetch
        af(resourceUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'text/markdown' },
          body: text
        }).then(function() {
          var s = container.querySelector('.md-status')
          if (s) { s.textContent = 'Saved'; setTimeout(function() { s.textContent = '' }, 1500) }
        })
      }, 800)
    }

    function renderDoc() {
      // Build the wrapper first
      var wrapper = document.createElement('div')
      wrapper.className = 'md-body'
      wrapper.innerHTML = '<style>'
        + '.md-body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.7; color: #1a1a1a; max-width: 760px; margin: 0 auto; padding: 40px 44px 80px; }'
        + '.md-body h1 { font-size: 2em; font-weight: 700; margin: 1.5em 0 0.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }'
        + '.md-body h2 { font-size: 1.5em; font-weight: 600; margin: 1.4em 0 0.4em; border-bottom: 1px solid #f0f0f0; padding-bottom: 0.2em; }'
        + '.md-body h3 { font-size: 1.25em; font-weight: 600; margin: 1.2em 0 0.3em; }'
        + '.md-body p { margin: 0.8em 0; }'
        + '.md-body a { color: #7c3aed; }'
        + '.md-body code { background: #f5f3ff; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }'
        + '.md-body pre { background: #1a1a1a; color: #e0e0e0; padding: 16px 20px; border-radius: 8px; overflow-x: auto; margin: 1em 0; }'
        + '.md-body pre code { background: none; padding: 0; color: inherit; }'
        + '.md-body blockquote { border-left: 3px solid #7c3aed; margin: 1em 0; padding: 0.5em 1em; color: #666; background: #faf9ff; border-radius: 0 6px 6px 0; }'
        + '.md-body ul, .md-body ol { padding-left: 1.5em; margin: 0.8em 0; }'
        + '.md-body li { margin: 0.3em 0; }'
        + '.md-body table { border-collapse: collapse; width: 100%; margin: 1em 0; }'
        + '.md-body th, .md-body td { border: 1px solid #e5e5e5; padding: 8px 12px; text-align: left; }'
        + '.md-body th { background: #f8f7f5; font-weight: 600; }'
        + '.md-body img { max-width: 100%; border-radius: 6px; }'
        + '.md-body hr { border: none; border-top: 1px solid #eee; margin: 2em 0; }'
        + '.md-btn { background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 6px 14px; font: 500 13px -apple-system, sans-serif; color: #444; cursor: pointer; margin-right: 8px; }'
        + '.md-btn:hover { border-color: #7c3aed; color: #7c3aed; }'
        + '.md-btn-active { background: #7c3aed; color: #fff; border-color: #7c3aed; }'
        + '.md-editor { width: 100%; min-height: 400px; border: 1px solid #ddd; border-radius: 8px; padding: 16px 20px; font: 14px/1.6 monospace; color: #1a1a1a; outline: none; resize: vertical; }'
        + '.md-editor:focus { border-color: #7c3aed; }'
        + '</style>'

      // Toolbar
      var toolbar = document.createElement('div')
      toolbar.style.cssText = 'display: flex; align-items: center; gap: 4px; margin-bottom: 20px;'

      var viewBtn = document.createElement('button')
      viewBtn.className = editing ? 'md-btn' : 'md-btn md-btn-active'
      viewBtn.textContent = '\u{1F4C4} View'
      viewBtn.onclick = function() { editing = false; renderDoc() }

      var editBtn = document.createElement('button')
      editBtn.className = editing ? 'md-btn md-btn-active' : 'md-btn'
      editBtn.textContent = '\u270F\uFE0F Edit'
      editBtn.onclick = function() { editing = true; renderDoc() }

      var status = document.createElement('span')
      status.className = 'md-status'
      status.style.cssText = 'font-size: 12px; color: #7c3aed; margin-left: 8px;'

      toolbar.appendChild(viewBtn)
      toolbar.appendChild(editBtn)
      toolbar.appendChild(status)
      wrapper.appendChild(toolbar)

      if (editing) {
        var textarea = document.createElement('textarea')
        textarea.className = 'md-editor'
        textarea.value = content
        textarea.oninput = function() { content = textarea.value; save(content) }
        wrapper.appendChild(textarea)
      } else {
        var rendered = document.createElement('div')
        ensureMarked().then(function() {
          try {
            var m = window.marked
            var parsed = typeof m.parse === 'function' ? m.parse(content) : m(content)
            rendered.innerHTML = parsed.replace(/\[\[([^\]]+)\]\]/g, function(_, name) {
              var href = name.replace(/ /g, '_')
              if (href.indexOf('.') === -1) href += '.md'
              return '<a href="' + href + '" class="md-wikilink" data-href="' + href + '" style="color: #7c3aed;">' + name + '</a>'
            })
            rendered.querySelectorAll('.md-wikilink').forEach(function(a) {
              a.addEventListener('click', function(e) {
                e.preventDefault()
                var url = new URL(a.dataset.href, resourceUrl).href
                var af = (window.xlogin && window.xlogin.authFetch) || fetch
                af(url, { method: 'HEAD' }).then(function(r) {
                  if (r.ok) { window.location.href = url; return }
                  return af(url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'text/markdown' },
                    body: '# ' + a.textContent + '\n'
                  }).then(function() { window.location.href = url })
                })
              })
            })
          } catch (e) {
            rendered.innerHTML = '<pre>' + content.replace(/</g, '&lt;') + '</pre>'
          }
        }).catch(function() {
          rendered.innerHTML = '<pre>' + content.replace(/</g, '&lt;') + '</pre>'
        })
        wrapper.appendChild(rendered)
      }

      container.innerHTML = ''
      container.appendChild(wrapper)
    }

    renderDoc()
  }
}
