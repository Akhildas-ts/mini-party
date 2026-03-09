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
          <span className="block text-lg md:text-xl font-medium text-gray-500 mb-2">Best Birthday Party Hall in Palakkad</span>
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
        <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
          Palakkad's most affordable party venue for birthday celebrations,
          get-togethers, and private events. We handle the setup,
          decorations, and vibes — you bring the fun!
        </p>
        <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-2xl px-8 py-4 mb-8 shadow-lg">
          <span className="text-3xl font-bold">&#8377;100</span>
          <span className="text-lg font-medium">/hr</span>
          <span className="block text-sm text-purple-100 mt-1">No hidden fees — just fun</span>
        </div>
        <div>
          <Link
            to="/book"
            className="inline-block bg-purple-600 text-white text-lg px-8 py-4 rounded-xl hover:bg-purple-700 transition shadow-lg hover:shadow-xl"
          >
            Book Your Party
          </Link>
        </div>
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
            {[
              { label: 'Party Setup', alt: 'Birthday party setup at Mini Party venue Palakkad' },
              { label: 'Cozy Corner', alt: 'Cozy private party space at IceSpot Palakkad' },
              { label: 'Lounge Area', alt: 'Party lounge area at Mini Party Palakkad Kerala' },
            ].map(({ label, alt }) => (
              <div
                key={label}
                role="img"
                aria-label={alt}
                className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl h-56 flex items-center justify-center text-purple-500 text-lg font-medium"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IceSpot Bulk Catering */}
      <section className="bg-gradient-to-br from-purple-700 to-pink-600 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-pink-200 font-medium text-sm uppercase tracking-widest mb-3">Factory-Direct from Our Shop</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              IceSpot Bulk Ice Cream Catering — Palakkad
            </h2>
            <p className="text-lg text-purple-100 max-w-2xl mx-auto">
              Kerala's trending ice cream destination now offers bulk catering and family packs for weddings, parties, and special events.
              Delight your guests with premium-quality ice cream, handcrafted flavors, and fresh desserts delivered directly from our shop.
              Affordable bulk pricing with the taste everyone loves.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition">
              <div className="text-5xl mb-4">&#127846;</div>
              <h3 className="text-xl font-bold text-white mb-2">1-Liter Family Tub</h3>
              <p className="text-purple-100 text-sm mb-3">Ideal for birthdays & small gatherings</p>
              <span className="inline-block bg-white/20 text-white text-sm font-semibold px-4 py-1.5 rounded-full">Bulk Price Available</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition">
              <div className="text-5xl mb-4">&#127847;</div>
              <h3 className="text-xl font-bold text-white mb-2">4-Liter Party Tub</h3>
              <p className="text-purple-100 text-sm mb-3">Perfect for weddings & large events</p>
              <span className="inline-block bg-white/20 text-white text-sm font-semibold px-4 py-1.5 rounded-full">Bulk Price Available</span>
            </div>
          </div>
          <div className="text-center mt-10">
            <a
              href="https://wa.me/919074696823?text=Hi!%20I%27m%20interested%20in%20IceSpot%20bulk%20catering%20for%20my%20event."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-purple-700 font-semibold text-lg px-8 py-4 rounded-xl hover:bg-purple-50 transition shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.79 23.329l4.47-1.47A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.587-5.932-1.608l-.425-.253-2.652.872.89-2.578-.278-.441A9.776 9.776 0 012.182 12c0-5.418 4.4-9.818 9.818-9.818S21.818 6.582 21.818 12s-4.4 9.818-9.818 9.818z"/>
              </svg>
              Catering Inquiry
            </a>
          </div>
        </div>
      </section>

      {/* Local SEO Section */}
      <section className="bg-purple-50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Your Neighbourhood Party Destination
          </h2>
          <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Located in the heart of Palakkad, IceSpot offers the most affordable party space
            for birthday celebrations. Whether you're looking for a cheap party hall in Palakkad
            or the best ice cream shop for your event catering, we're right here in your neighbourhood —
            no long drives, no expensive bookings.
          </p>
          <p className="text-sm text-gray-400 mt-4">Anil New Icespot, Palakkad, Kerala</p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to Party?
        </h2>
        <p className="text-gray-600 mb-2">
          Spots fill up fast — secure your date now!
        </p>
        <p className="text-purple-600 font-semibold mb-8">
          Only &#8377;100/hr — No hidden fees
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
