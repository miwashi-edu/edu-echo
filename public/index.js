window.onload = () => {
  fetch('/logs')
    .then(res => res.json())
    .then(logs => {
      const container = document.getElementById('logs')
      logs.forEach(entry => {
        const div = document.createElement('div')
        div.className = 'bubble'
        div.innerHTML = `
          <div><strong>${entry.method}</strong> <code>${entry.originalUrl}</code></div>
          <div class="meta">${entry.time} — ${entry.ip}</div>
          <details>
            <summary>Details</summary>
            <pre>${JSON.stringify({
              query: entry.query,
              headers: entry.headers,
              body: entry.body,
              hostname: entry.hostname,
              userAgent: entry.userAgent
            }, null, 2)}</pre>
          </details>
        `
        container.appendChild(div)
      })
    })
}
