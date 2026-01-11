'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface User {
  _id: string
  name: string
  email: string
  phone: string
  isVerified: boolean
  isAdmin: boolean
  fcmToken?: string
  picture?: string
  createdAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTokens, setFilterTokens] = useState<'all' | 'with' | 'without'>('all')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTokens])

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        setError('No authentication token found')
        return
      }

      const params = new URLSearchParams()
      if (filterTokens === 'with') params.append('hasToken', 'true')
      if (filterTokens === 'without') params.append('hasToken', 'false')
      
      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }

      setUsers(data.users || [])
    } catch (err: any) {
      setError(err.message)
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = searchQuery
    ? users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <p className="text-gray-600">View and manage registered users</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Search by name or email..."
          />
          <select
            value={filterTokens}
            onChange={(e) => setFilterTokens(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Users</option>
            <option value="with">With FCM Token</option>
            <option value="without">Without FCM Token</option>
          </select>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Users ({filteredUsers.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-y border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">User</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Contact</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">Loading...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">No users found</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        {user.picture && user.picture.trim() ? (
                          <div className="relative shrink-0 mr-3 w-10 h-10">
                            <Image
                              src={user.picture}
                              alt={user.name}
                              width={40}
                              height={40}
                              className="rounded-full object-cover border border-gray-200"
                              unoptimized
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement
                                target.style.display = 'none'
                                const parent = target.parentElement
                                const fallback = parent?.querySelector('.fallback-avatar') as HTMLElement
                                if (fallback) {
                                  fallback.style.display = 'flex'
                                  fallback.classList.remove('hidden')
                                }
                              }}
                            />
                            <div className="fallback-avatar hidden w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full items-center justify-center text-white font-semibold absolute top-0 left-0">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        ) : (
                          <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900">{user.name}</div>
                          {user.isAdmin && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">Admin</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      <div className="text-xs text-gray-500">{user.phone}</div>
                    </td>
                    <td className="py-4 px-6">
                      {/* Icons for all devices */}
                      <div className="flex gap-2">
                        {user.isVerified ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-600" title="Verified">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-100 text-yellow-600" title="Pending">⏳</span>
                        )}
                        {user.fcmToken && (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600" title="Push Enabled">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
