import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Explore from './pages/ExplorePage';
import Profile from './pages/Profile';
import MapSearch from './pages/MapSearch';
import Chat from './pages/Chat';
import Wallet from './pages/Wallet';
import Admin from './pages/Admin';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { userInfo } = useSelector((state) => state.auth);

  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans text-slate-100 dark:text-slate-100 selection:bg-primary/30">
          <Toaster position="top-right" toastOptions={{
            style: {
              background: '#291c14',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
            }
          }} />
          <Navbar />
          <main className="min-h-[80vh] container mx-auto px-4 py-8 max-w-7xl pt-24">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              {userInfo && (
                <>
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/dashboard" element={<Navigate to="/explore" replace />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/map" element={<MapSearch />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/wallet" element={<Wallet />} />
                  {userInfo.role === 'admin' && <Route path="/admin" element={<Admin />} />}
                </>
              )}
              {/* Fallback route to prevent completely blank pages */}
              <Route path="*" element={<Navigate to={userInfo ? "/explore" : "/login"} replace />} />
            </Routes>
          </main>
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
