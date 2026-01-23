import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'

// Layouts
import { Layout } from './components/Layout'
import { AuthLayout } from './components/AuthLayout'

// Pages
import { LoginPage } from './pages'
import { RegisterPage } from './pages'
import { DashboardPage } from './pages'
import { WorkOrdersPage } from './pages'
import { WorkOrderDetailPage } from './pages'
import { CreateWorkOrderPage } from './pages'
import { AssetsPage } from './pages'
import { PMPage } from './pages'
import { ProfilePage } from './pages'
import { LandingPage } from './pages'

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="register" element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } />
        </Route>

        {/* Direct login/register routes for convenience */}
        <Route path="/login" element={
          <PublicRoute>
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <AuthLayout>
              <RegisterPage />
            </AuthLayout>
          </PublicRoute>
        } />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<LandingPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="work-orders" element={<WorkOrdersPage />} />
          <Route path="work-orders/new" element={<CreateWorkOrderPage />} />
          <Route path="work-orders/:id" element={<WorkOrderDetailPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="pm" element={<PMPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  )
}

export default App