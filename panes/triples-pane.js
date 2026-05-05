/**
 * Triples Pane — SolidOS-style outliner.
 * One flat 3-column grid: subject | predicate | object.
 * Subject shown once per section; predicate shown once per group of
 * values; objects listed one per row. Predicate names are CamelCase
 * split ("primaryTopic" → "primary Topic"). Object references resolve
 * to friendly labels via lion (foaf:name / vcard:fn / schema:name /
 * rdfs:label / dc:title).
 */
import { html, render } from '../losos/html.js'

var LABEL_PREDS = [
  'http://xmlns.com/foaf/0.1/name',
  'http://www.w3.org/2006/vcard/ns#fn',
  'http://schema.org/name',
  'http://www.w3.org/2000/01/rdf-schema#label',
  'http://purl.org/dc/terms/title',
  'http://purl.org/dc/elements/1.1/title'
]

function localName(uri) {
  if (typeof uri !== 'string') return String(uri)
  var m = uri.match(/[#/]([^#/]+)\/?$/)
  return m ? decodeURIComponent(m[1]) : uri
}
function predLabel(uri) {
  return localName(uri).replace(/([a-z])([A-Z])/g, '$1 $2')
}
function labelOf(node) {
  if (!node) return null
  for (var i = 0; i < LABEL_PREDS.length; i++) {
    var v = node[LABEL_PREDS[i]]
    if (v == null) continue
    var first = Array.isArray(v) ? v[0] : v
    if (typeof first === 'string') return first
    if (first && first['@value']) return String(first['@value'])
    if (first && first['@id']) return localName(first['@id'])
  }
  return null
}
function isUri(v) { return typeof v === 'string' && /^(https?|did|urn):/.test(v) }
function anchor(id) { return 'tr-' + encodeURIComponent(id).replace(/%/g, '_') }

function valueCell(v, store) {
  if (v == null) return html`<span style="color:#999;">∅</span>`
  if (typeof v === 'object' && '@value' in v) {
    var t = v['@type']
    return html`<span>${String(v['@value'])}</span>${t ? html` <span style="color:#bbb;font-size:11px;">^^${localName(t)}</span>` : ''}`
  }
  if (typeof v === 'object' && v['@id']) {
    var id = v['@id']
    var label = (store.get(id) && labelOf(store.get(id))) || localName(id)
    var href = store.nodes.has(id) ? '#' + anchor(id) : id
    return html`<a href="${href}" style="color:#0a4d8f;text-decoration:none;font-weight:600;">${label}</a>`
  }
  if (isUri(v)) {
    var label2 = (store.get(v) && labelOf(store.get(v))) || localName(v)
    var href2 = store.nodes.has(v) ? '#' + anchor(v) : v
    return html`<a href="${href2}" style="color:#0a4d8f;text-decoration:none;font-weight:600;">${label2}</a>`
  }
  return html`<span>${String(v)}</span>`
}

export default {
  label: 'Data',
  icon: '\u{1F517}',
  canHandle: function() { return true },
  render: function(subject, store, container) {
    var nodes = Array.from(store.nodes.values())
    if (!nodes.length) { container.innerHTML = '<div style="padding:24px;color:#999;">No data</div>'; return }

    var rows = []
    nodes.forEach(function(node, sIdx) {
      var subjLabel = labelOf(node) || localName(node['@id'])
      var firstSubj = true
      var keys = Object.keys(node).filter(function(k) { return k[0] !== '@' })
      if (node['@type']) keys.unshift('@type')
      keys.forEach(function(k) {
        var raw = node[k]
        var vals = Array.isArray(raw) ? raw : [raw]
        var pLabel = k === '@type' ? 'type' : predLabel(k)
        vals.forEach(function(val, i) {
          var obj = (k === '@type' && typeof val === 'string') ? { '@id': val } : val
          rows.push({
            subj: firstSubj ? subjLabel : '',
            anchorId: firstSubj ? anchor(node['@id']) : '',
            pred: i === 0 ? pLabel : '',
            obj: obj,
            isSection: firstSubj,
            sIdx: sIdx
          })
          firstSubj = false
        })
      })
    })

    render(container, html`
      <div style="padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:1200px;margin:0 auto;font-size:13px;color:#1a1a1a;">
        <div style="display:grid;grid-template-columns:240px 200px 1fr;">
          ${rows.map(function(r, i) {
            var bg = r.sIdx % 2 ? '#fafafa' : '#fff'
            var top = r.isSection && i > 0 ? 'border-top:1px solid #ddd;' : ''
            var base = 'padding:5px 12px;background:' + bg + ';' + top
            var subjStyle = base + 'font-weight:' + (r.subj ? '700' : '400') + ';color:#0a4d8f;word-break:break-word;'
            var predStyle = base + 'color:#666;'
            var objStyle = base + 'word-break:break-word;'
            return html`
              <div id="${r.anchorId}" style="${subjStyle}">${r.subj}</div>
              <div style="${predStyle}">${r.pred}</div>
              <div style="${objStyle}">${valueCell(r.obj, store)}</div>
            `
          })}
        </div>
      </div>
    `)
  }
}
