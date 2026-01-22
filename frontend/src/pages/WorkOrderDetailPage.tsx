import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  ArrowLeft,
  Edit,
  User,
  Clock,
  Calendar,
  MapPin,
  Wrench,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Paperclip,
  Save,
  X,
  Plus,
  Zap,
  Camera
} from 'lucide-react'
import { workOrderAPI, aiAPI, userAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'

export const WorkOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [isEditing, setIsEditing] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [newNote, setNewNote] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    type: 'corrective',
    estimated_duration_minutes: 60
  })

  const [assignData, setAssignData] = useState({
    technician_id: '',
    vendor_id: '',
    notes: ''
  })

  const [completeData, setCompleteData] = useState({
    resolution_notes: '',
    actual_duration_minutes: 60
  })

  // Fetch work order details
  const { data: workOrder, isLoading } = useQuery(
    ['work-order', id],
    () => workOrderAPI.getWorkOrder(parseInt(id!)),
    { enabled: !!id }
  )

  // Fetch technicians for assignment
  const { data: technicians } = useQuery('technicians', userAPI.getTechnicians, { enabled: showAssignModal })
  const { data: vendors } = useQuery('vendors', userAPI.getVendors, { enabled: showAssignModal })

  const updateWorkOrderMutation = useMutation(
    (data: any) => workOrderAPI.updateWorkOrder(parseInt(id!), data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['work-order', id])
        queryClient.invalidateQueries('work-orders')
        setIsEditing(false)
      }
    }
  )

  const assignWorkOrderMutation = useMutation(
    (data: any) => workOrderAPI.assignWorkOrder(parseInt(id!), data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['work-order', id])
        queryClient.invalidateQueries('work-orders')
        setShowAssignModal(false)
      }
    }
  )

  const completeWorkOrderMutation = useMutation(
    (data: any) => workOrderAPI.completeWorkOrder(parseInt(id!), data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['work-order', id])
        queryClient.invalidateQueries('work-orders')
        setShowCompleteModal(false)
      }
    }
  )

  const addNoteMutation = useMutation(
    (note: string) => workOrderAPI.addNote(parseInt(id!), note),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['work-order', id])
        setNewNote('')
      }
    }
  )

  const handleSave = () => {
    updateWorkOrderMutation.mutate(formData)
  }

  const handleAssign = () => {
    const assignmentData = assignData.technician_id 
      ? { technician_id: parseInt(assignData.technician_id), notes: assignData.notes }
      : { vendor_id: parseInt(assignData.vendor_id), notes: assignData.notes }
    
    assignWorkOrderMutation.mutate(assignmentData)
  }

  const handleComplete = () => {
    completeWorkOrderMutation.mutate(completeData)
  }

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNoteMutation.mutate(newNote)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'assigned': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!workOrder) {
    return <div>Work order not found</div>
  }

  const wo = workOrder.data

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Work Order #{wo.id}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(wo.status)}`}>
                {wo.status.replace('_', ' ')}
              </span>
              <span className={`status-badge ${getPriorityColor(wo.priority)}`}>
                {wo.priority}
              </span>
              <span className="text-sm text-gray-500">
                {wo.type.replace('_', ' ')}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {wo.status !== 'completed' && wo.status !== 'cancelled' && (
              <>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="btn-outline"
                  disabled={isEditing}
                >
                  <User className="h-4 w-4 mr-2" />
                  Assign
                </button>
                <button
                  onClick={() => setShowCompleteModal(true)}
                  className="btn-primary"
                  disabled={wo.status !== 'in_progress'}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </button>
              </>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-outline"
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Details</h3>
            </div>
            <div className="card-body">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="input"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        className="input"
                      >
                        <option value="corrective">Corrective</option>
                        <option value="preventive">Preventive</option>
                        <option value="emergency">Emergency</option>
                        <option value="inspection">Inspection</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={updateWorkOrderMutation.isLoading}
                      className="btn-primary"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{wo.title}</h4>
                    <p className="text-gray-700 mt-1">{wo.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{wo.site_name}</span>
                      </div>
                      {wo.asset_name && (
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Wrench className="h-4 w-4 mr-2" />
                          <span>{wo.asset_name}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Created: {new Date(wo.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Est. Duration: {wo.estimated_duration_minutes} min</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Notes & Updates</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {/* Add Note */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    className="input flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || addNoteMutation.isLoading}
                    className="btn-primary"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </div>

                {/* Notes List */}
                {wo.notes && wo.notes.length > 0 ? (
                  <div className="space-y-3">
                    {wo.notes.map((note: any, index: number) => (
                      <div key={index} className="border-l-4 border-gray-200 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-3 w-3 text-gray-600" />
                            </div>
                            <div className="ml-2">
                              <p className="text-sm font-medium text-gray-900">
                                {note.created_by_first_name} {note.created_by_last_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(note.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">{note.note}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <MessageSquare className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm">No notes yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignment Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Assignment</h3>
            </div>
            <div className="card-body">
              {wo.assigned_technician_id ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {wo.tech_first_name} {wo.tech_last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Technician
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="btn-outline text-sm"
                  >
                    Reassign
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <User className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Unassigned</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This work order has not been assigned yet.
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="btn-primary"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Work Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Files */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Attachments</h3>
            </div>
            <div className="card-body">
              <button className="w-full btn-outline">
                <Camera className="h-4 w-4 mr-2" />
                Add Photos
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Upload photos or documents related to this work order
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Assign Work Order</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment Type
                </label>
                <select
                  value={assignData.technician_id ? 'technician' : assignData.vendor_id ? 'vendor' : ''}
                  onChange={(e) => {
                    const type = e.target.value
                    setAssignData(prev => ({ ...prev, technician_id: '', vendor_id: '' }))
                  }}
                  className="input"
                >
                  <option value="">Select assignment type</option>
                  <option value="technician">Technician</option>
                  <option value="vendor">External Vendor</option>
                </select>
              </div>

              {assignData.technician_id !== '' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Technician
                  </label>
                  <select
                    value={assignData.technician_id}
                    onChange={(e) => setAssignData(prev => ({ ...prev, technician_id: e.target.value }))}
                    className="input"
                  >
                    <option value="">Select technician</option>
                    {technicians?.data?.map((tech: any) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.first_name} {tech.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  rows={3}
                  value={assignData.notes}
                  onChange={(e) => setAssignData(prev => ({ ...prev, notes: e.target.value }))}
                  className="input"
                  placeholder="Assignment notes or instructions..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={assignWorkOrderMutation.isLoading || (!assignData.technician_id && !assignData.vendor_id)}
                className="btn-primary"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Complete Work Order</h3>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resolution Notes *
                </label>
                <textarea
                  required
                  rows={4}
                  value={completeData.resolution_notes}
                  onChange={(e) => setCompleteData(prev => ({ ...prev, resolution_notes: e.target.value }))}
                  className="input"
                  placeholder="Describe what was done to resolve the issue..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Duration (minutes)
                </label>
                <input
                  type="number"
                  value={completeData.actual_duration_minutes}
                  onChange={(e) => setCompleteData(prev => ({ ...prev, actual_duration_minutes: parseInt(e.target.value) }))}
                  className="input"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={completeWorkOrderMutation.isLoading || !completeData.resolution_notes}
                className="btn-primary"
              >
                Complete Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const CreateWorkOrderPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Create Work Order</h1>
      <p className="mt-1 text-sm text-gray-600">
        Create a new maintenance work order with AI assistance - Coming Soon
      </p>
      
      <div className="mt-6 card">
        <div className="card-body">
          <div className="text-center py-8">
            <p className="text-gray-500">This feature is coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const AssetsPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
      <p className="mt-1 text-sm text-gray-600">
        Manage facility assets and equipment - Coming Soon
      </p>
      
      <div className="mt-6 card">
        <div className="card-body">
          <div className="text-center py-8">
            <p className="text-gray-500">This feature is coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const PMPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Preventive Maintenance</h1>
      <p className="mt-1 text-sm text-gray-600">
        Manage preventive maintenance schedules and templates - Coming Soon
      </p>
      
      <div className="mt-6 card">
        <div className="card-body">
          <div className="text-center py-8">
            <p className="text-gray-500">This feature is coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const ProfilePage: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      <p className="mt-1 text-sm text-gray-600">
        Manage your account settings and preferences - Coming Soon
      </p>
      
      <div className="mt-6 card">
        <div className="card-body">
          <div className="text-center py-8">
            <p className="text-gray-500">This feature is coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  )
}