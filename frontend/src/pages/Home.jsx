import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Make Every Party
          <span className="text-purple-600"> Unforgettable</span>
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
            icon="🏠"
          />
          <FeatureCard
            title="Flexible Hours"
            description="Book from 1 to 8 hours. Morning brunch parties to late-night celebrations."
            icon="⏰"
          />
          <FeatureCard
            title="Easy Booking"
            description="Pick your date, time, and guest count. Confirmed in seconds."
            icon="✅"
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

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h3 className="text-xl font-bold text-white mb-2">
            Anil New Icespot Palakkad
          </h3>
          <p className="text-gray-400 mb-4">Owner: Anil Das</p>
          <p className="text-gray-400 mb-2">Icespot, Palakkad</p>
          <p>
            <a
              href="tel:9074696823"
              className="text-purple-400 hover:text-purple-300 transition font-medium"
            >
              9074696823
            </a>
          </p>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({ title, description, icon }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
