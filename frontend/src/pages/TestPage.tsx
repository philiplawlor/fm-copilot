import React from 'react'
import { Link } from 'react-router-dom'

export const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center items-center px-4">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-8">
          FM Copilot - Test Page
        </h1>
        
        <div className="bg-white p-8 rounded-xl shadow-md mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Navigation Test
          </h2>
          <div className="space-y-4">
            <Link
              to="/login"
              className="block w-full text-center bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
            >
              Go to Login
            </Link>
            <Link
              to="/register"
              className="block w-full text-center bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 mt-4"
            >
              Go to Register
            </Link>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>If you can see this page, React is working!</p>
          <p>Current time: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}