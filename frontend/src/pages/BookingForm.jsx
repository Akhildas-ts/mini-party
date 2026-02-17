import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function BookingForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    duration: 2,
    guests: 10,
  })
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors([])
    setSubmitting(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          duration: Number(form.duration),
          guests: Number(form.guests),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors(data.errors || [data.error || 'Something went wrong'])
        return
      }

      navigate('/confirmation', { state: { booking: data.booking } })
    } catch {
      setErrors(['Could not connect to server. Is the backend running?'])
    } finally {
      setSubmitting(false)
    }
  }

  // Get tomorrow's date as the minimum selectable date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Party</h1>
      <p className="text-gray-600 mb-8">Fill in the details below and we'll confirm your booking instantly.</p>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
          <ul className="list-disc list-inside space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
        {/* Contact Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Full Name" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" />
          <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="john@example.com" />
        </div>

        <Field label="Phone Number" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+1 234 567 8900" />

        {/* Date & Time */}
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Party Date" name="date" type="date" value={form.date} onChange={handleChange} min={minDate} />
          <Field label="Start Time" name="time" type="time" value={form.time} onChange={handleChange} />
        </div>

        {/* Duration & Guests */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
            <select
              name="duration"
              value={form.duration}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                <option key={h} value={h}>{h} {h === 1 ? 'hour' : 'hours'}</option>
              ))}
            </select>
          </div>
          <Field
            label="Number of Guests"
            name="guests"
            type="number"
            value={form.guests}
            onChange={handleChange}
            min="1"
            max="100"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-purple-600 text-white py-3 rounded-xl text-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Booking...' : 'Confirm Booking'}
        </button>
      </form>
    </main>
  )
}

function Field({ label, name, type = 'text', value, onChange, ...props }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
        {...props}
      />
    </div>
  )
}
