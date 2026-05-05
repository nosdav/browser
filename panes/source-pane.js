import { html, render } from '../losos/html.js'

export default {
  label: 'Source',
  icon: '\u{1F4CB}',

  canHandle(subject, store) {
    const node = store.get(subject.value)
    return node != null
  },

  render(subject, store, container) {
    const dataEl = document.querySelector('script[type="application/ld+json"]')
    const src = dataEl && dataEl.getAttribute('src')
    const dataUrl = src ? new URL(src, window.location.href).href : ''

    // Show the full document, not just the focused subject. The entry point
    // caches the parsed JSON-LD on the island as `__jsonLd`; fall back to the
    // island's text, then to the subject node if there's no island at all.
    let raw
    if (dataEl && dataEl.__jsonLd) {
      raw = JSON.stringify(dataEl.__jsonLd, null, 2)
    } else if (dataEl && dataEl.textContent) {
      try { raw = JSON.stringify(JSON.parse(dataEl.textContent), null, 2) }
      catch { raw = dataEl.textContent }
    } else {
      const node = store.get(subject.value)
      if (!node) return
      raw = JSON.stringify(node, null, 2)
    }
    const bytes = new Blob([raw]).size

    render(container, html`
      <div style="padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 1400px; margin: 0 auto;">
        <div style="margin-bottom: 16px;">
          <h2 style="font-size: 18px; font-weight: 700; color: #1a1a1a; margin: 0 0 6px;">\u{1F4CB} Source</h2>
          <div style="font-size: 12px; color: #999;">
            ${src ? html`<a href="${dataUrl}" target="_blank" rel="noopener" style="color: #999; text-decoration: none; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace; word-break: break-all;">${src}</a> · ` : ''}${bytes.toLocaleString()} bytes · ${raw.split('\n').length} lines
          </div>
        </div>
        <pre style="background: #fff; color: #1a1a1a; padding: 14px; border-radius: 10px; box-shadow: 0 1px 6px rgba(0,0,0,0.05); overflow-x: auto; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace; font-variant-numeric: tabular-nums; font-size: 13px; line-height: 1.4; white-space: pre-wrap; word-break: break-word; margin: 0;">${raw}</pre>
      </div>
    `)
  }
}
