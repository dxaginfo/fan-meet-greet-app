import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Provider } from 'react-redux';
import store from './store';

// Layout Components
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Authentication Components
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import EventList from './pages/events/EventList';
import EventDetails from './pages/events/EventDetails';
import ArtistProfile from './pages/artists/ArtistProfile';

// Artist Dashboard Pages
import ArtistDashboard from './pages/dashboard/artist/Dashboard';
import ArtistEvents from './pages/dashboard/artist/Events';
import ArtistSessions from './pages/dashboard/artist/Sessions';
import ArtistMerchandise from './pages/dashboard/artist/Merchandise';
import ArtistAnalytics from './pages/dashboard/artist/Analytics';

// Fan Dashboard Pages
import FanDashboard from './pages/dashboard/fan/Dashboard';
import FanBookings from './pages/dashboard/fan/Bookings';
import FanMedia from './pages/dashboard/fan/Media';
import FanMerchandise from './pages/dashboard/fan/Merchandise';

// Virtual Meet & Greet Pages
import VirtualWaitingRoom from './pages/virtual/WaitingRoom';
import VirtualMeetingRoom from './pages/virtual/MeetingRoom';

// Utils
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { ROLES } from './utils/constants';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="events" element={<EventList />} />
              <Route path="events/:eventId" element={<EventDetails />} />
              <Route path="artists/:artistId" element={<ArtistProfile />} />
            </Route>

            {/* Authentication Routes */}
            <Route path="/auth" element={<AuthLayout />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Artist Dashboard Routes */}
            <Route
              path="/dashboard/artist"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ARTIST, ROLES.MANAGER]}>
                  <DashboardLayout userType="artist" />
                </ProtectedRoute>
              }
            >
              <Route index element={<ArtistDashboard />} />
              <Route path="events" element={<ArtistEvents />} />
              <Route path="sessions" element={<ArtistSessions />} />
              <Route path="merchandise" element={<ArtistMerchandise />} />
              <Route path="analytics" element={<ArtistAnalytics />} />
            </Route>

            {/* Fan Dashboard Routes */}
            <Route
              path="/dashboard/fan"
              element={
                <ProtectedRoute allowedRoles={[ROLES.FAN]}>
                  <DashboardLayout userType="fan" />
                </ProtectedRoute>
              }
            >
              <Route index element={<FanDashboard />} />
              <Route path="bookings" element={<FanBookings />} />
              <Route path="media" element={<FanMedia />} />
              <Route path="merchandise" element={<FanMerchandise />} />
            </Route>

            {/* Virtual Meeting Routes */}
            <Route
              path="/virtual"
              element={
                <ProtectedRoute allowedRoles={[ROLES.ARTIST, ROLES.FAN, ROLES.MANAGER]}>
                  <MainLayout noFooter />
                </ProtectedRoute>
              }
            >
              <Route path="waiting-room/:sessionId" element={<VirtualWaitingRoom />} />
              <Route path="meeting/:sessionId" element={<VirtualMeetingRoom />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;