import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { QrCode, Building2, AlertCircle } from 'lucide-react';

export default function Login() {
  const { loginWithGoogle, currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (currentUser && userProfile) {
      if (userProfile.role === 'admin') navigate('/admin');
      else if (userProfile.role === 'sponsor') navigate('/sponsor');
      else navigate('/pending');
    }
  }, [currentUser, userProfile, navigate]);

  const handleLogin = async () => {
    try {
      setErrorMsg(null);
      setIsLoggingIn(true);
      await loginWithGoogle();
    } catch (error: any) {
      console.error('Login error:', error);
      setErrorMsg(error?.message || 'Giriş yapılırken bir hata oluştu.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <QrCode className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          SponsorOl.com
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          B2B Islak Mendil Reklam Platformu
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {errorMsg && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 break-words">
                    {errorMsg}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoggingIn ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {isLoggingIn ? 'Giriş Yapılıyor...' : 'Google ile Giriş Yap'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <Link to="/" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
            <Building2 className="w-4 h-4 mr-1" />
            Anlaşmalı Firmalarımızı İnceleyin
          </Link>
        </div>
      </div>
    </div>
  );
}
