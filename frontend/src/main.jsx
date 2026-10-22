import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'
import { applyTheme, storedTheme } from './context/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import { installErrorReporter } from './utils/errorReporter'

// Browser errors go to the platform's error monitoring.
installErrorReporter()

// Paint the last used theme right away (no dark/light flash on reload)
applyTheme(storedTheme() || 'dark')


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
