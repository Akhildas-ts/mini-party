import { useState, useEffect } from 'react'

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
  </svg>
)

export default function AdminDashboard() {
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Restore session on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('adminToken')
    if (saved) {
      setToken(saved)
      fetchBookings(saved)
    }
  }, [])

  const fetchBookings = async (adminToken) => {
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings`, {
        headers: { 'X-Admin-Token': adminToken },
      })

      if (res.status === 401) {
        sessionStorage.removeItem('adminToken')
        setAuthenticated(false)
        setError('Invalid token. Access denied.')
        setLoading(false)
        return
      }

      if (!res.ok) {
        setError('Failed to fetch bookings.')
        setLoading(false)
        return
      }

      const data = await res.json()
      setBookings(data || [])
      setAuthenticated(true)
      sessionStorage.setItem('adminToken', adminToken)
    } catch {
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (e) => {
    e.preventDefault()
    fetchBookings(token)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken')
    setAuthenticated(false)
    setBookings([])
    setToken('')
  }

  const totalGuests = bookings.reduce((sum, b) => sum + b.guests, 0)

  // --- Login Gate ---
  if (!authenticated) {
    return (
      <main className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-100 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-purple-700">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
            <p className="text-gray-500 text-sm mt-1">Enter your secret token to continue</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                Secret Token
              </label>
              <div className="relative">
                <input
                  id="token"
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  autoComplete="off"
                  placeholder="Enter admin token"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-11 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  aria-label={showToken ? 'Hide token' : 'Show token'}
                >
                  {showToken ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 rounded-xl text-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'View Dashboard'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  // --- Dashboard ---
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-4 py-2 rounded-lg transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-purple-600">
          <p className="text-sm text-gray-500 mb-1">Total Bookings</p>
          <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-purple-600">
          <p className="text-sm text-gray-500 mb-1">Total Guests</p>
          <p className="text-3xl font-bold text-gray-900">{totalGuests}</p>
        </div>
      </div>

      {/* Data Table */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-500">
          No bookings yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-purple-700 text-white text-sm uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">Guests</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">Phone</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">Duration</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <tr
                    key={b.id}
                    className={`border-b border-gray-100 ${
                      i % 2 === 0 ? 'bg-white' : 'bg-purple-50'
                    } hover:bg-purple-100 transition`}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{b.name}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">{b.date}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{b.time}</td>
                    <td className="px-4 py-3 text-purple-700 font-bold text-center">{b.guests}</td>
                    <td className="px-4 py-3 text-gray-700 hidden sm:table-cell">{b.email}</td>
                    <td className="px-4 py-3 text-gray-700 hidden sm:table-cell">{b.phone}</td>
                    <td className="px-4 py-3 text-gray-700 hidden sm:table-cell">{b.duration}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}
