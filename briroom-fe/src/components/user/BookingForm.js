import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { toast } from 'react-toastify';
import { userAPI } from '../../services/api';
import "react-datepicker/dist/react-datepicker.css";

const BookingForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    purpose: '',
    request_type: 'room',
    date: new Date(),
    start_time: '',
    end_time: '',
    capacity: '',
    pic_name: '',
    pic_contact: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      date: date
    });
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.title.trim()) return 'Judul acara harus diisi';
    if (!formData.purpose.trim()) return 'Tujuan harus diisi';
    if (!formData.start_time) return 'Waktu mulai harus diisi';
    if (!formData.end_time) return 'Waktu selesai harus diisi';
    if (!formData.capacity || formData.capacity < 1) return 'Kapasitas harus valid';
    if (!formData.pic_name.trim()) return 'Nama PIC harus diisi';
    if (!formData.pic_contact.trim()) return 'Kontak PIC harus diisi';

    // Validate time
    if (formData.start_time >= formData.end_time) {
      return 'Waktu selesai harus lebih besar dari waktu mulai';
    }

    // Validate date (not in the past)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (formData.date < today) {
      return 'Tanggal tidak boleh di masa lalu';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        date: formData.date.toISOString().split('T')[0], // Format YYYY-MM-DD
        capacity: parseInt(formData.capacity),
        pic_contact: formData.pic_contact, // Save to proper pic_contact field
        whatsapp_number: formData.pic_contact // Also save to whatsapp for backward compatibility
      };

      console.log('🔄 Submitting booking data:', submitData);
      await userAPI.createBooking(submitData);
      toast.success('Booking berhasil diajukan!');
      navigate('/user/mybookings');
    } catch (error) {
      console.error('❌ Booking submission error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 'Gagal membuat booking';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      // Validate step 1 fields
      if (!formData.title.trim() || !formData.purpose.trim()) {
        setError('Mohon lengkapi informasi acara terlebih dahulu');
        return;
      }
    }
    setStep(step + 1);
    setError('');
  };

  const prevStep = () => {
    setStep(step - 1);
    setError('');
  };

  const getRequestTypeIcon = (type) => {
    switch (type) {
      case 'room': return '🏢';
      case 'zoom': return '💻';
      case 'both': return '🔗';
      default: return '📝';
    }
  };

  const getStepTitle = (stepNumber) => {
    switch (stepNumber) {
      case 1: return 'Informasi Acara';
      case 2: return 'Waktu & Tempat';
      case 3: return 'Kontak PIC';
      default: return 'Form Booking';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                <span className="text-white text-xl">📝</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Buat Booking Baru
                </h1>
                <p className="text-gray-600">Langkah {step} dari 3 - {getStepTitle(step)}</p>
              </div>
            </div>
            <Link
              to="/user/dashboard"
              className="inline-flex items-center px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-lg group"
            >
              <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali
            </Link>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-8">
          <div className="flex items-center mb-4">
  {/* Step 1 */}
  <div className="flex flex-col items-center">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
      step >= 1
        ? 'bg-gradient-to-r from-primary-500 to-blue-600 text-white shadow-lg'
        : 'bg-gray-200 text-gray-500'
    }`}>
      {step > 1 ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        1
      )}
    </div>
    <span className={step >= 1 ? 'text-primary-600 font-medium mt-2' : 'text-gray-600 mt-2'}>Informasi Acara</span>
  </div>
  {/* Garis antara 1 dan 2 */}
  <div className={`flex-1 h-1 mx-4 rounded-full transition-all duration-300 ${
    step > 1 ? 'bg-gradient-to-r from-primary-500 to-blue-600' : 'bg-gray-200'
  }`} />
  {/* Step 2 */}
  <div className="flex flex-col items-center">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
      step >= 2
        ? 'bg-gradient-to-r from-primary-500 to-blue-600 text-white shadow-lg'
        : 'bg-gray-200 text-gray-500'
    }`}>
      {step > 2 ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        2
      )}
    </div>
    <span className={step >= 2 ? 'text-primary-600 font-medium mt-2' : 'text-gray-600 mt-2'}>Waktu & Tempat</span>
  </div>
  {/* Garis antara 2 dan 3 */}
  <div className={`flex-1 h-1 mx-4 rounded-full transition-all duration-300 ${
    step > 2 ? 'bg-gradient-to-r from-primary-500 to-blue-600' : 'bg-gray-200'
  }`} />
  {/* Step 3 */}
  <div className="flex flex-col items-center">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
      step >= 3
        ? 'bg-gradient-to-r from-primary-500 to-blue-600 text-white shadow-lg'
        : 'bg-gray-200 text-gray-500'
    }`}>
      3
    </div>
    <span className={step >= 3 ? 'text-primary-600 font-medium mt-2' : 'text-gray-600 mt-2'}>Kontak PIC</span>
  </div>
</div>
          
        </div>

        {/* Main Form */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 m-6 rounded-xl animate-fade-in">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-red-600">⚠️</span>
                </div>
                <div>
                  <h4 className="text-red-800 font-medium">Perhatian!</h4>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8">
            {/* Step 1: Event Information */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Informasi Acara</h2>
                  <p className="text-gray-600">Berikan detail tentang acara yang akan Anda adakan</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Judul Acara *
                    </label>
                    <input
  type="text"
  name="title"
  value={formData.title}
  onChange={handleChange}
  placeholder="Contoh: Meeting Project Alpha"
  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900"
  required
/>
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Jenis Booking *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
  {[
    { value: 'room', label: 'Ruangan Saja', icon: '🏢', desc: 'Booking ruangan fisik' },
    { value: 'zoom', label: 'Zoom Saja', icon: '💻', desc: 'Meeting virtual' },
    { value: 'both', label: 'Ruangan + Zoom', icon: '🔗', desc: 'Hybrid meeting' }
  ].map((option) => (
    <label key={option.value} className="cursor-pointer h-full flex">
      <input
        type="radio"
        name="request_type"
        value={option.value}
        checked={formData.request_type === option.value}
        onChange={handleChange}
        className="sr-only"
      />
      <div className={`
        flex-1 h-full flex flex-col justify-center
        p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg
        ${formData.request_type === option.value
          ? 'border-primary-500 bg-primary-50 shadow-lg'
          : 'border-gray-200 bg-white hover:border-gray-300'
        }
      `}>
        <div className="text-center">
          <span className="text-3xl mb-3 block">{option.icon}</span>
          <h3 className={`font-semibold mb-1 ${
            formData.request_type === option.value ? 'text-primary-700' : 'text-gray-900'
          }`}>
            {option.label}
          </h3>
          <p className="text-sm text-gray-600">{option.desc}</p>
        </div>
      </div>
    </label>
  ))}
</div>
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Tujuan/Keperluan *
                    </label>
                    <textarea
  name="purpose"
  value={formData.purpose}
  onChange={handleChange}
  rows={4}
  placeholder="Jelaskan tujuan penggunaan ruangan atau zoom..."
  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm resize-none text-gray-900"
  required
/>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Time & Place */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-3xl">📅</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Waktu & Tempat</h2>
                  <p className="text-gray-600">Tentukan kapan dan berapa kapasitas yang dibutuhkan</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Tanggal *
                    </label>
                    <div className="relative">
                      <DatePicker
  selected={formData.date}
  onChange={handleDateChange}
  minDate={new Date()}
  dateFormat="dd/MM/yyyy"
  className="w-full px-4 py-3 pl-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm text-gray-900"
  required
/>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {/* <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg> */}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Kapasitas *
                    </label>
                    <div className="relative">
                      <input
  type="number"
  name="capacity"
  value={formData.capacity}
  onChange={handleChange}
  min="1"
  max="1000"
  placeholder="Jumlah peserta"
  className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm pl-11 text-gray-900"
  required
/>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {/* <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg> */}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Waktu Mulai *
                    </label>
                    <div className="relative">
                      <input
  type="time"
  name="start_time"
  value={formData.start_time}
  onChange={handleChange}
  className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm pl-12 text-gray-900"
  required
/>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {/* <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg> */}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Waktu Selesai *
                    </label>
                    <div className="relative">
                      <input
  type="time"
  name="end_time"
  value={formData.end_time}
  onChange={handleChange}
  className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm pl-12 text-gray-900"
  required
/>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {/* <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg> */}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time Duration Info */}
                {formData.start_time && formData.end_time && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-blue-600">ℹ️</span>
                      </div>
                      <div>
                        <h4 className="text-blue-900 font-medium">Durasi Meeting</h4>
                        <p className="text-blue-700">
                          {formData.start_time} - {formData.end_time} 
                          {(() => {
                            const start = new Date(`2000-01-01T${formData.start_time}`);
                            const end = new Date(`2000-01-01T${formData.end_time}`);
                            const duration = (end - start) / (1000 * 60 * 60);
                            return duration > 0 ? ` (${duration} jam)` : '';
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: PIC Contact */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-3xl">👤</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Kontak PIC</h2>
                  <p className="text-gray-600">Informasi Person in Charge untuk acara ini</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Nama PIC *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="pic_name"
                        value={formData.pic_name}
                        onChange={handleChange}
                        placeholder="Nama Person in Charge"
                        className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm pl-12"
                        required
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {/* <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg> */}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Kontak PIC *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="pic_contact"
                        value={formData.pic_contact}
                        onChange={handleChange}
                        placeholder="Nomor HP atau Email"
                        className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm pl-12"
                        required
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {/* <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg> */}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-blue-600">📋</span>
                    </span>
                    Ringkasan Booking
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Acara:</span>
                      <p className="font-semibold text-gray-900">{formData.title || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Jenis:</span>
                      <p className="font-semibold text-gray-900 flex items-center">
                        <span className="mr-2">{getRequestTypeIcon(formData.request_type)}</span>
                        {formData.request_type === 'room' ? 'Ruangan Saja' : 
                         formData.request_type === 'zoom' ? 'Zoom Saja' : 'Ruangan + Zoom'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Tanggal:</span>
                      <p className="font-semibold text-gray-900">{formData.date.toLocaleDateString('id-ID')}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Waktu:</span>
                      <p className="font-semibold text-gray-900">{formData.start_time} - {formData.end_time}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Kapasitas:</span>
                      <p className="font-semibold text-gray-900">{formData.capacity} orang</p>
                    </div>
                    <div>
                      <span className="text-gray-500">PIC:</span>
                      <p className="font-semibold text-gray-900">{formData.pic_name || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-200">
              <div>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="inline-flex items-center px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-lg group"
                  >
                    <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Kembali
                  </button>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/user/dashboard')}
                  className="inline-flex items-center px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  Batal
                </button>
                
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600 hover:from-primary-700 hover:via-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl group"
                  >
                    Lanjut
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Ajukan Booking
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;