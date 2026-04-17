import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';

const DashboardPage   = lazy(() => import('./pages/DashboardPage').then(m   => ({ default: m.DashboardPage })));
const PracticeModePage = lazy(() => import('./pages/PracticeModePage').then(m => ({ default: m.PracticeModePage })));
const TestExamPage    = lazy(() => import('./pages/TestExamPage').then(m    => ({ default: m.TestExamPage })));

const LoadingScreen = () => (
  <div
    style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F5F7FA',
      gap: 16,
    }}
  >
    <Loader2
      style={{ width: 36, height: 36, color: '#4361EE', animation: 'spin 0.9s linear infinite' }}
    />
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: '#9CA3AF', textTransform: 'uppercase' }}>
      LexiLearn đang tải...
    </p>
  </div>
);

export function App() {
  return (
    <>
      <Toaster position="top-right" theme="light" richColors expand={true} />
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/"                     element={<DashboardPage />} />
                <Route path="/practice"             element={<PracticeModePage />} />
                <Route path="/practice/:partId"     element={<PracticeModePage />} />
                <Route path="/test"                 element={<TestExamPage />} />
                <Route path="/test/:sessionId"      element={<TestExamPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </>
  );
}

export default App;
