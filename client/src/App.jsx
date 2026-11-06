import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ScrollToTop from './components/common/ScrollToTop';
import { pageTransition } from './animations';

import Home from './pages/public/Home';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import Jobs from './pages/public/Jobs';
import JobDetails from './pages/public/JobDetails';
import ForgotPassword from './pages/public/ForgotPassword';
import ResetPassword from './pages/public/ResetPassword';
import About from './pages/public/About';

import SeekerDashboard from './pages/seeker/Dashboard';
import SeekerProfile from './pages/seeker/Profile';
import Recommended from './pages/seeker/Recommended';
import Applications from './pages/seeker/Applications';
import SavedJobs from './pages/seeker/SavedJobs';
import Notifications from './pages/seeker/Notifications';
import Settings from './pages/seeker/Settings';

import BusinessDashboard from './pages/business/Dashboard';
import BusinessProfile from './pages/business/Profile';
import PostJob from './pages/business/PostJob';
import EditJob from './pages/business/EditJob';
import Applicants from './pages/business/Applicants';


import AdminDashboard from './pages/admin/Dashboard';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-circular-progressbar/dist/styles.css';
import './index.css';
import './App.css';
import './animations.css';

/** Wraps a page element with the shared fade+slide page transition. */
const P = (el) => (
  <motion.div initial="initial" animate="animate" exit="exit" variants={pageTransition}>
    {el}
  </motion.div>
);

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={P(<Home />)} />
        <Route path="/login" element={P(<Login />)} />
        <Route path="/register" element={P(<Register />)} />
        <Route path="/jobs" element={P(<Jobs />)} />
        <Route path="/jobs/:id" element={P(<JobDetails />)} />
        <Route path="/about" element={P(<About />)} />
        <Route path="/forgot-password" element={P(<ForgotPassword />)} />
        <Route path="/reset-password/:token" element={P(<ResetPassword />)} />

        <Route path="/seeker/dashboard" element={<ProtectedRoute roles={['JOB_SEEKER']}>{P(<SeekerDashboard />)}</ProtectedRoute>} />
        <Route path="/seeker/profile" element={<ProtectedRoute roles={['JOB_SEEKER']}>{P(<SeekerProfile />)}</ProtectedRoute>} />
        <Route path="/seeker/recommended" element={<ProtectedRoute roles={['JOB_SEEKER']}>{P(<Recommended />)}</ProtectedRoute>} />
        <Route path="/seeker/applications" element={<ProtectedRoute roles={['JOB_SEEKER']}>{P(<Applications />)}</ProtectedRoute>} />
        <Route path="/seeker/saved" element={<ProtectedRoute roles={['JOB_SEEKER']}>{P(<SavedJobs />)}</ProtectedRoute>} />
        <Route path="/seeker/notifications" element={<ProtectedRoute roles={['JOB_SEEKER']}>{P(<Notifications />)}</ProtectedRoute>} />
        <Route path="/seeker/settings" element={<ProtectedRoute roles={['JOB_SEEKER']}>{P(<Settings />)}</ProtectedRoute>} />

        <Route path="/business/dashboard" element={<ProtectedRoute roles={['BUSINESS']}>{P(<BusinessDashboard />)}</ProtectedRoute>} />
        <Route path="/business/profile" element={<ProtectedRoute roles={['BUSINESS']}>{P(<BusinessProfile />)}</ProtectedRoute>} />
        <Route path="/business/post-job" element={<ProtectedRoute roles={['BUSINESS']}>{P(<PostJob />)}</ProtectedRoute>} />
        <Route path="/business/jobs/:jobId/edit" element={<ProtectedRoute roles={['BUSINESS']}>{P(<EditJob />)}</ProtectedRoute>} />
        <Route path="/business/jobs" element={<ProtectedRoute roles={['BUSINESS']}>{P(<BusinessDashboard />)}</ProtectedRoute>} />
        <Route path="/business/jobs/:jobId/applicants" element={<ProtectedRoute roles={['BUSINESS']}>{P(<Applicants />)}</ProtectedRoute>} />
        <Route path="/business/notifications" element={<ProtectedRoute roles={['BUSINESS']}>{P(<Notifications />)}</ProtectedRoute>} />
        <Route path="/business/settings" element={<ProtectedRoute roles={['BUSINESS']}>{P(<Settings />)}</ProtectedRoute>} />


        <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}>{P(<AdminDashboard />)}</ProtectedRoute>} />

        <Route path="*" element={P(<div className="container py-5 text-center"><h3>Page not found</h3></div>)} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <div className="d-flex flex-column min-vh-100">
          <Navbar />
          <main className="flex-grow-1">
            <AnimatedRoutes />
          </main>
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                background: '#0f172a',
                color: '#fff',
                fontSize: '0.9rem',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
