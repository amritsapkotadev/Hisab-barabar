'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [adminUser, setAdminUser] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/admin/login') {
      setLoading(false)
      return
    }

    // Check authentication
    const token = localStorage.getItem('adminToken')
    const user = localStorage.getItem('adminUser')

    if (!token || !user) {
      router.push('/admin/login')
      return
    }

    try {
      const parsedUser = JSON.parse(user)
      setAdminUser(parsedUser)
      setLoading(false)
    } catch (error) {
      console.error('Error parsing admin user:', error)
      router.push('/admin/login')
    }
  }, [pathname, router])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    router.push('/admin/login')
  }

  // Show loading state
  if (loading && pathname !== '/admin/login') {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-2 border-neutral-300 dark:border-neutral-700 border-b-neutral-900 dark:border-b-white mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Show login page without layout
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const navItems = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Notifications',
      path: '/admin/notifications',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
    },
    {
      name: 'Users',
      path: '/admin/users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      name: 'Admins',
      path: '/admin/admins',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      superAdminOnly: true
    },
  ]

  const getPageTitle = () => {
    // Check for specific sub-pages first
    if (pathname === '/admin/notifications/history') return 'History'

    // Then check nav items
    const item = navItems.find(item => item.path === pathname)
    return item?.name || 'Admin panel'
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Left Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-neutral-900 border-r border-neutral-300 dark:border-neutral-800 transition-all duration-300 flex flex-col ${
        sidebarOpen ? 'w-64' : 'w-16'
      } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-4 border-b border-neutral-300 dark:border-neutral-800 flex-shrink-0">
          <div className="flex items-center">
            <span className="w-8 h-8 overflow-hidden rounded-lg block flex-shrink-0">
              <img
                src="/logo.jpeg"
                alt="Hisab Barabar logo"
                className="w-full h-full object-cover"
              />
            </span>
            <span className={`ml-3 text-lg font-semibold tracking-tight whitespace-nowrap transition-all duration-300 overflow-hidden ${
              sidebarOpen ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 ml-0'
            }`}>
              Admin portal
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto min-h-0">
          {navItems.map((item) => {
            // Hide super-admin only items for non-super-admins
            if (item.superAdminOnly && adminUser?.role !== 'super-admin') {
              return null
            }

            const isActive = pathname === item.path

            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
                title={!sidebarOpen ? item.name : ''}
              >
                <div className="flex items-center justify-center w-5">
                  <span className={`flex-shrink-0 ${isActive ? 'text-white dark:text-neutral-900' : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200'}`}>
                    {item.icon}
                  </span>
                </div>
                <span className={`ml-3 whitespace-nowrap transition-all duration-300 overflow-hidden ${
                  sidebarOpen ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 ml-0'
                }`}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-neutral-300 dark:border-neutral-800 p-3">
          {/* Admin Avatar */}
          <div className="flex items-center py-3">
            <div className="flex items-center justify-center w-10 flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-semibold">
                {adminUser?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
            <div className={`flex-1 min-w-0 ml-3 transition-all duration-300 overflow-hidden ${
              sidebarOpen ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 ml-0'
            }`}>
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {adminUser?.name || 'Admin'}
              </div>
              <div className="text-xs text-neutral-500 truncate">
                {adminUser?.role === 'super-admin' ? 'Super admin' :
                 adminUser?.role === 'admin' ? 'Admin' :
                 adminUser?.role === 'moderator' ? 'Moderator' :
                 'Administrator'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            title={!sidebarOpen ? 'Logout' : ''}
          >
            <div className="flex items-center justify-center w-5">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <span className={`ml-3 whitespace-nowrap transition-all duration-300 overflow-hidden ${
              sidebarOpen ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0 ml-0'
            }`}>
              Logout
            </span>
          </button>
        </div>

        {/* Collapse/Expand Button - At Bottom */}
        <div className="p-3 mt-auto">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex w-full items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              )}
            </svg>
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        {/* Top Header */}
        <header className="h-16 bg-white/90 dark:bg-neutral-950/90 backdrop-blur border-b border-neutral-300 dark:border-neutral-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Page Title */}
            <div>
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{getPageTitle()}</h1>
              <p className="text-xs text-neutral-500 hidden sm:block">Welcome back, {adminUser?.name || 'Admin'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Time Display */}
            <div className="hidden md:block text-sm text-neutral-500 dark:text-neutral-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-neutral-900 border-t border-neutral-300 dark:border-neutral-800 py-4 px-6">
          <div className="text-center text-xs text-neutral-500">
            © {new Date().getFullYear()} Hisab Barabar. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  )
}
