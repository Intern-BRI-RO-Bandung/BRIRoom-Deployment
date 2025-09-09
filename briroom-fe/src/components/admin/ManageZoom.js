import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminAPI } from '../../services/api';

const ManageZoom = () => {
  const [zoomLinks, setZoomLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [zoomToDelete, setZoomToDelete] = useState(null);
  const [formData, setFormData] = useState({
    zoom_account_name: '',
    zoom_email: '',
    zoom_link: '',
    meeting_id: '',
    passcode: '',
    is_active: true
  });

  useEffect(() => {
    fetchZoomLinks();
  }, []);

  const fetchZoomLinks = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching zoom links...');
      
      const response = await adminAPI.getZoomLinks();
      console.log('🔗 Zoom links response:', response);
      
      // Handle response data with validation
      let zoomLinksData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          zoomLinksData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          zoomLinksData = response.data.data;
        }
      }

      // Ensure it's an array
      if (!Array.isArray(zoomLinksData)) {
        console.warn('⚠️ Zoom links is not an array, setting to empty array');
        zoomLinksData = [];
      }

      console.log('📋 Processed zoom links:', zoomLinksData);
      setZoomLinks(zoomLinksData);
    } catch (error) {
      console.error('❌ Error fetching zoom links:', error);
      console.error('Error details:', error.response?.data);
      
      // Set empty array on error
      setZoomLinks([]);
      
      toast.error('Gagal memuat data zoom links');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (zoom = null) => {
    if (zoom) {
      setEditMode(true);
      setCurrentZoom(zoom);
      setFormData({
        zoom_account_name: zoom.zoom_account_name,
        zoom_email: zoom.zoom_email,
        zoom_link: zoom.zoom_link,
        meeting_id: zoom.meeting_id,
        passcode: zoom.passcode,
        is_active: zoom.is_active
      });
    } else {
      setEditMode(false);
      setCurrentZoom(null);
      setFormData({
        zoom_account_name: '',
        zoom_email: '',
        zoom_link: '',
        meeting_id: '',
        passcode: '',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setCurrentZoom(null);
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
      if (editMode) {
        await adminAPI.updateZoomLink(currentZoom.id, formData);
        toast.success('Zoom link berhasil diperbarui!');
      } else {
        await adminAPI.createZoomLink(formData);
        toast.success('Zoom link berhasil ditambahkan!');
      }
      
      fetchZoomLinks();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving zoom link:', error);
      toast.error('Gagal menyimpan zoom link');
    }
  };

  const handleDeleteConfirm = (zoom) => {
    setZoomToDelete(zoom);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await adminAPI.deleteZoomLink(zoomToDelete.id);
      toast.success('Zoom link berhasil dihapus!');
      fetchZoomLinks();
      setShowDeleteModal(false);
      setZoomToDelete(null);
    } catch (error) {
      console.error('Error deleting zoom link:', error);
      toast.error('Gagal menghapus zoom link');
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-primary-600 mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-primary-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-gray-600 font-medium text-lg">Memuat data zoom...</p>
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
                  <span className="text-white text-2xl">💻</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Kelola Zoom Accounts
                  </h1>
                  <p className="text-gray-600 font-medium">Manage zoom accounts untuk booking meeting</p>
                  <p className="text-sm text-gray-500">
                    Total: {zoomLinks.length} account ({zoomLinks.filter(z => z.is_active).length} aktif)
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-lg group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Dashboard
              </Link>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tambah Zoom Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Zoom Accounts */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-white text-2xl">🔗</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Zoom Accounts</h2>
                  <p className="text-blue-100 text-sm">
                    Menampilkan {zoomLinks.length} zoom account
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {zoomLinks.length > 0 ? (
              <div className="space-y-4">
                {zoomLinks.map((zoom, index) => (
                  <div 
                    key={zoom.id} 
                    className="bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-200/50 hover:border-blue-200 group transform hover:-translate-y-1"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex-1 mb-4 xl:mb-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-gray-900 mb-1 text-lg group-hover:text-blue-600 transition-colors duration-300">
                              {zoom.zoom_account_name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Email:</span> {zoom.zoom_email}
                            </p>
                            <div className="flex items-center text-sm text-gray-500">
                              <span className="font-medium mr-2">Meeting ID:</span>
                              <code className="bg-gray-100 px-2 py-1 rounded text-gray-900 mr-4">{zoom.meeting_id}</code>
                              <span className="font-medium mr-2">Passcode:</span>
                              <code className="bg-gray-100 px-2 py-1 rounded text-gray-900">{zoom.passcode}</code>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(zoom.is_active)}
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </div>
                          <a 
                            href={zoom.zoom_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline break-all font-medium transition-colors duration-200"
                          >
                            {zoom.zoom_link}
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenModal(zoom)}
                          className="inline-flex items-center px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition-all duration-300 text-sm group"
                          title="Edit"
                        >
                          <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteConfirm(zoom)}
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
                <div className="w-32 h-32 bg-gradient-to-r from-purple-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-6xl">💻</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Belum Ada Zoom Account</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Tambahkan zoom account untuk dapat digunakan dalam booking meeting
                </p>
                <button
                  onClick={() => handleOpenModal()}
                  className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Tambah Zoom Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                    <span className="text-white text-2xl">{editMode ? '✏️' : '➕'}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {editMode ? 'Edit Zoom Account' : 'Tambah Zoom Account'}
                    </h2>
                    <p className="text-blue-100 text-sm">
                      {editMode ? 'Perbarui informasi zoom account' : 'Tambahkan zoom account baru'}
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
                    Account Name *
                  </label>
                  <input
                    type="text"
                    name="zoom_account_name"
                    value={formData.zoom_account_name}
                    onChange={handleChange}
                    placeholder="Contoh: BRI Meeting Room 1"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Email Zoom *
                  </label>
                  <input
                    type="email"
                    name="zoom_email"
                    value={formData.zoom_email}
                    onChange={handleChange}
                    placeholder="meeting1@bri.co.id"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                    required
                  />
                </div>
              </div>

              {/* Meeting Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Meeting ID *
                  </label>
                  <input
                    type="text"
                    name="meeting_id"
                    value={formData.meeting_id}
                    onChange={handleChange}
                    placeholder="123-456-789"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Passcode *
                  </label>
                  <input
                    type="text"
                    name="passcode"
                    value={formData.passcode}
                    onChange={handleChange}
                    placeholder="password123"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                    required
                  />
                </div>
              </div>

              {/* Zoom Link */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Zoom Link *
                </label>
                <input
                  type="url"
                  name="zoom_link"
                  value={formData.zoom_link}
                  onChange={handleChange}
                  placeholder="https://zoom.us/j/123456789?pwd=..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                  required
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
                    className="w-5 h-5 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <label htmlFor="is_active" className="ml-3 text-sm font-medium text-gray-700">
                    Aktif (dapat digunakan untuk booking)
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-8">
                  Zoom account yang aktif dapat dipilih saat melakukan approval booking
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
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
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
      {showDeleteModal && zoomToDelete && (
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
                <h3 className="text-lg font-bold text-red-900 mb-4">Anda akan menghapus zoom account:</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account:</span>
                    <span className="font-semibold text-gray-900">{zoomToDelete.zoom_account_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-semibold text-gray-900">{zoomToDelete.zoom_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Meeting ID:</span>
                    <span className="font-semibold text-gray-900">{zoomToDelete.meeting_id}</span>
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
                      Zoom account yang dihapus tidak dapat dipulihkan dan tidak akan bisa digunakan untuk booking di masa depan.
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
                    setZoomToDelete(null);
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

export default ManageZoom;