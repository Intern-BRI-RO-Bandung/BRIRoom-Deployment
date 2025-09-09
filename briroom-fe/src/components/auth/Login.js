import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import briLogo from '../../assets/bri-logo.png';

const blobs = [
  {
    className: "w-[400px] h-[400px] opacity-60",
    style: { top: '-100px', left: '-100px' },
    gradient: ['#6366f1', '#60a5fa'],
    dur: '12s',
    delay: 0,
  },
  {
    className: "w-[350px] h-[350px] opacity-50",
    style: { bottom: '-120px', right: '-120px' },
    gradient: ['#a5b4fc', '#818cf8'],
    dur: '10s',
    delay: 0.5,
  },
  {
    className: "w-[220px] h-[220px] opacity-40",
    style: { top: '20%', left: '-80px' },
    gradient: ['#f472b6', '#818cf8'],
    dur: '14s',
    delay: 1,
  },
  {
    className: "w-[180px] h-[180px] opacity-40",
    style: { bottom: '10%', left: '10%' },
    gradient: ['#34d399', '#60a5fa'],
    dur: '16s',
    delay: 1.5,
  },
  {
    className: "w-[160px] h-[160px] opacity-30",
    style: { top: '10%', right: '5%' },
    gradient: ['#fbbf24', '#f472b6'],
    dur: '18s',
    delay: 2,
  },
  {
    className: "w-[120px] h-[120px] opacity-40",
    style: { top: '60%', left: '20%' },
    gradient: ['#f472b6', '#fbbf24'],
    dur: '13s',
    delay: 2.5,
  },
  {
    className: "w-[200px] h-[200px] opacity-30",
    style: { bottom: '20%', right: '10%' },
    gradient: ['#60a5fa', '#34d399'],
    dur: '15s',
    delay: 3,
  },
  {
    className: "w-[100px] h-[100px] opacity-30",
    style: { top: '40%', right: '20%' },
    gradient: ['#818cf8', '#6366f1'],
    dur: '17s',
    delay: 3.5,
  },
];

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Parallax state
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    setParallax({ x, y });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setLoginError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    try {
      const result = await login(formData);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setLoginError(result.message || 'Login gagal, silakan cek email dan password Anda.');
      }
    } catch (error) {
      setLoginError('Terjadi kesalahan saat login. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-gray-900"
      onMouseMove={handleMouseMove}
    >
      {/* Animated Blobs Background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {blobs.map((blob, i) => (
          <svg
            key={i}
            className={`absolute ${blob.className}`}
            style={{
              ...blob.style,
              transform: `translate3d(${parallax.x * (20 + i * 10)}px, ${parallax.y * (20 + i * 10)}px, 0)`,
              transition: 'transform 0.3s cubic-bezier(.4,2,.6,1)',
            }}
            viewBox="0 0 400 400"
          >
            <defs>
              <linearGradient id={`blob${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={blob.gradient[0]} />
                <stop offset="100%" stopColor={blob.gradient[1]} />
              </linearGradient>
            </defs>
            <path fill={`url(#blob${i})`}>
              <animate attributeName="d" dur={blob.dur} repeatCount="indefinite"
                values="
                  M320,180Q320,260,240,300Q160,340,100,270Q40,200,100,130Q160,60,240,100Q320,140,320,180Z;
                  M320,180Q300,260,220,320Q140,380,80,300Q20,220,80,140Q140,60,220,120Q300,180,320,180Z;
                  M320,180Q320,260,240,300Q160,340,100,270Q40,200,100,130Q160,60,240,100Q320,140,320,180Z
                "
                begin={`${blob.delay}s`}
              />
            </path>
          </svg>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Logo/Brand Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4 border-4 border-blue-200">
              <img
                src={briLogo}
                alt="BRI Logo"
                className="w-12 h-12 object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Selamat Datang Insan BRILiaN
            </h2>
            <p className="text-blue-100 text-sm text-center">
              Masuk ke BRIRoom untuk mengelola ruangan Anda
            </p>
          </div>

          {/* Login Form */}
          <div className="glass-card rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="input-field pl-10 text-gray-900"
                    placeholder="Masukkan Email Anda"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="input-field pl-10 pr-10 text-gray-900"
                    placeholder="Masukkan Password Anda"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Warning/Error Message */}
              {loginError && (
                <div className="w-full bg-yellow-100 border border-yellow-400 text-yellow-800 text-sm rounded-md px-4 py-2 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12A9 9 0 113 12a9 9 0 0118 0z" />
                  </svg>
                  <span>{loginError}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary group"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span>Masuk</span>
                      <svg className="ml-2 -mr-1 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">atau</span>
                </div>
              </div>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Belum punya akun?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200 hover:underline"
                  >
                    Daftar sekarang
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-xs text-blue-200">
              © 2025 BRIRoom. Semua hak dilindungi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;