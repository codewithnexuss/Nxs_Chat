import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SignIn, SignUp, UsernameSelect } from './pages/auth';
import {
  Home, ChatWindow, Search, Status, Settings,
  RandomChat, StatusViewer, CreateStatus
} from './pages';
import {
  AdminLogin, AdminLayout, AdminDashboard, UserManagement
} from './pages/admin';
import { AppLayout } from './components/layout';
import { LoadingScreen } from './components/common';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { supabase } from './lib/supabase';
import './index.css';

const PublicRoute = () => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  // If authenticated AND has a profile, go to home
  if (isAuthenticated && user) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};

const ProtectedRoute = () => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If authenticated but no profile, send to username selection
  // UNLESS already on the username select page (which is Public)
  if (!user && window.location.pathname !== '/signup/username') {
    return <Navigate to="/signup/username" replace />;
  }

  return <Outlet />;
};

function App() {
  const { setSession, setUser, fetchUser, setLoading } = useAuthStore();
  const { applyTheme } = useThemeStore();

  useEffect(() => {
    // Apply theme on mount
    applyTheme();

    const initAuth = async () => {
      console.log('App: initAuth manual check started');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          console.log('App: Session found on mount, fetching profile');
          setSession({
            access_token: session.access_token,
            user: { id: session.user.id, email: session.user.email! }
          });
          await fetchUser(session.user.id);
        } else {
          console.log('App: No session found on mount');
          setSession(null);
          setUser(null);
        }
      } catch (err) {
        console.error('App: initAuth error:', err);
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
        console.log('App: initAuth finished, setLoading(false)');
      }
    };

    // Run initial check
    initAuth();

    // Listen for subsequent auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`App: auth event: ${event}`, session ? 'session found' : 'no session');

        // We only handle events that would change the state after initial load
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            setSession({
              access_token: session.access_token,
              user: { id: session.user.id, email: session.user.email! }
            });
            await fetchUser(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        }
      }
    );

    // Safety timeout: guaranteed to stop loading after 8 seconds if things hang
    const safetyTimer = setTimeout(() => {
      const state = useAuthStore.getState();
      if (state.isLoading) {
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
        <Route element={<PublicRoute />}>
          <Route path="/" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signup/username" element={<UsernameSelect />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/status" element={<Status />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="/chat/:chatId" element={<ChatWindow />} />
          <Route path="/random-chat" element={<RandomChat />} />
          <Route path="/status/view/:id" element={<StatusViewer />} />
          <Route path="/status/view" element={<StatusViewer />} />
          <Route path="/status/create" element={<CreateStatus />} />
        </Route>

        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
