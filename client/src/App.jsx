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
import FrontendSubscription from './pages/FrontendSubscription';
import FrontendCheckout from './pages/FrontendCheckout';
import FrontendDetails from './pages/FrontendDetails';
import FrontendViewAll from './pages/FrontendViewAll';
import FrontendShortFilms from './pages/FrontendShortFilms';
import FrontendWebSeries from './pages/FrontendWebSeries';



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
        const res = await fetch('http://localhost:5001/api/auth/validate', {
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

function App() {
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/general-settings');
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
      <TokenValidator />
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


        
        {/* Dynamic Static Pages */}
        <Route path="/about" element={<FrontendPage fixedSlug="about-us" />} />
        <Route path="/contact" element={<FrontendPage fixedSlug="contact-us" />} />
        <Route path="/privacy" element={<FrontendPage fixedSlug="privacy-policy" />} />
        <Route path="/terms" element={<FrontendPage fixedSlug="terms-of-use" />} />
        <Route path="/faq" element={<FrontendPage fixedSlug="faq" />} />
        <Route path="/help" element={<FrontendPage fixedSlug="help-center" />} />
        <Route path="/devices" element={<FrontendPage fixedSlug="supported-devices" />} />

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
    </Router>
  );
}

export default App;
