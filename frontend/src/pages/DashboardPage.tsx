import React from 'react'
import { useQuery } from 'react-query'
import { 
  ClipboardList, 
  Clock,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  Calendar
} from '../icons'
import { workOrderAPI, aiAPI, pmAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { Link } from 'react-router-dom'

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore()

  // Fetch dashboard data
  const { data: workOrders } = useQuery(
    'dashboard-work-orders',
    () => workOrderAPI.getWorkOrders({ limit: 10 }),
    { enabled: !!user }
  )

  const { data: upcomingPM } = useQuery(
    'upcoming-pm',
    () => pmAPI.getUpcomingPM(7),
    { enabled: !!user }
  )

  // Mock stats for demonstration
  const stats = [
    {
      name: 'Open Work Orders',
      value: workOrders?.data?.filter(wo => wo.status === 'open').length || 0,
      icon: ClipboardList,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      name: 'In Progress',
      value: workOrders?.data?.filter(wo => wo.status === 'in_progress').length || 0,
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      name: 'High Priority',
      value: workOrders?.data?.filter(wo => wo.priority === 'high' || wo.priority === 'critical').length || 0,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-100'
    },
    {
      name: 'Completed Today',
      value: workOrders?.data?.filter(wo => 
        wo.status === 'completed' && 
        new Date(wo.completed_at).toDateString() === new Date().toDateString()
      ).length || 0,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100'
    }
  ]

  const recentWorkOrders = workOrders?.data?.slice(0, 5) || []
  const upcomingPMs = upcomingPM?.data || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Here's what's happening with your facilities today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-2xl font-bold text-gray-900">{stat.value}</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Work Orders */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Work Orders
              </h3>
              <Link
                to="/work-orders"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="card-body">
            {recentWorkOrders.length > 0 ? (
              <div className="space-y-3">
                {recentWorkOrders.map((wo: any) => (
                  <div key={wo.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {wo.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {wo.site_name} • {wo.asset_name || 'No asset'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`status-badge status-${wo.priority}`}>
                        {wo.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(wo.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No work orders</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new work order.
                </p>
                <div className="mt-6">
                  <Link
                    to="/work-orders/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <PlusCircleIcon className="h-4 w-4 mr-2" />
                    New Work Order
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming PM */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Upcoming PM (7 days)
              </h3>
              <Link
                to="/pm"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="card-body">
            {upcomingPMs.length > 0 ? (
              <div className="space-y-3">
                {upcomingPMs.map((pm: any) => (
                  <div key={pm.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {pm.template_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {pm.asset_name} • {pm.site_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {pm.days_until_due === 0 ? 'Today' : `${pm.days_until_due} days`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(pm.next_due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming PM</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No preventive maintenance scheduled in the next 7 days.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Quick Actions
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/work-orders/new"
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Create Work Order
            </Link>
            <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Clock className="h-5 w-5 mr-2" />
              Schedule PM
            </button>
            <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <ClipboardList className="h-5 w-5 mr-2" />
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}