import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import GlobalErrorOverlay from './components/GlobalErrorOverlay'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <GlobalErrorOverlay />
  </React.StrictMode>,
)

