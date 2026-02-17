import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import BookingForm from './pages/BookingForm'
import Confirmation from './pages/Confirmation'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book" element={<BookingForm />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/manage-bookings" element={<AdminDashboard />} />
      </Routes>
    </div>
  )
}

export default App
