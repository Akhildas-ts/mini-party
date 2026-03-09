import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid md:grid-cols-3 gap-10">

          {/* Brand + Contact Info */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">IceSpot MiniParty</h3>
            <p className="text-purple-400 text-xs font-medium tracking-wide uppercase mb-5">
              A unit of IceSpot Ice Creams, Palakkad
            </p>

            <address className="not-italic text-sm leading-relaxed text-gray-400 mb-5">
              <span className="text-white font-medium">Icespot</span><br />
              Near Victoria Colleage Palakkad, Kerala 678001<br />
              India
            </address>

            {/* Click-to-Call */}
            <a
              href="tel:+919074696823"
              className="inline-flex items-center gap-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-3 rounded-xl transition shadow-lg hover:shadow-xl"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              +91 90746 96823
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/919074696823"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-green-400 transition mt-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.616l4.537-1.462A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.7-6.42-1.9l-.147-.09-2.69.867.879-2.65-.104-.158A9.935 9.935 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              </svg>
              Chat on WhatsApp
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">Quick Links</h4>
            <nav>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/" className="hover:text-purple-400 transition inline-flex items-center gap-2">
                    <span className="w-1 h-1 bg-purple-500 rounded-full" />
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/book" className="hover:text-purple-400 transition inline-flex items-center gap-2">
                    <span className="w-1 h-1 bg-purple-500 rounded-full" />
                    Book Venue
                  </Link>
                </li>
                <li>
                  <a
                    href="https://wa.me/919074696823?text=Hi!%20I%27m%20interested%20in%20IceSpot%20bulk%20ice%20cream%20catering."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-purple-400 transition inline-flex items-center gap-2"
                  >
                    <span className="w-1 h-1 bg-purple-500 rounded-full" />
                    Bulk Catering
                  </a>
                </li>
                <li>
                  <a href="mailto:palakkadicespot@gmail.com" className="hover:text-purple-400 transition inline-flex items-center gap-2">
                    <span className="w-1 h-1 bg-purple-500 rounded-full" />
                    Email Us
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Visit Us + Served Areas */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">Visit Us</h4>

            <a
              href="https://www.google.com/maps/search/?api=1&query=Icespot+Palakkad+Kerala"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-purple-500/60 text-purple-400 hover:bg-purple-600 hover:text-white hover:border-purple-600 font-medium px-4 py-2.5 rounded-lg transition text-sm mb-5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Get Directions
            </a>

            <div className="text-sm mb-5">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Open Daily</p>
              <p className="text-white font-medium">9:30 AM &mdash; 9:30 PM</p>
            </div>

            <div className="border-t border-gray-800 pt-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Areas We Serve</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Providing the best birthday party space and bulk ice cream catering in Palakkad, Ottapalam, and surrounding regions.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} IceSpot MiniParty. All Rights Reserved.</p>
          <p>A unit of IceSpot Ice Creams, Palakkad</p>
        </div>
      </div>
    </footer>
  )
}
