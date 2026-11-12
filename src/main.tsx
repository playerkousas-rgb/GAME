/**
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { registerServiceWorker } from './shared/pwa'

registerServiceWorker()

const container = document.getElementById('root')!
// 清走 index.html 內靜態骨架（h1），再由 React 接管；避免 createRoot 與殘留節點並存
container.replaceChildren()

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
