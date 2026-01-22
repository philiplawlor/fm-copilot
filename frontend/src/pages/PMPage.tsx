import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  Filter,
  Zap,
  Wrench,
  MapPin,
  User
} from 'lucide-react'
import { pmAPI, assetAPI, siteAPI, aiAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'

export const PMPage: React.FC = () => {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('upcoming')
  const [filters, setFilters] = useState({
    search: '',
    site_id: '',
    status: '',
    date_range: '30',
    page: 1,
    limit: 20
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  const { data: upcomingPM, isLoading: loadingUpcoming } = useQuery(
    ['pm-upcoming', filters],
    () => pmAPI.getUpcomingPM(parseInt(filters.date_range)),
    { enabled: !!user && activeTab === 'upcoming' }
  )

  const { data: pmSchedules, isLoading: loadingSchedules } = useQuery(
    ['pm-schedules', filters],
    () => pmAPI.getPMSchedules(filters),
    { enabled: !!user && activeTab === 'schedules' }
  )

  const { data: pmTemplates, isLoading: loadingTemplates } = useQuery(
    'pm-templates',
    pmAPI.getPMTemplates,
    { enabled: !!user && activeTab === 'templates' }
  )

  const { data: assets } = useQuery('assets', assetAPI.getAssets, { enabled: showCreateModal || showScheduleModal })
  const { data: sites } = useQuery('sites', siteAPI.getSites, { enabled: showCreateModal || showScheduleModal })

  const createPMTemplateMutation = useMutation(pmAPI.createPMTemplate, {
    onSuccess: () => {
      queryClient.invalidateQueries('pm-templates')
      setShowCreateModal(false)
    }
  })

  const schedulePMMutation = useMutation(pmAPI.schedulePM, {
    onSuccess: () => {
      queryClient.invalidateQueries('pm-schedules')
      queryClient.invalidateQueries('pm-upcoming')
      setShowScheduleModal(false)
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'status-medium'
      case 'in_progress': return 'status-high'
      case 'completed': return 'status-low'
      case 'overdue': return 'status-critical'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'status-medium'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'status-low'
      case 'medium': return 'status-medium'
      case 'high': return 'status-high'
      case 'critical': return 'status-critical'
      default: return 'status-medium'
    }
  }

  const getAISuggestions = async () => {
    // Implementation for AI PM suggestions
    console.log('Get AI PM suggestions')
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Preventive Maintenance</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage maintenance schedules and templates
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowScheduleModal(true)}
              className="btn-outline"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule PM
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['upcoming', 'schedules', 'templates'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-2 bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-lg font-semibold text-gray-900">
                  {upcomingPM?.data?.length || 0}
                </p>
                <p className="text-sm text-gray-500">Upcoming (30 days)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-2 bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-lg font-semibold text-gray-900">
                  {upcomingPM?.data?.filter((pm: any) => pm.days_until_due <= 0).length || 0}
                </p>
                <p className="text-sm text-gray-500">Overdue</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-2 bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-lg font-semibold text-gray-900">
                  {pmTemplates?.data?.length || 0}
                </p>
                <p className="text-sm text-gray-500">Templates</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-2 bg-purple-100">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-lg font-semibold text-gray-900">AI</p>
                <p className="text-sm text-gray-500">Optimization</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="text-sm font-medium text-gray-900">AI PM Assistant</h3>
            </div>
            <button
              onClick={getAISuggestions}
              className="btn-outline text-sm"
            >
              Get AI Recommendations
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Let AI analyze your asset data and suggest optimal PM schedules
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search PM schedules..."
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site
              </label>
              <select
                value={filters.site_id}
                onChange={(e) => setFilters(prev => ({ ...prev, site_id: e.target.value }))}
                className="input"
              >
                <option value="">All Sites</option>
                {sites?.data?.map((site: any) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="input"
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={filters.date_range}
                onChange={(e) => setFilters(prev => ({ ...prev, date_range: e.target.value }))}
                className="input"
              >
                <option value="7">Next 7 days</option>
                <option value="30">Next 30 days</option>
                <option value="90">Next 90 days</option>
                <option value="365">Next year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'upcoming' && (
        <div className="card">
          <div className="card-body p-0">
            {loadingUpcoming ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading upcoming PM...</p>
              </div>
            ) : upcomingPM?.data?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asset / Template
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Site / Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {upcomingPM.data.map((pm: any) => (
                      <tr key={pm.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {pm.template_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {pm.asset_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">
                              {pm.site_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {pm.location}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(pm.next_due_date).toLocaleDateString()}
                            </div>
                            <div className={`text-sm ${
                              pm.days_until_due <= 0 
                                ? 'text-red-600 font-medium'
                                : pm.days_until_due <= 7 
                                ? 'text-yellow-600 font-medium'
                                : 'text-gray-500'
                            }`}>
                              {pm.days_until_due === 0 
                                ? 'Today' 
                                : pm.days_until_due < 0 
                                ? `${Math.abs(pm.days_until_due)} days overdue`
                                : `${pm.days_until_due} days`
                              }
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`status-badge ${getPriorityColor(pm.priority)}`}>
                            {pm.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`status-badge ${getStatusColor(pm.status)}`}>
                            {pm.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button className="text-primary-600 hover:text-primary-900">
                              <Play className="h-4 w-4" />
                            </button>
                            <Link
                              to={`/pm/${pm.id}`}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Wrench className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming PM</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No preventive maintenance scheduled in the selected period.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="btn-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule PM
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'schedules' && (
        <div className="card">
          <div className="card-body p-0">
            {loadingSchedules ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading schedules...</p>
              </div>
            ) : pmSchedules?.data?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asset
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Template
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Frequency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Next Due
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Completed
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pmSchedules.data.map((schedule: any) => (
                      <tr key={schedule.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {schedule.asset_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {schedule.template_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Every {schedule.frequency_interval} {schedule.frequency_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(schedule.next_due_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {schedule.last_completed_date 
                            ? new Date(schedule.last_completed_date).toLocaleDateString()
                            : 'Never'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button className="text-primary-600 hover:text-primary-900">
                              <Pause className="h-4 w-4" />
                            </button>
                            <Link
                              to={`/pm/schedules/${schedule.id}`}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Wrench className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No schedules found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start scheduling preventive maintenance for your assets.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingTemplates ? (
            <div className="col-span-full text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading templates...</p>
            </div>
          ) : pmTemplates?.data?.length > 0 ? (
            pmTemplates.data.map((template: any) => (
              <div key={template.id} className="card">
                <div className="card-body">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {template.description}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-500">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Duration: {template.estimated_duration_minutes} min</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Wrench className="h-4 w-4 mr-2" />
                      <span>{template.task_list?.length || 0} tasks</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="capitalize">{template.priority} priority</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <button className="btn-outline text-sm">
                        Edit
                      </button>
                      <button className="btn-primary text-sm">
                        Use Template
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <Wrench className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first preventive maintenance template.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}