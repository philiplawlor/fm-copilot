import React from 'react'
import ReactDOM from 'react-dom/client'

// Debug: Show we're running
console.log('main.tsx is executing...')

const App = () => {
  console.log('App component rendering...')
  return React.createElement('div', {
    style: {
      padding: '2rem',
      textAlign: 'center',
      background: 'red',
      color: 'white',
      fontSize: '24px',
      fontWeight: 'bold',
      minHeight: '100vh',
      border: '5px solid yellow'
    }
  }, 
    React.createElement('h1', null, '🚀 FM COPILOT WORKS!'),
    React.createElement('p', null, 'React is rendering successfully!'),
    React.createElement('p', null, `Time: ${new Date().toLocaleString()}`),
    React.createElement('p', null, `Rendered at: ${Date.now()}`),
    React.createElement('div', { style: { marginTop: '2rem' } },
      React.createElement('a', {
        href: '/login',
        style: {
          display: 'inline-block',
          margin: '0.5rem',
          padding: '0.75rem 1.5rem',
          background: 'blue',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '0.5rem',
          fontWeight: 'bold'
        }
      }, 'Go to Login'),
      React.createElement('a', {
        href: '/register',
        style: {
          display: 'inline-block',
          margin: '0.5rem',
          padding: '0.75rem 1.5rem',
          background: 'green',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '0.5rem',
          fontWeight: 'bold'
        }
      }, 'Go to Register')
    )
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
    React.createElement(React.StrictMode, null, React.createElement(App))
  )
  console.log('Render complete!')
} else {
  console.error('Root element not found!')
  // Fallback: try to create the element
  const fallbackRoot = document.createElement('div')
  fallbackRoot.id = 'root'
  fallbackRoot.innerHTML = '<h1 style="color: red; background: yellow; padding: 20px;">Root element was missing! Created fallback.</h1>'
  document.body.appendChild(fallbackRoot)
}