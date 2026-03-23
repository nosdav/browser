import { html, render } from '../losos/html.js'

var FOAF = 'http://xmlns.com/foaf/0.1/'
var SCHEMA = 'http://schema.org/'
var SOLID = 'http://www.w3.org/ns/solid/terms#'
var VCARD = 'http://www.w3.org/2006/vcard/ns#'

function val(node, keys) {
  for (var i = 0; i < keys.length; i++) {
    var v = node[keys[i]]
    if (v == null) continue
    if (typeof v === 'object' && v['@id']) return v['@id']
    if (typeof v === 'object' && v['@value']) return v['@value']
    return String(v)
  }
  return ''
}

// Editable profile fields
var FIELDS = [
  { key: 'foaf:name', label: 'Name', icon: '\u{1F464}', placeholder: 'Your full name' },
  { key: 'foaf:nick', label: 'Nickname', icon: '\u{1F3F7}', placeholder: 'username' },
  { key: 'schema:description', label: 'Bio', icon: '\u{1F4AC}', placeholder: 'A short bio', textarea: true },
  { key: 'foaf:img', label: 'Avatar URL', icon: '\u{1F5BC}', placeholder: 'https://...', isId: true },
  { key: 'foaf:homepage', label: 'Homepage', icon: '\u{1F3E0}', placeholder: 'https://...', isId: true },
  { key: 'foaf:weblog', label: 'Blog', icon: '\u{1F4DD}', placeholder: 'https://...', isId: true },
  { key: 'foaf:mbox', label: 'Email', icon: '\u2709\uFE0F', placeholder: 'mailto:you@example.com' }
]

export default {
  label: 'Profile',
  icon: '\u{1F464}',

  canHandle(subject, store) {
    var node = store.get(subject.value)
    if (!node) { for (var entry of store.nodes) { node = entry[1]; break } }
    if (!node) return false
    var type = node['@type'] || []
    if (typeof type === 'string') type = [type]
    return type.some(function(t) {
      return t.indexOf('Person') !== -1 || t.indexOf('Agent') !== -1
    })
  },

  render(subject, store, container, rawData) {
    var node = null
    for (var entry of store.nodes) {
      var type = entry[1]['@type'] || []
      if (typeof type === 'string') type = [type]
      if (type.some(function(t) { return t.indexOf('Person') !== -1 })) { node = entry[1]; break }
    }
    if (!node) node = rawData
    if (!node) return

    var editing = false
    var saveTimer = null
    var statusMsg = ''
    var resourceUrl = window.location.href.replace(/[?#].*$/, '')

    function getField(key) {
      return val(node, [key, key.replace(':', function() { return '/' }).replace('foaf/', FOAF).replace('schema/', SCHEMA).replace('solid/', SOLID)])
    }

    function save() {
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(function() {
        statusMsg = 'Saving...'
        renderProfile()

        // Rebuild from rawData (pre-expansion) to avoid duplicate keys
        var profile = JSON.parse(JSON.stringify(rawData))
        // Update editable fields from node
        FIELDS.forEach(function(f) {
          var v = node[f.key]
          if (v != null && v !== '') {
            // Unwrap double @id
            if (f.isId && typeof v === 'object' && v['@id']) v = v['@id']
            profile[f.key] = f.isId ? { '@id': v } : v
          } else {
            delete profile[f.key]
          }
        })

        // Check if resource is index.html (rebuild with data island)
        var af = (window.xlogin && window.xlogin.authFetch) || fetch
        var isHtml = resourceUrl.endsWith('/') || resourceUrl.endsWith('.html')

        if (isHtml) {
          var mashlibEl = document.querySelector('script[type="module"][src*="mashlib"]')
          var mashlibUrl = mashlibEl ? mashlibEl.src : (window.location.origin + '/mashlib.js')
          var body = '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>' + (profile['foaf:name'] || 'Profile') + '</title>\n'
            + '  <script type="application/ld+json">\n  ' + JSON.stringify(profile, null, 2).replace(/\n/g, '\n  ') + '\n  </script>\n'
            + '</head>\n<body>\n  <div id="mashlib"></div>\n'
            + '  <script type="module" src="' + mashlibUrl + '"></script>\n'
            + '  <link rel="stylesheet" href="' + mashlibUrl.replace('.js', '.css') + '">\n'
            + '</body>\n</html>'
          af(resourceUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'text/html' },
            body: body
          }).then(function() { statusMsg = 'Saved'; renderProfile(); setTimeout(function() { statusMsg = ''; renderProfile() }, 1500) })
            .catch(function(e) { statusMsg = 'Error: ' + e.message; renderProfile() })
        } else {
          af(resourceUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/ld+json' },
            body: JSON.stringify(profile, null, 2)
          }).then(function() { statusMsg = 'Saved'; renderProfile(); setTimeout(function() { statusMsg = ''; renderProfile() }, 1500) })
            .catch(function(e) { statusMsg = 'Error: ' + e.message; renderProfile() })
        }
      }, 800)
    }

    function renderProfile() {
      var name = val(node, ['foaf:name', FOAF + 'name', 'schema:name', SCHEMA + 'name', 'name'])
      var nick = val(node, ['foaf:nick', FOAF + 'nick', 'nick'])
      var img = val(node, ['foaf:img', FOAF + 'img', 'foaf:depiction', FOAF + 'depiction', 'schema:image', SCHEMA + 'image', 'image'])
      var homepage = val(node, ['foaf:homepage', FOAF + 'homepage', 'homepage'])
      var weblog = val(node, ['foaf:weblog', FOAF + 'weblog', 'weblog'])
      var email = val(node, ['foaf:mbox', FOAF + 'mbox', 'schema:email', SCHEMA + 'email', 'email'])
      var issuer = val(node, ['solid:oidcIssuer', SOLID + 'oidcIssuer'])
      var typeIndex = val(node, ['solid:publicTypeIndex', SOLID + 'publicTypeIndex'])
      var desc = val(node, ['schema:description', SCHEMA + 'description', 'description'])
      var webId = node['@id'] || ''
      var initials = name ? name.split(' ').map(function(w) { return w[0] }).join('').slice(0, 2).toUpperCase() : '?'

      var w = document.createElement('div')
      w.style.cssText = 'max-width: 640px; margin: 0 auto; padding: 40px 32px 80px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;'

      w.innerHTML = '<style>'
        + '.pf-btn{background:#fff;border:1px solid #ddd;border-radius:6px;padding:6px 14px;font:500 13px inherit;color:#444;cursor:pointer;margin-right:8px}'
        + '.pf-btn:hover{border-color:#7c3aed;color:#7c3aed}'
        + '.pf-btn-active{background:#7c3aed;color:#fff;border-color:#7c3aed}'
        + '.pf-input{width:100%;border:1px solid #e5e5e5;border-radius:8px;padding:10px 14px;font:14px inherit;color:#1a1a1a;outline:none}'
        + '.pf-input:focus{border-color:#7c3aed}'
        + '.pf-textarea{min-height:60px;resize:vertical}'
        + '</style>'

      // Toolbar
      var toolbar = document.createElement('div')
      toolbar.style.cssText = 'display:flex;align-items:center;gap:4px;margin-bottom:20px;'
      var viewBtn = document.createElement('button')
      viewBtn.className = editing ? 'pf-btn' : 'pf-btn pf-btn-active'
      viewBtn.textContent = '\u{1F464} View'
      viewBtn.onclick = function() { editing = false; renderProfile() }
      var editBtn = document.createElement('button')
      editBtn.className = editing ? 'pf-btn pf-btn-active' : 'pf-btn'
      editBtn.textContent = '\u270F\uFE0F Edit'
      editBtn.onclick = function() { editing = true; renderProfile() }
      var status = document.createElement('span')
      status.style.cssText = 'font-size:12px;color:#7c3aed;margin-left:8px;'
      status.textContent = statusMsg
      toolbar.appendChild(viewBtn)
      toolbar.appendChild(editBtn)
      toolbar.appendChild(status)
      w.appendChild(toolbar)

      if (editing) {
        // Edit form
        var form = document.createElement('div')
        form.style.cssText = 'background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.07);padding:32px;'

        FIELDS.forEach(function(f) {
          var group = document.createElement('div')
          group.style.cssText = 'margin-bottom:16px;'
          var label = document.createElement('label')
          label.style.cssText = 'display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:4px;'
          label.textContent = f.icon + ' ' + f.label
          group.appendChild(label)

          var currentVal = val(node, [f.key, f.key.split(':').length === 2 ? ({'foaf': FOAF, 'schema': SCHEMA, 'solid': SOLID}[f.key.split(':')[0]] || '') + f.key.split(':')[1] : f.key])
          var input
          if (f.textarea) {
            input = document.createElement('textarea')
            input.className = 'pf-input pf-textarea'
            input.value = currentVal
          } else {
            input = document.createElement('input')
            input.className = 'pf-input'
            input.type = 'text'
            input.value = currentVal
          }
          input.placeholder = f.placeholder
          input.oninput = function() {
            var v = input.value.trim()
            if (v) {
              node[f.key] = f.isId ? { '@id': v } : v
            } else {
              delete node[f.key]
            }
            save()
          }
          group.appendChild(input)
          form.appendChild(group)
        })

        w.appendChild(form)
      } else {
        // View mode - card
        var card = document.createElement('div')
        card.style.cssText = 'background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.07);overflow:hidden;'

        var banner = document.createElement('div')
        banner.style.cssText = 'height:120px;background:linear-gradient(135deg,#7c3aed 0%,#a78bfa 50%,#c4b5fd 100%);'
        card.appendChild(banner)

        var info = document.createElement('div')
        info.style.cssText = 'padding:0 32px 32px;margin-top:-48px;'

        if (img) {
          var av = document.createElement('img')
          av.src = img
          av.style.cssText = 'width:96px;height:96px;border-radius:50%;border:4px solid #fff;object-fit:cover;box-shadow:0 2px 8px rgba(0,0,0,0.1);'
        } else {
          var av = document.createElement('div')
          av.style.cssText = 'width:96px;height:96px;border-radius:50%;border:4px solid #fff;background:linear-gradient(135deg,#7c3aed,#a78bfa);display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.1);'
          av.textContent = initials
        }
        info.appendChild(av)

        var h1 = document.createElement('h1')
        h1.style.cssText = 'font-size:28px;font-weight:700;color:#1a1a1a;margin:16px 0 4px;'
        h1.textContent = name || 'Unknown'
        info.appendChild(h1)

        if (nick) {
          var ne = document.createElement('div')
          ne.style.cssText = 'font-size:15px;color:#7c3aed;font-weight:500;margin-bottom:8px;'
          ne.textContent = '@' + nick
          info.appendChild(ne)
        }
        if (desc) {
          var de = document.createElement('p')
          de.style.cssText = 'font-size:15px;color:#666;line-height:1.5;margin:12px 0 0;'
          de.textContent = desc
          info.appendChild(de)
        }

        card.appendChild(info)
        w.appendChild(card)

        // Links
        var details = document.createElement('div')
        details.style.cssText = 'margin-top:20px;background:#fff;border-radius:12px;box-shadow:0 1px 6px rgba(0,0,0,0.05);padding:24px 32px;'

        var links = []
        if (homepage) links.push({ icon: '\u{1F3E0}', label: 'Homepage', url: homepage })
        if (weblog) links.push({ icon: '\u{1F4DD}', label: 'Blog', url: weblog })
        if (email) links.push({ icon: '\u2709\uFE0F', label: 'Email', url: email.startsWith('mailto:') ? email : 'mailto:' + email, display: email.replace('mailto:', '') })
        if (issuer) links.push({ icon: '\u{1F511}', label: 'OIDC Issuer', url: issuer })
        if (typeIndex) links.push({ icon: '\u{1F4C1}', label: 'Type Index', url: typeIndex })
        if (webId) links.push({ icon: '\u{1F517}', label: 'WebID', url: null, display: webId })

        links.forEach(function(link, i) {
          var row = document.createElement('div')
          row.style.cssText = 'display:flex;align-items:center;padding:10px 0;gap:12px;' + (i < links.length - 1 ? 'border-bottom:1px solid #f5f5f5;' : '')
          var ic = document.createElement('span')
          ic.style.cssText = 'font-size:18px;width:28px;text-align:center;flex-shrink:0;'
          ic.textContent = link.icon
          var lbl = document.createElement('span')
          lbl.style.cssText = 'font-size:13px;color:#999;width:90px;flex-shrink:0;'
          lbl.textContent = link.label
          row.appendChild(ic)
          row.appendChild(lbl)
          if (link.url) {
            var a = document.createElement('a')
            a.href = link.url; a.target = '_blank'; a.rel = 'noopener'
            a.style.cssText = 'font-size:14px;color:#7c3aed;text-decoration:none;word-break:break-all;'
            a.textContent = link.display || link.url
            a.onmouseenter = function() { a.style.textDecoration = 'underline' }
            a.onmouseleave = function() { a.style.textDecoration = 'none' }
            row.appendChild(a)
          } else {
            var txt = document.createElement('span')
            txt.style.cssText = 'font-size:14px;color:#444;word-break:break-all;font-family:monospace;'
            txt.textContent = link.display || ''
            row.appendChild(txt)
          }
          details.appendChild(row)
        })

        w.appendChild(details)
      }

      container.innerHTML = ''
      container.appendChild(w)
    }

    renderProfile()
  }
}
