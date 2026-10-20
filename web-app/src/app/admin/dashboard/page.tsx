'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Stats {
  totalUsers: number
  verifiedUsers: number
  usersWithTokens: number
  admins: number
  totalGroups: number
  totalExpenses: number
  recentUsers: Array<{
    _id: string
    name: string
    email: string
    picture?: string
    fcmToken?: string
    createdAt: string
    isVerified: boolean
  }>
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchDashboardStats = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats')
      }

      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-2 border-neutral-300 dark:border-neutral-700 border-b-neutral-900 dark:border-b-white mx-auto mb-4"></div>
        <p className="text-neutral-600 dark:text-neutral-400 font-medium">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-6 text-center max-w-xl mx-auto mt-8">
        <svg className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">Error loading dashboard</h3>
        <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchDashboardStats}
          className="px-5 py-2 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl">

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <Link href="/admin/notifications" className="block group">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-2xl shadow-[8px_8px_20px_rgba(0,0,0,0.04)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.25)] p-5 md:p-6 hover:border-neutral-500 dark:hover:border-neutral-600 transition-colors">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-900 dark:text-neutral-100">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <svg className="w-5 h-5 md:w-6 md:h-6 text-neutral-400 dark:text-neutral-500 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-1">Send notifications</h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">Send push notifications to users</p>
          </div>
        </Link>

        <Link href="/admin/users" className="block group">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-2xl shadow-[8px_8px_20px_rgba(0,0,0,0.04)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.25)] p-5 md:p-6 hover:border-neutral-500 dark:hover:border-neutral-600 transition-colors">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-900 dark:text-neutral-100">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <svg className="w-5 h-5 md:w-6 md:h-6 text-neutral-400 dark:text-neutral-500 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-1">Manage users</h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">View and manage all users</p>
          </div>
        </Link>

        <button onClick={fetchDashboardStats} className="block group text-left">
          <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-2xl shadow-[8px_8px_20px_rgba(0,0,0,0.04)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.25)] p-5 md:p-6 hover:border-neutral-500 dark:hover:border-neutral-600 transition-colors">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-neutral-900 dark:text-neutral-100">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <svg className="w-5 h-5 md:w-6 md:h-6 text-neutral-400 dark:text-neutral-500 transform group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-1">Refresh stats</h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">Update dashboard data</p>
          </div>
        </button>
      </div>

      {/* Recent Users */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-2xl shadow-[8px_8px_20px_rgba(0,0,0,0.04)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.25)] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Recent users</h2>
          <Link
            href="/admin/users"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center transition-colors"
          >
            View all
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {stats?.recentUsers && stats.recentUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-300 dark:border-neutral-800">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hidden md:table-cell">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hidden sm:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentUsers.map((user) => (
                  <tr key={user._id} className="border-b border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {user.picture ? (
                          <div className="relative shrink-0 mr-3 w-8 h-8">
                            <img
                              src={user.picture}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement
                                target.style.display = 'none'
                                const fallback = target.nextElementSibling as HTMLElement
                                if (fallback) {
                                  fallback.style.display = 'flex'
                                  fallback.classList.remove('hidden')
                                }
                              }}
                            />
                            <div className="hidden w-8 h-8 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full items-center justify-center font-semibold text-sm absolute top-0 left-0">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                        ) : (
                          <div className="w-8 h-8 shrink-0 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full flex items-center justify-center font-semibold text-sm mr-3">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 text-sm hidden md:table-cell">{user.email}</td>
                    <td className="py-3 px-4">
                      {/* Icons for all devices */}
                      <div className="flex" style={{ gap: '0.3rem' }}>
                        {user.isVerified ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" title="Verified">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" title="Pending">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                        )}
                        {user.fcmToken && (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" title="Push enabled">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 text-sm hidden sm:table-cell">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500">
            No recent users found
          </div>
        )}
      </div>
    </div>
  )
}
