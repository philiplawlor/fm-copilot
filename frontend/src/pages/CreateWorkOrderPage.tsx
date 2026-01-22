import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  Save,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Wrench,
  Upload,
  Camera
} from 'lucide-react'
import { workOrderAPI, aiAPI, assetAPI, siteAPI } from '../services/api'
import { useAuthStore } from '../stores/authStore'

export const CreateWorkOrderPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    type: 'corrective',
    site_id: '',
    asset_id: '',
    estimated_duration_minutes: 60
  })

  const [aiProcessing, setAiProcessing] = useState(false)
  const [aiResult, setAiResult] = useState<any>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  // Fetch sites and assets for dropdowns
  const { data: sites } = useQuery('sites', siteAPI.getSites, { enabled: !!user })
  const { data: assets } = useQuery(
    ['assets', formData.site_id], 
    () => assetAPI.getAssets({ site_id: formData.site_id }),
    { enabled: !!formData.site_id }
  )

  const createWorkOrderMutation = useMutation(workOrderAPI.createWorkOrder, {
    onSuccess: (data) => {
      queryClient.invalidateQueries('work-orders')
      navigate(`/work-orders/${data.data.id}`)
    }
  })

  const processWithAI = async () => {
    if (!formData.description || !formData.site_id) return

    setAiProcessing(true)
    try {
      const result = await aiAPI.processIntake({
        description: formData.description,
        site_id: parseInt(formData.site_id)
      })
      setAiResult(result.data)
      
      // Auto-fill form with AI suggestions
      if (result.data.suggested_work_order) {
        setFormData(prev => ({
          ...prev,
          title: result.data.suggested_work_order.title || prev.title,
          priority: result.data.suggested_work_order.priority || prev.priority,
          type: result.data.suggested_work_order.type || prev.type
        }))
      }
    } catch (error) {
      console.error('AI processing failed:', error)
    } finally {
      setAiProcessing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const workOrderData = {
      ...formData,
      site_id: parseInt(formData.site_id),
      asset_id: formData.asset_id ? parseInt(formData.asset_id) : null
    }

    createWorkOrderMutation.mutate(workOrderData)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadedFiles(prev => [...prev, ...files])
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/work-orders')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Work Orders
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Work Order</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create a new maintenance request with AI assistance
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description with AI */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Work Order Details</h3>
                  <button
                    type="button"
                    onClick={processWithAI}
                    disabled={!formData.description || !formData.site_id || aiProcessing}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                    ) : (
                      <Zap className="h-4 w-4 mr-1" />
                    )}
                    {aiProcessing ? 'Processing...' : 'AI Assist'}
                  </button>
                </div>
              </div>
              <div className="card-body space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="input"
                    placeholder="Brief description of the issue"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="input"
                    placeholder="Describe the maintenance issue in detail. Include equipment name, location, and symptoms."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Be specific for better AI processing and technician assignment
                  </p>
                </div>

                {/* Location and Asset */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Site *
                    </label>
                    <select
                      required
                      value={formData.site_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, site_id: e.target.value, asset_id: '' }))}
                      className="input"
                    >
                      <option value="">Select a site</option>
                      {sites?.data?.map((site: any) => (
                        <option key={site.id} value={site.id}>
                          {site.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asset
                    </label>
                    <select
                      value={formData.asset_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, asset_id: e.target.value }))}
                      className="input"
                      disabled={!formData.site_id}
                    >
                      <option value="">Select an asset (optional)</option>
                      {assets?.data?.map((asset: any) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name} ({asset.asset_tag})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Work Order Type and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="input"
                    >
                      <option value="corrective">Corrective Maintenance</option>
                      <option value="preventive">Preventive Maintenance</option>
                      <option value="emergency">Emergency Repair</option>
                      <option value="inspection">Inspection</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="input"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Estimated Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    value={formData.estimated_duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration_minutes: parseInt(e.target.value) }))}
                    className="input"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attachments
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <label className="cursor-pointer">
                        <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, PDF up to 10MB
                      </p>
                    </div>
                  </div>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="flex items-center">
                            <Camera className="h-4 w-4 mr-2 text-gray-400" />
                            {file.name}
                          </span>
                          <span className="text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(1)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI Results Sidebar */}
          <div className="space-y-6">
            {aiResult && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">AI Analysis</h3>
                  {aiResult.confidence_score && (
                    <span className="text-sm text-gray-500">
                      {Math.round(aiResult.confidence_score * 100)}% confidence
                    </span>
                  )}
                </div>
                <div className="card-body space-y-4">
                  {/* Extracted Info */}
                  {aiResult.extracted_info && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Extracted Information</h4>
                      <div className="space-y-2 text-sm">
                        {aiResult.extracted_info.asset && (
                          <div className="flex items-center">
                            <Wrench className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="text-gray-700">{aiResult.extracted_info.asset.name}</span>
                          </div>
                        )}
                        {aiResult.extracted_info.asset?.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="text-gray-700">{aiResult.extracted_info.asset.location}</span>
                          </div>
                        )}
                        {aiResult.extracted_info.urgency && (
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="text-gray-700">Urgency: {aiResult.extracted_info.urgency}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Similar Work Orders */}
                  {aiResult.similar_work_orders && aiResult.similar_work_orders.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Similar Work Orders</h4>
                      <div className="space-y-2">
                        {aiResult.similar_work_orders.slice(0, 3).map((wo: any, index: number) => (
                          <div key={index} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                            <div className="font-medium">{wo.title}</div>
                            {wo.resolution && (
                              <div className="mt-1">Resolution: {wo.resolution}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Quick Reference</h3>
              </div>
              <div className="card-body space-y-3">
                <div className="flex items-center text-sm">
                  <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                  <span className="font-medium">Critical:</span>
                  <span className="ml-1 text-gray-600">Safety hazard, equipment failure</span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-orange-500" />
                  <span className="font-medium">High:</span>
                  <span className="ml-1 text-gray-600">Major impact, urgent</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="font-medium">Medium:</span>
                  <span className="ml-1 text-gray-600">Normal operations, scheduleable</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/work-orders')}
            className="btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createWorkOrderMutation.isLoading}
            className="btn-primary"
          >
            {createWorkOrderMutation.isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Create Work Order
          </button>
        </div>
      </form>
    </div>
  )
}

export const AssetsPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Assets</h1>
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-yellow-800">Assets page - coming soon</p>
      </div>
    </div>
  )
}

export const PMPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Preventive Maintenance</h1>
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-yellow-800">Preventive Maintenance page - coming soon</p>
      </div>
    </div>
  )
}

export const ProfilePage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Profile</h1>
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-yellow-800">Profile page - coming soon</p>
      </div>
    </div>
  )
}