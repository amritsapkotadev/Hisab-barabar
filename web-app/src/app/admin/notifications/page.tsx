'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface User {
  _id: string
  name: string
  email: string
  phone: string
  isVerified: boolean
  fcmToken?: string
  createdAt: string
}

interface NotificationResult {
  totalUsers: number
  successCount: number
  failedCount: number
  errors: Array<{ userId: string; email: string; error: string }>
}

export default function AdminNotificationsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [sendToAll, setSendToAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchingUsers, setFetchingUsers] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTokens, setFilterTokens] = useState<'all' | 'with' | 'without'>('with')
  
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [customData, setCustomData] = useState('')
  
  const [result, setResult] = useState<NotificationResult | null>(null)
  const [error, setError] = useState('')
  const [showResultModal, setShowResultModal] = useState(false)
  
  // Schedule states
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTokens])

  const fetchUsers = async () => {
    setFetchingUsers(true)
    setError('')
    
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        setError('No authentication token found. Please login.')
        return
      }

      const params = new URLSearchParams()
      if (filterTokens === 'with') params.append('hasToken', 'true')
      if (filterTokens === 'without') params.append('hasToken', 'false')
      
      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }

      setUsers(data.users || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users')
      console.error('Error fetching users:', err)
    } finally {
      setFetchingUsers(false)
    }
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      fetchUsers()
      return
    }

    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setUsers(filtered)
  }

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(u => u._id))
    }
  }

  const handleSendNotification = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No authentication token found. Please login.')
      }

      if (!title.trim() || !body.trim()) {
        throw new Error('Title and body are required')
      }

      if (!sendToAll && selectedUsers.length === 0) {
        throw new Error('Please select at least one user or choose "Send to All"')
      }

      let parsedData = {}
      if (customData.trim()) {
        try {
          parsedData = JSON.parse(customData)
        } catch (e) {
          throw new Error('Invalid JSON in custom data')
        }
      }

      // Check if scheduling
      if (scheduleEnabled) {
        if (!scheduledDate || !scheduledTime) {
          throw new Error('Please select date and time for scheduled notification')
        }

        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
        
        if (scheduledDateTime <= new Date()) {
          throw new Error('Scheduled time must be in the future')
        }

        // Schedule notification
        const response = await fetch('/api/admin/notifications/schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title,
            body,
            userIds: sendToAll ? [] : selectedUsers,
            sendToAll,
            data: parsedData,
            scheduledFor: scheduledDateTime.toISOString()
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to schedule notification')
        }

        // Show success message for scheduled notification
        setError('')
        alert(`✅ Notification scheduled successfully for ${scheduledDateTime.toLocaleString()}`)
        
        // Clear form
        setTitle('')
        setBody('')
        setCustomData('')
        setSelectedUsers([])
        setSendToAll(false)
        setScheduleEnabled(false)
        setScheduledDate('')
        setScheduledTime('')
      } else {
        // Send immediately
        const response = await fetch('/api/admin/notifications/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title,
            body,
            userIds: sendToAll ? [] : selectedUsers,
            sendToAll,
            data: parsedData
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to send notifications')
        }

        setResult(data.results)
        setShowResultModal(true)
        
        // Clear form on success
        if (data.results.failedCount === 0) {
          setTitle('')
          setBody('')
          setCustomData('')
          setSelectedUsers([])
          setSendToAll(false)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send notifications')
      console.error('Error sending notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl px-4 sm:px-6">
      {/* Result Modal */}
      {showResultModal && result && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-scale-in">
            {/* Close Button */}
            <button
              onClick={() => setShowResultModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icon */}
            <div className="text-center mb-4">
              {result.failedCount === 0 ? (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : result.successCount === 0 ? (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              ) : (
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              )}
              
              <h3 className="text-xl font-bold text-gray-900">
                {result.failedCount === 0 ? 'Success!' : result.successCount === 0 ? 'Failed' : 'Partial Success'}
              </h3>
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Total Recipients</span>
                <span className="text-lg font-bold text-gray-900">{result.totalUsers}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-700">Sent Successfully</span>
                <span className="text-lg font-bold text-green-700">{result.successCount}</span>
              </div>
              
              {result.failedCount > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium text-red-700">Failed</span>
                  <span className="text-lg font-bold text-red-700">{result.failedCount}</span>
                </div>
              )}
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="mb-6">
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-red-600 hover:text-red-700 flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <span>View Error Details ({result.errors.length})</span>
                    <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                    {result.errors.map((err, idx) => (
                      <div key={idx} className="text-xs bg-white border border-red-200 p-2 rounded">
                        <div className="font-medium text-gray-900">{err.email}</div>
                        <div className="text-red-600">{err.error}</div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}

            {/* Actions */}
            <button
              onClick={() => setShowResultModal(false)}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div>
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Notification Form */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create Notification</h2>
              <Link
                href="/admin/notifications/history"
                className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-all text-sm sm:text-base"
                title="View History"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">History</span>
              </Link>
            </div>
            
            <div className="space-y-4">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter notification title"
                  maxLength={100}
                />
                <div className="text-xs text-gray-500 mt-1">{title.length}/100</div>
              </div>

              {/* Body Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter notification message"
                  rows={4}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">{body.length}/500</div>
              </div>

              {/* Custom Data */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Data (JSON) - Optional
                </label>
                <textarea
                  value={customData}
                  onChange={(e) => setCustomData(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                  placeholder='{"key": "value", "action": "open_screen"}'
                  rows={3}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Enter valid JSON for additional data
                </div>
              </div>

              {/* Send to All Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sendToAll"
                  checked={sendToAll}
                  onChange={(e) => {
                    setSendToAll(e.target.checked)
                    if (e.target.checked) {
                      setSelectedUsers([])
                    }
                  }}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="sendToAll" className="ml-2 text-sm font-medium text-gray-700">
                  Send to all users with FCM tokens
                </label>
              </div>

              {/* Schedule Toggle */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="scheduleEnabled"
                    checked={scheduleEnabled}
                    onChange={(e) => setScheduleEnabled(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="scheduleEnabled" className="ml-2 text-sm font-medium text-gray-700">
                    🕐 Schedule for later
                  </label>
                </div>

                {scheduleEnabled && (
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                onClick={handleSendNotification}
                disabled={loading || (!sendToAll && selectedUsers.length === 0)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : scheduleEnabled ? (
                  `Schedule Notification${!sendToAll ? ` to ${selectedUsers.length} user(s)` : ' to All'}`
                ) : (
                  `Send Notification${!sendToAll ? ` to ${selectedUsers.length} user(s)` : ' to All'}`
                )}
              </button>
            </div>
          </div>

          {/* User Selection */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Select Recipients</h2>
            
            {/* Search and Filter */}
            <div className="space-y-3 sm:space-y-4 mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Search by name or email"
                />
                <button
                  onClick={handleSearch}
                  className="px-3 sm:px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                  title="Search"
                >
                  <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="hidden sm:inline text-sm sm:text-base">Search</span>
                </button>
              </div>

              <div className="flex gap-2">
                <select
                  value={filterTokens}
                  onChange={(e) => setFilterTokens(e.target.value as any)}
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                >
                  <option value="all">All Users</option>
                  <option value="with">With FCM Token</option>
                  <option value="without">Without FCM Token</option>
                </select>
                <button
                  onClick={fetchUsers}
                  disabled={fetchingUsers}
                  className="px-3 sm:px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline text-sm sm:text-base">{fetchingUsers ? 'Loading...' : 'Refresh'}</span>
                </button>
              </div>
            </div>

            {/* Select All */}
            {!sendToAll && users.length > 0 && (
              <div className="mb-3 pb-3 border-b">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="ml-3 text-sm text-gray-500">
                  {selectedUsers.length} of {users.length} selected
                </span>
              </div>
            )}

            {/* Users List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {fetchingUsers ? (
                <div className="text-center py-8 text-gray-500">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No users found</div>
              ) : (
                users.map((user) => (
                  <div
                    key={user._id}
                    className={`p-3 border rounded-lg transition-all ${
                      sendToAll 
                        ? 'bg-gray-50 border-gray-200 opacity-50' 
                        : selectedUsers.includes(user._id)
                        ? 'bg-purple-50 border-purple-300'
                        : 'bg-white border-gray-200 hover:border-purple-200'
                    }`}
                  >
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendToAll || selectedUsers.includes(user._id)}
                        onChange={() => handleSelectUser(user._id)}
                        disabled={sendToAll}
                        className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                        <div className="flex gap-2 mt-1">
                          {user.isVerified && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              Verified
                            </span>
                          )}
                          {user.fcmToken ? (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              Has FCM Token
                            </span>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              No FCM Token
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">📱 Information</h3>
          <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
            <li>• Only users with FCM tokens can receive push notifications</li>
            <li>• Custom data should be in valid JSON format</li>
            <li>• Notifications are sent asynchronously and may take a few moments</li>
            <li>• Failed notifications will be reported with error details</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
