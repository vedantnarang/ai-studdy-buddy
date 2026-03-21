import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import SubjectsList from './pages/SubjectsList';
import SubjectDetail from './pages/SubjectDetail';
import TopicDetail from './pages/TopicDetail';
import TopicSummary from './pages/TopicSummary';
import FlashcardStudy from './pages/FlashcardStudy';
import SubjectFlashcardReview from './pages/SubjectFlashcardReview';
import QuizStudy from './pages/QuizStudy';
import QuizHistory from './pages/QuizHistory';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <Router>
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: 'green',
              secondary: 'black',
            },
          },
        }}
      />
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Public Routes (Guests only) */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Routes (Authenticated only wrapped in AppLayout) */}
          <Route element={<ProtectedRoute />}>
             <Route element={<AppLayout />}>
                 {/* Main App Screens */}
                 <Route path="/dashboard" element={<SubjectsList />} />
                 <Route path="/subject/:id" element={<SubjectDetail />} />
                 <Route path="/subject/:id/flashcards" element={<SubjectFlashcardReview />} />
                 <Route path="/topic/:id" element={<TopicDetail />} />
                 <Route path="/topic/:id/summary" element={<TopicSummary />} />
                 <Route path="/topic/:id/flashcards" element={<FlashcardStudy />} />
                 <Route path="/topic/:id/quiz" element={<QuizStudy />} />
                 <Route path="/topic/:id/quiz-history" element={<QuizHistory />} />
                 
                 {/* Fallback 404 Route */}
                 <Route path="*" element={<NotFound />} />
             </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
