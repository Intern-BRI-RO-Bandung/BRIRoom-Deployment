import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';
import { exportAPI } from '../../services/api';

const AllBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [zoomLinks, setZoomLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedZoomId, setSelectedZoomId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  
  // Manual Zoom Information States
  const [zoomLinkManual, setZoomLinkManual] = useState('');
  const [zoomMeetingIdManual, setZoomMeetingIdManual] = useState('');
  const [zoomPasscodeManual, setZoomPasscodeManual] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, filter, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching all bookings data...');
      
      const [bookingsRes, zoomRes] = await Promise.all([
        adminAPI.getAllRequests(),
        adminAPI.getZoomLinks()
      ]);
      
      console.log('📋 Bookings response:', bookingsRes);
      console.log('🔗 Zoom links response:', zoomRes);
      
      // Handle bookings data with validation
      let bookings = [];
      if (bookingsRes.data) {
        if (Array.isArray(bookingsRes.data)) {
          bookings = bookingsRes.data;
        } else if (bookingsRes.data.data && Array.isArray(bookingsRes.data.data)) {
          bookings = bookingsRes.data.data;
        }
      }

      // Handle zoom links data with validation
      let zoomLinks = [];
      if (zoomRes.data) {
        if (Array.isArray(zoomRes.data)) {
          zoomLinks = zoomRes.data;
        } else if (zoomRes.data.data && Array.isArray(zoomRes.data.data)) {
          zoomLinks = zoomRes.data.data;
        }
      }

      // Ensure both are arrays
      if (!Array.isArray(bookings)) {
        console.warn('⚠️ Bookings is not an array, setting to empty array');
        bookings = [];
      }

      if (!Array.isArray(zoomLinks)) {
        console.warn('⚠️ Zoom links is not an array, setting to empty array');
        zoomLinks = [];
      }

      console.log('📊 Processed bookings:', bookings);
      console.log('🔗 Processed zoom links:', zoomLinks);
      
      setBookings(bookings);
      setZoomLinks(zoomLinks);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      console.error('Error details:', error.response?.data);
      
      // Set empty arrays on error
      setBookings([]);
      setZoomLinks([]);
      
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;
    
    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(booking => booking.status === filter);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredBookings(filtered);
  };

  const handleExportPdf = async () => {
    try {
      const response = await exportAPI.requestsPdf({});
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rekap-booking-${new Date().toISOString().slice(0,10)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export PDF failed:', e);
      toast.error('Gagal mengunduh PDF');
    }
  };

  const handleApprove = (booking) => {
    setSelectedBooking(booking);
    setAdminNotes('');
    setZoomLinkManual('');
    setZoomMeetingIdManual('');
    setZoomPasscodeManual('');
    setSelectedZoomId('');
    
    if (booking.request_type === 'zoom' || booking.request_type === 'both') {
      setShowApproveModal(true);
    } else {
      submitApprove(booking.id, null);
    }
  };

  const handleReject = (booking) => {
    setSelectedBooking(booking);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const submitApprove = async (bookingId, zoomLinkId) => {
    try {
      const data = {};
      if (zoomLinkId) {
        data.zoom_link_id = zoomLinkId;
      }
      if (adminNotes.trim()) {
        data.admin_notes = adminNotes.trim();
      }
      
      // Add manual Zoom information
      if (zoomLinkManual.trim()) {
        data.zoom_link_manual = zoomLinkManual.trim();
      }
      if (zoomMeetingIdManual.trim()) {
        data.zoom_meeting_id_manual = zoomMeetingIdManual.trim();
      }
      if (zoomPasscodeManual.trim()) {
        data.zoom_passcode_manual = zoomPasscodeManual.trim();
      }
      
      await adminAPI.approveRequest(bookingId, data);
      toast.success('Booking berhasil disetujui!');
      fetchData();
      setShowApproveModal(false);
      setSelectedZoomId('');
      setAdminNotes('');
      // Reset manual Zoom fields
      setZoomLinkManual('');
      setZoomMeetingIdManual('');
      setZoomPasscodeManual('');
    } catch (error) {
      console.error('Error approving booking:', error);
      toast.error('Gagal menyetujui booking');
    }
  };

  const submitReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Alasan penolakan harus diisi');
      return;
    }

    try {
      await adminAPI.rejectRequest(selectedBooking.id, {
        rejection_reason: rejectionReason
      });
      toast.success('Booking berhasil ditolak!');
      fetchData();
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting booking:', error);
      toast.error('Gagal menolak booking');
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
          <p className="text-gray-600 font-medium text-lg">Memuat data booking...</p>
          <p className="text-gray-500 text-sm mt-2">Tunggu sebentar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-[6rem] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white text-2xl">📋</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Semua Booking
                  </h1>
                  <p className="text-gray-600 font-medium">Kelola semua booking dari seluruh user</p>
                  <p className="text-sm text-gray-500">
                    Total: {filteredBookings.length} dari {bookings.length} booking
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleExportPdf}
                className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 border border-emerald-700/30 hover:shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                </svg>
                Export PDF
              </button>
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-lg group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Filter Status
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Search */}
            <div className="space-y-2 lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">
                Cari Booking
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari berdasarkan judul, user, atau tujuan..."
                  className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bookings Grid */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-white text-2xl">📊</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Data Booking</h2>
                  <p className="text-blue-100 text-sm">
                    Menampilkan {filteredBookings.length} booking
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {filteredBookings.length > 0 ? (
              <div className="space-y-4">
                {filteredBookings.map((booking, index) => (
                  <div 
                    key={booking.id} 
                    className="bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-200/50 hover:border-blue-200 group transform hover:-translate-y-1"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex-1 mb-4 xl:mb-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900 mb-1 text-lg group-hover:text-blue-600 transition-colors duration-300">
                              {booking.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">User:</span> {booking.user_email}
                            </p>
                            <p className="text-sm text-gray-500">
                              {booking.purpose}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getTypeBadge(booking.request_type)}
                            {getStatusBadge(booking.status)}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-6 text-sm">
                          <div className="flex items-center text-gray-600">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="font-medium">{new Date(booking.date).toLocaleDateString('id-ID')}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span className="font-medium">{booking.start_time} - {booking.end_time}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                              </svg>
                            </div>
                            <span className="font-medium">{booking.capacity} orang</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Detail Button */}
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowDetailModal(true);
                          }}
                          className="inline-flex items-center px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition-all duration-300 text-sm group"
                          title="Lihat Detail"
                        >
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(booking)}
                              className="inline-flex items-center px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 font-medium rounded-lg transition-all duration-300 text-sm group"
                              title="Approve"
                            >
                              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleReject(booking)}
                              className="inline-flex items-center px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-all duration-300 text-sm group"
                              title="Reject"
                            >
                              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-gradient-to-r from-gray-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-6xl">📋</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Tidak Ada Booking</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {filter === 'all' && !searchTerm
                    ? 'Belum ada booking yang dibuat'
                    : `Tidak ada booking yang sesuai dengan filter "${filter}" dan pencarian "${searchTerm}"`
                  }
                </p>
                {(filter !== 'all' || searchTerm) && (
                  <button
                    onClick={() => {
                      setFilter('all');
                      setSearchTerm('');
                    }}
                    className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-300"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                    <span className="text-white text-2xl">📋</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Detail Booking</h2>
                    <p className="text-blue-100 text-sm">{selectedBooking.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-300 group"
                >
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    Informasi User
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Email:</span>
                      <p className="font-semibold text-gray-900">{selectedBooking.user_email}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">PIC:</span>
                      <p className="font-semibold text-gray-900">{selectedBooking.pic_name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Kontak PIC:</span>
                      <p className="font-semibold text-gray-900">{selectedBooking.pic_contact}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </span>
                    Informasi Booking
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Jenis:</span>
                      <div className="mt-1">{getTypeBadge(selectedBooking.request_type)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Status:</span>
                      <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Kapasitas:</span>
                      <p className="font-semibold text-gray-900">{selectedBooking.capacity} orang</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purpose */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </span>
                  Tujuan
                </h3>
                <p className="text-gray-700 leading-relaxed">{selectedBooking.purpose}</p>
              </div>

              {/* Schedule */}
              <div className="bg-green-50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center">
                  <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                  Waktu & Tempat
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Tanggal:</span>
                    <p className="font-semibold text-gray-900">{new Date(selectedBooking.date).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Waktu:</span>
                    <p className="font-semibold text-gray-900">{selectedBooking.start_time} - {selectedBooking.end_time}</p>
                  </div>
                  {selectedBooking.room_name && (
                    <div>
                      <span className="text-sm text-gray-600">Ruangan:</span>
                      <p className="font-semibold text-gray-900">{selectedBooking.room_name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Zoom Info */}
              {(selectedBooking.zoom_link_manual || selectedBooking.zoom_link) && (
                <div className="bg-blue-50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </span>
                    Informasi Zoom
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Link:</span>
                      {selectedBooking.zoom_link_manual ? (
                        <div className="flex items-center mt-1">
                          <a 
                            href={selectedBooking.zoom_link_manual} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline break-all"
                          >
                            {selectedBooking.zoom_link_manual}
                          </a>
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Manual
                          </span>
                        </div>
                      ) : selectedBooking.zoom_link ? (
                        <div className="flex items-center mt-1">
                          <a 
                            href={selectedBooking.zoom_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline break-all"
                          >
                            {selectedBooking.zoom_link}
                          </a>
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            Auto
                          </span>
                        </div>
                      ) : (
                        <p className="text-gray-500 mt-1">-</p>
                      )}
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Meeting ID:</span>
                      {selectedBooking.zoom_meeting_id_manual ? (
                        <div className="flex items-center mt-1">
                          <p className="font-semibold text-gray-900">{selectedBooking.zoom_meeting_id_manual}</p>
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Manual
                          </span>
                        </div>
                      ) : selectedBooking.zoom_meeting_id ? (
                        <div className="flex items-center mt-1">
                          <p className="font-semibold text-gray-900">{selectedBooking.zoom_meeting_id}</p>
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            Auto
                          </span>
                        </div>
                      ) : (
                        <p className="text-gray-500 mt-1">-</p>
                      )}
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Passcode:</span>
                      {selectedBooking.zoom_passcode_manual ? (
                        <div className="flex items-center mt-1">
                          <p className="font-semibold text-gray-900">{selectedBooking.zoom_passcode_manual}</p>
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Manual
                          </span>
                        </div>
                      ) : selectedBooking.zoom_passcode ? (
                        <div className="flex items-center mt-1">
                          <p className="font-semibold text-gray-900">{selectedBooking.zoom_passcode}</p>
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            Auto
                          </span>
                        </div>
                      ) : (
                        <p className="text-gray-500 mt-1">-</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {(selectedBooking.status === 'rejected' && selectedBooking.rejection_reason) && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-r-2xl p-6">
                  <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Alasan Penolakan
                  </h3>
                  <p className="text-red-800">{selectedBooking.rejection_reason}</p>
                </div>
              )}

              {selectedBooking.admin_notes && (
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-2xl p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Catatan dari Admin
                  </h3>
                  <p className="text-blue-800">{selectedBooking.admin_notes}</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-8 py-4 rounded-b-3xl">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                    <span className="text-white text-2xl">✅</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Setujui Booking</h2>
                    <p className="text-green-100 text-sm">Persetujuan untuk booking user</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedZoomId('');
                    setAdminNotes('');
                    setZoomLinkManual('');
                    setZoomMeetingIdManual('');
                    setZoomPasscodeManual('');
                  }}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-300 group"
                >
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Booking Summary */}
              <div className="bg-green-50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-green-900 mb-4">Anda akan menyetujui booking:</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Judul:</span>
                    <span className="font-semibold text-gray-900">{selectedBooking.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">User:</span>
                    <span className="font-semibold text-gray-900">{selectedBooking.user_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tanggal:</span>
                    <span className="font-semibold text-gray-900">{new Date(selectedBooking.date).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Waktu:</span>
                    <span className="font-semibold text-gray-900">{selectedBooking.start_time} - {selectedBooking.end_time}</span>
                  </div>
                </div>
              </div>

              {/* Zoom Account Selection */}
              {(selectedBooking.request_type === 'zoom' || selectedBooking.request_type === 'both') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Pilih Zoom Account:
                    </label>
                    <select
                      value={selectedZoomId}
                      onChange={(e) => setSelectedZoomId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                      required
                    >
                      <option value="">-- Pilih Zoom Account --</option>
                      {zoomLinks.filter(z => z.is_active).map(zoom => (
                        <option key={zoom.id} value={zoom.id}>
                          {zoom.zoom_account_name} ({zoom.zoom_email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Manual Zoom Information */}
                  <div className="bg-blue-50 rounded-2xl p-6">
                    <h4 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                      <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </span>
                      Informasi Zoom Manual
                    </h4>
                    <p className="text-blue-700 text-sm mb-4">Isi informasi Zoom yang sebenarnya akan digunakan untuk meeting ini</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Link Zoom:</label>
                        <input
                          type="url"
                          value={zoomLinkManual}
                          onChange={(e) => setZoomLinkManual(e.target.value)}
                          placeholder="https://zoom.us/j/123456789?pwd=password123"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Meeting ID:</label>
                          <input
                            type="text"
                            value={zoomMeetingIdManual}
                            onChange={(e) => setZoomMeetingIdManual(e.target.value)}
                            placeholder="123 456 789"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Passcode:</label>
                          <input
                            type="text"
                            value={zoomPasscodeManual}
                            onChange={(e) => setZoomPasscodeManual(e.target.value)}
                            placeholder="password123"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📝 Catatan untuk User (Opsional):
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Berikan catatan tambahan untuk user (opsional)..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white resize-none text-gray-900"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Catatan ini akan dilihat oleh user di detail booking mereka.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 px-8 py-4 rounded-b-3xl">
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedZoomId('');
                    setAdminNotes('');
                    setZoomLinkManual('');
                    setZoomMeetingIdManual('');
                    setZoomPasscodeManual('');
                  }}
                  className="inline-flex items-center px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  Batal
                </button>
                <button 
                  onClick={() => submitApprove(selectedBooking?.id, selectedZoomId || null)}
                  disabled={
                    (selectedBooking?.request_type === 'zoom' || selectedBooking?.request_type === 'both') 
                    && !selectedZoomId
                  }
                  className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-300"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Setujui
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                    <span className="text-white text-2xl">❌</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Tolak Booking</h2>
                    <p className="text-red-100 text-sm">Penolakan untuk booking user</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-300 group"
                >
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Booking Summary */}
              <div className="bg-red-50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-red-900 mb-4">Anda akan menolak booking:</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Judul:</span>
                    <span className="font-semibold text-gray-900">{selectedBooking.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">User:</span>
                    <span className="font-semibold text-gray-900">{selectedBooking.user_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tanggal:</span>
                    <span className="font-semibold text-gray-900">{new Date(selectedBooking.date).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {/* Rejection Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Alasan Penolakan: *
                </label>
                <textarea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Jelaskan alasan penolakan..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white resize-none text-gray-900"
                  required
                />
              </div>
            </div>

            <div className="bg-gray-50 px-8 py-4 rounded-b-3xl">
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="inline-flex items-center px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  Batal
                </button>
                <button 
                  onClick={submitReject}
                  className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Tolak
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllBookings;