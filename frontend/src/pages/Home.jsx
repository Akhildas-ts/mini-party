import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  const [backendStatus, setBackendStatus] = useState('waking') // 'waking' | 'ready' | 'error'

  useEffect(() => {
    let cancelled = false
    let attempt = 0
    const maxAttempts = 6 // retry up to 6 times (covers ~90s of cold start)

    const ping = () => {
      fetch(`${import.meta.env.VITE_API_URL}/health`)
        .then((res) => {
          if (cancelled) return
          if (res.ok) setBackendStatus('ready')
          else throw new Error('not ok')
        })
        .catch(() => {
          if (cancelled) return
          attempt++
          if (attempt < maxAttempts) {
            setTimeout(ping, 5000) // retry every 5 seconds
          } else {
            setBackendStatus('error')
          }
        })
    }

    ping()
    return () => { cancelled = true }
  }, [])

  return (
    <main>
      {/* Wake-up banner */}
      {backendStatus === 'waking' && (
        <div className="bg-purple-50 text-purple-700 text-center py-3 text-sm">
          <span className="inline-block animate-spin mr-2">&#9881;</span>
          Waking up our servers — this may take up to 30 seconds...
        </div>
      )}
      {backendStatus === 'error' && (
        <div className="bg-red-50 text-red-700 text-center py-3 text-sm">
          Server is taking longer than usual. Please try again in a minute.
        </div>
      )}
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          <span
            className="font-extrabold"
            style={{
              color: '#FFFFFF',
              WebkitTextStroke: '5px #9C2C8A',
              paintOrder: 'stroke fill',
            }}
          >
            IceSpot
          </span>
          <span className="text-purple-600"> Palakkad</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Book your private party venue in minutes. We handle the setup,
          decorations, and vibes — you bring the fun!
        </p>
        <Link
          to="/book"
          className="inline-block bg-purple-600 text-white text-lg px-8 py-4 rounded-xl hover:bg-purple-700 transition shadow-lg hover:shadow-xl"
        >
          Book Your Party
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            title="Private Venue"
            description="Exclusive space for your group with customizable layouts and decorations."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L2 12h3v8h6v-5h2v5h6v-8h3L12 3z" />
              </svg>
            }
          />
          <FeatureCard
            title="Chill & Celebrate"
            description="Enjoy your favorite ice creams with friends while we set the perfect party mood."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C9.5 2 7.5 4 7.5 6.5c0 .5.1 1 .2 1.5H6a2 2 0 00-2 2v1a2 2 0 002 2h.5L8 22h8l1.5-9H18a2 2 0 002-2v-1a2 2 0 00-2-2h-1.7c.1-.5.2-1 .2-1.5C16.5 4 14.5 2 12 2z" />
              </svg>
            }
          />
          <FeatureCard
            title="Easy Booking"
            description="Pick your date, time, and guest count. Confirmed in seconds."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Our Space */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Our Space
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            A cozy, intimate space perfect for small meetings, spending quality
            time with friends, or hosting small birthday events.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {['Party Setup', 'Cozy Corner', 'Lounge Area'].map((label) => (
              <div
                key={label}
                className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl h-56 flex items-center justify-center text-purple-500 text-lg font-medium"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to Party?
        </h2>
        <p className="text-gray-600 mb-8">
          Spots fill up fast — secure your date now!
        </p>
        <Link
          to="/book"
          className="inline-block bg-purple-600 text-white text-lg px-8 py-4 rounded-xl hover:bg-purple-700 transition shadow-lg"
        >
          Book Your Party
        </Link>
      </section>

    </main>
  )
}

function FeatureCard({ title, description, icon }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition text-center">
      <div className="mb-4 flex justify-center">
        <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
