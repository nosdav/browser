import { html, render } from '../losos/html.js'

// Derive a human-ish title from the resource URL's filename.
function titleFromUrl(url) {
  try {
    var path = decodeURIComponent(url.split(/[?#]/)[0])
    var file = path.replace(/\/+$/, '').split('/').pop() || path
    return file.replace(/\.[a-z0-9]+$/i, '') || file
  } catch (e) {
    return url
  }
}

export default {
  label: 'Audio',
  icon: '\u{1F3A7}',

  canHandle(subject, store) {
    for (var entry of store.nodes) {
      var node = entry[1]
      var type = node['@type']
      if (type === 'AudioDocument') return true
      var ct = node['contentType'] || ''
      if (ct.indexOf('audio/') === 0 && ct !== 'audio/mpegurl' && ct !== 'audio/x-scpls') return true
    }
    return false
  },

  render(subject, store, container, rawData) {
    var data = rawData
    if (!data || !(data['resourceUrl'] || data['@id'])) {
      for (var entry of store.nodes) {
        var n = entry[1]
        if (n['@type'] === 'AudioDocument' || (n['contentType'] || '').indexOf('audio/') === 0) { data = n; break }
      }
    }
    if (!data) return

    var src = data['resourceUrl'] || data['@id']
    var ct = data['contentType'] || ''
    var title = data['name'] || data['title'] || titleFromUrl(src)
    var cover = data['image'] || data['img'] || data['artwork']
    if (cover && typeof cover === 'object') cover = cover['@id'] || cover['url']

    render(container, html`
      <div style="max-width: 640px; margin: 0 auto; padding: 48px 32px 80px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <div style="background: linear-gradient(135deg, #1a1a2e, #2d1b4e); border-radius: 16px; padding: 32px; color: #fff; box-shadow: 0 8px 32px rgba(0,0,0,0.18);">
          ${cover
            ? html`<img src="${cover}" alt="" style="width: 100%; max-width: 320px; aspect-ratio: 1; object-fit: cover; border-radius: 12px; display: block; margin: 0 auto 24px;">`
            : html`<div style="width: 100%; max-width: 320px; aspect-ratio: 1; border-radius: 12px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.06); font-size: 96px;">\u{1F3B5}</div>`}
          <div style="font-size: 20px; font-weight: 700; text-align: center; margin-bottom: 4px; word-break: break-word;">${title}</div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.45); text-align: center; margin-bottom: 24px; font-family: monospace;">${ct || 'audio'}</div>
          <audio controls autoplay style="width: 100%;" src="${src}"></audio>
        </div>
        <div style="text-align: center; margin-top: 16px;">
          <a href="${src}" download style="font-size: 13px; color: #7c3aed; text-decoration: none;">↓ Download</a>
        </div>
      </div>
    `)
  }
}
