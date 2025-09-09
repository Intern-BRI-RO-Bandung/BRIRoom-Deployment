import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { userAPI } from '../../services/api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, filter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching user bookings...');
      const response = await userAPI.getMyBookings();
      console.log('📊 MyBookings API response:', response);
      
      let bookingsData = response.data;
      if (response.data && response.data.data) {
        bookingsData = response.data.data;
      }
      
      console.log('📋 Bookings data:', bookingsData);
      
      if (!Array.isArray(bookingsData)) {
        console.warn('⚠️ Bookings data is not an array, setting to empty array');
        bookingsData = [];
      }
      
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Gagal memuat data booking');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    if (!Array.isArray(bookings)) {
      console.warn('⚠️ Bookings is not an array in filterBookings');
      setFilteredBookings([]);
      return;
    }
    
    if (filter === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(booking => booking.status === filter));
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

  const getTypeBadge = (type) => {
    const typeConfig = {
      room: { bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: '🏢', text: 'Ruangan' },
      zoom: { bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: '💻', text: 'Zoom' },
      both: { bg: 'bg-green-50 text-green-700 border-green-200', icon: '🔗', text: 'Ruangan + Zoom' }
    };

    const config = typeConfig[type] || { bg: 'bg-gray-50 text-gray-700 border-gray-200', icon: '📝', text: type };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${config.bg}`}>
        <span className="mr-1">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const handleShowDetail = (booking) => {
    console.log('🔍 Selected booking for detail:', booking);
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
  };

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
          <p className="text-gray-600 font-medium text-lg">Memuat booking...</p>
          <p className="text-gray-500 text-sm mt-2">Tunggu sebentar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white text-2xl">📋</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    My Bookings
                  </h1>
                  <p className="text-gray-600 font-medium">Kelola dan lihat status booking Anda</p>
                  <p className="text-sm text-gray-500">{filteredBookings.length} dari {bookings.length} booking</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/user/dashboard"
                className="inline-flex items-center px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-lg group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali
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
        {/* Enhanced Filter Section */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Filter Booking</h3>
                <p className="text-sm text-gray-600">Pilih status untuk menyaring data</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all duration-200"
              >
                <option value="all">Semua Status ({bookings.length})</option>
                <option value="pending">Menunggu ({bookings.filter(b => b.status === 'pending').length})</option>
                <option value="approved">Disetujui ({bookings.filter(b => b.status === 'approved').length})</option>
                <option value="rejected">Ditolak ({bookings.filter(b => b.status === 'rejected').length})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modern Bookings Grid */}
        {filteredBookings.length > 0 ? (
          <div className="space-y-4 animate-slide-up">
            {filteredBookings.map((booking, index) => (
              <div 
                key={booking.id} 
                className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200/50 hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 group overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-8">
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
                    {/* Main Info */}
                    <div className="flex-1 mb-6 xl:mb-0">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                            {booking.title}
                          </h3>
                          <p className="text-gray-600 mb-4">{booking.purpose}</p>
                        </div>
                        <div className="ml-4 text-right">
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>
                      
                      {/* Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Tanggal</p>
                            <p className="font-semibold text-gray-900">{new Date(booking.date).toLocaleDateString('id-ID')}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Waktu</p>
                            <p className="font-semibold text-gray-900">{booking.start_time} - {booking.end_time}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Kapasitas</p>
                            <p className="font-semibold text-gray-900">{booking.capacity} orang</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Section */}
                    <div className="flex flex-col sm:flex-row xl:flex-col items-center space-y-3 sm:space-y-0 sm:space-x-3 xl:space-x-0 xl:space-y-3">
                      {getTypeBadge(booking.request_type)}
                      <button
                        onClick={() => handleShowDetail(booking)}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group min-w-[120px]"
                      >
                        <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Detail
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 p-16 text-center animate-fade-in">
            <div className="w-32 h-32 bg-gradient-to-r from-gray-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <span className="text-6xl">📅</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {filter === 'all' ? 'Belum Ada Booking' : `Tidak Ada Booking "${filter}"`}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {filter === 'all' 
                ? 'Anda belum memiliki booking apapun. Mulai dengan membuat booking pertama Anda!'
                : `Tidak ada booking dengan status "${filter}". Coba filter lain atau buat booking baru.`
              }
            </p>
            <Link
              to="/user/booking"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600 hover:from-primary-700 hover:via-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Buat Booking Baru
            </Link>
          </div>
        )}
      </div>

      {/* Enhanced Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
              onClick={handleCloseModal}
            ></div>

            {/* Modal content */}
            <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full animate-slide-up">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                      <span className="text-white text-2xl">📋</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Detail Booking</h3>
                      <p className="text-blue-100 text-sm">Informasi lengkap booking Anda</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-300"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              {selectedBooking && (
                <div className="px-8 py-8 bg-gradient-to-br from-gray-50 to-blue-50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Event Information */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-blue-600">🎯</span>
                        </span>
                        Informasi Acara
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Judul</label>
                          <p className="text-gray-900 font-semibold">{selectedBooking.title}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Tujuan</label>
                          <p className="text-gray-900">{selectedBooking.purpose}</p>
                        </div>
                        <div className="flex space-x-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Jenis</label>
                            <div className="mt-1">{getTypeBadge(selectedBooking.request_type)}</div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Status</label>
                            <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Time & Place */}
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-green-600">📍</span>
                        </span>
                        Waktu & Tempat
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Tanggal</label>
                          <p className="text-gray-900 font-semibold">{new Date(selectedBooking.date).toLocaleDateString('id-ID')}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Waktu</label>
                          <p className="text-gray-900 font-semibold">{selectedBooking.start_time} - {selectedBooking.end_time}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Kapasitas</label>
                          <p className="text-gray-900 font-semibold">{selectedBooking.capacity} orang</p>
                        </div>
                        {selectedBooking.room_name && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Ruangan</label>
                            <p className="text-gray-900 font-semibold">{selectedBooking.room_name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PIC Information */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                      <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-purple-600">👤</span>
                      </span>
                      PIC (Person in Charge)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Nama</label>
                        <p className="text-gray-900 font-semibold">
                          {selectedBooking.zoom_approver_name && selectedBooking.room_approver_name ? 
                            `${selectedBooking.zoom_approver_name} (Zoom), ${selectedBooking.room_approver_name} (Room)` :
                            selectedBooking.zoom_approver_name || selectedBooking.room_approver_name || 
                            selectedBooking.pic_name || selectedBooking.user_name || 'Tidak tersedia'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Kontak</label>
                        <p className="text-gray-900 font-semibold">
                          {selectedBooking.zoom_approver_email && selectedBooking.room_approver_email ? 
                            `${selectedBooking.zoom_approver_email}, ${selectedBooking.room_approver_email}` :
                            selectedBooking.zoom_approver_email || selectedBooking.room_approver_email || 
                            selectedBooking.pic_contact || selectedBooking.whatsapp_number || selectedBooking.user_email || 'Tidak tersedia'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Zoom Information */}
                  {(selectedBooking.zoom_link_manual || selectedBooking.zoom_link) && (
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-indigo-600">💻</span>
                        </span>
                        Informasi Zoom
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Link</label>
                          <div className="mt-1">
                            {selectedBooking.zoom_link_manual ? (
                              <a href={selectedBooking.zoom_link_manual} target="_blank" rel="noopener noreferrer" 
                                 className="text-blue-600 hover:text-blue-700 underline break-all">
                                {selectedBooking.zoom_link_manual}
                              </a>
                            ) : selectedBooking.zoom_link ? (
                              <a href={selectedBooking.zoom_link} target="_blank" rel="noopener noreferrer" 
                                 className="text-blue-600 hover:text-blue-700 underline break-all">
                                {selectedBooking.zoom_link}
                              </a>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Meeting ID</label>
                            <p className="text-gray-900 font-mono">
                              {selectedBooking.zoom_meeting_id_manual || selectedBooking.zoom_meeting_id || '-'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Passcode</label>
                            <p className="text-gray-900 font-mono">
                              {selectedBooking.zoom_passcode_manual || selectedBooking.zoom_passcode || '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Messages */}
                  {selectedBooking.status === 'rejected' && selectedBooking.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-red-600">❌</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-red-900 mb-2">Alasan Penolakan</h4>
                          <p className="text-red-700">{selectedBooking.rejection_reason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedBooking.admin_notes && selectedBooking.admin_notes.trim() !== '' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-blue-600">📝</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-blue-900 mb-2">Catatan dari Admin</h4>
                          <p className="text-blue-700">{selectedBooking.admin_notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedBooking.zoom_notes && (
                    <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 mb-6">
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-purple-600">🔗</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-purple-900 mb-2">Catatan Zoom</h4>
                          <p className="text-purple-700">{selectedBooking.zoom_notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedBooking.room_notes && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-green-600">🏢</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-green-900 mb-2">Catatan Ruangan</h4>
                          <p className="text-green-700">{selectedBooking.room_notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Footer */}
              <div className="bg-gray-50 px-8 py-6 flex justify-end">
                <button
                  onClick={handleCloseModal}
                  className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;