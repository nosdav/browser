import { html, render } from '../losos/html.js'

var ACL = 'http://www.w3.org/ns/auth/acl#'
var FOAF = 'http://xmlns.com/foaf/0.1/'

function id(v) { return typeof v === 'object' && v ? (v['@id'] || '') : (v || '') }
function arrify(v) { return v == null ? [] : (Array.isArray(v) ? v : [v]) }

function parseAcl(data) {
  var auths = []
  var graph = data['@graph'] || [data]
  graph.forEach(function(node) {
    var type = node['@type'] || ''
    if (type.indexOf('Authorization') === -1) return
    var agents = arrify(node['acl:agent'] || node[ACL + 'agent']).map(id).filter(Boolean)
    var classes = arrify(node['acl:agentClass'] || node[ACL + 'agentClass']).map(id).filter(Boolean)
    var modes = arrify(node['acl:mode'] || node[ACL + 'mode']).map(id).map(function(m) {
      return m.replace(ACL, '').replace('acl:', '')
    })
    var accessTo = id(node['acl:accessTo'] || node[ACL + 'accessTo'])
    var def = id(node['acl:default'] || node[ACL + 'default'])

    agents.forEach(function(a) { auths.push({ id: node['@id'], agent: a, isClass: false, modes: modes, accessTo: accessTo, default: def }) })
    classes.forEach(function(c) { auths.push({ id: node['@id'], agent: c, isClass: true, modes: modes, accessTo: accessTo, default: def }) })
  })
  return auths
}

function buildAcl(auths, context) {
  var graph = []
  auths.forEach(function(a, i) {
    var node = { '@id': a.id || '#auth' + i, '@type': 'acl:Authorization' }
    if (a.isClass) {
      node['acl:agentClass'] = { '@id': a.agent }
    } else {
      node['acl:agent'] = { '@id': a.agent }
    }
    node['acl:accessTo'] = { '@id': a.accessTo || './' }
    if (a.default) node['acl:default'] = { '@id': a.default }
    node['acl:mode'] = a.modes.map(function(m) { return { '@id': 'acl:' + m } })
    graph.push(node)
  })
  return {
    '@context': context || { 'acl': ACL, 'foaf': FOAF },
    '@graph': graph
  }
}

function agentLabel(agent) {
  if (agent === FOAF + 'Agent' || agent === 'foaf:Agent') return 'Everyone (Public)'
  if (agent === 'http://www.w3.org/ns/auth/acl#AuthenticatedAgent' || agent === 'acl:AuthenticatedAgent') return 'Authenticated Users'
  // Extract name from WebID
  var parts = agent.replace(/#.*$/, '').replace(/\/$/, '').split('/')
  return parts[parts.length - 1] || agent
}

function agentIcon(agent) {
  if (agent.indexOf('Agent') !== -1 && agent.indexOf('foaf') !== -1) return '\u{1F30D}'
  if (agent.indexOf('Authenticated') !== -1) return '\u{1F512}'
  return '\u{1F464}'
}

export default {
  label: 'Sharing',
  icon: '\u{1F91D}',

  canHandle(subject, store) {
    // Show on any resource — sharing is always relevant
    return true
  },

  render(subject, store, container, rawData) {
    var resourceUrl = window.location.href.replace(/[?#].*$/, '')
    var aclUrl = resourceUrl.endsWith('/') ? resourceUrl + '.acl' : resourceUrl + '.acl'
    var auths = []
    var context = { 'acl': ACL, 'foaf': FOAF }
    var loading = true
    var error = null
    var statusMsg = ''

    var doFetch = (window.xlogin && window.xlogin.authFetch) || fetch

    function load() {
      doFetch(aclUrl, { headers: { 'Accept': 'application/ld+json' } })
        .then(function(r) {
          if (!r.ok) throw new Error(r.status === 404 ? 'No ACL file' : r.status + ' ' + r.statusText)
          return r.json()
        })
        .then(function(data) {
          context = data['@context'] || context
          auths = parseAcl(data)
          loading = false
          renderSharing()
        })
        .catch(function(e) {
          error = e.message
          loading = false
          renderSharing()
        })
    }

    function save() {
      statusMsg = 'Saving...'
      renderSharing()
      var data = buildAcl(auths, context)
      doFetch(aclUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/ld+json' },
        body: JSON.stringify(data, null, 2)
      }).then(function(r) {
        if (!r.ok) throw new Error(r.status + ' ' + r.statusText)
        statusMsg = 'Saved'
        renderSharing()
        setTimeout(function() { statusMsg = ''; renderSharing() }, 1500)
      }).catch(function(e) {
        statusMsg = 'Error: ' + e.message
        renderSharing()
      })
    }

    function toggleMode(auth, mode) {
      var idx = auth.modes.indexOf(mode)
      if (idx >= 0) auth.modes.splice(idx, 1)
      else auth.modes.push(mode)
      save()
    }

    function removeAuth(auth) {
      auths = auths.filter(function(a) { return a !== auth })
      save()
    }

    function addAgent(webId) {
      auths.push({ id: '#agent-' + Date.now(), agent: webId, isClass: false, modes: ['Read'], accessTo: './', default: '' })
      save()
    }

    function togglePublic() {
      var pub = auths.find(function(a) { return a.isClass && (a.agent === FOAF + 'Agent' || a.agent === 'foaf:Agent') })
      if (pub) {
        auths = auths.filter(function(a) { return a !== pub })
      } else {
        auths.push({ id: '#public', agent: 'foaf:Agent', isClass: true, modes: ['Read'], accessTo: './', default: '' })
      }
      save()
    }

    function renderSharing() {
      var w = document.createElement('div')
      w.style.cssText = 'max-width: 640px; margin: 0 auto; padding: 40px 32px 80px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;'

      w.innerHTML = '<style>'
        + '.sh-card{background:#fff;border-radius:10px;box-shadow:0 1px 6px rgba(0,0,0,0.05);padding:16px 20px;margin-bottom:10px;display:flex;align-items:center;gap:14px;transition:box-shadow .15s}'
        + '.sh-card:hover{box-shadow:0 2px 12px rgba(0,0,0,0.08)}'
        + '.sh-toggle{width:36px;height:20px;border-radius:10px;border:none;cursor:pointer;position:relative;transition:background .2s}'
        + '.sh-toggle::after{content:"";position:absolute;width:16px;height:16px;border-radius:50%;background:#fff;top:2px;left:2px;transition:left .2s}'
        + '.sh-toggle-on{background:#7c3aed}.sh-toggle-on::after{left:18px}'
        + '.sh-toggle-off{background:#ddd}'
        + '.sh-btn{background:#fff;border:1px solid #ddd;border-radius:6px;padding:6px 14px;font:500 13px inherit;color:#444;cursor:pointer}'
        + '.sh-btn:hover{border-color:#7c3aed;color:#7c3aed}'
        + '.sh-btn-danger:hover{border-color:#dc2626;color:#dc2626}'
        + '.sh-mode{display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;margin-right:4px}'
        + '.sh-mode-on{background:#7c3aed;color:#fff}'
        + '.sh-mode-off{background:#f0f0f0;color:#999}'
        + '.sh-mode-off:hover{background:#e8e0ff;color:#7c3aed}'
        + '</style>'

      // Header
      var header = document.createElement('div')
      header.style.cssText = 'margin-bottom:24px;'
      header.innerHTML = '<h2 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 6px;">\u{1F91D} Sharing</h2>'
        + '<div style="font-size:13px;color:#999;word-break:break-all;">' + resourceUrl + '</div>'
      if (statusMsg) header.innerHTML += '<div style="font-size:12px;color:#7c3aed;margin-top:6px;">' + statusMsg + '</div>'
      w.appendChild(header)

      if (loading) {
        w.innerHTML += '<div style="padding:40px 0;text-align:center;color:#999;">Loading ACL...</div>'
        container.innerHTML = ''
        container.appendChild(w)
        return
      }

      if (error) {
        var errDiv = document.createElement('div')
        errDiv.style.cssText = 'padding:24px;background:#fef2f2;border-radius:8px;color:#991b1b;font-size:14px;margin-bottom:20px;'
        errDiv.textContent = error
        w.appendChild(errDiv)
      }

      // Public access toggle
      var pub = auths.find(function(a) { return a.isClass && (a.agent === FOAF + 'Agent' || a.agent === 'foaf:Agent') })
      var pubCard = document.createElement('div')
      pubCard.className = 'sh-card'
      pubCard.style.cssText += 'background:' + (pub ? '#f5f3ff' : '#fff') + ';border:1px solid ' + (pub ? '#7c3aed22' : '#f0f0f0') + ';'

      var pubIcon = document.createElement('span')
      pubIcon.style.cssText = 'font-size:24px;'
      pubIcon.textContent = '\u{1F30D}'

      var pubInfo = document.createElement('div')
      pubInfo.style.cssText = 'flex:1;'
      pubInfo.innerHTML = '<div style="font-size:14px;font-weight:600;color:#1a1a1a;">Public Access</div>'
        + '<div style="font-size:12px;color:#888;">Anyone on the web can ' + (pub ? pub.modes.join(', ').toLowerCase() : 'not access') + '</div>'

      var pubToggle = document.createElement('button')
      pubToggle.className = 'sh-toggle ' + (pub ? 'sh-toggle-on' : 'sh-toggle-off')
      pubToggle.onclick = togglePublic

      pubCard.appendChild(pubIcon)
      pubCard.appendChild(pubInfo)
      pubCard.appendChild(pubToggle)
      w.appendChild(pubCard)

      // Individual authorizations
      var label = document.createElement('div')
      label.style.cssText = 'font-size:12px;font-weight:700;color:#888;letter-spacing:.05em;text-transform:uppercase;padding:20px 0 10px;'
      label.textContent = 'Permissions (' + auths.length + ')'
      w.appendChild(label)

      auths.forEach(function(auth) {
        var card = document.createElement('div')
        card.className = 'sh-card'

        var icon = document.createElement('span')
        icon.style.cssText = 'font-size:20px;flex-shrink:0;'
        icon.textContent = agentIcon(auth.agent)

        var info = document.createElement('div')
        info.style.cssText = 'flex:1;min-width:0;'

        var name = document.createElement('div')
        name.style.cssText = 'font-size:14px;font-weight:600;color:#1a1a1a;'
        name.textContent = agentLabel(auth.agent)
        info.appendChild(name)

        if (!auth.isClass) {
          var uri = document.createElement('div')
          uri.style.cssText = 'font-size:11px;color:#bbb;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'
          uri.textContent = auth.agent
          uri.title = auth.agent
          info.appendChild(uri)
        }

        // Mode toggles
        var modes = document.createElement('div')
        modes.style.cssText = 'margin-top:6px;'
        ;['Read', 'Write', 'Control'].forEach(function(m) {
          var btn = document.createElement('span')
          btn.className = 'sh-mode ' + (auth.modes.indexOf(m) >= 0 ? 'sh-mode-on' : 'sh-mode-off')
          btn.textContent = m
          btn.onclick = function() { toggleMode(auth, m) }
          modes.appendChild(btn)
        })
        info.appendChild(modes)

        // Default indicator
        if (auth.default) {
          var def = document.createElement('div')
          def.style.cssText = 'font-size:10px;color:#bbb;margin-top:4px;'
          def.textContent = 'Inherited by children'
          info.appendChild(def)
        }

        var del = document.createElement('button')
        del.className = 'sh-btn sh-btn-danger'
        del.textContent = '\u2715'
        del.style.cssText += 'flex-shrink:0;padding:4px 8px;'
        del.onclick = function() { removeAuth(auth) }

        card.appendChild(icon)
        card.appendChild(info)
        card.appendChild(del)
        w.appendChild(card)
      })

      // Add agent
      var addSection = document.createElement('div')
      addSection.style.cssText = 'display:flex;gap:8px;margin-top:16px;'
      var input = document.createElement('input')
      input.type = 'text'
      input.placeholder = 'Add WebID (https://...)'
      input.style.cssText = 'flex:1;padding:8px 14px;border:1px solid #ddd;border-radius:8px;font:14px inherit;outline:none;'
      input.onfocus = function() { input.style.borderColor = '#7c3aed' }
      input.onblur = function() { input.style.borderColor = '#ddd' }
      input.onkeydown = function(e) { if (e.key === 'Enter' && input.value.trim()) { addAgent(input.value.trim()); input.value = '' } }
      var addBtn = document.createElement('button')
      addBtn.style.cssText = 'background:#7c3aed;color:#fff;border:none;border-radius:8px;padding:8px 18px;font:600 13px inherit;cursor:pointer;'
      addBtn.textContent = 'Add'
      addBtn.onclick = function() { if (input.value.trim()) { addAgent(input.value.trim()); input.value = '' } }
      addSection.appendChild(input)
      addSection.appendChild(addBtn)
      w.appendChild(addSection)

      container.innerHTML = ''
      container.appendChild(w)
    }

    load()
  }
}
