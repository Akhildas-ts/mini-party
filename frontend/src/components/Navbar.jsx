import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-purple-700">
          MiniParty
        </Link>
        <div className="flex gap-6">
          <Link to="/" className="text-gray-600 hover:text-purple-700 transition">
            Home
          </Link>
          <Link
            to="/book"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Book Now
          </Link>
        </div>
      </div>
    </nav>
  )
}
