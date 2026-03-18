import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut } from 'lucide-react';

export default function FirmDashboard() {
  const { logout, userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-emerald-600">Firma Paneli</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">{userProfile?.name}</span>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Firma Paneline Hoş Geldiniz</h2>
              <p className="text-gray-500">Bu alan henüz yapım aşamasındadır.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
