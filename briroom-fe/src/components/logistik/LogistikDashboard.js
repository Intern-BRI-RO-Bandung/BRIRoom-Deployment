import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { bpmnAPI, logistikAPI, adminAPI } from '../../services/api';
import { getUser } from '../../utils/auth';

const LogistikDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    roomsAvailable: 0
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const user = getUser();

  useEffect(() => {
    fetchDashboardData();
    setGreetingMessage();
    
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
      
      let requests = [];
      let roomsList = [];

      try {
        const requestsResponse = await adminAPI.getAllRequests();
        
        let allRequests = [];
        if (requestsResponse.data && requestsResponse.data.success && requestsResponse.data.data) {
          allRequests = requestsResponse.data.data;
        } else if (Array.isArray(requestsResponse.data)) {
          allRequests = requestsResponse.data;
        } else {
          allRequests = [];
        }
        
        requests = allRequests.filter(req => 
          (req.request_type === 'room' && req.room_status === 'pending') || 
          (req.request_type === 'both' && req.room_status === 'pending')
        );

        
      } catch (adminError) {
        try {
          const requestsResponse = await bpmnAPI.getValidatedRequestsForLogistik();
          // requests = Array.isArray(requestsResponse.data) ? requestsResponse.data : [];
          requests = Array.isArray(requestsResponse.data) ? requestsResponse.data : [];
        } catch (bpmnError) {
          try {
            const requestsResponse = await logistikAPI.getRoomRequests();
            // requests = Array.isArray(requestsResponse.data) ? requestsResponse.data : [];
            requests = Array.isArray(requestsResponse.data) ? requestsResponse.data : [];
          } catch (logistikError) {
            requests = [];
          }
        }
      }

      try {
        const roomsRes = await logistikAPI.getRooms();
        
        if (roomsRes.data && roomsRes.data.success && roomsRes.data.data) {
          roomsList = roomsRes.data.data;
        } else if (Array.isArray(roomsRes.data)) {
          roomsList = roomsRes.data;
        } else {
          roomsList = [];
        }
      } catch (roomError) {
        roomsList = [];
      }

      const pendingRequests = requests.filter(req => 
        (req.room_status === 'pending' || req.status === 'pending')
      );
      
      const approvedRequests = requests.filter(req => 
        (req.room_status === 'approved' || req.status === 'approved')
      );
      const rejectedRequests = requests.filter(req => 
        (req.room_status === 'rejected' || req.status === 'rejected')
      );
      const availableRooms = roomsList.filter(r => r.is_active).length;

      const newStats = {
        total: requests.length,
        pending: pendingRequests.length,
        approved: approvedRequests.length,
        rejected: rejectedRequests.length,
        roomsAvailable: availableRooms
      };

      setStats(newStats);
      
      const sortedRequests = requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecentRequests(sortedRequests.slice(0, 10));
      setRooms(roomsList.filter(r => r.is_active));
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setAdminNotes('');
    if (request.request_type === 'room' || request.request_type === 'both') {
      setShowApproveModal(true);
    } else {
      submitApprove(request.id, null);
    }
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const handleDetail = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const submitApprove = async (requestId, roomId) => {
    try {
      try {
        const data = {
          action: 'approve'
        };
        if (roomId) {
          data.room_id = roomId;
          data.notes = `Ruangan disetujui oleh logistik`;
        }
        
        if (adminNotes.trim()) {
          data.admin_notes = adminNotes.trim();
        }
        
        await bpmnAPI.logistikApproveRoom(requestId, data);
        
        if (selectedRequest.request_type === 'room') {
          toast.success('✅ Ruangan berhasil disetujui dan request diselesaikan!');
        } else if (selectedRequest.request_type === 'both') {
          toast.success('✅ Ruangan disetujui! Request diselesaikan sepenuhnya.');
        }
        
      } catch (bpmnError) {
        const data = roomId ? { 
          room_id: roomId, 
          notes: 'Ruangan disetujui oleh logistik',
          admin_notes: adminNotes.trim() || undefined
        } : {
          admin_notes: adminNotes.trim() || undefined
        };
        await logistikAPI.approveRoomRequest(requestId, data);
        toast.success('Request berhasil disetujui!');
      }
      
      fetchDashboardData();
      setShowApproveModal(false);
      setSelectedRoomId('');
      setAdminNotes('');
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Gagal menyetujui request');
    }
  };

  const submitReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Alasan penolakan harus diisi');
      return;
    }

    try {
      try {
        await bpmnAPI.logistikRejectRoom(selectedRequest.id, {
          action: 'reject',
          notes: rejectionReason
        });
        toast.success('✅ Request berhasil ditolak!');
        
      } catch (bpmnError) {
        await logistikAPI.rejectRoomRequest(selectedRequest.id, { reason: rejectionReason });
        toast.success('Request berhasil ditolak!');
      }

      fetchDashboardData();
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Gagal menolak request');
    }
  };

  const getStatusBadge = (request) => {
    const status = request.room_status || request.status;
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

  const StatCard = ({ icon, title, value, subtitle, gradient, trend, delay = 0 }) => (
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-green-200 border-t-green-600 mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-green-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-gray-600 font-medium text-lg">Memuat dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Tunggu sebentar</p>
        </div>
      </div>
    );
  }

  // Continue to Part 2...
    // ...continued from Part 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
      {/* Modern Header Section */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-[6rem] z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <span className="text-white text-2xl animate-pulse">🏢</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {greeting}, Logistik!
                  </h1>
                  <p className="text-gray-600 font-medium">{user?.name || user?.email}</p>
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
                to="/logistik/rooms"
                className="inline-flex items-center px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-lg group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Kelola Ruangan
              </Link>
              <Link
                to="/logistik/bookings"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Semua Booking
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role Information */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mr-4 flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-900 mb-2">Role Logistik</h3>
              <p className="text-green-700 text-sm leading-relaxed">
                Anda bertanggung jawab untuk mengelola dan menyetujui penggunaan ruangan. 
                Request yang memerlukan <span className="font-semibold">ruangan</span> akan dialokasikan ruangan oleh Anda 
                setelah mendapat validasi dari Admin IT.
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            icon="📋"
            title="Total Request"
            value={stats.total}
            subtitle="Request ruangan"
            gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
            trend={3}
            delay={0}
          />
          <StatCard
            icon="⏳"
            title="Pending"
            value={stats.pending}
            subtitle="Menunggu approval"
            gradient="bg-gradient-to-r from-amber-500 to-orange-500"
            delay={100}
          />
          <StatCard
            icon="✅"
            title="Approved"
            value={stats.approved}
            subtitle="Sudah disetujui"
            gradient="bg-gradient-to-r from-emerald-500 to-green-500"
            trend={8}
            delay={200}
          />
          <StatCard
            icon="❌"
            title="Rejected"
            value={stats.rejected}
            subtitle="Ditolak"
            gradient="bg-gradient-to-r from-rose-500 to-red-500"
            delay={300}
          />
          <StatCard
            icon="🏢"
            title="Ruangan Aktif"
            value={stats.roomsAvailable}
            subtitle="Siap digunakan"
            gradient="bg-gradient-to-r from-green-500 to-emerald-500"
            trend={2}
            delay={400}
          />
        </div>

        {/* Modern Recent Requests Section */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden mb-8 animate-slide-up">
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-white text-2xl">📋</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Request Terbaru</h2>
                  <p className="text-green-100 text-sm">Request ruangan yang membutuhkan perhatian Anda</p>
                </div>
              </div>
              <Link
                to="/logistik/bookings"
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
            {recentRequests.length > 0 ? (
              <div className="space-y-4">
                {recentRequests.map((request, index) => (
                  <div 
                    key={request.id} 
                    className="bg-gradient-to-r from-gray-50 to-green-50/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-200/50 hover:border-green-200 group transform hover:-translate-y-1"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex-1 mb-4 xl:mb-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900 mb-1 text-lg group-hover:text-green-600 transition-colors duration-300">
                              {request.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">User:</span> {request.user_email}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getTypeBadge(request.request_type)}
                            {getStatusBadge(request)}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-6 text-sm">
                          <div className="flex items-center text-gray-600">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="font-medium">{new Date(request.date).toLocaleDateString('id-ID')}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span className="font-medium">{request.start_time} - {request.end_time}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <span className="font-medium">{request.capacity} orang</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Detail Button */}
                        <button
                          onClick={() => handleDetail(request)}
                          className="inline-flex items-center px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition-all duration-300 text-sm group"
                          title="Lihat Detail"
                        >
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {(request.room_status === 'pending' || request.status === 'pending') && (
                          <>
                            {(request.request_type === 'room' || request.request_type === 'both') && (
                              <>
                                <button
                                  onClick={() => handleApprove(request)}
                                  className="inline-flex items-center px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 font-medium rounded-lg transition-all duration-300 text-sm group"
                                  title="Approve Room"
                                >
                                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleReject(request)}
                                  className="inline-flex items-center px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-all duration-300 text-sm group"
                                  title="Reject Room"
                                >
                                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            )}
                            {request.request_type === 'zoom' && (
                              <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                                Hanya untuk Admin IT
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-gradient-to-r from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-6xl">🏢</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Tidak Ada Request Terbaru</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Semua request ruangan telah diproses atau belum ada request baru yang membutuhkan perhatian Anda
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      // ...existing code...

      {/* Modals */}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                    <span className="text-white text-2xl">📋</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Detail Request</h2>
                    <p className="text-green-100 text-sm">ID: #{selectedRequest.id}</p>
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
              {/* Status & Type */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getTypeBadge(selectedRequest.request_type)}
                  {getStatusBadge(selectedRequest)}
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-800">
                  ID: #{selectedRequest.id}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Request Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                    Informasi Request
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Judul:</span>
                      <span className="font-semibold text-gray-900">{selectedRequest.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Purpose:</span>
                      <span className="font-semibold text-gray-900">{selectedRequest.purpose}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jenis Request:</span>
                      <span className="font-semibold text-gray-900">{selectedRequest.request_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kapasitas:</span>
                      <span className="font-semibold text-gray-900">{selectedRequest.capacity} orang</span>
                    </div>
                  </div>
                </div>

                {/* User & Time Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                    Informasi User & Waktu
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">User:</span>
                      <span className="font-semibold text-gray-900">{selectedRequest.user_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-semibold text-gray-900">{selectedRequest.user_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tanggal:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(selectedRequest.date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Waktu:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedRequest.start_time} - {selectedRequest.end_time}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(selectedRequest.created_at).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Room Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                  Informasi Ruangan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ruangan:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedRequest.room_name || 'Belum dialokasi'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status Ruangan:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedRequest.room_status || 'pending'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Diproses:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedRequest.room_approved_at 
                        ? new Date(selectedRequest.room_approved_at).toLocaleString('id-ID')
                        : 'Belum diproses'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {(selectedRequest.admin_notes || selectedRequest.zoom_notes || selectedRequest.room_notes) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                    Catatan
                  </h3>
                  
                  {selectedRequest.admin_notes && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                      <div className="flex">
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-blue-800">📝 Catatan dari Admin</h4>
                          <p className="text-sm text-blue-700 mt-1">{selectedRequest.admin_notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedRequest.zoom_notes && (
                    <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg">
                      <div className="flex">
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-purple-800">🔗 Catatan Zoom</h4>
                          <p className="text-sm text-purple-700 mt-1">{selectedRequest.zoom_notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedRequest.room_notes && selectedRequest.room_notes !== 'Tidak ada catatan' && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                      <div className="flex">
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-green-800">🏢 Catatan Ruangan</h4>
                          <p className="text-sm text-green-700 mt-1">{selectedRequest.room_notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-8 py-4 rounded-b-3xl">
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="inline-flex items-center px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  Tutup
                </button>
                {(selectedRequest.room_status === 'pending' || selectedRequest.status === 'pending') && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleApprove(selectedRequest);
                      }}
                      className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleReject(selectedRequest);
                      }}
                      className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-300"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                    <span className="text-white text-2xl">✅</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Setujui Request</h2>
                    <p className="text-green-100 text-sm">Pilih ruangan dan tambahkan catatan</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedRoomId('');
                    setAdminNotes('');
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
              {/* Request Summary */}
              <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                <h3 className="text-lg font-bold text-green-900 mb-4">Request yang akan disetujui:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-700 font-medium">Judul:</span>
                    <p className="text-green-900 font-semibold">{selectedRequest.title}</p>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">User:</span>
                    <p className="text-green-900 font-semibold">{selectedRequest.user_email}</p>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">Tanggal:</span>
                    <p className="text-green-900 font-semibold">
                      {new Date(selectedRequest.date).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">Waktu:</span>
                    <p className="text-green-900 font-semibold">
                      {selectedRequest.start_time} - {selectedRequest.end_time}
                    </p>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">Kapasitas:</span>
                    <p className="text-green-900 font-semibold">{selectedRequest.capacity} orang</p>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">Purpose:</span>
                    <p className="text-green-900 font-semibold">{selectedRequest.purpose}</p>
                  </div>
                </div>
              </div>

              {/* Room Selection */}
              {(selectedRequest.request_type === 'room' || selectedRequest.request_type === 'both') && (
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    Pilih Ruangan *
                  </label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                    required
                  >
                    <option value="">Pilih ruangan yang tersedia</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.name} - {room.location} (Kapasitas: {room.capacity} orang)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">
                    Pilih ruangan yang sesuai dengan kapasitas dan kebutuhan meeting
                  </p>
                </div>
              )}

              {/* Admin Notes */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Catatan Logistik (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Tambahkan catatan khusus untuk user (opsional)..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white resize-none text-gray-900"
                />
                <p className="text-xs text-gray-500">
                  Catatan ini akan dikirim ke user sebagai informasi tambahan
                </p>
              </div>

              {/* Important Info */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <div className="flex">
                  <svg className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Informasi Penting</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      {selectedRequest.request_type === 'room' 
                        ? 'Setelah approval, request akan selesai dan user akan mendapat notifikasi.'
                        : 'Request ruangan akan disetujui. Jika jenis "both", request akan selesai sepenuhnya.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-8 py-4 rounded-b-3xl">
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedRoomId('');
                    setAdminNotes('');
                  }}
                  className="inline-flex items-center px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if ((selectedRequest.request_type === 'room' || selectedRequest.request_type === 'both') && !selectedRoomId) {
                      toast.error('Silakan pilih ruangan terlebih dahulu');
                      return;
                    }
                    submitApprove(selectedRequest.id, selectedRoomId || null);
                  }}
                  className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Setujui Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                    <span className="text-white text-2xl">❌</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Tolak Request</h2>
                    <p className="text-red-100 text-sm">Berikan alasan penolakan yang jelas</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
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
              {/* Request Summary */}
              <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
                <h3 className="text-lg font-bold text-red-900 mb-4">Request yang akan ditolak:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-red-700 font-medium">Judul:</span>
                    <p className="text-red-900 font-semibold">{selectedRequest.title}</p>
                  </div>
                  <div>
                    <span className="text-red-700 font-medium">User:</span>
                    <p className="text-red-900 font-semibold">{selectedRequest.user_email}</p>
                  </div>
                  <div>
                    <span className="text-red-700 font-medium">Tanggal:</span>
                    <p className="text-red-900 font-semibold">
                      {new Date(selectedRequest.date).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <span className="text-red-700 font-medium">Waktu:</span>
                    <p className="text-red-900 font-semibold">
                      {selectedRequest.start_time} - {selectedRequest.end_time}
                    </p>
                  </div>
                  <div>
                    <span className="text-red-700 font-medium">Kapasitas:</span>
                    <p className="text-red-900 font-semibold">{selectedRequest.capacity} orang</p>
                  </div>
                  <div>
                    <span className="text-red-700 font-medium">Purpose:</span>
                    <p className="text-red-900 font-semibold">{selectedRequest.purpose}</p>
                  </div>
                </div>
              </div>

              {/* Rejection Reason */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Alasan Penolakan *
                </label>
                <textarea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Jelaskan alasan mengapa request ini ditolak..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-white resize-none text-gray-900"
                  required
                />
                <p className="text-xs text-gray-500">
                  Alasan ini akan dikirim ke user untuk memberikan penjelasan yang jelas
                </p>
              </div>

              {/* Common Rejection Reasons */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Pilih Alasan Umum (Opsional)
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    'Ruangan tidak tersedia pada waktu yang diminta',
                    'Kapasitas ruangan tidak sesuai dengan kebutuhan',
                    'Konflik jadwal dengan booking lain',
                    'Tujuan meeting tidak sesuai dengan kebijakan',
                    'Informasi request tidak lengkap',
                    'Request melebihi batas waktu pemesanan'
                  ].map((reason, index) => (
                    <button
                      key={index}
                      onClick={() => setRejectionReason(reason)}
                      className="text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Peringatan!</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Penolakan ini bersifat final. User akan menerima notifikasi dengan alasan yang Anda berikan.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-8 py-4 rounded-b-3xl">
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="inline-flex items-center px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  Batal
                </button>
                <button
                  onClick={submitReject}
                  className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Tolak Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogistikDashboard;