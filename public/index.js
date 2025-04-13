function fetchLogs() {
    const container = document.getElementById('logs')
    container.innerHTML = '' // Clear previous logs

    fetch('/logs')
        .then(res => res.json())
        .then(logs => {
            logs.forEach(entry => {
                const div = document.createElement('div')
                div.className = 'bubble'
                div.innerHTML = `
          <div><strong>${entry.method || entry.type}</strong> <code>${entry.path || entry.event}</code></div>
          <div class="meta">${entry.time} — ${entry.ip}</div>
          <details>
            <summary>Details</summary>
            <pre>${JSON.stringify(entry, null, 2)}</pre>
          </details>
        `
                container.appendChild(div)
            })
        })
}

window.addEventListener('DOMContentLoaded', () => {
    fetchLogs()
    document.getElementById('refresh').addEventListener('click', fetchLogs)
})
