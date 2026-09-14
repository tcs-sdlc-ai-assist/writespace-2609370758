import PropTypes from 'prop-types';
import { Route, Routes } from 'react-router-dom';
import { getPosts } from './utils/storage';
import { getSession } from './utils/auth';
import Navbar from './components/Navbar';
import PublicNavbar from './components/PublicNavbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import ReadBlog from './pages/ReadBlog';

/** Render a compact temporary surface for routes implemented in subsequent slices. */
function Placeholder({ title }) {
  return <main className="mx-auto max-w-3xl px-5 py-16"><p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-clay">WriteSpace</p><h1 className="mt-3 font-display text-5xl font-bold">{title}</h1><p className="mt-4 max-w-xl text-stone-600">This part of the local writing room is being prepared.</p></main>;
}

Placeholder.propTypes = {
  title: PropTypes.string.isRequired,
};

/** Compose all application routes and the session-aware navigation shell. */
export default function App() {
  const session = getSession();
  const postForEdit = getPosts().find((post) => post.id === window.location.pathname.split('/').pop());

  return (
    <div className="min-h-screen">
      {session ? <Navbar session={session} /> : <PublicNavbar session={session} />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/blogs" element={<ProtectedRoute mode="auth"><Home /></ProtectedRoute>} />
        <Route path="/blog/:id" element={<ProtectedRoute mode="auth"><ReadBlog /></ProtectedRoute>} />
        <Route path="/write" element={<ProtectedRoute mode="auth"><Placeholder title="Write" /></ProtectedRoute>} />
        <Route path="/edit/:id" element={<ProtectedRoute mode="edit" post={postForEdit}><Placeholder title="Edit" /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute mode="admin"><Placeholder title="Admin" /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute mode="admin"><Placeholder title="Users" /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}
