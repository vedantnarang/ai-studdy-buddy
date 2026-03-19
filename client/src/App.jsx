import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import SubjectsList from './pages/SubjectsList';
import SubjectDetail from './pages/SubjectDetail';
import TopicDetail from './pages/TopicDetail';
import FlashcardStudy from './pages/FlashcardStudy';
import QuizStudy from './pages/QuizStudy';
import './App.css';

function App() {
  return (
    <Router>
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
                 <Route path="/topic/:id" element={<TopicDetail />} />
                 <Route path="/topic/:id/flashcards" element={<FlashcardStudy />} />
                 <Route path="/topic/:id/quiz" element={<QuizStudy />} />
             </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
