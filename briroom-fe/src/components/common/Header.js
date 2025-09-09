import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUser, logout } from '../../utils/auth';
import briLogo from '../../assets/bri-logo.png';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin logout?')) {
      logout();
      navigate('/login');
    }
  };

  const getNavItems = () => {
    if (!user) return [];

    const baseItems = [
      { name: 'Dashboard', path: '/user/dashboard', icon: '🏠' },
      { name: 'My Bookings', path: '/user/mybookings', icon: '📋' },
      { name: 'Buat Booking', path: '/user/booking', icon: '➕' }
    ];

    if (user.role === 'admin') {
      return [
        { name: 'Admin Dashboard', path: '/admin/dashboard', icon: '👑' },
        { name: 'Manage Bookings', path: '/admin/bookings', icon: '📊' },
        { name: 'Manage Rooms', path: '/admin/rooms', icon: '🏢' },
        { name: 'Manage Users', path: '/admin/users', icon: '👥' },
        ...baseItems
      ];
    }

    if (user.role === 'zoom_approver') {
      return [
        { name: 'Zoom Dashboard', path: '/zoom/dashboard', icon: '💻' },
        { name: 'Zoom Requests', path: '/zoom/requests', icon: '📝' },
        ...baseItems
      ];
    }

    if (user.role === 'room_approver') {
      return [
        { name: 'Room Dashboard', path: '/room/dashboard', icon: '🏢' },
        { name: 'Room Requests', path: '/room/requests', icon: '📝' },
        ...baseItems
      ];
    }

    return baseItems;
  };

  const getRoleInfo = () => {
    const roleMap = {
      admin: { label: 'Administrator', color: 'bg-purple-500', textColor: 'text-purple-700', bgColor: 'bg-purple-50', icon: '👑' },
      zoom_approver: { label: 'Zoom Approver', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50', icon: '💻' },
      room_approver: { label: 'Room Approver', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50', icon: '🏢' },
      user: { label: 'User', color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-50', icon: '👤' }
    };
    return roleMap[user?.role] || roleMap.user;
  };

  const getDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const navItems = getNavItems();
  const roleInfo = getRoleInfo();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={() => navigate('/user/dashboard')}
              className="flex items-center gap-3 hover:opacity-90 transition-opacity focus:outline-none"
            >
              <img
                src={briLogo}
                alt="BRI Logo"
                className="w-10 h-10 object-contain rounded-lg shadow-sm bg-white"
                style={{ background: '#fff' }}
              />
              <div className="flex flex-col justify-center">
                <span className="text-xl font-bold text-gray-900 leading-tight">BRIRoom</span>
                <span className="text-xs text-gray-500 -mt-0.5">Room Management</span>
              </div>
            </button>
          </div>
          <div className="flex items-center space-x-4">
            {/* User Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors min-w-0"
              >
                {/* User Avatar */}
                <div className={`w-8 h-8 ${roleInfo.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-sm">{roleInfo.icon}</span>
                </div>
                {/* User Info */}
                <div className="text-left min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate max-w-32">
                    {getDisplayName()}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {roleInfo.label}
                  </div>
                </div>
                {/* Dropdown Arrow */}
                <svg 
                  className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                  {/* User Info Header */}
                  <div className={`${roleInfo.color} px-6 py-4`}>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xl">{roleInfo.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white font-semibold text-lg truncate">
                          {getDisplayName()}
                        </h3>
                        <p className="text-white text-sm opacity-90 truncate">
                          {user?.email}
                        </p>
                        <div className="flex items-center mt-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white">
                            {roleInfo.icon} {roleInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* User Details */}
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Status</span>
                        <div className="flex items-center mt-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          <span className="text-green-600 font-medium">Active</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Role</span>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleInfo.bgColor} ${roleInfo.textColor}`}>
                            {roleInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Navigation */}
                  <div className="py-2">
                    {navItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-6 py-3 text-sm transition-colors group ${
                          isActivePath(item.path)
                            ? `${roleInfo.bgColor} ${roleInfo.textColor} border-r-4 ${roleInfo.color.replace('bg-', 'border-')}`
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
                        <span className="font-medium">{item.name}</span>
                        {isActivePath(item.path) && (
                          <span className={`ml-auto w-2 h-2 ${roleInfo.color} rounded-full`}></span>
                        )}
                      </button>
                    ))}
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button
                        onClick={() => {
                          navigate('/user/profile');
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                      >
                        <span className="text-lg group-hover:scale-110 transition-transform">⚙️</span>
                        <span>Profile & Settings</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                      >
                        <span className="text-lg group-hover:scale-110 transition-transform">🚪</span>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                />
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="py-2 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                    isActivePath(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;