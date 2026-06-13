import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Login from './pages/Login';
import Languages from './pages/Languages';
import Genres from './pages/Genres';
import Movies from './pages/Movies';
import AddMovie from './pages/AddMovie';
import ShortFilms from './pages/ShortFilms';
import AddShortFilm from './pages/AddShortFilm';
import EditShortFilm from './pages/EditShortFilm';
import NewRelease from './pages/NewRelease';
import AddNewRelease from './pages/AddNewRelease';
import EditNewRelease from './pages/EditNewRelease';
import AddEpisode from './pages/AddEpisode';
import EditEpisode from './pages/EditEpisode';
import Shows from './pages/Shows';
import AddShow from './pages/AddShow';
import EditShow from './pages/EditShow';
import ShortWebSeries from './pages/ShortWebSeries';
import AddShortWebSeries from './pages/AddShortWebSeries';
import EditShortWebSeries from './pages/EditShortWebSeries';
import { syncFavicon } from './utils/branding';
import { logoutUser } from './utils/logout';
import Seasons from './pages/Seasons';
import AddSeason from './pages/AddSeason';
import EditSeason from './pages/EditSeason';
import Episodes from './pages/Episodes';
import Profile from './pages/Profile';
import SportsCategory from './pages/SportsCategory';
import SportsVideos from './pages/SportsVideos';
import AddSportsVideo from './pages/AddSportsVideo';
import EditSportsVideo from './pages/EditSportsVideo';
import EditMovie from './pages/EditMovie';
import TVCategory from './pages/TVCategory';
import TVChannels from './pages/TVChannels';
import AddTVChannel from './pages/AddTVChannel';
import EditTVChannel from './pages/EditTVChannel';
import Slider from './pages/Slider';
import AddSlider from './pages/AddSlider';
import EditSlider from './pages/EditSlider';
import HomeSections from './pages/HomeSections';
import AddHomeSection from './pages/AddHomeSection';
import Actors from './pages/Actors';
import AddActor from './pages/AddActor';
import EditActor from './pages/EditActor';
import Directors from './pages/Directors';
import AddDirector from './pages/AddDirector';
import EditDirector from './pages/EditDirector';
import UsersList from './pages/UsersList';
import SubAdmin from './pages/SubAdmin';
import DeletedUsers from './pages/DeletedUsers';
import AddUser from './pages/AddUser';
import EditUser from './pages/EditUser';
import AddAdmin from './pages/AddAdmin';
import EditAdmin from './pages/EditAdmin';
import UserHistory from './pages/UserHistory';
import SubscriptionPlan from './pages/SubscriptionPlan';
import AddSubscriptionPlan from './pages/AddSubscriptionPlan';
import EditSubscriptionPlan from './pages/EditSubscriptionPlan';
import Coupons from './pages/Coupons';
import AddCoupon from './pages/AddCoupon';
import EditCoupon from './pages/EditCoupon';
import Transactions from './pages/Transactions';
import PaymentGateway from './pages/PaymentGateway';
import EditPaymentGateway from './pages/EditPaymentGateway';
import PagesList from './pages/PagesList';
import AddPage from './pages/AddPage';
import EditPage from './pages/EditPage';
import PlayerConfig from './pages/PlayerConfig';
import PlayerAds from './pages/PlayerAds';
import GeneralSettings from './pages/GeneralSettings';
import SMTPSettings from './pages/SMTPSettings';
import SocialLoginSettings from './pages/SocialLoginSettings';
import MenuSettings from './pages/MenuSettings';
import ReCaptchaSettings from './pages/ReCaptchaSettings';
import BannerAds from './pages/BannerAds';
import MaintenanceSettings from './pages/MaintenanceSettings';
import AndroidAppVerify from './pages/AndroidAppVerify';
import AndroidAppSettings from './pages/AndroidAppSettings';
import AndroidAdSettings from './pages/AndroidAdSettings';
import AndroidNotification from './pages/AndroidNotification';
import Experience from './pages/Experience';
import Images from './pages/Images';
import FrontendMovies from './pages/FrontendMovies';
import FrontendShows from './pages/FrontendShows';
import FrontendLiveTV from './pages/FrontendLiveTV';
import FrontendSports from './pages/FrontendSports';
import FrontendProfile from './pages/FrontendProfile';
import FrontendLogin from './pages/FrontendLogin';
import ResetPassword from './pages/ResetPassword';
import Watchlist from './pages/Watchlist';
import FrontendPage from './pages/FrontendPage';
import ScrollToTop from './components/ScrollToTop';
import FrontendSubscription from './pages/FrontendSubscription';
import FrontendCheckout from './pages/FrontendCheckout';
import FrontendDetails from './pages/FrontendDetails';
import FrontendViewAll from './pages/FrontendViewAll';
import FrontendShortFilms from './pages/FrontendShortFilms';
import FrontendWebSeries from './pages/FrontendWebSeries';
import FrontendSubmission from './pages/FrontendSubmission';
import AdminSubmissions from './pages/AdminSubmissions';



// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;
  
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      console.error("Error parsing user from localStorage");
    }
  }

  // Check if token exists and user is an admin or sub-admin
  if (!token || !user || (user.role !== 'admin' && user.role !== 'sub-admin')) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

// Helper component to check session validation on every route transition
const TokenValidator = () => {
  const location = useLocation();

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch('/api/auth/validate', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.status === 401) {
          // Session is invalid/terminated, trigger logout
          logoutUser();
        } else if (res.ok) {
          const data = await res.json();
          if (data && data.user) {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...currentUser, ...data.user, id: data.user.id }));
          }
        }
      } catch (err) {
        console.error('Session validation error:', err);
      }
    };

    validateSession();
  }, [location.pathname]);

  return null;
};

// Layout for Admin Panel
const AdminLayout = () => (
  <div className="dashboard-container">
    <Sidebar />
    <main className="main-content">
      <Header />
      <div className="content-body">
        <Outlet />
      </div>
      <Footer />
    </main>
  </div>
);

// Premium Countdown Timer for Maintenance Mode
const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = React.useState('');

  React.useEffect(() => {
    if (!targetDate) return;

    let timer;
    const calculateTimeLeft = () => {
      const diff = +new Date(targetDate) - +new Date();
      if (diff <= 0) {
        setTimeLeft('Maintenance is completing...');
        clearInterval(timer);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const parts = [];
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(`Estimated completion in: ${parts.join(' ')}`);
    };

    calculateTimeLeft();
    timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div style={{
      marginTop: '25px',
      padding: '12px 20px',
      backgroundColor: 'rgba(179, 211, 50, 0.1)',
      border: '1px solid rgba(179, 211, 50, 0.3)',
      borderRadius: '8px',
      color: '#b3d332',
      fontSize: '15px',
      fontWeight: '700',
      display: 'inline-block',
      letterSpacing: '0.5px'
    }}>
      ⏱️ {timeLeft}
    </div>
  );
};

// Maintenance Mode Handler Wrapper
const MaintenanceWrapper = ({ children }) => {
  const [maintenance, setMaintenance] = React.useState({ status: false, title: '', description: '', secret: '', endTime: '' });
  const [bypass, setBypass] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const location = useLocation();

  React.useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/api/maintenance-settings');
        const settings = await res.json();
        if (settings) {
          setMaintenance(settings);

          // Check if current path is the secret path
          const path = location.pathname.replace(/^\/|\/$/g, ''); // strip leading/trailing slashes
          if (settings.status && path && path.toLowerCase() === settings.secret.toLowerCase()) {
            localStorage.setItem('maintenance_bypass', settings.secret.toLowerCase());
            setBypass(true);
            // Redirect to home
            window.location.href = '/';
            return;
          }

          // Verify if stored bypass secret matches the current secret
          const storedBypass = localStorage.getItem('maintenance_bypass');
          if (storedBypass && storedBypass.toLowerCase() === settings.secret.toLowerCase()) {
            setBypass(true);
          } else {
            setBypass(false);
          }
        }
      } catch (err) {
        console.error('Maintenance discovery anomaly:', err);
      } finally {
        setLoading(false);
      }
    };
    checkMaintenance();
  }, [location.pathname]);

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#000000',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '4px solid rgba(179, 211, 50, 0.15)',
          borderTopColor: '#b3d332',
          borderRightColor: '#b3d332',
          animation: 'loader-spin 0.75s linear infinite',
          boxShadow: '0 0 18px rgba(179, 211, 50, 0.3)'
        }} />
        <style>{`
          @keyframes loader-spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const isAdminPath = location.pathname.startsWith('/admin');

  // Check if the currently logged-in user has an admin or sub-admin role
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let isAdminUser = false;
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      const roleLower = (user.role || '').toLowerCase();
      if (user && (roleLower === 'admin' || roleLower === 'sub-admin')) {
        isAdminUser = true;
      }
    } catch (e) {
      console.error("Error parsing user context in MaintenanceWrapper", e);
    }
  }

  if (maintenance.status && !bypass && !isAdminPath && !isAdminUser) {
    return (
      <div style={{
        backgroundColor: '#000000',
        color: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        textAlign: 'center',
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          backgroundColor: '#121212',
          border: '1px solid #1f1f1f',
          borderRadius: '16px',
          padding: '40px 30px',
          maxWidth: '600px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '20px'
          }}>🛠️</div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '800',
            marginBottom: '15px',
            color: '#ffffff',
            letterSpacing: '-0.5px'
          }}>
            {maintenance.title || 'Under Maintenance'}
          </h1>
          <div 
            style={{
              fontSize: '15px',
              color: '#8e8e93',
              lineHeight: '1.6',
              marginBottom: '20px'
            }}
            dangerouslySetInnerHTML={{ __html: maintenance.description || 'We are currently performing scheduled maintenance. Please check back soon.' }}
          />
          {maintenance.endTime && new Date(maintenance.endTime) > new Date() && (
            <CountdownTimer targetDate={maintenance.endTime} />
          )}
        </div>
      </div>
    );
  }

  return children;
};

function App() {
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetch('/api/general-settings');
        const settings = await res.json();
        if (settings) {
          // Sync Title Discovery
          document.title = settings.siteName || 'LEMO OTT';
          
          if (settings.siteFavicon) {
            syncFavicon(settings.siteFavicon);
          }
        }
      } catch (err) {
        console.error('Branding discovery anomaly:', err);
      }
    };
    fetchBranding();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <TokenValidator />
      <MaintenanceWrapper>
        <Routes>
        {/* Frontend Route */}
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<FrontendMovies />} />
        <Route path="/shows" element={<FrontendShows />} />
        <Route path="/live-tv" element={<FrontendLiveTV />} />
        <Route path="/sports" element={<FrontendSports />} />
        <Route path="/short-films" element={<FrontendShortFilms />} />
        <Route path="/web-series" element={<FrontendWebSeries />} />
        <Route path="/user/profile" element={<FrontendProfile />} />
        <Route path="/login" element={<FrontendLogin />} />
        <Route path="/register" element={<FrontendLogin type="register" />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/subscription" element={<FrontendSubscription />} />
        <Route path="/checkout" element={<FrontendCheckout />} />
        <Route path="/details/:type/:id" element={<FrontendDetails />} />
        <Route path="/view-all/:type/:title" element={<FrontendViewAll />} />
        <Route path="/submission" element={<FrontendSubmission />} />

        
        {/* Dynamic Static Pages */}
        <Route path="/about" element={<FrontendPage fixedSlug="about-us" />} />
        <Route path="/contact" element={<FrontendPage fixedSlug="contact-us" />} />
        <Route path="/privacy" element={<FrontendPage fixedSlug="privacy-policy" />} />
        <Route path="/terms" element={<FrontendPage fixedSlug="terms-of-service" />} />
        <Route path="/faq" element={<FrontendPage fixedSlug="faq" />} />
        <Route path="/help" element={<FrontendPage fixedSlug="help-center" />} />
        <Route path="/devices" element={<FrontendPage fixedSlug="supported-devices" />} />
        <Route path="/refund-policy" element={<FrontendPage fixedSlug="refund-policy" />} />
        <Route path="/:slug" element={<FrontendPage />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<Login />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="language" element={<Languages />} />
          <Route path="genres" element={<Genres />} />
          <Route path="movies" element={<Movies />} />
          <Route path="movies/add" element={<AddMovie />} />
          <Route path="movies/edit/:id" element={<EditMovie />} />
          <Route path="short-films" element={<ShortFilms />} />
          <Route path="short-films/add" element={<AddShortFilm />} />
          <Route path="short-films/edit/:id" element={<EditShortFilm />} />
          <Route path="short-web-series" element={<ShortWebSeries />} />
          <Route path="short-web-series/add" element={<AddShortWebSeries />} />
          <Route path="short-web-series/edit/:id" element={<EditShortWebSeries />} />
          <Route path="short-web-series/seasons" element={<Seasons />} />
          <Route path="short-web-series/seasons/add" element={<AddSeason />} />
          <Route path="short-web-series/seasons/edit/:id" element={<EditSeason />} />
          <Route path="short-web-series/episodes" element={<Episodes />} />
          <Route path="short-web-series/episodes/add" element={<AddEpisode />} />
          <Route path="short-web-series/episodes/edit/:id" element={<EditEpisode />} />
          <Route path="new-release" element={<NewRelease />} />
          <Route path="new-release/add" element={<AddNewRelease />} />
          <Route path="new-release/edit/:id" element={<EditNewRelease />} />
          <Route path="tv-shows/shows" element={<Shows />} />
          <Route path="tv-shows/shows/add" element={<AddShow />} />
          <Route path="tv-shows/shows/edit/:id" element={<EditShow />} />
          <Route path="tv-shows/seasons" element={<Seasons />} />
          <Route path="tv-shows/seasons/add" element={<AddSeason />} />
          <Route path="tv-shows/seasons/edit/:id" element={<EditSeason />} />
          <Route path="tv-shows/episodes" element={<Episodes />} />
          <Route path="tv-shows/episodes/add" element={<AddEpisode />} />
          <Route path="tv-shows/episodes/edit/:id" element={<EditEpisode />} />
          <Route path="sports/category" element={<SportsCategory />} />
          <Route path="sports/video" element={<SportsVideos />} />
          <Route path="sports/add-video" element={<AddSportsVideo />} />
          <Route path="sports/edit-video/:id" element={<EditSportsVideo />} />
          <Route path="live-tv/category" element={<TVCategory />} />
          <Route path="live-tv/channel" element={<TVChannels />} />
          <Route path="live-tv/channel/add" element={<AddTVChannel />} />
          <Route path="live-tv/channel/edit/:id" element={<EditTVChannel />} />
          <Route path="home/slider" element={<Slider />} />
          <Route path="home/slider/add" element={<AddSlider />} />
          <Route path="home/slider/edit/:id" element={<EditSlider />} />
          <Route path="home/experience" element={<Experience />} />
          <Route path="home/images" element={<Images />} />
          <Route path="home/sections" element={<HomeSections />} />
          <Route path="home/sections/add" element={<AddHomeSection />} />
          <Route path="cast-crew/actors" element={<Actors />} />
          <Route path="cast-crew/actors/add" element={<AddActor />} />
          <Route path="cast-crew/actors/edit/:id" element={<EditActor />} />
          <Route path="cast-crew/directors" element={<Directors />} />
          <Route path="cast-crew/directors/add" element={<AddDirector />} />
          <Route path="cast-crew/directors/edit/:id" element={<EditDirector />} />
          <Route path="users/list" element={<UsersList />} />
          <Route path="users/list/add" element={<AddUser />} />
          <Route path="users/list/edit/:id" element={<EditUser />} />
          <Route path="users/history/:id" element={<UserHistory />} />
          <Route path="users/sub-admin" element={<SubAdmin />} />
          <Route path="users/sub-admin/add" element={<AddAdmin />} />
          <Route path="users/sub-admin/edit/:id" element={<EditAdmin />} />
          <Route path="users/deleted" element={<DeletedUsers />} />
          <Route path="subscription-plan" element={<SubscriptionPlan />} />
          <Route path="subscription-plan/add" element={<AddSubscriptionPlan />} />
          <Route path="subscription-plan/edit/:id" element={<EditSubscriptionPlan />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="coupons/add" element={<AddCoupon />} />
          <Route path="coupons/edit/:id" element={<EditCoupon />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="submissions" element={<AdminSubmissions />} />
          <Route path="payment-gateway" element={<PaymentGateway />} />
          <Route path="payment-gateway/edit/:id" element={<EditPaymentGateway />} />
          <Route path="pages/list" element={<PagesList />} />
          <Route path="pages/add" element={<AddPage />} />
          <Route path="pages/edit/:id" element={<EditPage />} />
          <Route path="player-settings/config" element={<PlayerConfig />} />
          <Route path="player-settings/ads" element={<PlayerAds />} />
          <Route path="settings/general" element={<GeneralSettings />} />
          <Route path="settings/smtp" element={<SMTPSettings />} />
          <Route path="settings/social-login" element={<SocialLoginSettings />} />
          <Route path="settings/menu" element={<MenuSettings />} />
          <Route path="settings/recaptcha" element={<ReCaptchaSettings />} />
          <Route path="settings/banner-ads" element={<BannerAds />} />
          <Route path="settings/maintenance" element={<MaintenanceSettings />} />
          <Route path="android-app/verify" element={<AndroidAppVerify />} />
          <Route path="android-app/settings" element={<AndroidAppSettings />} />
          <Route path="android-app/ads" element={<AndroidAdSettings />} />
          <Route path="android-app/notification" element={<AndroidNotification />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
      </MaintenanceWrapper>
    </Router>
  );
}

export default App;
