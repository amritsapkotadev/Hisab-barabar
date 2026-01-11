'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Notification {
  _id: string
  title: string
  body: string
  recipients: {
    type: 'all' | 'selected'
    userIds?: Array<{
      _id: string
      name: string
      email: string
      picture?: string
    }>
  }
  status: 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled'
  scheduledFor?: string
  sentAt?: string
  results?: {
    totalUsers: number
    successCount: number
    failedCount: number
    errors: Array<{ email: string; error: string }>
  }
  createdBy: {
    name: string
    email: string
  }
  createdAt: string
}

export default function NotificationHistoryPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page])

  const fetchHistory = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: '20'
      })

      const response = await fetch(`/api/admin/notifications/history?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch history')
      }

      setNotifications(data.notifications || [])
      setTotalPages(data.pagination.pages)
    } catch (err: any) {
      setError(err.message)
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      scheduled: 'bg-blue-100 text-blue-800',
      sending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    }
    return badges[status as keyof typeof badges] || badges.scheduled
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      scheduled: '🕐',
      sending: '📤',
      sent: '✅',
      failed: '❌',
      cancelled: '🚫',
    }
    return icons[status as keyof typeof icons] || '📬'
  }

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-gray-600">View all sent and scheduled notifications</p>
        </div>
        <Link
          href="/admin/notifications"
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
        >
          Send New
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Notifications</option>
            <option value="scheduled">Scheduled</option>
            <option value="sending">Sending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p>No notifications found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <details key={notification._id} className="group">
                <summary className="p-4 hover:bg-gray-50 cursor-pointer transition-colors list-none">
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: Status + Title */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusBadge(notification.status)}`}>
                        {getStatusIcon(notification.status)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{notification.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span className="truncate">{notification.body}</span>
                          <span className="text-gray-400">•</span>
                          <span className="whitespace-nowrap">by {notification.createdBy.name}</span>
                          {notification.sentAt && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="whitespace-nowrap">
                                {new Date(notification.sentAt).toLocaleString()}
                              </span>
                            </>
                          )}
                          {notification.status === 'scheduled' && notification.scheduledFor && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="whitespace-nowrap text-blue-600">
                                ⏰ {new Date(notification.scheduledFor).toLocaleString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Stats + Arrow */}
                    <div className="flex items-center gap-3 text-sm shrink-0">
                      {notification.results && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700">
                            {notification.recipients.type === 'all' ? '👥' : `👤 ${notification.recipients.userIds?.length || 0}`}
                          </span>
                          <span className="text-green-600">✓ {notification.results.successCount}</span>
                          {notification.results.failedCount > 0 && (
                            <span className="text-red-600">✗ {notification.results.failedCount}</span>
                          )}
                        </div>
                      )}
                      <svg className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </summary>

                {/* Expanded Details */}
                <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
                  <div className="flex gap-6">
                    {/* Left Side: Message & Results */}
                    <div className="flex-1 space-y-3">
                      {/* Full Message */}
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase">Message</label>
                        <p className="text-sm text-gray-900 mt-1">{notification.body}</p>
                      </div>

                      {/* Results */}
                      {notification.results && (
                        <div>
                          <label className="text-xs font-semibold text-gray-600 uppercase">Results</label>
                          <div className="mt-1 flex items-center gap-3">
                            <span className="text-sm text-gray-700">
                              Total: {notification.results.totalUsers}
                            </span>
                            <span className="text-green-600 font-medium">✓ {notification.results.successCount} sent</span>
                            {notification.results.failedCount > 0 && (
                              <span className="text-red-600 font-medium">✗ {notification.results.failedCount} failed</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Errors */}
                      {notification.results?.errors && notification.results.errors.length > 0 && (
                        <div>
                          <label className="text-xs font-semibold text-red-600 uppercase">Errors ({notification.results.errors.length})</label>
                          <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                            {notification.results.errors.map((err, idx) => (
                              <div key={idx} className="text-xs bg-red-50 border border-red-200 p-2 rounded">
                                <span className="font-medium">{err.email}:</span> {err.error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Side: Recipients */}
                    <div className="w-80 shrink-0">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 uppercase">Recipients</label>
                        {notification.recipients.type === 'all' ? (
                          <p className="text-sm text-gray-900 mt-2">All Users with FCM Tokens</p>
                        ) : (
                          <div className="mt-2 space-y-1.5 max-h-60 overflow-y-auto">
                            {notification.recipients.userIds && notification.recipients.userIds.length > 0 ? (
                              notification.recipients.userIds.map((user) => (
                                <div key={user._id} className="flex items-center gap-2 text-sm py-1.5 px-2 bg-white rounded-lg border border-gray-200">
                                  {user.picture ? (
                                    <>
                                      <img
                                        src={user.picture}
                                        alt={user.name}
                                        className="w-7 h-7 rounded-full object-cover shrink-0 border border-gray-200"
                                        onError={(e) => {
                                          // Fallback to gradient avatar if image fails to load
                                          const target = e.currentTarget as HTMLImageElement
                                          target.style.display = 'none'
                                          const fallback = target.nextElementSibling as HTMLElement
                                          if (fallback) fallback.classList.remove('hidden')
                                        }}
                                      />
                                      <div className="hidden w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                        {user.name.charAt(0).toUpperCase()}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                      {user.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-gray-900 font-medium truncate">{user.name}</div>
                                    <div className="text-gray-500 text-xs truncate">{user.email}</div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500 mt-2">No recipient details available</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
