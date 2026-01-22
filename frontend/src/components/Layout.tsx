import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', emoji: '📊' },
    { name: 'Work Orders', href: '/work-orders', emoji: '📋' },
    { name: 'Assets', href: '/assets', emoji: '🏢' },
    { name: 'PM', href: '/pm', emoji: '🔧' },
    { name: 'Profile', href: '/profile', emoji: '👤' },
  ]

  const isActive = (href: string) => location.pathname === href

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">FM Copilot</h1>
        </div>
        
        <nav className="mt-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-6 py-3 text-sm font-medium ${
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3">{item.emoji}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600">{user?.first_name} {user?.last_name}</p>
            <button
              onClick={logout}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              {navigation.find(item => isActive(item.href))?.name}
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                API: {import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}