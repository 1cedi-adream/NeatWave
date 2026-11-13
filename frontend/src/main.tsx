import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import { Toaster } from 'sonner'
import './styles/features.css'

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /><Toaster theme="light" position="top-right" richColors closeButton/></React.StrictMode>)
