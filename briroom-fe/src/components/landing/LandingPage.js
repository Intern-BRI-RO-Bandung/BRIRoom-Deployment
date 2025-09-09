import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import briLogo from '../../assets/bri-logo.png';
import api from '../../services/api';

const blobs = [
  {
    className: "w-72 h-72 opacity-30 pointer-events-none animate-pulse",
    style: { top: '-40px', left: '-40px' },
    color: "#6366f1"
  },
  {
    className: "w-40 h-40 opacity-20 pointer-events-none animate-pulse",
    style: { top: '60px', left: '60px' },
    color: "#818cf8"
  },
  {
    className: "w-56 h-56 opacity-20 pointer-events-none animate-pulse",
    style: { bottom: '-60px', right: '-60px' },
    color: "#a5b4fc"
  }
];

// Komponen untuk menampilkan status dengan warna yang sesuai
const StatusBadge = ({ status }) => {
  if (status === 'approved' || status === 'DISETUJUI') {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-lg">
        <span className="mr-1.5">✅</span>DISETUJUI
      </span>
    );
  }
  if (status === 'pending' || status === 'MENUNGGU') {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg">
        <span className="mr-1.5">⏳</span>MENUNGGU
      </span>
    );
  }
  if (status === 'rejected' || status === 'DITOLAK') {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-lg">
        <span className="mr-1.5">❌</span>DITOLAK
      </span>
    );
  }
  if (status === 'validated_by_admin') {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-lg">
        <span className="mr-1.5">🔍</span>DIVALIDASI
      </span>
    );
  }
  return null;
};

// Komponen untuk menampilkan tipe request
const TypeBadge = ({ type }) => {
  if (type === 'room') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
        <span className="mr-1">🏢</span>Ruangan
      </span>
    );
  }
  if (type === 'both') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border bg-green-50 text-green-700 border-green-200">
        <span className="mr-1">🔗</span>Ruangan + Zoom
      </span>
    );
  }
  if (type === 'zoom') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200">
        <span className="mr-1">💻</span>Zoom Only
      </span>
    );
  }
  return null;
};

// Komponen utama untuk section "Request Terbaru"
const RequestSection = ({ latestRequests, isLoading }) => (
  <section id="latest-requests" className="py-20 bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                <span className="text-white text-2xl">📋</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Request Terbaru</h2>
                <p className="text-green-100 text-sm">Data realtime dari sistem BRIRoom</p>
              </div>
            </div>
            <Link to="/login" className="inline-flex items-center px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-300 text-sm font-medium backdrop-blur-sm border border-white/20 hover:border-white/40 group">
              Lihat Semua
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </Link>
          </div>
        </div>
        <div className="p-8">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Memuat data request...</p>
              </div>
            ) : latestRequests && latestRequests.length > 0 ? (
              latestRequests.map((request, index) => (
                <div key={request.id} className="bg-gradient-to-r from-gray-50 to-green-50/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-200/50 hover:border-green-200 group transform hover:-translate-y-1" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex-1 mb-4 xl:mb-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 mb-1 text-lg group-hover:text-green-600 transition-colors duration-300">{request.title}</h3>
                          <p className="text-sm text-gray-600"><span className="font-medium">User:</span> {request.user_email}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TypeBadge type={request.request_type} />
                          <StatusBadge status={request.status} />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-6 text-sm">
                        <div className="flex items-center text-gray-600">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3"><svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>
                          <span className="font-medium">{new Date(request.date).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3"><svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                          <span className="font-medium">{request.start_time} - {request.end_time}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3"><svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></div>
                          <span className="font-medium">{request.capacity || 'N/A'} orang</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-lg">Belum ada request yang masuk</p>
                <p className="text-sm">Jadilah yang pertama untuk membuat request!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Komponen utama untuk section "History Permintaan"
const HistorySection = ({ userHistory, isLoggedIn, isLoading }) => (
  <section id="history-requests" className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                <span className="text-white text-2xl">🕓</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Riwayat Permintaan</h2>
                <p className="text-indigo-100 text-sm">
                  {isLoggedIn ? 'Lihat riwayat pengajuan request Anda' : 'Login untuk melihat riwayat request Anda'}
                </p>
              </div>
            </div>
            <Link to="/login" className="inline-flex items-center px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-300 text-sm font-medium backdrop-blur-sm border border-white/20 hover:border-white/40 group">
              {isLoggedIn ? 'Lihat Detail' : 'Login Sekarang'}
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </Link>
          </div>
        </div>
        <div className="p-8">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Memuat riwayat...</p>
            </div>
          ) : isLoggedIn && userHistory && userHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Judul</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipe</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Waktu</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Peserta</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {userHistory.map((req) => (
                    <tr key={req.id} className="hover:bg-blue-50/50 transition-colors duration-200">
                      <td className="px-4 py-3 font-medium text-gray-900">{req.title}</td>
                      <td className="px-4 py-3"><TypeBadge type={req.request_type} /></td>
                      <td className="px-4 py-3 text-gray-700">{new Date(req.date).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3 text-gray-700">{req.start_time} - {req.end_time}</td>
                      <td className="px-4 py-3 text-gray-700">{req.capacity || 'N/A'} orang</td>
                      <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              {isLoggedIn ? (
                <>
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-lg text-gray-600 mb-2">Belum ada riwayat permintaan</p>
                  <p className="text-sm text-gray-500">Mulai buat request pertama Anda!</p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">🔒</div>
                  <p className="text-lg text-gray-600 mb-2">Login untuk melihat riwayat</p>
                  <p className="text-sm text-gray-500">Anda perlu login untuk melihat riwayat permintaan</p>
                  <Link to="/login" className="inline-flex items-center px-6 py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-300">
                    Login Sekarang
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div> */}
    </div>
  </section>
);

const LandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [latestRequests, setLatestRequests] = useState([]);
  const [userHistory, setUserHistory] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const features = [
    {
      icon: '🏢',
      title: 'Room Booking',
      description: 'Pesan ruangan meeting dengan mudah dan cepat',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '💻',
      title: 'Zoom Integration',
      description: 'Otomatis setup meeting zoom untuk keperluan virtual',
      color: 'from-purple-500 to-indigo-500'
    },
    {
      icon: '⚡',
      title: 'Fast Approval',
      description: 'Sistem approval yang cepat dan transparan',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: '📊',
      title: 'Smart Dashboard',
      description: 'Dashboard yang informatif untuk monitoring',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const testimonials = [
    {
      name: 'Ahmad Wijaya',
      role: 'Manager IT',
      avatar: 'AW',
      comment: 'BRIRoom sangat memudahkan proses booking ruangan dan zoom meeting. Interface yang user-friendly!',
      rating: 5
    },
    {
      name: 'Sarah Putri',
      role: 'HR Manager',
      avatar: 'SP',
      comment: 'Sistem approval yang cepat dan transparan. Tim logistik jadi lebih efisien dalam mengelola ruangan.',
      rating: 5
    },
    {
      name: 'Budi Santoso',
      role: 'Project Manager',
      avatar: 'BS',
      comment: 'Tidak perlu lagi repot koordinasi manual. Semua bisa dilakukan melalui satu platform terintegrasi.',
      rating: 5
    }
  ];

  // Auto slide testimonial
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch realtime data
  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/requests/public');
        if (response.data.success) {
          setLatestRequests(response.data.data.latestRequests || []);
          setUserHistory(response.data.data.userHistory || []);
          setIsLoggedIn(response.data.data.userHistory !== undefined);
        }
      } catch (error) {
        console.error('Error fetching public data:', error);
        // Fallback to empty arrays if API fails
        setLatestRequests([]);
        setUserHistory([]);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchPublicData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Smooth scroll
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation Header */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200/50' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <img
                src={briLogo}
                alt="BRI Logo"
                className="w-10 h-10 mr-3 object-contain"
              />
              <div className="flex flex-col justify-center">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                  BRIRoom
                </span>
                <span className="text-xs text-gray-500 leading-tight mt-0.5">
                  Meeting Solutions
                </span>
              </div>
            </div>
            {/* Navigation Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300"
              >
                Testimonials
              </button>
              <Link
                to="/login"
                className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Login
              </Link>
            </div>
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Link
                to="/login"
                className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 lg:pt-28 lg:pb-24 overflow-hidden animate-fade-in">
        {/* Animated Blobs */}
        {blobs.map((blob, idx) => (
          <div
            key={idx}
            className={blob.className + " absolute"}
            style={blob.style}
          >
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill={blob.color} d="M40.5,-67.6C52.7,-60.2,62.7,-52.7,68.3,-42.3C73.9,-31.9,75.1,-18.6,74.2,-5.8C73.3,7,70.3,19.3,64.2,29.8C58.1,40.3,48.9,49,38.3,56.2C27.7,63.4,15.8,69.1,3.1,65.2C-9.6,61.3,-19.2,47.8,-31.2,40.2C-43.2,32.6,-57.7,31,-65.2,22.2C-72.7,13.4,-73.2,-2.6,-68.6,-16.2C-64,-29.8,-54.3,-41,-43.1,-48.7C-31.9,-56.4,-19.2,-60.7,-6.1,-62.2C7,-63.7,14,-62.4,40.5,-67.6Z" transform="translate(100 100)" />
            </svg>
          </div>
        ))}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium">
                  🚀 Welcome to BRIRoom
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Smart Meeting
                  <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Management
                  </span>
                  <span className="block">System</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Solusi terpadu untuk booking ruangan dan zoom meeting. Kelola semua kebutuhan meeting Anda dengan mudah, cepat, dan efisien.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Get Started
                </Link>
                <button 
                  onClick={() => scrollToSection('features')}
                  className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl transition-all duration-300 border border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Learn More
                </button>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">50+</div>
                  <div className="text-sm text-gray-600">Ruangan</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">100+</div>
                  <div className="text-sm text-gray-600">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">24/7</div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
              </div>
            </div>
            {/* Illustration */}
            <div className="relative animate-float">
              <div className="relative">
                {/* Main illustration container */}
                <div className="bg-gradient-to-br from-blue-400 via-purple-500 to-indigo-600 rounded-3xl p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 bg-white/30 rounded-lg"></div>
                      <div className="w-16 h-3 bg-white/30 rounded-full"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="w-full h-4 bg-white/30 rounded-lg"></div>
                      <div className="w-3/4 h-4 bg-white/20 rounded-lg"></div>
                      <div className="w-1/2 h-4 bg-white/20 rounded-lg"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-16 bg-white/20 rounded-xl"></div>
                      <div className="h-16 bg-white/20 rounded-xl"></div>
                    </div>
                  </div>
                </div>
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-green-400 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                  <span className="text-xl">✨</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <RequestSection latestRequests={latestRequests} isLoading={isLoading} />

      <HistorySection userHistory={userHistory} isLoggedIn={isLoggedIn} isLoading={isLoading} />

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-4">
              ⚡ Key Features
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Mengapa Memilih <span className="text-blue-600">BRIRoom?</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Platform terintegrasi dengan fitur-fitur canggih untuk memenuhi semua kebutuhan meeting Anda
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 border border-gray-100 hover:border-blue-200 cursor-pointer"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-4">
                  🏢 About BRIRoom
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                  Solusi Terdepan untuk 
                  <span className="block text-blue-600">Meeting Management</span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  BRIRoom adalah platform inovatif yang dirancang khusus untuk memudahkan pengelolaan ruangan meeting dan integrasi zoom di lingkungan BRI. Dengan teknologi terdepan dan user experience yang intuitif.
                </p>
              </div>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Sistem Terintegrasi</h3>
                    <p className="text-gray-600">Satu platform untuk semua kebutuhan meeting, dari booking ruangan hingga setup zoom otomatis.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Proses Cepat</h3>
                    <p className="text-gray-600">Approval otomatis dengan workflow yang efisien, mengurangi waktu tunggu approval manual.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">User Friendly</h3>
                    <p className="text-gray-600">Interface yang intuitif dan mudah digunakan untuk semua kalangan, dari staff hingga management.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white rounded-2xl p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">Meeting Dashboard</h4>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Room A - 09:00</span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Approved</span>
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Zoom Meeting - 14:00</span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Active</span>
                        </div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Both - 16:00</span>
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-4">
              💬 Testimonials
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Apa Kata <span className="text-purple-600">Pengguna?</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Dengar langsung dari pengguna yang telah merasakan kemudahan BRIRoom
            </p>
          </div>
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl p-8 lg:p-12 shadow-xl">
              <div className="text-center">
                {/* Avatar */}
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="text-white font-bold text-xl">
                    {testimonials[currentSlide].avatar}
                  </span>
                </div>
                {/* Stars */}
                <div className="flex justify-center mb-6">
                  {[...Array(testimonials[currentSlide].rating)].map((_, i) => (
                    <svg key={i} className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {/* Quote */}
                <blockquote className="text-xl lg:text-2xl text-gray-700 font-medium italic mb-8 leading-relaxed">
                  "{testimonials[currentSlide].comment}"
                </blockquote>
                {/* Author */}
                <div>
                  <div className="font-bold text-gray-900 text-lg">
                    {testimonials[currentSlide].name}
                  </div>
                  <div className="text-purple-600 font-medium">
                    {testimonials[currentSlide].role}
                  </div>
                </div>
              </div>
            </div>
            {/* Navigation dots */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-purple-600 w-8' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                Siap Untuk Memulai?
              </h2>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                Bergabunglah dengan BRIRoom dan rasakan kemudahan mengelola meeting Anda. 
                Dapatkan akses ke platform yang akan mengubah cara Anda bekerja.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-10 py-4 bg-white hover:bg-gray-100 text-blue-600 font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login Sekarang
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4 space-x-4">
                <img
                  src={briLogo}
                  alt="BRI Logo"
                  className="w-12 h-12 object-contain rounded bg-white p-1"
                  style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07)' }}
                />
                <div>
                  <h1 className="text-2xl font-bold text-white leading-tight">BRIRoom</h1>
                  <p className="text-sm text-gray-300 leading-tight">Meeting Solutions</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4 max-w-md mt-2">
                Platform terpadu untuk mengelola ruangan meeting dan zoom dengan mudah, cepat, dan efisien di lingkungan BRI.
              </p>
              <div className="text-sm text-gray-500">
                © 2025 BRIRoom. All rights reserved.
              </div>
            </div>
            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Quick Links</h3>
              <div className="space-y-2">
                <button onClick={() => scrollToSection('features')} className="block text-gray-400 hover:text-white transition-colors duration-300">
                  Features
                </button>
                <button onClick={() => scrollToSection('about')} className="block text-gray-400 hover:text-white transition-colors duration-300">
                  About
                </button>
                <button onClick={() => scrollToSection('testimonials')} className="block text-gray-400 hover:text-white transition-colors duration-300">
                  Testimonials
                </button>
              </div>
            </div>
            {/* Contact */}
            <div>
              <h3 className="font-semibold text-white mb-4">Contact</h3>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">support@briroom.com</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-sm">+62 21 1500 017</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;