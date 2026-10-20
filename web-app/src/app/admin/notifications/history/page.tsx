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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch history')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      scheduled: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
      sending: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
      sent: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      failed: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
      cancelled: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
    }
    return badges[status as keyof typeof badges] || badges.scheduled
  }

  const getStatusIcon = (status: string) => {
    const iconClass = 'w-3.5 h-3.5'
    const icons = {
      scheduled: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      sending: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      sent: (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
      failed: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      cancelled: (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
    }
    return icons[status as keyof typeof icons] || (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    )
  }

  return (
    <div className="max-w-full px-2 sm:px-4">
      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4">
          <span className="text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-2xl shadow-[8px_8px_20px_rgba(0,0,0,0.04)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.25)] p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <label className="text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="flex-1 sm:flex-initial px-4 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-xl text-sm sm:text-base placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/20 focus:border-neutral-500 transition-colors"
          >
            <option value="all">All notifications</option>
            <option value="scheduled">Scheduled</option>
            <option value="sending">Sending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="px-3 sm:px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-full font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-2xl shadow-[8px_8px_20px_rgba(0,0,0,0.04)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.25)] overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-neutral-300 dark:border-neutral-700 border-b-neutral-900 dark:border-b-white mx-auto mb-4"></div>
            <p className="text-neutral-600 dark:text-neutral-400">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p>No notifications found</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {notifications.map((notification) => (
              <details key={notification._id} className="group">
                <summary className="p-3 sm:p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors list-none">
                  <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4">
                    {/* Left: Status + Title */}
                    <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                      <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium shrink-0 ${getStatusBadge(notification.status)}`}>
                        {getStatusIcon(notification.status)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 truncate text-sm sm:text-base">{notification.title}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-neutral-500 mt-0.5">
                          <span className="truncate">{notification.body}</span>
                          <span className="hidden sm:inline text-neutral-400 dark:text-neutral-500">•</span>
                          <span className="whitespace-nowrap">by {notification.createdBy.name}</span>
                          {notification.sentAt && (
                            <>
                              <span className="hidden sm:inline text-neutral-400 dark:text-neutral-500">•</span>
                              <span className="whitespace-nowrap">
                                {new Date(notification.sentAt).toLocaleDateString()}
                              </span>
                            </>
                          )}
                          {notification.status === 'scheduled' && notification.scheduledFor && (
                            <>
                              <span className="hidden sm:inline text-neutral-400 dark:text-neutral-500">•</span>
                              <span className="whitespace-nowrap text-blue-600 dark:text-blue-400">
                                {new Date(notification.scheduledFor).toLocaleString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Stats + Arrow */}
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm shrink-0">
                      {notification.results && (
                        <div className="hidden sm:flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-neutral-700 dark:text-neutral-300">
                            {notification.recipients.type === 'all' ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {notification.recipients.userIds?.length || 0}
                              </>
                            )}
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400">✓ {notification.results.successCount}</span>
                          {notification.results.failedCount > 0 && (
                            <span className="text-red-600 dark:text-red-400">✗ {notification.results.failedCount}</span>
                          )}
                        </div>
                      )}
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 dark:text-neutral-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </summary>

                {/* Expanded Details */}
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-800">
                  <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                    {/* Left Side: Message & Results */}
                    <div className="flex-1 space-y-3">
                      {/* Full Message */}
                      <div>
                        <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Message</label>
                        <p className="text-sm text-neutral-900 dark:text-neutral-100 mt-1">{notification.body}</p>
                      </div>

                      {/* Results */}
                      {notification.results && (
                        <div>
                          <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Results</label>
                          <div className="mt-1 flex items-center gap-3">
                            <span className="text-sm text-neutral-700 dark:text-neutral-300">
                              Total: {notification.results.totalUsers}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ {notification.results.successCount} sent</span>
                            {notification.results.failedCount > 0 && (
                              <span className="text-red-600 dark:text-red-400 font-medium">✗ {notification.results.failedCount} failed</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Errors */}
                      {notification.results?.errors && notification.results.errors.length > 0 && (
                        <div>
                          <label className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">Errors ({notification.results.errors.length})</label>
                          <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                            {notification.results.errors.map((err, idx) => (
                              <div key={idx} className="text-xs bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-2 rounded-lg">
                                <span className="font-medium">{err.email}:</span> {err.error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Side: Recipients */}
                    <div className="lg:w-80 shrink-0">
                      <div>
                        <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase">Recipients</label>
                        {notification.recipients.type === 'all' ? (
                          <p className="text-sm text-neutral-900 dark:text-neutral-100 mt-2">All users with FCM tokens</p>
                        ) : (
                          <div className="mt-2 space-y-1.5 max-h-60 overflow-y-auto">
                            {notification.recipients.userIds && notification.recipients.userIds.length > 0 ? (
                              notification.recipients.userIds.map((user) => (
                                <div key={user._id} className="flex items-center gap-2 text-sm py-1.5 px-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                                  {user.picture ? (
                                    <>
                                      <img
                                        src={user.picture}
                                        alt={user.name}
                                        className="w-7 h-7 rounded-full object-cover shrink-0 border border-neutral-200 dark:border-neutral-700"
                                        onError={(e) => {
                                          const target = e.currentTarget as HTMLImageElement
                                          target.style.display = 'none'
                                          const fallback = target.nextElementSibling as HTMLElement
                                          if (fallback) fallback.classList.remove('hidden')
                                        }}
                                      />
                                      <div className="hidden w-7 h-7 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
                                        {user.name.charAt(0).toUpperCase()}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-7 h-7 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
                                      {user.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-neutral-900 dark:text-neutral-100 font-medium truncate">{user.name}</div>
                                    <div className="text-neutral-500 text-xs truncate">{user.email}</div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-neutral-500 mt-2">No recipient details available</p>
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
          <div className="bg-neutral-50 dark:bg-neutral-800/50 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 sm:px-4 py-1.5 sm:py-2 border border-neutral-300 dark:border-neutral-700 rounded-full text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 sm:px-4 py-1.5 sm:py-2 border border-neutral-300 dark:border-neutral-700 rounded-full text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
