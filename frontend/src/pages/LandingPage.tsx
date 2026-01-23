import React from 'react'
import { Link } from 'react-router-dom'

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center items-center px-4">
      <div className="max-w-4xl w-full text-center">
        {/* Logo and Header */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl shadow-lg mb-6">
            <span className="text-white text-4xl font-bold">FM</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-2">
            FM Copilot
          </h1>
          <p className="text-xl text-gray-600">
            AI-Powered Facilities Management Assistant
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI Work Orders
            </h3>
            <p className="text-gray-600">
              Natural language processing for instant work order creation
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Smart Dispatch
            </h3>
            <p className="text-gray-600">
              Intelligent technician and vendor assignment
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              PM Automation
            </h3>
            <p className="text-gray-600">
              Preventive maintenance scheduling and optimization
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md transition-all"
          >
            Create Account
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-sm text-gray-500">
          <p>Version 0.1.0 - Your AI-powered facilities management assistant</p>
        </div>
      </div>
    </div>
  )
}