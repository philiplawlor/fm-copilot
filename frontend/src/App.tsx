import React from 'react'

const App: React.FC = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>FM Copilot</h1>
      <p>React is working!</p>
      <p>Time: {new Date().toLocaleString()}</p>
      <a href="/login" style={{ display: 'block', marginTop: '1rem', padding: '0.5rem', background: '#3b82f6', color: 'white', textDecoration: 'none', borderRadius: '0.25rem' }}>
        Go to Login
      </a>
    </div>
  )
}

export default App