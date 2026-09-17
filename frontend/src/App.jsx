import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

const LandingPage = lazy(() => import('./pages/home/LandingPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ChangePasswordPage = lazy(() => import('./pages/auth/ChangePasswordPage'));

const StudentDashboard = lazy(() => import('./pages/dashboard/StudentDashboard'));
const ParentDashboard = lazy(() => import('./pages/dashboard/ParentDashboard'));
const MentorDashboard = lazy(() => import('./pages/dashboard/MentorDashboard'));

const ProfilePage = lazy(() => import('./pages/dashboard/ProfilePage'));
const OnboardingPage = lazy(() => import('./pages/dashboard/OnboardingPage'));
const CareerListPage = lazy(() => import('./pages/dashboard/CareerListPage'));
const CareerDetailPage = lazy(() => import('./pages/dashboard/CareerDetailPage'));
const CareerComparePage = lazy(() => import('./pages/dashboard/CareerComparePage'));
const RecommendationsPage = lazy(() => import('./pages/dashboard/RecommendationsPage'));
const EducationPage = lazy(() => import('./pages/dashboard/EducationPage'));
const EducationDetailPage = lazy(() => import('./pages/dashboard/EducationDetailPage'));
const RoadmapPage = lazy(() => import('./pages/dashboard/RoadmapPage'));
const CareerReadinessPage = lazy(() => import('./pages/dashboard/CareerReadinessPage'));
const ResumeInterviewPage = lazy(() => import('./pages/dashboard/ResumeInterviewPage'));
const AICommunityPage = lazy(() => import('./pages/dashboard/AICommunityPage'));
const ChildrenPage = lazy(() => import('./pages/dashboard/ChildrenPage'));
const ChildDetailPage = lazy(() => import('./pages/dashboard/ChildDetailPage'));
const ChildrenProgressPage = lazy(() => import('./pages/dashboard/ChildrenProgressPage'));
const MentorStudentsPage = lazy(() => import('./pages/dashboard/MentorStudentsPage'));
const MentorStudentDetailPage = lazy(() => import('./pages/dashboard/MentorStudentDetailPage'));
const MentorReviewsPage = lazy(() => import('./pages/dashboard/MentorReviewsPage'));
const NearbyCollegesPage = lazy(() => import('./pages/dashboard/NearbyCollegesPage'));
const PlaceholderPage = lazy(() => import('./pages/dashboard/PlaceholderPage'));

const ProtectedRoute = ({ children }) => { const { user, loading } = useAuth(); if (loading) return <LoadingSpinner fullScreen />; return user ? children : <Navigate to="/login" replace />; };
const PublicRoute = ({ children }) => { const { user, loading } = useAuth(); if (loading) return <LoadingSpinner fullScreen />; return user ? <Navigate to="/dashboard" replace /> : children; };

function RoleDashboard() {
  const { user } = useAuth();
  if (user?.role === 'parent') return <ParentDashboard />;
  if (user?.role === 'mentor') return <MentorDashboard />;
  return <StudentDashboard />;
}

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
        </Route>
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<RoleDashboard />} />
          <Route path="/dashboard/profile" element={<ProfilePage />} />
          <Route path="/dashboard/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard/education" element={<EducationPage />} />
          <Route path="/dashboard/education/:type/:slug" element={<EducationDetailPage />} />
          <Route path="/dashboard/ai-community" element={<AICommunityPage />} />
          <Route path="/dashboard/careers" element={<CareerListPage />} />
          <Route path="/dashboard/careers/compare" element={<CareerComparePage />} />
          <Route path="/dashboard/careers/recommendations" element={<RecommendationsPage />} />
          <Route path="/dashboard/careers/:slug" element={<CareerDetailPage />} />
          <Route path="/dashboard/roadmap" element={<RoadmapPage />} />
          <Route path="/dashboard/nearby-colleges" element={<NearbyCollegesPage />} />
          <Route path="/dashboard/career-readiness" element={<CareerReadinessPage />} />
          <Route path="/dashboard/resume-interview" element={<ResumeInterviewPage />} />
          <Route path="/dashboard/children" element={<ChildrenPage />} />
          <Route path="/dashboard/children/progress" element={<ChildrenProgressPage />} />
          <Route path="/dashboard/children/:childId" element={<ChildDetailPage />} />
          <Route path="/dashboard/students" element={<MentorStudentsPage />} />
          <Route path="/dashboard/students/:studentId" element={<MentorStudentDetailPage />} />
          <Route path="/dashboard/reviews" element={<MentorReviewsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
