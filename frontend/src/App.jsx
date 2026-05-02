import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ComplianceList from './pages/ComplianceList'
import ComplianceForm from './pages/ComplianceForm'
import ComplianceDetail from './pages/ComplianceDetail'
import Analytics from './pages/Analytics'
import TaskList from './pages/TaskList'

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 py-6">
          <div className="page-shell">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index                        element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"            element={<Dashboard />} />
            <Route path="/compliance"           element={<ComplianceList />} />
            <Route path="/compliance/new"       element={<ComplianceForm />} />
            <Route path="/compliance/:id"       element={<ComplianceDetail />} />
            <Route path="/compliance/:id/edit"  element={<ComplianceForm />} />
            <Route path="/analytics"            element={<Analytics />} />
            <Route path="/tasks"                element={<TaskList />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
