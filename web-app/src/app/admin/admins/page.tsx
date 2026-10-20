'use client'

import { useState, useEffect } from 'react'

interface Admin {
  _id: string
  name: string
  email: string
  phone?: string
  role: 'super-admin' | 'admin' | 'moderator'
  isActive: boolean
  permissions: {
    canSendNotifications: boolean
    canManageUsers: boolean
    canManageAdmins: boolean
    canViewAnalytics: boolean
    canExportData: boolean
  }
  lastLogin?: string
  createdAt: string
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'admin' as 'super-admin' | 'admin' | 'moderator',
  })
  const [formLoading, setFormLoading] = useState(false)

  // Current admin info
  const [currentAdmin, setCurrentAdmin] = useState<any>(null)

  useEffect(() => {
    // Get current admin info
    const adminUser = localStorage.getItem('adminUser')
    if (adminUser) {
      setCurrentAdmin(JSON.parse(adminUser))
    }
    fetchAdmins()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAdmins = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/admin/manage', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch admins')
      }

      setAdmins(data.admins || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admins')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Validate
      if (!formData.name || !formData.email || !formData.password) {
        throw new Error('Name, email, and password are required')
      }

      if (formData.password.length < 8) {
        throw new Error('Password must be at least 8 characters')
      }

      // Set permissions based on role
      const permissions = {
        'super-admin': {
          canSendNotifications: true,
          canManageUsers: true,
          canManageAdmins: true,
          canViewAnalytics: true,
          canExportData: true,
        },
        'admin': {
          canSendNotifications: true,
          canManageUsers: true,
          canManageAdmins: false,
          canViewAnalytics: true,
          canExportData: true,
        },
        'moderator': {
          canSendNotifications: false,
          canManageUsers: false,
          canManageAdmins: false,
          canViewAnalytics: true,
          canExportData: false,
        },
      }

      const response = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          permissions: permissions[formData.role],
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create admin')
      }

      setSuccess(`Admin "${formData.name}" created successfully!`)
      setFormData({ name: '', email: '', password: '', phone: '', role: 'admin' })
      setShowCreateForm(false)
      fetchAdmins()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create admin')
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleActive = async (adminId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`/api/admin/manage/${adminId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update admin')
      }

      setSuccess('Admin status updated successfully')
      fetchAdmins()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update admin')
    }
  }

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!confirm(`Are you sure you want to delete admin "${adminName}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch(`/api/admin/manage/${adminId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete admin')
      }

      setSuccess(`Admin "${adminName}" deleted successfully`)
      fetchAdmins()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete admin')
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === 'super-admin') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">Super admin</span>
    }
    if (role === 'admin') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">Admin</span>
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">Moderator</span>
  }

  // Check if current user can manage admins
  const canManageAdmins = currentAdmin?.role === 'super-admin' || currentAdmin?.permissions?.canManageAdmins

  if (!canManageAdmins) {
    return (
      <div className="max-w-7xl">
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-8 text-center">
          <svg className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-semibold text-red-700 dark:text-red-300 mb-2">Access denied</h2>
          <p className="text-red-700 dark:text-red-400">You do not have permission to manage admin accounts.</p>
          <p className="text-red-600 dark:text-red-400 text-sm mt-2">This feature is only available to super admins.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-neutral-600 dark:text-neutral-400">Create and manage admin accounts</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full font-medium hover:opacity-85 transition-opacity"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create admin</span>
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700 dark:text-red-400">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-emerald-700 dark:text-emerald-400">{success}</span>
          </div>
        </div>
      )}

      {/* Create Admin Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-2xl shadow-[8px_8px_20px_rgba(0,0,0,0.04)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.25)] p-4 md:p-6 mb-8">
          <h2 className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6">Create new admin</h2>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-xl text-sm placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-500 transition-colors"
                  placeholder="Admin name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-xl text-sm placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-500 transition-colors"
                  placeholder="admin@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-xl text-sm placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-500 transition-colors"
                  placeholder="Min 8 characters"
                  minLength={8}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-xl text-sm placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-500 transition-colors"
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-500 transition-colors"
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                  {currentAdmin?.role === 'super-admin' && (
                    <option value="super-admin">Super admin</option>
                  )}
                </select>
              </div>
            </div>

            {/* Role Description */}
            <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-300 dark:border-neutral-700 rounded-xl p-4">
              <p className="text-sm text-neutral-900 dark:text-neutral-100 font-medium mb-2">
                {formData.role === 'super-admin' && 'Super admin: full system access including admin management'}
                {formData.role === 'admin' && 'Admin: can manage users and send notifications'}
                {formData.role === 'moderator' && 'Moderator: read-only access for monitoring'}
              </p>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                <div className="flex items-center gap-1.5">
                  {formData.role !== 'moderator' ? (
                    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  Send notifications
                </div>
                <div className="flex items-center gap-1.5">
                  {formData.role !== 'moderator' ? (
                    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  Manage users
                </div>
                <div className="flex items-center gap-1.5">
                  {formData.role === 'super-admin' ? (
                    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  Manage admins
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={formLoading}
                className="w-full sm:w-auto px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full font-medium hover:opacity-85 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {formLoading ? 'Creating...' : 'Create admin'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false)
                  setFormData({ name: '', email: '', password: '', phone: '', role: 'admin' })
                }}
                className="w-full sm:w-auto px-6 py-3 border border-neutral-300 dark:border-neutral-700 rounded-full font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admins List */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-2xl shadow-[8px_8px_20px_rgba(0,0,0,0.04)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.25)] overflow-hidden">
        <div className="p-4 md:p-6 border-b border-neutral-300 dark:border-neutral-800">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            All admins ({admins.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-neutral-300 dark:border-neutral-700 border-b-neutral-900 dark:border-b-white mx-auto mb-4"></div>
            <p className="text-neutral-600 dark:text-neutral-400">Loading admins...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">No admins found</div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block md:hidden">
              {admins.map((admin) => (
                <div key={admin._id} className="border-b border-neutral-200 dark:border-neutral-800 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  {/* Admin Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 shrink-0 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full flex items-center justify-center font-semibold text-lg">
                        {admin.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-base">{admin.name}</div>
                        <div className="mt-1">{getRoleBadge(admin.role)}</div>
                      </div>
                    </div>
                    {admin.isActive ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        Inactive
                      </span>
                    )}
                  </div>

                  {/* Admin Details */}
                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-neutral-400 dark:text-neutral-500 mr-2 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-neutral-900 dark:text-neutral-100 break-all">{admin.email}</span>
                    </div>
                    {admin.phone && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-neutral-400 dark:text-neutral-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-neutral-600 dark:text-neutral-400">{admin.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center text-neutral-600 dark:text-neutral-400">
                      <svg className="w-4 h-4 text-neutral-400 dark:text-neutral-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Last login: {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}
                    </div>
                  </div>

                  {/* Actions */}
                  {admin._id !== currentAdmin?.id ? (
                    <div className="flex gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                      <button
                        onClick={() => handleToggleActive(admin._id, admin.isActive)}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                          admin.isActive
                            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                            : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                        }`}
                      >
                        {admin.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(admin._id, admin.name)}
                        className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 text-center">
                      <span className="text-xs text-neutral-500 italic">This is you</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-300 dark:border-neutral-800">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Admin</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Contact</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Role</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Last login</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin._id} className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 shrink-0 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full flex items-center justify-center font-semibold">
                            {admin.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">{admin.name}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-neutral-900 dark:text-neutral-100">{admin.email}</div>
                        {admin.phone && <div className="text-xs text-neutral-500">{admin.phone}</div>}
                      </td>
                      <td className="py-4 px-6">
                        {getRoleBadge(admin.role)}
                      </td>
                      <td className="py-4 px-6 text-sm text-neutral-600 dark:text-neutral-400">
                        {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : 'Never'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          {admin._id !== currentAdmin?.id ? (
                            <>
                              <button
                                onClick={() => handleToggleActive(admin._id, admin.isActive)}
                                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                  admin.isActive
                                    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                                    : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                                }`}
                              >
                                {admin.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteAdmin(admin._id, admin.name)}
                                className="px-3 py-1 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                              >
                                Delete
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-neutral-500 italic">You</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
