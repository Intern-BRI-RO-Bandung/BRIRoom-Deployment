import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <Header />
      
      <div className="flex">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`
  ${sidebarOpen ? 'fixed inset-y-0 left-0 z-50 w-64 transform translate-x-0 transition-transform duration-300 ease-in-out bg-white shadow-xl border-r border-gray-200' : 'hidden'}
  lg:block lg:relative lg:w-72 xl:w-80 lg:bg-transparent lg:shadow-none lg:border-0
`}>
  <Sidebar onClose={() => setSidebarOpen(false)} />
</div>
        
        {/* Main Content */}
        <div className="flex-1 min-h-[calc(100vh-4rem)] lg:ml-0">
          {/* Mobile Sidebar Toggle */}
          <div className="lg:hidden sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/50 px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Menu</span>
            </button>
          </div>
          
          {/* Content Area */}
          <main className="p-4 lg:p-6 xl:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Content Container */}
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-200/50 min-h-[calc(100vh-8rem)] lg:min-h-[calc(100vh-6rem)]">
                <div className="p-6 lg:p-8">
  <Outlet />
</div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;