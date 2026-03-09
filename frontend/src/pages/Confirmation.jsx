import { Link, useLocation, Navigate } from 'react-router-dom'

export default function Confirmation() {
  const { state } = useLocation()
  const booking = state?.booking
  if (!booking) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="bg-white rounded-2xl shadow-sm p-10">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
        <p className="text-gray-600 mb-8">
          Thanks, {booking.name}! Your party is booked. Here are the details:
        </p>

        <div className="bg-purple-50 rounded-xl p-6 text-left space-y-3 mb-4">
          <Detail label="Booking ID" value={`#${booking.id}`} />
          <Detail label="Date" value={booking.date} />
          <Detail label="Time" value={booking.time} />
          <Detail label="Duration" value={`${booking.duration} hour${booking.duration > 1 ? 's' : ''}`} />
          <Detail label="Guests" value={booking.guests} />
          <Detail label="Email" value={booking.email} />
          <Detail label="Phone" value={booking.phone} />
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl p-5 text-white mb-8">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-sm text-purple-100">Total Price</p>
              <p className="text-xs text-purple-200">{booking.duration} {booking.duration > 1 ? 'hours' : 'hour'} &times; &#8377;100/hr</p>
            </div>
            <p className="text-3xl font-bold">&#8377;{booking.duration * 100}</p>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          A confirmation will be sent to {booking.email}.
        </p>

        <Link
          to="/"
          className="inline-block bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition"
        >
          Back to Home
        </Link>
      </div>
    </main>
  )
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="font-medium text-gray-700">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  )
}
