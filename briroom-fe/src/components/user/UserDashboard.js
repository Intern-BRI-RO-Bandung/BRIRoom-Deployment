import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { userAPI } from '../../services/api';
import { getUser } from '../../utils/auth';

const UserDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const user = getUser();

  useEffect(() => {
    fetchDashboardData();
    setGreetingMessage();
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const setGreetingMessage = () => {
    const hour = new Date().getHours();
    if (hour < 10) setGreeting('Selamat Pagi');
    else if (hour < 17) setGreeting('Selamat Siang');
    else setGreeting('Selamat Malam');
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching user dashboard data...');
      const response = await userAPI.getMyBookings();
      console.log('📊 User dashboard API response:', response);
      
      let bookings = response.data;
      if (response.data && response.data.data) {
        bookings = response.data.data;
      }
      
      console.log('📋 Bookings data:', bookings);
      
      if (!Array.isArray(bookings)) {
        console.warn('⚠️ Bookings is not an array, setting to empty array');
        bookings = [];
      }

      const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        approved: bookings.filter(b => b.status === 'approved').length,
        rejected: bookings.filter(b => b.status === 'rejected').length
      };

      setStats(stats);
      setRecentBookings(bookings.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: 'bg-gradient-to-r from-amber-400 to-orange-500',
        text: 'text-white',
        icon: '⏳',
        label: 'MENUNGGU'
      },
      approved: {
        bg: 'bg-gradient-to-r from-emerald-400 to-green-500',
        text: 'text-white',
        icon: '✅',
        label: 'DISETUJUI'
      },
      rejected: {
        bg: 'bg-gradient-to-r from-rose-400 to-red-500',
        text: 'text-white',
        icon: '❌',
        label: 'DITOLAK'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} shadow-lg`}>
        <span className="mr-1.5">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getRequestTypeBadge = (type) => {
    const typeConfig = {
      meeting: { bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: '👥', text: 'Meeting' },
      event: { bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: '🎉', text: 'Event' },
      training: { bg: 'bg-orange-50 text-orange-700 border-orange-200', icon: '📚', text: 'Training' },
      presentation: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: '📊', text: 'Presentation' }
    };

    const config = typeConfig[type] || { bg: 'bg-gray-50 text-gray-700 border-gray-200', icon: '📝', text: type };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${config.bg}`}>
        <span className="mr-1">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const StatCard = ({ icon, title, value, subtitle, gradient, trend, delay = 0 }) => (
    <div 
      className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 group relative overflow-hidden animate-fade-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background Gradient Overlay */}
      <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-14 h-14 ${gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <span className="text-2xl">{icon}</span>
          </div>
          {trend && (
            <div className="text-right">
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                +{trend}%
              </span>
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors duration-300">
            {value}
          </h3>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-600 mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-primary-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-gray-600 font-medium text-lg">Memuat dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Tunggu sebentar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Modern Header Section */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-[6rem] z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <span className="text-white text-2xl animate-pulse">👋</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
                    {greeting}!
                  </h1>
                  <p className="text-gray-600 font-medium mb-1">{user?.name || user?.email}</p>
                  <p className="text-sm text-gray-500">
                    {currentTime.toLocaleDateString('id-ID', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/user/mybookings"
                className="inline-flex items-center px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-lg group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                My Bookings
              </Link>
              <Link
                to="/user/booking"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600 hover:from-primary-700 hover:via-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Buat Booking Baru
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon="📅"
            title="Total Booking"
            value={stats.total}
            subtitle="Semua booking Anda"
            gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
            trend={12}
            delay={0}
          />
          <StatCard
            icon="⏳"
            title="Menunggu Persetujuan"
            value={stats.pending}
            subtitle="Sedang diproses"
            gradient="bg-gradient-to-r from-amber-500 to-orange-500"
            delay={100}
          />
          <StatCard
            icon="✅"
            title="Disetujui"
            value={stats.approved}
            subtitle="Booking berhasil"
            gradient="bg-gradient-to-r from-emerald-500 to-green-500"
            trend={8}
            delay={200}
          />
          <StatCard
            icon="❌"
            title="Ditolak"
            value={stats.rejected}
            subtitle="Perlu perbaikan"
            gradient="bg-gradient-to-r from-rose-500 to-red-500"
            delay={300}
          />
        </div>

        {/* Modern Recent Bookings Section */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden mb-8 animate-slide-up">
          <div className="bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-white text-2xl">📋</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-bold text-white mb-1">Booking Terbaru</h2>
                  <p className="text-blue-100 text-sm">5 booking terakhir Anda</p>
                </div>
              </div>
              <Link
                to="/user/mybookings"
                className="inline-flex items-center px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-300 text-sm font-medium backdrop-blur-sm border border-white/20 hover:border-white/40 group"
              >
                Lihat Semua
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="p-8">
            {recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.map((booking, index) => (
                  <div 
                    key={booking.id} 
                    className="bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-200/50 hover:border-blue-200 group transform hover:-translate-y-1"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                      <div className="flex-1 mb-4 xl:mb-0">
                        <h3 className="font-bold text-gray-900 mb-3 text-lg group-hover:text-blue-600 transition-colors duration-300">
                          {booking.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-6 text-sm">
                          <div className="flex items-center text-gray-600 gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="font-medium">{new Date(booking.date).toLocaleDateString('id-ID')}</span>
                          </div>
                          <div className="flex items-center text-gray-600 gap-2">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span className="font-medium">{booking.start_time} - {booking.end_time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getRequestTypeBadge(booking.request_type)}
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-6xl">📅</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Belum Ada Booking</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Mulai perjalanan Anda dengan membuat booking ruangan pertama untuk kebutuhan meeting atau event Anda
                </p>
                <Link
                  to="/user/booking"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600 hover:from-primary-700 hover:via-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                >
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Buat Booking Pertama
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/user/mybookings"
            className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-200/50 group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-3xl">📝</span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">My Bookings</h3>
                <p className="text-gray-600 mb-1">Kelola semua booking Anda</p>
                <p className="text-xs text-gray-500">{stats.total} total booking</p>
              </div>
            </div>
          </Link>

          <Link
            to="/user/profile"
            className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-200/50 group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-3xl">👤</span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors duration-300">Profile</h3>
                <p className="text-gray-600 mb-1">Edit informasi akun</p>
                <p className="text-xs text-gray-500">Kelola data pribadi</p>
              </div>
            </div>
          </Link>

          <Link
            to="/user/history"
            className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-200/50 group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <span className="text-3xl">📊</span>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors duration-300">History</h3>
                <p className="text-gray-600 mb-1">Riwayat aktivitas</p>
                <p className="text-xs text-gray-500">Lihat semua aktivitas</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;