import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import './lib/generated/fonts.css'
import './index.css'
// Last on purpose: print.css takes the shell apart, and every rule it overrides lives in the
// stylesheets above it. Imported any earlier it loses the cascade on equal specificity.
import './features/poster/print.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
