import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActaConfig, testNet } from '@acta-team/acta-sdk';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Lesson } from './pages/Lesson';
import { Quiz } from './pages/Quiz';
import { Profile } from './pages/Profile';
import { Leaderboard } from './pages/Leaderboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ChaptersPage } from './pages/ChaptersPage';
import { ChapterFlow } from './pages/ChapterFlow';
import { CertificatesPage } from './pages/CertificatesPage';
import { useAuthStore } from './stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5 * 60 * 1000 } },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated) return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  return <>{children}</>;
}

function AppLayout({ children, showNavbar = true }: { children: React.ReactNode; showNavbar?: boolean }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {showNavbar && <Navbar />}
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}

const ACTA_API_KEY = import.meta.env.VITE_ACTA_API_KEY || '';

export default function App() {
  return (
    <ActaConfig baseURL={testNet} apiKey={ACTA_API_KEY}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<AppLayout><Landing /></AppLayout>} />

          <Route path="/login" element={
            <PublicRoute><AppLayout><Login /></AppLayout></PublicRoute>
          } />

          <Route path="/register" element={
            <PublicRoute><AppLayout><Register /></AppLayout></PublicRoute>
          } />

          {/* User routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
          } />

          <Route path="/chapters" element={
            <ProtectedRoute><AppLayout><ChaptersPage /></AppLayout></ProtectedRoute>
          } />

          <Route path="/chapters/:chapterId" element={
            <ProtectedRoute><AppLayout showNavbar={false}><ChapterFlow /></AppLayout></ProtectedRoute>
          } />

          <Route path="/certificates" element={
            <ProtectedRoute><AppLayout><CertificatesPage /></AppLayout></ProtectedRoute>
          } />

          <Route path="/learn/:lessonId" element={
            <ProtectedRoute><AppLayout showNavbar={false}><Lesson /></AppLayout></ProtectedRoute>
          } />

          <Route path="/quiz/:lessonId" element={
            <ProtectedRoute><AppLayout showNavbar={false}><Quiz /></AppLayout></ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>
          } />

          <Route path="/leaderboard" element={
            <ProtectedRoute><AppLayout><Leaderboard /></AppLayout></ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <AdminRoute><AppLayout><AdminDashboard /></AppLayout></AdminRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
    </ActaConfig>
  );
}
