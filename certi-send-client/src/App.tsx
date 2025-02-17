import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/auth';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout/index';
import { Home } from './pages/home';
import { Dashboard } from './pages/dashboard';
import { CreateEvent } from './pages/events/create';
import { EventDetails } from './pages/events/[id]';
import { EventRegistration } from './pages/events/[id]/register';
import { EventCheckIn } from './pages/events/[id]/check-in';
import { ParticipantsList } from './pages/events/[id]/participants';
import { ExploreEvents } from './pages/events';
import { Login } from './pages/auth/login';
import { Signup } from './pages/auth/signup';
import { ProtectedRoute } from './components/auth/protected-route';
import { VerifyCertificate } from './pages/verify-certificate';
import { ClaimCertificate } from './pages/claim-certificate';
import { QrAttendance } from './pages/events/[id]/qr-attendance';
import { CertificateManagement } from './pages/events/[id]/certificates';
import { CertificateConfirmation } from './pages/claim-certificate/confirmation';
import { EventUpdatesPage } from './pages/events/[id]/event-updates';
import { WinnersPage } from './pages/events/[id]/winners';
import { CreateEventContainer } from './components/events/create-event/CreateEventContainer';
import { EventCreationProvider } from '@/contexts/EventCreationContext';

function App() {
  return (
    <EventCreationProvider>
      <Router>
        <AuthProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: '#333',
                color: '#fff',
              },
            }} 
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            <Route path="/verify" element={<VerifyCertificate />} />
            <Route path="/claim" element={<ClaimCertificate />} />
            <Route path="/events/:eventId/claim" element={<ClaimCertificate />} />
            
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/events" element={<ExploreEvents />} />
              <Route path="/events/:id/winners" element={<WinnersPage />} />
              
              {/* Protected Routes */}
              <Route element={
                <ProtectedRoute>
                  <Outlet />
                </ProtectedRoute>
              }>
                <Route path="/events/:id/updates" element={<EventUpdatesPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/events/create" element={<CreateEventContainer />} />
                <Route path="/events/:id" element={<EventDetails />} />
                <Route path="/events/:id/check-in" element={<EventCheckIn />} />
                <Route path="/events/:id/register" element={<EventRegistration />} />
                <Route path="/events/:id/details" element={<EventDetails />} />
                <Route path="/events/:id/participants" element={<ParticipantsList />} />
                <Route path="/events/:id/qr-attendance" element={<QrAttendance />} />
                <Route path="/events/:id/certificates" element={<CertificateManagement />} />
              </Route>

              {/* Public Event Routes */}
              <Route path="/events/:id" element={<EventDetails />} />
              <Route path="/events/:id/register" element={<EventRegistration />} />
            </Route>

            <Route path="/claim-certificate/confirmation" element={<CertificateConfirmation />} />
          </Routes>
        </AuthProvider>
      </Router>
    </EventCreationProvider>
  );
}

export default App;