import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Edit,
  Eye,
  Wrench,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  Upload
} from 'lucide-react'
import { assetAPI, siteAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'

export const AssetsPage: React.FC = () => {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState({
    search: '',
    site_id: '',
    asset_type: '',
    status: '',
    page: 1,
    limit: 20
  })

  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: assets, isLoading, refetch } = useQuery(
    ['assets', filters],
    () => assetAPI.getAssets(filters),
    { enabled: !!user }
  )

  const { data: sites } = useQuery('sites', siteAPI.getSites, { enabled: !!user })

  const createAssetMutation = useMutation(assetAPI.createAsset, {
    onSuccess: () => {
      queryClient.invalidateQueries('assets')
      setShowCreateModal(false)
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'status-low'
      case 'maintenance_required': return 'status-medium'
      case 'out_of_service': return 'status-high'
      case 'critical_failure': return 'status-critical'
      default: return 'status-medium'
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage facility equipment and infrastructure
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Asset
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-2 bg-blue-100">
                <Wrench className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-lg font-semibold text-gray-900">
                  {assets?.data?.length || 0}
                </p>
                <p className="text-sm text-gray-500">Total Assets</p>
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
                  {assets?.data?.filter((a: any) => a.status === 'operational').length || 0}
                </p>
                <p className="text-sm text-gray-500">Operational</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-2 bg-yellow-100">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-lg font-semibold text-gray-900">
                  {assets?.data?.filter((a: any) => a.status === 'maintenance_required').length || 0}
                </p>
                <p className="text-sm text-gray-500">Maintenance Required</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-2 bg-red-100">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-lg font-semibold text-gray-900">
                  {assets?.data?.filter((a: any) => a.status === 'out_of_service' || a.status === 'critical_failure').length || 0}
                </p>
                <p className="text-sm text-gray-500">Out of Service</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search assets..."
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
                onChange={(e) => handleFilterChange('site_id', e.target.value)}
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
                Type
              </label>
              <select
                value={filters.asset_type}
                onChange={(e) => handleFilterChange('asset_type', e.target.value)}
                className="input"
              >
                <option value="">All Types</option>
                <option value="hvac">HVAC</option>
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="mechanical">Mechanical</option>
                <option value="fire_safety">Fire Safety</option>
                <option value="elevator">Elevator</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input"
              >
                <option value="">All Statuses</option>
                <option value="operational">Operational</option>
                <option value="maintenance_required">Maintenance Required</option>
                <option value="out_of_service">Out of Service</option>
                <option value="critical_failure">Critical Failure</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ search: '', site_id: '', asset_type: '', status: '', page: 1, limit: 20 })}
                className="btn-outline w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading assets...</p>
            </div>
          ) : assets?.data?.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asset
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Site/Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last PM
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assets.data.map((asset: any) => (
                      <tr key={asset.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {asset.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Tag: {asset.asset_tag}
                            </div>
                            {asset.manufacturer && (
                              <div className="text-sm text-gray-500">
                                {asset.manufacturer} {asset.model}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 capitalize">
                            {asset.asset_type?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">
                              {asset.site_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {asset.location}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`status-badge ${getStatusColor(asset.status)}`}>
                            {asset.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {asset.last_pm_date 
                            ? new Date(asset.last_pm_date).toLocaleDateString()
                            : 'Never'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/assets/${asset.id}`}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`/assets/${asset.id}/edit`}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {assets.pagination?.totalPages > 1 && (
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={assets.pagination.page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, page: Math.min(assets.pagination.totalPages, prev.page + 1) }))}
                      disabled={assets.pagination.page === assets.pagination.totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">
                          {(assets.pagination.page - 1) * assets.pagination.limit + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(assets.pagination.page * assets.pagination.limit, assets.pagination.total)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">{assets.pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                          disabled={assets.pagination.page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          {assets.pagination.page} of {assets.pagination.totalPages}
                        </span>
                        <button
                          onClick={() => setFilters(prev => ({ ...prev, page: Math.min(assets.pagination.totalPages, prev.page + 1) }))}
                          disabled={assets.pagination.page === assets.pagination.totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Wrench className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No assets found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search || filters.site_id || filters.asset_type || filters.status
                  ? 'Try adjusting your filters.'
                  : 'Get started by creating your first asset.'
                }
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Asset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import/Export Actions */}
      <div className="mt-6 flex justify-between">
        <button className="btn-outline">
          <Upload className="h-4 w-4 mr-2" />
          Import Assets
        </button>
        <button className="btn-outline">
          <Download className="h-4 w-4 mr-2" />
          Export Assets
        </button>
      </div>
    </div>
  )
}