import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

console.log('main.tsx is executing...')

const App = () => {
  console.log('App component rendering...')
  return (
    <div style={{ padding: '2rem', textAlign: 'center', background: 'lightblue', minHeight: '100vh' }}>
      <h1>🚀 FM Copilot</h1>
      <p>React is working!</p>
      <p>Time: {new Date().toLocaleString()}</p>
      <p>Rendered at: {Date.now()}</p>
      <div style={{ marginTop: '2rem' }}>
        <a href="/login" style={{ display: 'inline-block', margin: '0.5rem', padding: '0.75rem 1.5rem', background: 'blue', color: 'white', textDecoration: 'none', borderRadius: '0.5rem', fontWeight: 'bold' }}>
          Go to Login
        </a>
        <a href="/register" style={{ display: 'inline-block', margin: '0.5rem', padding: '0.75rem 1.5rem', background: 'green', color: 'white', textDecoration: 'none', borderRadius: '0.5rem', fontWeight: 'bold' }}>
          Go to Register
        </a>
      </div>
    </div>
  )
}

console.log('About to create root...')
const rootElement = document.getElementById('root')
console.log('Root element:', rootElement)

if (rootElement) {
  console.log('Creating React root...')
  const root = ReactDOM.createRoot(rootElement)
  console.log('Root created, rendering...')
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('Render complete!')
} else {
  console.error('Root element not found!')
}