import { html, render, ref } from '../losos/html.js'

var SOLID = 'http://www.w3.org/ns/solid/terms#'

function pickIssuer(node) {
  var v = node && (node['oidcIssuer'] || node['solid:oidcIssuer'] || node[SOLID + 'oidcIssuer'])
  // JSON-LD allows the value to be an array of references
  if (Array.isArray(v)) v = v[0]
  return v
}

function readOidcIssuer(store, subjectValue) {
  var docUri = subjectValue.replace(/#.*$/, '')
  var candidates = [
    subjectValue,
    docUri + '#me', docUri + '#this', docUri + '#i', docUri + '#card', docUri,
    '#me', '#this', '#i', '#card'
  ]
  for (var i = 0; i < candidates.length; i++) {
    var v = pickIssuer(store.get(candidates[i]))
    if (v) {
      var iss = typeof v === 'object' ? v['@id'] : v
      if (!iss) continue
      return iss.endsWith('/') ? iss : iss + '/'
    }
  }
  return null
}

// Validate the issuer URL came from a profile that hasn't been tampered to
// redirect credentials. Require: same protocol as current page, same port,
// AND issuer hostname is either the page hostname or a parent of it (e.g.
// page is melvin.solid.social, issuer is solid.social).
//
// LIMITATION: rejects setups where the WebID points to a shared IDP on an
// unrelated host. The proper fix is to validate against the issuer xlogin
// actually authenticated to, but xlogin doesn't expose that today — see
// melvincarvalho/xlogin#15 for the follow-up.
function defaultPortFor(protocol) {
  return protocol === 'https:' ? '443' : protocol === 'http:' ? '80' : ''
}

function normalizedPort(u) {
  return u.port || defaultPortFor(u.protocol)
}

function validateIssuer(iss) {
  try {
    var u = new URL(iss)
    if (u.protocol !== window.location.protocol) return false
    if (normalizedPort(u) !== normalizedPort(window.location)) return false
    var page = window.location.hostname
    var issHost = u.hostname
    return issHost === page || page.endsWith('.' + issHost)
  } catch (e) { return false }
}

export default {
  label: 'Account',
  icon: '\u{1F510}',

  canHandle(subject, store) {
    if (!(window.xlogin && window.xlogin.id)) return false
    // Same doc as the user's WebID. We don't require subject.value to equal
    // the WebID, because LOSOS's findSubject() prefers #this over #me on
    // multi-node profiles — exact match would hide the tab on those docs.
    // render() always reads the issuer from window.xlogin.id directly, so
    // the wrong-subject concern is moot.
    var subjDoc = subject.value.replace(/#.*$/, '')
    var myDoc = window.xlogin.id.replace(/#.*$/, '')
    return subjDoc === myDoc
  },

  render(subject, store, container, rawData) {
    // Always read from the user's WebID node, not whichever subject the
    // shell picked — robust against #this-vs-#me ambiguity.
    var issuer = readOidcIssuer(store, window.xlogin.id)
    if (!issuer) {
      container.innerHTML = '<div style="max-width:520px;margin:60px auto;padding:40px;text-align:center;color:#888;font-family:-apple-system,sans-serif">'
        + '<h2 style="color:#1a1a1a">\u{1F510} Account</h2>'
        + '<p>No <code>solid:oidcIssuer</code> found in this profile — cannot resolve the IDP endpoint.</p></div>'
      return
    }
    if (!validateIssuer(issuer)) {
      // html`` interpolates ${} as text nodes — safe even if `issuer` was
      // tampered to contain HTML/script.
      render(container, html`
        <div style="max-width:520px;margin:60px auto;padding:40px;text-align:center;color:#991b1b;font-family:-apple-system,sans-serif">
          <h2 style="color:#1a1a1a">${'\u{1F510}'} Account</h2>
          <p><code>solid:oidcIssuer</code> in this profile (<code>${issuer}</code>) does not match the current origin. Refusing to send credentials cross-origin.</p>
        </div>
      `)
      return
    }

    var doFetch = (window.xlogin && window.xlogin.authFetch) || fetch
    var endpoint = issuer + 'idp/credentials'
    var status = ''  // '' | 'submitting' | 'ok' | 'err'
    var errMsg = ''
    var values = { current: '', next: '', confirm: '' }
    var refs = { current: ref(), next: ref(), confirm: ref() }

    // Preflight: probe the endpoint UNAUTHENTICATED to confirm the dedicated
    // PUT handler exists. The handler's 401 has a specific shape that the LDP
    // wildcard fallthrough would not produce. Crucial: unauth PUT with no body
    // can never leak credentials even if it does fall through.
    //
    // RESIDUAL RISK: on a misconfigured JSS <0.0.165 where /idp/credentials
    // has a world-writable ACL, the wildcard could create an empty file at
    // that path. WAC normally rejects unauth PUT before the wildcard runs, so
    // this is theoretical. Proper fix is GET-based discovery on the JSS side
    // (no PUT touches the path at all) — tracked at nosdav/browser#14.
    async function preflight() {
      try {
        var res = await fetch(endpoint, { method: 'PUT' })
        if (res.status !== 401) return false
        var body = await res.json().catch(function() { return null })
        return !!(body && body.error === 'invalid_token')
      } catch (e) { return false }
    }

    function update(field, ev) { values[field] = ev.target.value }

    function clearInputs() {
      values = { current: '', next: '', confirm: '' }
      if (refs.current.el) refs.current.el.value = ''
      if (refs.next.el) refs.next.el.value = ''
      if (refs.confirm.el) refs.confirm.el.value = ''
    }

    async function submit(ev) {
      ev.preventDefault()
      errMsg = ''
      if (!values.current || !values.next || !values.confirm) {
        status = 'err'; errMsg = 'All fields are required.'; return redraw()
      }
      if (values.next !== values.confirm) {
        status = 'err'; errMsg = 'New password and confirmation do not match.'; return redraw()
      }
      if (values.next === values.current) {
        status = 'err'; errMsg = 'New password must differ from current.'; return redraw()
      }
      status = 'submitting'; redraw()
      // Preflight before sending the password — version-skew protection.
      if (!(await preflight())) {
        status = 'err'
        errMsg = 'This server does not support self-service password change. The administrator needs to update JSS to 0.0.165 or later.'
        return redraw()
      }
      try {
        var res = await doFetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: values.current, newPassword: values.next })
        })
        if (res.status === 200) {
          status = 'ok'
          clearInputs()
        } else if (res.status === 401) {
          status = 'err'; errMsg = 'Current password is incorrect.'
        } else if (res.status === 400) {
          status = 'err'; errMsg = 'Server rejected the request (400).'
        } else if (res.status === 403) {
          status = 'err'; errMsg = 'Not authorized to change this account.'
        } else {
          status = 'err'; errMsg = 'Unexpected server response: ' + res.status
        }
      } catch (e) {
        status = 'err'; errMsg = 'Network error: ' + (e && e.message)
      }
      redraw()
    }

    var input = 'width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font:14px inherit;outline:none;box-sizing:border-box'
    var label = 'display:block;font-size:12px;font-weight:600;color:#666;margin:14px 0 4px'
    var btn = 'background:#7c3aed;color:#fff;border:none;border-radius:8px;padding:10px 24px;font:600 14px inherit;cursor:pointer;margin-top:18px'
    var btnDisabled = btn + ';opacity:0.5;cursor:not-allowed'

    function redraw() {
      var submitting = status === 'submitting'
      render(container, html`
        <div style="max-width:520px;margin:40px auto;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
          <h2 style="font-size:22px;margin:0 0 6px;color:#1a1a1a">${'\u{1F510}'} Account</h2>
          <div style="font-size:13px;color:#999;margin-bottom:24px">${endpoint}</div>

          <h3 style="font-size:16px;margin:0 0 4px;color:#1a1a1a">Change password</h3>
          <p style="font-size:13px;color:#888;margin:0 0 16px">Re-enter your current password as proof.</p>

          <form onsubmit="${submit}">
            <label for="acct-current" style="${label}">Current password</label>
            <input id="acct-current" type="password" autocomplete="current-password" style="${input}"
                   ref="${refs.current}" oninput="${(e) => update('current', e)}" disabled="${submitting}" />

            <label for="acct-next" style="${label}">New password</label>
            <input id="acct-next" type="password" autocomplete="new-password" style="${input}"
                   ref="${refs.next}" oninput="${(e) => update('next', e)}" disabled="${submitting}" />

            <label for="acct-confirm" style="${label}">Confirm new password</label>
            <input id="acct-confirm" type="password" autocomplete="new-password" style="${input}"
                   ref="${refs.confirm}" oninput="${(e) => update('confirm', e)}" disabled="${submitting}" />

            <button type="submit" style="${submitting ? btnDisabled : btn}" disabled="${submitting}">
              ${submitting ? 'Saving...' : 'Update password'}
            </button>
          </form>

          <div role="status" aria-live="polite" style="min-height:1px">
            ${status === 'ok' ? html`
              <div style="margin-top:18px;padding:12px 16px;background:#ecfdf5;color:#065f46;border-radius:8px;font-size:14px">
                Password updated.
              </div>` : null}
            ${status === 'err' ? html`
              <div style="margin-top:18px;padding:12px 16px;background:#fef2f2;color:#991b1b;border-radius:8px;font-size:14px">
                ${errMsg}
              </div>` : null}
          </div>
        </div>
      `)
    }

    redraw()
  }
}
