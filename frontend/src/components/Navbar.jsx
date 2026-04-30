import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

const links = [
  { to: '/dashboard',  label: 'Dashboard'  },
  { to: '/compliance', label: 'Compliance' },
  { to: '/analytics',  label: 'Analytics'  },
  { to: '/tasks',  label: 'Task List'  },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">C</span>
            </div>
            <span className="font-semibold text-slate-800 hidden sm:block">
              Compliance Tracker
            </span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 min-h-[44px] flex items-center ${
                    isActive
                      ? 'bg-primary-50 text-primary-500'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* User + Logout */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:block">
              {user?.name || user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="btn-secondary text-sm px-3 py-2 min-h-[36px]"
            >
              Logout
            </button>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 min-h-[44px] min-w-[44px]"
              onClick={() => setOpen(!open)}
            >
              <span className="block w-5 h-0.5 bg-slate-600 mb-1"></span>
              <span className="block w-5 h-0.5 bg-slate-600 mb-1"></span>
              <span className="block w-5 h-0.5 bg-slate-600"></span>
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {open && (
          <div className="md:hidden border-t border-slate-100 py-2">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 text-sm font-medium rounded-lg mx-1 ${
                    isActive
                      ? 'bg-primary-50 text-primary-500'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}