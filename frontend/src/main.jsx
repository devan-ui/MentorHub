import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"
import './index.css'
import App from './App.jsx'
import { MyContextProvider } from './MyContext.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      < MyContextProvider>
        <App />
      </MyContextProvider>
    </BrowserRouter>
  </StrictMode>
)
