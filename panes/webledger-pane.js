import { html, render } from '../losos/html.js'

export default {
  label: 'Ledger',
  icon: '\u{1F4B0}',

  canHandle(subject, store) {
    var node = store.get(subject.value)
    if (!node) return false
    var type = node['type'] || node['@type'] || ''
    return type === 'WebLedger' || type === 'https://w3id.org/webledgers#WebLedger'
  },

  render(subject, store, container, rawData) {
    var node = store.get(subject.value)
    if (!node) return

    var data = rawData || node
    var currency = data.defaultCurrency || 'satoshi'
    var entries = data.entries || []
    var created = data.created ? new Date(data.created * 1000) : null
    var updated = data.updated ? new Date(data.updated * 1000) : null
    var name = data.name || 'WebLedger'
    var description = data.description || ''
    var pubkey = data.pubkeyBase || ''

    // Calculate total
    var total = 0
    entries.forEach(function(e) {
      var amt = Array.isArray(e.amount) ? e.amount : [e.amount]
      amt.forEach(function(a) {
        var val = typeof a === 'object' ? Number(a.value) : Number(a)
        if (!isNaN(val)) total += val
      })
    })

    function formatAmount(amount) {
      var val = typeof amount === 'object' ? Number(amount.value) : Number(amount)
      if (isNaN(val)) return String(amount)
      return val.toLocaleString()
    }

    function formatBtc(sats) {
      if (currency !== 'satoshi') return null
      return (sats / 100000000).toFixed(8) + ' BTC'
    }

    function shortenUrl(url) {
      if (!url) return ''
      if (url.startsWith('did:nostr:')) return 'did:nostr:' + url.slice(10, 18) + '\u2026' + url.slice(-8)
      if (url.length > 50) return url.slice(0, 30) + '\u2026' + url.slice(-15)
      return url
    }

    function formatDate(d) {
      if (!d) return ''
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    }

    render(container, html`
      <div style="padding: 48px 40px 80px; font-family: Inter, -apple-system, sans-serif; max-width: 640px; margin: 0 auto;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <h2 style="font-family: Georgia, serif; font-size: 36px; font-weight: 400; font-style: italic; color: #1a1a1a; margin: 0;">${name}</h2>
          <a href="https://webledgers.org/" target="_blank" rel="noopener"
             style="font-size: 11px; color: #999; text-decoration: none;">webledgers.org</a>
        </div>

        ${description ? html`<p style="font-size: 14px; color: #888; margin: 0 0 24px 0;">${description}</p>` : null}

        <div style="display: flex; gap: 24px; margin-bottom: 32px; font-size: 13px; color: #999;">
          ${created ? html`<span>Created ${formatDate(created)}</span>` : null}
          ${updated ? html`<span>Updated ${formatDate(updated)}</span>` : null}
          <span style="text-transform: capitalize;">${currency}</span>
        </div>

        ${pubkey ? html`
          <div style="margin-bottom: 32px;">
            <div style="font-size: 10px; font-weight: 600; color: #ccc; letter-spacing: 0.1em; margin-bottom: 6px;">PUBKEY</div>
            <div style="font-size: 12px; color: #888; font-family: monospace; word-break: break-all;">${pubkey}</div>
          </div>
        ` : null}

        <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; margin-bottom: 16px;">
          <div style="font-size: 11px; color: #666; margin-bottom: 4px;">Total Balance</div>
          <div style="font-size: 32px; font-weight: 600; color: #e0e0e0; font-family: monospace;">
            ${total.toLocaleString()}
            <span style="font-size: 14px; color: #666; font-weight: 400;"> ${currency}</span>
          </div>
          ${formatBtc(total) ? html`<div style="font-size: 14px; color: #555; margin-top: 4px; font-family: monospace;">${formatBtc(total)}</div>` : null}
        </div>

        <div style="font-size: 10px; font-weight: 600; color: #ccc; letter-spacing: 0.1em; margin: 32px 0 12px;">
          ENTRIES (${entries.length})
        </div>

        ${entries.length === 0
          ? html`<div style="font-size: 14px; color: #999; padding: 16px 0;">No entries.</div>`
          : entries.map(function(entry) {
              var amt = Array.isArray(entry.amount) ? entry.amount : [entry.amount]
              return html`
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #f0ede8;">
                  <div style="min-width: 0; flex: 1;">
                    <a href="${entry.url || ''}" target="_blank" rel="noopener"
                       title="${entry.url || ''}"
                       style="font-size: 13px; color: #1a5276; text-decoration: none; font-family: monospace; word-break: break-all;">${shortenUrl(entry.url)}</a>
                  </div>
                  <div style="text-align: right; flex-shrink: 0; margin-left: 16px;">
                    ${amt.map(function(a) {
                      var val = typeof a === 'object' ? Number(a.value) : Number(a)
                      var cur = typeof a === 'object' ? a.currency : currency
                      return html`<div style="font-size: 15px; font-weight: 600; color: #1a1a1a; font-family: monospace;">${formatAmount(a)} <span style="font-size: 11px; color: #999; font-weight: 400;">${cur}</span></div>`
                    })}
                  </div>
                </div>
              `
            })
        }
      </div>
    `)
  }
}
