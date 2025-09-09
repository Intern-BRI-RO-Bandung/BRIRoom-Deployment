import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getUser } from '../../utils/auth';
import { userAPI } from '../../services/api';

const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const user = getUser();
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    pendingApprovals: 0,
    upcomingBookings: 0
  });

  const isActive = (path) => location.pathname === path;

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  useEffect(() => {
    // Only fetch stats if user exists and role is exactly 'user'
    if (!user || user.role !== 'user') return;

    const loadStats = async () => {
      try {
        console.log('🔍 Sidebar: Fetching real stats...');
        const response = await userAPI.getMyBookings();
        console.log('📊 Sidebar: API response:', response);

        let bookings = response.data;
        if (response.data && response.data.data) {
          bookings = response.data.data;
        }

        if (Array.isArray(bookings)) {
          const total = bookings.length;
          const active = bookings.filter(booking =>
            booking.status === 'approved' || booking.status === 'partial_approved'
          ).length;
          const pending = bookings.filter(booking =>
            booking.status === 'pending'
          ).length;

          // Count upcoming bookings (today and future)
          const today = new Date().toISOString().split('T')[0];
          const upcoming = bookings.filter(booking =>
            booking.date >= today &&
            (booking.status === 'approved' || booking.status === 'partial_approved')
          ).length;

          setStats({
            totalBookings: total,
            activeBookings: active,
            pendingApprovals: pending,
            upcomingBookings: upcoming
          });
        } else {
          console.log('📊 Sidebar: No bookings data or invalid format');
          setStats({
            totalBookings: 0,
            activeBookings: 0,
            pendingApprovals: 0,
            upcomingBookings: 0
          });
        }
      } catch (error) {
        console.error('❌ Sidebar: Error fetching stats:', error);
        setStats({
          totalBookings: 0,
          activeBookings: 0,
          pendingApprovals: 0,
          upcomingBookings: 0
        });
      }
    };

    loadStats();
  }, [user?.role]);

  const menuSections = useMemo(() => {
    if (!user) return { main: [] };

    let personalMenu = [];
    if (user.role === 'user') {
      personalMenu = [
        { 
          name: 'Dashboard', 
          path: '/user/dashboard', 
          icon: '🏠',
          iconActive: '🏡',
          description: 'Overview & Analytics',
          badge: null,
          color: 'blue'
        },
        { 
          name: 'Buat Booking', 
          path: '/user/booking', 
          icon: '➕',
          iconActive: '✨',
          description: 'Buat reservasi baru',
          badge: 'New',
          color: 'green'
        },
        { 
          name: 'Booking Saya', 
          path: '/user/mybookings', 
          icon: '📋',
          iconActive: '📊',
          description: 'Kelola booking Anda',
          badge: stats.activeBookings > 0 ? stats.activeBookings : null,
          color: 'orange'
        }
      ];
    } else if (user.role === 'admin_it') {
      personalMenu = [
        { 
          name: 'Dashboard', 
          path: '/admin/dashboard', 
          icon: '👑',
          iconActive: '💎',
          description: 'System overview',
          badge: null,
          color: 'purple'
        },
        { 
          name: 'Kelola Booking', 
          path: '/admin/bookings', 
          icon: '📊',
          iconActive: '📈',
          description: 'Manage all bookings',
          badge: stats.pendingApprovals > 0 ? stats.pendingApprovals : null,
          color: 'blue'
        },
        { 
          name: 'Zoom Settings', 
          path: '/admin/zoom', 
          icon: '💻',
          iconActive: '🖥️',
          description: 'Zoom configuration',
          badge: null,
          color: 'blue'
        }
      ];
    } else if (user.role === 'logistik') {
      personalMenu = [
        { 
          name: 'Dashboard', 
          path: '/logistik/dashboard', 
          icon: '🏢',
          iconActive: '🏗️',
          description: 'Logistik overview',
          badge: null,
          color: 'green'
        },
        { 
          name: 'Kelola Ruangan', 
          path: '/logistik/rooms', 
          icon: '🏢',
          iconActive: '🏗️',
          description: 'Manage rooms',
          badge: null,
          color: 'green'
        },
        { 
          name: 'Permintaan Ruangan', 
          path: '/logistik/bookings', 
          icon: '📝',
          iconActive: '✅',
          description: 'Room requests',
          badge: stats.pendingApprovals > 0 ? stats.pendingApprovals : null,
          color: 'orange'
        }
      ];
    } else if (user.role === 'zoom_approver') {
      personalMenu = [
        { 
          name: 'Zoom Dashboard', 
          path: '/zoom/dashboard', 
          icon: '💻',
          iconActive: '🖥️',
          description: 'Zoom overview',
          badge: null,
          color: 'blue'
        },
        { 
          name: 'Zoom Requests', 
          path: '/zoom/requests', 
          icon: '📝',
          iconActive: '✅',
          description: 'Pending approvals',
          badge: stats.pendingApprovals > 0 ? stats.pendingApprovals : null,
          color: 'orange'
        }
      ];
    } else if (user.role === 'room_approver') {
      personalMenu = [
        { 
          name: 'Room Dashboard', 
          path: '/room/dashboard', 
          icon: '🏢',
          iconActive: '🏗️',
          description: 'Room overview',
          badge: null,
          color: 'green'
        },
        { 
          name: 'Room Requests', 
          path: '/room/requests', 
          icon: '📝',
          iconActive: '✅',
          description: 'Pending approvals',
          badge: stats.pendingApprovals > 0 ? stats.pendingApprovals : null,
          color: 'orange'
        },
        { 
          name: 'Kelola Ruangan', 
          path: '/logistik/rooms', 
          icon: '🏢',
          iconActive: '🏗️',
          description: 'Manage facilities',
          badge: null,
          color: 'green'
        }
      ];
    }

    return { main: personalMenu };
  }, [user, stats]);

  const getRoleInfo = () => {
    const roleMap = {
      admin: { 
        label: 'Administrator', 
        icon: '👑',
        level: 'System Admin',
        headerBg: 'from-purple-600 via-purple-700 to-indigo-800',
        accentColor: 'purple'
      },
      admin_it: { 
        label: 'Administrator', 
        icon: '👑',
        level: 'System Admin',
        headerBg: 'from-purple-600 via-purple-700 to-indigo-800',
        accentColor: 'purple'
      },
      logistik: {
        label: 'Logistik',
        icon: '🏢',
        level: 'Logistics',
        headerBg: 'from-green-600 via-emerald-700 to-teal-800',
        accentColor: 'green'
      },
      zoom_approver: { 
        label: 'Zoom Approver', 
        icon: '💻',
        level: 'Zoom Manager',
        headerBg: 'from-blue-600 via-blue-700 to-cyan-800',
        accentColor: 'blue'
      },
      room_approver: { 
        label: 'Room Approver', 
        icon: '🏢',
        level: 'Facility Manager',
        headerBg: 'from-green-600 via-emerald-700 to-teal-800',
        accentColor: 'green'
      },
      user: { 
        label: 'User', 
        icon: '👤',
        level: 'Employee',
        headerBg: 'from-gray-600 via-slate-700 to-gray-800',
        accentColor: 'gray'
      }
    };
    return roleMap[user?.role] || roleMap.user;
  };

  const getDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getBadgeColor = (color) => {
    const colorMap = {
      blue: 'bg-blue-500 text-white',
      green: 'bg-green-500 text-white',
      orange: 'bg-orange-500 text-white',
      purple: 'bg-purple-500 text-white',
      indigo: 'bg-indigo-500 text-white',
      red: 'bg-red-500 text-white',
      gray: 'bg-gray-500 text-white'
    };
    return colorMap[color] || 'bg-gray-500 text-white';
  };

  const getIconBgColor = (color, isActive = false) => {
    if (isActive) {
      const activeColorMap = {
        blue: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg',
        green: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg',
        orange: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg',
        purple: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg',
        indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg',
        red: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg',
        gray: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg'
      };
      return activeColorMap[color] || activeColorMap.gray;
    }
    const hoverColorMap = {
      blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200',
      green: 'bg-green-100 text-green-600 group-hover:bg-green-200',
      orange: 'bg-orange-100 text-orange-600 group-hover:bg-orange-200',
      purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-200',
      indigo: 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200',
      red: 'bg-red-100 text-red-600 group-hover:bg-red-200',
      gray: 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
    };
    return hoverColorMap[color] || hoverColorMap.gray;
  };

  const roleInfo = getRoleInfo();

  if (!user) {
    return (
      <div className="hidden lg:block w-72 bg-white shadow-xl border-r border-gray-200 flex flex-col z-40 items-center justify-center">
        <div className="flex flex-col items-center justify-center h-full py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <div className="text-gray-500 font-semibold">Loading Sidebar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex lg:flex-col lg:sticky lg:top-[4rem] lg:h-[calc(100vh-4rem)] w-72 bg-white shadow-xl border-r border-gray-200 z-40">
      {/* Header with User Info */}
      <div className={`bg-gradient-to-br ${roleInfo.headerBg} relative overflow-hidden flex-shrink-0`}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M20 20c0-11.046-8.954-20-20-20v20h20z'/%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/30"></div>
        <div className="relative p-4 text-white">
          <div className="flex items-center space-x-3 mb-3">
            <div className="relative">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-lg">
                <span className="text-2xl filter drop-shadow-lg">{roleInfo.icon}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold truncate filter drop-shadow-md">
                {getDisplayName()}
              </h2>
              <p className="text-xs opacity-90 truncate filter drop-shadow-sm">
                {user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white backdrop-blur-sm border border-white/30 shadow-lg">
              <span className="mr-1 text-sm">{roleInfo.icon}</span>
              {roleInfo.level}
            </span>
            <div className="flex items-center space-x-1 text-xs opacity-90">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
              <span className="font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="p-3 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 border-b border-gray-100 flex-shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white p-3 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-0.5">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-white text-sm">📊</span>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">{stats.totalBookings}</div>
                <div className="text-xs text-gray-500 font-medium">Total</div>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-0.5">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                <span className="text-white text-sm">✅</span>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{stats.activeBookings}</div>
                <div className="text-xs text-gray-500 font-medium">Active</div>
              </div>
            </div>
          </div>
        </div>
        {stats.upcomingBookings > 0 && (
          <div className="mt-3 p-3 bg-gradient-to-r from-blue-100 to-cyan-100 border border-blue-200 rounded-xl shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-lg">⏰</span>
              <div>
                <span className="text-sm text-blue-800 font-semibold">
                  {stats.upcomingBookings} upcoming booking{stats.upcomingBookings > 1 ? 's' : ''}
                </span>
                <p className="text-xs text-blue-600">Starting soon</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Navigation Menu */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white pb-2">
        <nav className="p-3 space-y-2">
          {Object.entries(menuSections).map(([sectionKey, items]) => (
            <div key={sectionKey} className="mb-2">
              <div className="flex items-center mb-2">
                <div className="w-1.5 h-1.5 rounded-full mr-2 bg-gray-500" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  {sectionKey === 'main' ? 'Personal' : sectionKey}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {items && items.length > 0 ? items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`
                      group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                      ${isActive(item.path)
                        ? 'bg-blue-50 border-l-4 border-blue-500 shadow-sm'
                        : 'hover:bg-gray-100'
                      }
                    `}
                  >
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-lg text-xl
                      ${getIconBgColor(item.color, isActive(item.path))}
                      transition-all duration-200
                    `}>
                      <span>{isActive(item.path) ? item.iconActive : item.icon}</span>
                      {item.badge && (
                        <span className={`
                          ml-1 px-2 py-0.5 rounded-full text-xs font-bold
                          ${getBadgeColor(item.color)}
                        `}>
                          {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`
                        font-semibold text-sm truncate
                        ${isActive(item.path) ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-700'}
                      `}>
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                )) : (
                  <div className="text-gray-400 text-xs px-3 py-2">Tidak ada menu</div>
                )}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex flex-col items-center justify-center py-4 px-2">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-bold">B</span>
            </div>
            <span className="text-sm font-bold text-gray-800">BRIRoom</span>
            <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">v2.1</span>
          </div>
          <div className="text-xs text-gray-600 font-medium leading-tight">
            Modern Room Management
          </div>
          <div className="text-xs text-gray-400 mt-1">
            © 2025 Bank BRI
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;