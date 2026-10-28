import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'
import { applyTheme, storedTheme } from './context/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import { installErrorReporter } from './utils/errorReporter'
import { getDefaultLanguage, loadLanguage } from './config/i18n.config'
import { installResponsiveTableLabels } from './utils/responsiveTables'

// Browser errors go to the platform's error monitoring.
installErrorReporter()

// Phone layout of the shared data tables (labels on each cell).
installResponsiveTableLabels()

// Paint the last used theme right away (no dark/light flash on reload)
applyTheme(storedTheme() || 'dark')

// A saved non-default language (ar, es…) is its own chunk: fetch it
// before the first render so the app never flashes in French first.
loadLanguage(getDefaultLanguage()).then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )
})
