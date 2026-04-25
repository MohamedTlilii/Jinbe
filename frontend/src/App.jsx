// App.jsx — Router principal
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Dashboard     from './pages/Dashboard'
import Leads         from './pages/Leads'
import Engine        from './pages/Engine'
import Database      from './pages/Database'
import Nouveautes    from './pages/Nouveautes'
import Nouvelles     from './pages/Nouvelles'
import Demenagements from './pages/Demenagements'
import Fermetures    from './pages/Fermetures'
import Reouvertures  from './pages/Reouvertures'
import MapPage       from './pages/MapPage'
import Tests         from './pages/Tests'
import SignalAlerts  from './components/ui/SignalAlerts'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, marginLeft: 'var(--sidebar)', padding: '2rem', maxWidth: 'calc(100vw - var(--sidebar))' }}>
          <Routes>
            <Route path="/"               element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"      element={<Dashboard />} />
            <Route path="/leads"          element={<Leads />} />
            <Route path="/nouveautes"     element={<Nouveautes />} />
            <Route path="/nouvelles"      element={<Nouvelles />} />
            <Route path="/demenagements"  element={<Demenagements />} />
            <Route path="/fermetures"     element={<Fermetures />} />
            <Route path="/reouvertures"   element={<Reouvertures />} />
            <Route path="/engine"         element={<Engine />} />
            <Route path="/database"       element={<Database />} />
            <Route path="/carte"          element={<MapPage />} />
            <Route path="/tests"          element={<Tests />} />
          </Routes>
        </main>
      </div>
      <SignalAlerts />
    </BrowserRouter>
  )
}
