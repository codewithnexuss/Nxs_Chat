import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SignIn, SignUp, UsernameSelect } from './pages/auth';
import {
  Home, ChatWindow, Search, Status, Settings,
  RandomChat, StatusViewer, CreateStatus
} from './pages';
import {
  AdminLogin, AdminLayout, AdminDashboard, UserManagement,
  UserDetails, ContentModeration, AdminAnalytics, SystemSettings
} from './pages/admin';
import { AppLayout } from './components/layout';
import { LoadingScreen } from './components/common';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { supabase } from './lib/supabase';
import './index.css';

// Protected Route wrapper
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

// Public Route wrapper (redirects to home if authenticated)
const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};

function App() {
  const { setSession, setUser, fetchUser, setLoading } = useAuthStore();
  const { applyTheme } = useThemeStore();

  useEffect(() => {
    // Apply theme on mount
    applyTheme();

    console.log('App: Setting up auth listener');

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`App: auth event: ${event}`, session ? 'session found' : 'no session');

        try {
          if (session?.user) {
            console.log('App: Session identified, fetching user profile');
            // Store session first (but it won't set isAuthenticated yet due to our authStore change)
            setSession({
              access_token: session.access_token,
              user: { id: session.user.id, email: session.user.email! }
            });

            // Now fetch the full profile
            await fetchUser(session.user.id);
            console.log('App: Auth cycle complete');
          } else {
            console.log('App: No session found, clearing auth state');
            setSession(null);
            setUser(null);
          }
        } catch (err) {
          console.error('App: Auth update error:', err);
        } finally {
          // Always clear loading after we've tried to handle the current session state
          setLoading(false);
          console.log('App: setLoading(false) called');
        }
      }
    );

    // Safety timeout: guaranteed to stop loading after 8 seconds if things hang
    const safetyTimer = setTimeout(() => {
      const { isLoading } = useAuthStore.getState();
      if (isLoading) {
        console.warn('App: Safety timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 8000);

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signup/username" element={<UsernameSelect />} />
        </Route>

        {/* Protected Routes with Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/status" element={<Status />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          {/* Full screen routes (outside layout) */}
          <Route path="/chat/:id" element={<ChatWindow />} />
          <Route path="/random-chat" element={<RandomChat />} />
          <Route path="/status/view/:id" element={<StatusViewer />} />
          <Route path="/status/view" element={<StatusViewer />} />
          <Route path="/status/create" element={<CreateStatus />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="users/:id" element={<UserDetails />} />
          <Route path="moderation" element={<ContentModeration />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<SystemSettings />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
