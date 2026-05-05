import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import posthog from 'posthog-js'

// Initialize PostHog
posthog.init('your-project-api-key', {
  api_host: 'your-posthog-host',
  capture_pageview: false // We'll handle page views manually
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
