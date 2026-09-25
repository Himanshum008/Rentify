import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import ChatDrawer from './components/ChatDrawer';

// Pages
import Home from './pages/Home';
import Explore from './pages/Explore';
import ItemDetails from './pages/ItemDetails';
import ListItem from './pages/ListItem';
import MyRentals from './pages/MyRentals';
import MessagesPage from './pages/MessagesPage';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <div style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/item/:id" element={<ItemDetails />} />
                <Route path="/list-item" element={<ListItem />} />
                <Route path="/my-rentals" element={<MyRentals />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
              </Routes>
            </div>
            <Footer />

            {/* Global Overlays */}
            <AuthModal />
            <ChatDrawer />
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
