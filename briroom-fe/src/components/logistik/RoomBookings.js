import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { bpmnAPI, logistikAPI, adminAPI } from '../../services/api';
import { exportAPI } from '../../services/api';

const RoomBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    requestType: 'all',
    search: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('🔄 [ROOM BOOKINGS] Fetching room bookings history for logistik...');
      
      let requests = [];

      try {
        console.log('🔍 [ROOM BOOKINGS] Fetching all requests for history...');
        const requestsResponse = await adminAPI.getAllRequests();
        console.log('✅ [ROOM BOOKINGS] Admin API success:', requestsResponse);
        
        let allRequests = [];
        if (requestsResponse.data && requestsResponse.data.success && requestsResponse.data.data) {
          allRequests = requestsResponse.data.data;
        } else if (Array.isArray(requestsResponse.data)) {
          allRequests = requestsResponse.data;
        } else {
          allRequests = [];
        }
        
        // Filter for room-related requests only (room dan both)
        requests = allRequests.filter(req => 
          req.request_type === 'room' || req.request_type === 'both'
        );
        
      } catch (adminError) {
        console.log('⚠️ [ROOM BOOKINGS] Admin API failed:', adminError);
        requests = [];
      }

      // Sort by date (newest first) 
      const sortedRequests = requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setBookings(sortedRequests);
      
      console.log('✅ [ROOM BOOKINGS] Bookings loaded successfully:', sortedRequests.length, 'items');
      
    } catch (error) {
      console.error('❌ [ROOM BOOKINGS] Error fetching bookings:', error);
      setBookings([]);
      toast.error('Gagal memuat data booking');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(booking => {
        const status = booking.room_status || booking.status;
        return status === filters.status;
      });
    }

    // Request type filter
    if (filters.requestType !== 'all') {
      filtered = filtered.filter(booking => booking.request_type === filters.requestType);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(booking => 
        new Date(booking.date) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(booking => 
        new Date(booking.date) <= new Date(filters.dateTo)
      );
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.title?.toLowerCase().includes(searchLower) ||
        booking.purpose?.toLowerCase().includes(searchLower) ||
        booking.user_name?.toLowerCase().includes(searchLower) ||
        booking.user_email?.toLowerCase().includes(searchLower) ||
        booking.room_name?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredBookings(filtered);
  };

  const handleExportPdf = async () => {
    try {
      const params = {
        status: filters.status !== 'all' ? filters.status : undefined,
        request_type: filters.requestType !== 'all' ? filters.requestType : 'room',
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined
      };
      const response = await exportAPI.requestsPdf(params);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rekap-room-${new Date().toISOString().slice(0,10)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export PDF failed:', e);
      toast.error('Gagal mengunduh PDF');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      requestType: 'all',
      search: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const getStatusBadge = (booking) => {
    const status = booking.room_status || booking.status;
    const statusConfig = {
      pending: { class: 'bg-amber-100 text-amber-700 border-amber-200', label: 'PENDING' },
      approved: { class: 'bg-green-100 text-green-700 border-green-200', label: 'APPROVED' },
      rejected: { class: 'bg-red-100 text-red-700 border-red-200', label: 'REJECTED' },
      completed: { class: 'bg-blue-100 text-blue-700 border-blue-200', label: 'COMPLETED' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      room: { class: 'bg-blue-100 text-blue-700 border-blue-200', text: 'Ruangan' },
      both: { class: 'bg-green-100 text-green-700 border-green-200', text: 'Ruangan + Zoom' }
    };

    const config = typeConfig[type] || { class: 'bg-gray-100 text-gray-700 border-gray-200', text: type };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDetail = (booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const StatCard = ({ icon, title, value, subtitle, gradient, delay = 0 }) => (
    <div 
      className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 group relative overflow-hidden animate-fade-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-14 h-14 ${gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <span className="text-2xl">{icon}</span>
          </div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-green-200 border-t-green-600 mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-green-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-gray-600 font-medium text-lg">Memuat history booking...</p>
          <p className="text-gray-500 text-sm mt-2">Tunggu sebentar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">History Booking Ruangan</h1>
              <p className="text-gray-600 mt-1">Riwayat semua pengajuan ruangan yang masuk ke logistik</p>
              <p className="text-sm text-gray-500 mt-1">
                Menampilkan {filteredBookings.length} dari {bookings.length} booking
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleExportPdf}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                </svg>
                Export PDF
              </button>
              <Link
                to="/logistik/dashboard"
                className="inline-flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            icon="📋"
            title="Total Filtered"
            value={filteredBookings.length}
            subtitle={`Dari ${bookings.length} total`}
            gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
            delay={0}
          />
          <StatCard
            icon="⏳"
            title="Pending"
            value={filteredBookings.filter(b => (b.room_status || b.status) === 'pending').length}
            subtitle="Menunggu approval"
            gradient="bg-gradient-to-r from-amber-500 to-orange-500"
            delay={100}
          />
          <StatCard
            icon="✅"
            title="Approved"
            value={filteredBookings.filter(b => (b.room_status || b.status) === 'approved').length}
            subtitle="Sudah disetujui"
            gradient="bg-gradient-to-r from-emerald-500 to-green-500"
            delay={200}
          />
          <StatCard
            icon="❌"
            title="Rejected"
            value={filteredBookings.filter(b => (b.room_status || b.status) === 'rejected').length}
            subtitle="Ditolak"
            gradient="bg-gradient-to-r from-rose-500 to-red-500"
            delay={300}
          />
        </div>

        {/* Simplified Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Request Type Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Request</label>
              <select
                value={filters.requestType}
                onChange={(e) => handleFilterChange('requestType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">Semua Jenis</option>
                <option value="room">Ruangan Only</option>
                <option value="both">Ruangan + Zoom</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Cari</label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Judul, user, purpose..."
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Dari Tanggal</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Sampai Tanggal</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Reset Button */}
            <div>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">History Booking Ruangan</h2>
            <p className="text-sm text-gray-600 mt-1">
              Menampilkan {filteredBookings.length} dari {bookings.length} booking
            </p>
          </div>

          <div className="p-6">
            {filteredBookings.length > 0 ? (
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <div 
                    key={booking.id} 
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1 mb-4 lg:mb-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg mb-1">
                              {booking.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">User:</span> {booking.user_email}
                            </p>
                            <p className="text-sm text-gray-500 mb-3">
                              {booking.purpose}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getTypeBadge(booking.request_type)}
                            {getStatusBadge(booking)}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(booking.date)}
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {booking.start_time} - {booking.end_time}
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                            {booking.capacity} orang
                          </div>
                          {booking.room_name && (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              {booking.room_name}
                            </div>
                          )}
                        </div>

                        {booking.room_notes && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-200">
                            <p className="text-sm text-green-700">
                              <span className="font-medium">📝 Notes:</span> {booking.room_notes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDetail(booking)}
                          className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-lg transition-colors text-sm"
                          title="Lihat Detail"
                        >
                          Detail
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Booking</h3>
                <p className="text-gray-500 mb-4">
                  {bookings.length === 0
                    ? 'Belum ada booking ruangan yang dibuat'
                    : 'Tidak ada booking yang sesuai dengan filter'
                  }
                </p>
                {(filters.status !== 'all' || filters.requestType !== 'all' || filters.search || filters.dateFrom || filters.dateTo) && (
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
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
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                    <span className="text-white text-2xl">📋</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Detail Booking</h2>
                    <p className="text-green-100 text-sm">ID: #{selectedBooking.id}</p>
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

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                    Informasi Request
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="font-semibold text-gray-900">#{selectedBooking.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Judul:</span>
                      <span className="font-semibold text-gray-900">{selectedBooking.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Purpose:</span>
                      <span className="font-semibold text-gray-900">{selectedBooking.purpose}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jenis:</span>
                      <span>{getTypeBadge(selectedBooking.request_type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span>{getStatusBadge(selectedBooking)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                    Informasi Waktu & User
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">User:</span>
                      <span className="font-semibold text-gray-900">{selectedBooking.user_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-semibold text-gray-900">{selectedBooking.user_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tanggal:</span>
                      <span className="font-semibold text-gray-900">{formatDate(selectedBooking.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Waktu:</span>
                      <span className="font-semibold text-gray-900">{selectedBooking.start_time} - {selectedBooking.end_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kapasitas:</span>
                      <span className="font-semibold text-gray-900">{selectedBooking.capacity} orang</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                  Informasi Ruangan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ruangan:</span>
                    <span className="font-semibold text-gray-900">{selectedBooking.room_name || 'Belum dialokasi'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Diproses:</span>
                    <span className="font-semibold text-gray-900">{formatDateTime(selectedBooking.room_approved_at)}</span>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {(selectedBooking.admin_notes || selectedBooking.zoom_notes || selectedBooking.room_notes) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                    Catatan
                  </h3>
                  
                  {selectedBooking.admin_notes && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                      <div className="flex">
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-blue-800">📝 Catatan dari Admin</h4>
                          <p className="text-sm text-blue-700 mt-1">{selectedBooking.admin_notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedBooking.zoom_notes && (
                    <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg">
                      <div className="flex">
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-purple-800">🔗 Catatan Zoom</h4>
                          <p className="text-sm text-purple-700 mt-1">{selectedBooking.zoom_notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedBooking.room_notes && selectedBooking.room_notes !== 'Tidak ada catatan' && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                      <div className="flex">
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-green-800">🏢 Catatan Ruangan</h4>
                          <p className="text-sm text-green-700 mt-1">{selectedBooking.room_notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-8 py-4 rounded-b-3xl">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="inline-flex items-center px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300"
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

export default RoomBookings;