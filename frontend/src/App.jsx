import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ComplianceList from './pages/ComplianceList'
import Analytics from './pages/Analytics'
import TaskList from './pages/TaskList'

// Layout wrapper for all protected pages (shows Navbar)
function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public route — no Navbar */}
          // In App.jsx, uncomment inside the protected routes:
          <Route path="/compliance" element={<ComplianceList />} />
        <Route path="/login" element={<Login />} /> 

          {/* Protected routes — wrapped in Navbar layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/compliance" element={<ComplianceList />} />
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/compliance" element={<ComplianceList />} />
            <Route path="/analytics"  element={<Analytics />} />
            <Route path="/tasks"  element={<TaskList />} />
            {/* More routes added as we build: */}
            {/* <Route path="/compliance/new"  element={<ComplianceForm />} /> */}
            {/* <Route path="/compliance/:id" element={<ComplianceDetail />} /> */}
            {/* <Route path="/compliance/:id/edit" element={<ComplianceForm />} /> */}
          </Route>

          {/* Catch-all — redirect unknown URLs */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}