import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Toaster } from 'sonner';
import { Loader2 } from 'lucide-react';

// Lazy loaded pages
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const PracticeModePage = lazy(() => import('./pages/PracticeModePage').then(m => ({ default: m.PracticeModePage })));
const TestExamPage = lazy(() => import('./pages/TestExamPage').then(m => ({ default: m.TestExamPage })));

const LoadingScreen = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-background-primary gap-6">
    <div className="relative">
      <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
      <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
    </div>
    <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">LexiLearn Loading</p>
  </div>
);

export function App() {
  return (
    <>
      <Toaster position="top-right" theme="dark" richColors expand={true} />
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/practice" element={<PracticeModePage />} />
                <Route path="/practice/:partId" element={<PracticeModePage />} />
                <Route path="/test" element={<TestExamPage />} />
                <Route path="/test/:sessionId" element={<TestExamPage />} />
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
