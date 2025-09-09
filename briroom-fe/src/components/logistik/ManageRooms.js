import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { logistikAPI } from '../../services/api';

const ManageRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    location: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching rooms for logistik...');
      
      const response = await logistikAPI.getRooms();
      console.log('✅ Rooms response:', response);
      
      // Handle response data with validation
      let roomsData = response.data || response;
      if (response.data?.data) {
        roomsData = response.data.data;
      }

      // Ensure it's an array
      if (!Array.isArray(roomsData)) {
        console.warn('⚠️ Rooms data is not an array:', roomsData);
        roomsData = [];
      }

      console.log('🏢 Processed rooms:', roomsData);
      setRooms(roomsData);
    } catch (error) {
      console.error('❌ Error fetching rooms:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 403) {
        toast.error(`Akses ditolak: ${error.response?.data?.message || 'Role tidak sesuai'}`);
      } else if (error.response?.status === 401) {
        toast.error('Sesi habis, silakan login kembali');
        window.location.href = '/login';
      } else {
        toast.error('Gagal memuat data ruangan: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (room = null) => {
    if (room) {
      setEditMode(true);
      setCurrentRoom(room);
      setFormData({
        name: room.name,
        capacity: room.capacity,
        location: room.location,
        description: room.description || '',
        is_active: room.is_active
      });
    } else {
      setEditMode(false);
      setCurrentRoom(null);
      setFormData({
        name: '',
        capacity: '',
        location: '',
        description: '',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setCurrentRoom(null);
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      console.log('🚀 Submitting room data:', formData);
      
      const submitData = {
        ...formData,
        capacity: parseInt(formData.capacity)
      };

      console.log('📝 Processed submit data:', submitData);

      if (editMode) {
        console.log('✏️ Updating room with ID:', currentRoom.id);
        const response = await logistikAPI.updateRoom(currentRoom.id, submitData);
        console.log('✅ Update response:', response);
        toast.success('Ruangan berhasil diperbarui!');
      } else {
        console.log('➕ Creating new room');
        const response = await logistikAPI.createRoom(submitData);
        console.log('✅ Create response:', response);
        toast.success('Ruangan berhasil ditambahkan!');
      }
      
      fetchRooms();
      handleCloseModal();
    } catch (error) {
      console.error('❌ Error saving room:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: error.config
      });
      
      if (error.response?.status === 401) {
        toast.error('Sesi habis, silakan login kembali');
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        toast.error(`Akses ditolak: ${error.response?.data?.message || 'Role tidak sesuai'}`);
      } else {
        toast.error('Gagal menyimpan ruangan: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleDeleteConfirm = (room) => {
    setRoomToDelete(room);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await logistikAPI.deleteRoom(roomToDelete.id);
      toast.success('Ruangan berhasil dihapus!');
      fetchRooms();
      setShowDeleteModal(false);
      setRoomToDelete(null);
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Gagal menghapus ruangan');
    }
  };

  // Filter rooms based on search and filter
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && room.is_active) ||
                         (filter === 'inactive' && !room.is_active);
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-lg">
        <span className="mr-1.5">✅</span>
        AKTIF
      </span>
    ) : (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg">
        <span className="mr-1.5">⏸️</span>
        NONAKTIF
      </span>
    );
  };

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
          <p className="text-gray-600 font-medium text-lg">Memuat data ruangan...</p>
          <p className="text-gray-500 text-sm mt-2">Tunggu sebentar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-[6rem] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white text-2xl">🏢</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Kelola Ruangan
                  </h1>
                  <p className="text-gray-600 font-medium">Manage ruangan meeting yang tersedia</p>
                  <p className="text-sm text-gray-500">
                    Total: {filteredRooms.length} ruangan ({rooms.filter(r => r.is_active).length} aktif)
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/logistik/dashboard"
                className="inline-flex items-center px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-lg group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Dashboard
              </Link>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tambah Ruangan
              </button>
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>

            {/* Search */}
            <div className="space-y-2 lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-700">
                Cari Ruangan
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
                  placeholder="Cari berdasarkan nama ruangan atau lokasi..."
                  className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-white text-2xl">🏢</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Data Ruangan</h2>
                  <p className="text-green-100 text-sm">
                    Menampilkan {filteredRooms.length} ruangan
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {filteredRooms.length > 0 ? (
              <div className="space-y-4">
                {filteredRooms.map((room, index) => (
                  <div 
                    key={room.id} 
                    className="bg-gradient-to-r from-gray-50 to-green-50/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-200/50 hover:border-green-200 group transform hover:-translate-y-1"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex-1 mb-4 xl:mb-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900 mb-1 text-lg group-hover:text-green-600 transition-colors duration-300">
                              {room.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Lokasi:</span> {room.location}
                            </p>
                            {room.description && (
                              <p className="text-sm text-gray-500">
                                {room.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(room.is_active)}
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <span className="font-medium text-gray-600">Kapasitas: {room.capacity} orang</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenModal(room)}
                          className="inline-flex items-center px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition-all duration-300 text-sm group"
                          title="Edit"
                        >
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteConfirm(room)}
                          className="inline-flex items-center px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-all duration-300 text-sm group"
                          title="Delete"
                        >
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {searchTerm || filter !== 'all' ? 'Tidak Ada Ruangan Ditemukan' : 'Belum Ada Ruangan'}
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {searchTerm || filter !== 'all' 
                    ? `Tidak ada ruangan yang sesuai dengan pencarian "${searchTerm}" dan filter "${filter}"`
                    : 'Tambahkan ruangan untuk dapat digunakan dalam booking meeting'
                  }
                </p>
                {searchTerm || filter !== 'all' ? (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilter('all');
                    }}
                    className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300"
                  >
                    Reset Filter
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Tambah Ruangan
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                    <span className="text-white text-2xl">{editMode ? '✏️' : '➕'}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {editMode ? 'Edit Ruangan' : 'Tambah Ruangan'}
                    </h2>
                    <p className="text-green-100 text-sm">
                      {editMode ? 'Perbarui informasi ruangan' : 'Tambahkan ruangan baru'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-300 group"
                >
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Nama Ruangan *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Contoh: Meeting Room A"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Kapasitas *
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    max="100"
                    placeholder="10"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Lokasi *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Contoh: Lantai 2, Wing A"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Deskripsi
                </label>
                <textarea
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Deskripsi fasilitas ruangan..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white resize-none text-gray-900"
                />
              </div>

              {/* Status */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-5 h-5 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <label htmlFor="is_active" className="ml-3 text-sm font-medium text-gray-700">
                    Aktif (dapat digunakan untuk booking)
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-8">
                  Ruangan yang aktif dapat dipilih saat melakukan booking
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="inline-flex items-center px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {editMode ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && roomToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-white text-2xl">🗑️</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Konfirmasi Hapus</h2>
                  <p className="text-red-100 text-sm">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-red-50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-red-900 mb-4">Anda akan menghapus ruangan:</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nama:</span>
                    <span className="font-semibold text-gray-900">{roomToDelete.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lokasi:</span>
                    <span className="font-semibold text-gray-900">{roomToDelete.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kapasitas:</span>
                    <span className="font-semibold text-gray-900">{roomToDelete.capacity} orang</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Peringatan!</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Ruangan yang dihapus tidak dapat dipulihkan dan tidak akan bisa digunakan untuk booking di masa depan.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-8 py-4 rounded-b-3xl">
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setRoomToDelete(null);
                  }}
                  className="inline-flex items-center px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRooms;