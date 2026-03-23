import { html, render } from '../losos/html.js'

function parseM3U(text) {
  var lines = text.split('\n')
  var tracks = []
  var title = ''
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim()
    if (line.startsWith('#PLAYLIST:')) continue
    if (line.startsWith('#EXTM3U')) continue
    if (line.startsWith('#EXTINF:')) {
      var comma = line.indexOf(',')
      title = comma >= 0 ? line.slice(comma + 1).trim() : ''
    } else if (line && !line.startsWith('#')) {
      tracks.push({ url: line, title: title || line })
      title = ''
    }
  }
  return tracks
}

function youtubeId(url) {
  var m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function youtubeThumbnail(vid) {
  return 'https://img.youtube.com/vi/' + vid + '/mqdefault.jpg'
}

export default {
  label: 'Playlist',
  icon: '\u{1F3B5}',

  canHandle(subject, store) {
    for (var entry of store.nodes) {
      var node = entry[1]
      if (node['contentType'] === 'audio/mpegurl' || node['contentType'] === 'application/vnd.apple.mpegurl' || node['contentType'] === 'audio/x-scpls') return true
    }
    return false
  },

  render(subject, store, container, rawData) {
    var data = rawData
    if (!data || !data['content']) {
      for (var entry of store.nodes) {
        if (entry[1]['contentType'] && entry[1]['contentType'].indexOf('audio') !== -1) { data = entry[1]; break }
      }
    }
    if (!data || !data['content']) return

    var tracks = parseM3U(data['content'])
    var current = 0
    var playing = false

    function play(idx) {
      current = idx
      playing = true
      renderPlayer()
    }

    function renderPlayer() {
      var track = tracks[current]
      if (!track) return
      var vid = youtubeId(track.url)

      var wrapper = document.createElement('div')
      wrapper.style.cssText = 'max-width: 900px; margin: 0 auto; padding: 24px 32px 80px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;'

      // Now playing
      var nowPlaying = document.createElement('div')
      nowPlaying.style.cssText = 'background: #1a1a2e; border-radius: 12px; padding: 24px; margin-bottom: 24px; color: #fff;'

      if (vid && playing) {
        var iframe = document.createElement('iframe')
        iframe.src = 'https://www.youtube.com/embed/' + vid + '?autoplay=1&enablejsapi=1'
        iframe.style.cssText = 'width: 100%; aspect-ratio: 16/9; border: none; border-radius: 8px; margin-bottom: 16px;'
        iframe.allow = 'autoplay; encrypted-media'
        iframe.allowFullscreen = true
        nowPlaying.appendChild(iframe)
      } else if (vid) {
        var thumb = document.createElement('img')
        thumb.src = youtubeThumbnail(vid)
        thumb.style.cssText = 'width: 100%; border-radius: 8px; margin-bottom: 16px; cursor: pointer;'
        thumb.onclick = function() { playing = true; renderPlayer() }
        nowPlaying.appendChild(thumb)
      }

      var titleEl = document.createElement('div')
      titleEl.style.cssText = 'font-size: 18px; font-weight: 600; margin-bottom: 8px;'
      titleEl.textContent = track.title
      nowPlaying.appendChild(titleEl)

      // Controls
      var controls = document.createElement('div')
      controls.style.cssText = 'display: flex; align-items: center; gap: 16px; margin-top: 12px;'

      var prevBtn = document.createElement('button')
      prevBtn.textContent = '\u23EE'
      prevBtn.style.cssText = 'background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; opacity: 0.7;'
      prevBtn.onclick = function() { if (current > 0) play(current - 1) }

      var playBtn = document.createElement('button')
      playBtn.textContent = playing ? '\u23F8' : '\u25B6'
      playBtn.style.cssText = 'background: linear-gradient(135deg, #7c3aed, #ec4899); border: none; color: #fff; font-size: 24px; width: 48px; height: 48px; border-radius: 50%; cursor: pointer;'
      playBtn.onclick = function() { playing = !playing; renderPlayer() }

      var nextBtn = document.createElement('button')
      nextBtn.textContent = '\u23ED'
      nextBtn.style.cssText = 'background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; opacity: 0.7;'
      nextBtn.onclick = function() { if (current < tracks.length - 1) play(current + 1) }

      var trackInfo = document.createElement('span')
      trackInfo.style.cssText = 'font-size: 13px; color: rgba(255,255,255,0.5); margin-left: auto;'
      trackInfo.textContent = (current + 1) + ' / ' + tracks.length

      controls.appendChild(prevBtn)
      controls.appendChild(playBtn)
      controls.appendChild(nextBtn)
      controls.appendChild(trackInfo)
      nowPlaying.appendChild(controls)
      wrapper.appendChild(nowPlaying)

      // Track list
      var listHeader = document.createElement('div')
      listHeader.style.cssText = 'font-size: 12px; font-weight: 700; color: #888; letter-spacing: 0.05em; text-transform: uppercase; padding: 8px 12px; margin-bottom: 4px;'
      listHeader.textContent = tracks.length + ' tracks'
      wrapper.appendChild(listHeader)

      tracks.forEach(function(t, idx) {
        var active = idx === current
        var vid = youtubeId(t.url)
        var row = document.createElement('div')
        row.style.cssText = 'display: flex; align-items: center; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: background 0.1s; margin-bottom: 2px;'
          + (active ? ' background: #f5f3ff; border-left: 3px solid #7c3aed;' : ' border-left: 3px solid transparent;')
        row.onmouseenter = function() { if (!active) row.style.background = '#faf9ff' }
        row.onmouseleave = function() { if (!active) row.style.background = 'none' }
        row.onclick = function() { play(idx) }

        var num = document.createElement('span')
        num.style.cssText = 'width: 28px; font-size: 13px; color: ' + (active ? '#7c3aed' : '#bbb') + '; font-weight: ' + (active ? '700' : '400') + ';'
        num.textContent = active && playing ? '\u{1F50A}' : (idx + 1)
        row.appendChild(num)

        if (vid) {
          var img = document.createElement('img')
          img.src = youtubeThumbnail(vid)
          img.style.cssText = 'width: 48px; height: 36px; border-radius: 4px; object-fit: cover; margin-right: 12px;'
          row.appendChild(img)
        }

        var name = document.createElement('span')
        name.style.cssText = 'flex: 1; font-size: 14px; color: ' + (active ? '#1a1a1a' : '#444') + '; font-weight: ' + (active ? '600' : '400') + ';'
        name.textContent = t.title
        row.appendChild(name)

        wrapper.appendChild(row)
      })

      container.innerHTML = ''
      container.appendChild(wrapper)
    }

    renderPlayer()
  }
}
