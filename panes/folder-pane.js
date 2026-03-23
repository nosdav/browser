import { html, render } from '../losos/html.js'

var LDP_CONTAINER = 'http://www.w3.org/ns/ldp#Container'

function isContainerType(type) {
  if (typeof type === 'string') type = [type]
  return type.some(function(t) { return t.indexOf('Container') !== -1 })
}

export default {
  label: 'Folder',
  icon: '\u{1F4C1}',

  canHandle(subject, store) {
    for (var entry of store.nodes) {
      var type = entry[1]['@type'] || entry[1]['type'] || []
      if (isContainerType(type)) return true
    }
    return false
  },

  render(subject, store, container, rawData) {
    var data = rawData
    if (!data) return

    if (!data['contains'] && !data['ldp:contains']) {
      for (var entry of store.nodes) {
        var type = entry[1]['@type'] || []
        if (isContainerType(type)) { data = entry[1]; break }
      }
    }
    if (!data) return

    var containsRaw = data['contains'] || data['ldp:contains'] || data['http://www.w3.org/ns/ldp#contains'] || []
    var items = Array.isArray(containsRaw) ? containsRaw : [containsRaw]

    var folders = []
    var files = []
    items.forEach(function(item) {
      var id = typeof item === 'string' ? item : (item['@id'] || '')
      var type = item['@type'] || []
      if (typeof type === 'string') type = [type]
      var isContainer = isContainerType(type)

      var name = id.replace(/\/$/, '').split('/').pop()
      if (name.startsWith('.') || name.endsWith('.acl') || name.endsWith('~')) return

      var size = item['stat:size'] || item['http://www.w3.org/ns/posix/stat#size']
      var modified = item['dcterms:modified'] || item['http://purl.org/dc/terms/modified']
      var entry = { id: id, name: isContainer ? name + '/' : name, isContainer: isContainer, size: size, modified: modified }
      if (isContainer) folders.push(entry)
      else files.push(entry)
    })

    folders.sort(function(a, b) { return a.name.toLowerCase().localeCompare(b.name.toLowerCase()) })
    files.sort(function(a, b) { return a.name.toLowerCase().localeCompare(b.name.toLowerCase()) })
    var all = folders.concat(files)

    // Folder name from last path segment
    var pathParts = window.location.pathname.replace(/\/$/, '').split('/')
    var folderName = decodeURIComponent(pathParts[pathParts.length - 1] || window.location.hostname)
    var fullUrl = window.location.href

    // Breadcrumb
    var parts = window.location.pathname.split('/').filter(Boolean)
    var crumbs = [{ name: window.location.hostname, href: '/' }]
    var path = ''
    parts.forEach(function(p) { path += '/' + p; crumbs.push({ name: decodeURIComponent(p), href: path + '/' }) })

    function icon(e) {
      if (e.isContainer) return '\u{1F4C1}'
      var ext = e.name.split('.').pop().toLowerCase()
      if (ext === 'json' || ext === 'jsonld') return '\u{1F4C4}'
      if (ext === 'ttl' || ext === 'n3' || ext === 'rdf') return '\u{1F517}'
      if (ext === 'html' || ext === 'htm') return '\u{1F310}'
      if (ext === 'md' || ext === 'txt') return '\u{1F4DD}'
      if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'svg') return '\u{1F5BC}'
      return '\u{1F4C4}'
    }

    function typeLabel(e) {
      if (e.isContainer) return 'Folder'
      var ext = e.name.split('.').pop().toLowerCase()
      var map = { json: 'JSON-LD', jsonld: 'JSON-LD', ttl: 'Turtle', html: 'HTML', md: 'Markdown', js: 'JavaScript', css: 'CSS' }
      return map[ext] || ext.toUpperCase()
    }

    function formatSize(bytes) {
      if (bytes == null) return ''
      var n = Number(bytes)
      if (n < 1024) return n + ' B'
      if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
      return (n / (1024 * 1024)).toFixed(1) + ' MB'
    }

    function formatDate(iso) {
      if (!iso) return ''
      var d = new Date(iso)
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    }

    var createMode = null
    var doFetch = (window.xlogin && window.xlogin.authFetch) || fetch
    var baseUrl = window.location.href.replace(/[?#].*$/, '')
    if (!baseUrl.endsWith('/')) baseUrl += '/'

    function doCreate() {
      var input = document.getElementById('fd-name')
      var name = input && input.value.trim()
      if (!name) return
      var url = baseUrl + name + (createMode === 'folder' ? '/' : '')
      var opts = { method: 'PUT', headers: {} }
      if (createMode === 'file') {
        opts.headers['Content-Type'] = 'application/ld+json'
        opts.body = JSON.stringify({ '@id': '#this' }, null, 2)
      }
      doFetch(url, opts).then(function() { window.location.reload() })
    }

    function rerender() {
      renderFolder()
    }

    function renderFolder() {
    render(container, html`
      <style>
        .fd-row { display: flex; align-items: center; padding: 8px 20px; border-bottom: 1px solid #eee; transition: background 0.1s; }
        .fd-row:hover { background: #faf9ff; }
        .fd-link { color: #7c3aed; text-decoration: none; font-weight: 500; font-size: 14px; }
        .fd-link:hover { text-decoration: underline; }
        .fd-hdr { font-size: 12px; font-weight: 700; color: #444; letter-spacing: 0.04em; text-transform: uppercase; }
        .fd-btn { background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 7px 14px; font: 500 13px inherit; color: #444; cursor: pointer; transition: border-color 0.15s; }
        .fd-btn:hover { border-color: #7c3aed; color: #7c3aed; }
      </style>
      <div style="max-width: 900px; margin: 0 auto; padding: 24px 32px 80px;">
        <div style="border-radius: 10px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.07); padding: 40px 44px;">

          <h1 style="font-size: 26px; font-weight: 700; color: #1a1a1a; margin: 0 0 10px;">${folderName}</h1>

          <div style="margin-bottom: 4px; font-size: 14px;">
            ${crumbs.map(function(c, i) {
              var last = i === crumbs.length - 1
              return html`${i > 0 ? html`<span style="color: #ccc; margin: 0 5px;">/</span>` : null}<a href="${c.href}" style="${'text-decoration: none; color: ' + (last ? '#1a1a1a; font-weight: 600' : '#7c3aed')}">${c.name}</a>`
            })}
          </div>

          <div style="font-size: 12px; color: #bbb; margin-bottom: 16px; word-break: break-all;">${fullUrl}</div>

          <div style="font-size: 14px; color: #777; margin-bottom: 20px;">
            ${folders.length} folder${folders.length !== 1 ? 's' : ''}, ${files.length} file${files.length !== 1 ? 's' : ''}
          </div>

          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
            <button class="fd-btn" onclick="${function() { createMode = 'folder'; rerender() }}">\u{1F4C1} New Folder</button>
            <button class="fd-btn" onclick="${function() { createMode = 'file'; rerender() }}">\u{1F4C4} New File</button>
            ${createMode ? html`
              <input id="fd-name" type="text" placeholder="Name..." style="flex: 1; padding: 7px 12px; border: 1px solid #ddd; border-radius: 6px; font: 14px inherit; outline: none;" onkeydown="${function(e) { if (e.key === 'Enter') doCreate() }}" />
              <button style="background: #7c3aed; color: #fff; border: none; border-radius: 6px; padding: 8px 18px; font: 600 13px inherit; cursor: pointer;" onclick="${doCreate}">Create</button>
              <button class="fd-btn" onclick="${function() { createMode = null; rerender() }}">Cancel</button>
            ` : null}
          </div>

          <div style="display: flex; padding: 10px 20px; border-bottom: 2px solid #7c3aed;">
            <div class="fd-hdr" style="flex: 1;">Name</div>
            <div class="fd-hdr" style="width: 80px; text-align: center;">Type</div>
            <div class="fd-hdr" style="width: 80px; text-align: right;">Size</div>
            <div class="fd-hdr" style="width: 180px; text-align: right;">Modified</div>
          </div>

          ${all.map(function(entry) {
            return html`
              <div class="fd-row">
                <span style="margin-right: 12px; font-size: 16px;">${icon(entry)}</span>
                <a href="${entry.id}" class="fd-link" style="${'flex: 1;' + (entry.isContainer ? ' font-weight: 700;' : '')}">${entry.name}</a>
                <span style="width: 80px; color: #999; font-size: 13px; text-align: center;">${typeLabel(entry)}</span>
                <span style="width: 80px; color: #999; font-size: 13px; text-align: right;">${entry.isContainer ? '' : formatSize(entry.size)}</span>
                <span style="width: 180px; color: #999; font-size: 13px; text-align: right;">${formatDate(entry.modified)}</span>
              </div>
            `
          })}

          ${all.length === 0 ? html`<div style="padding: 40px 0; text-align: center; color: #999; font-size: 14px;">Empty folder</div>` : null}
        </div>
      </div>
    `)
    }
    renderFolder()
  }
}
