import React, { useEffect, useState } from 'react'

export default function GlobalErrorOverlay() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      setError(`${e.message} at ${e.filename}:${e.lineno}:${e.colno}`)
      console.error('Global error:', e.error || e)
    }

    const onRejection = (e: PromiseRejectionEvent) => {
      setError(String(e.reason))
      console.error('Unhandled rejection:', e.reason)
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  if (!error) return null

  return (
    <div style={{ position: 'fixed', inset: 20, zIndex: 9999 }}>
      <div style={{ background: '#2b0b0b', color: '#ffdcdc', padding: 16, borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
        <h3 style={{ margin: 0, color: '#ff9b9b' }}>Błąd aplikacji</h3>
        <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{String(error)}</pre>
      </div>
    </div>
  )
}
