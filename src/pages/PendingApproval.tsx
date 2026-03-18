import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Clock, Send, CheckCircle, Shield, Briefcase, Users } from 'lucide-react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function PendingApproval() {
  const { logout, userProfile, refreshProfile } = useAuth();
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleRoleRequest = async (role: 'admin' | 'sponsor' | 'firm') => {
    if (!acceptedTerms) {
      setError('Lütfen devam etmeden önce Hizmet ve Kullanım Koşullarını kabul edin.');
      return;
    }
    if (!userProfile?.uid) return;
    setIsApplying(true);
    setError('');
    
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), {
        requestedRole: role
      });
      
      await refreshProfile();
    } catch (err) {
      console.error("Error requesting role:", err);
      setError('Rol talebi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsApplying(false);
    }
  };

  const hasApplied = userProfile?.sponsorStatus === 'pending' || userProfile?.requestedRole;

  if (!hasApplied && !userProfile?.requestedRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">SponsorOl'a Hoş Geldiniz!</h2>
            <p className="mt-2 text-lg text-gray-600">Lütfen sisteme hangi rol ile katılmak istediğinizi seçin.</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          <div className="mb-6 flex items-center justify-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <input
              id="terms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked);
                if (e.target.checked) setError('');
              }}
              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="terms" className="ml-3 block text-sm font-medium text-gray-700 cursor-pointer select-none">
              <a href="#" className="text-indigo-600 hover:text-indigo-500 hover:underline">Hizmet ve Kullanım Koşullarını</a> okudum ve kabul ediyorum.
            </label>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Sponsor Card */}
            <div 
              onClick={() => !isApplying && handleRoleRequest('sponsor')}
              className={`bg-white overflow-hidden shadow rounded-lg border-2 border-transparent hover:border-indigo-500 cursor-pointer transition-all ${isApplying || !acceptedTerms ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="px-4 py-5 sm:p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-4">
                  <Users className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sponsor Olmak İstiyorum</h3>
                <p className="text-sm text-gray-500">
                  Firmalara sponsor olarak reklam vermek ve QR kod kampanyaları oluşturmak istiyorum.
                </p>
              </div>
            </div>

            {/* Firm Card */}
            <div 
              onClick={() => !isApplying && handleRoleRequest('firm')}
              className={`bg-white overflow-hidden shadow rounded-lg border-2 border-transparent hover:border-emerald-500 cursor-pointer transition-all ${isApplying || !acceptedTerms ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="px-4 py-5 sm:p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4">
                  <Briefcase className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Firma Olarak Katılmak İstiyorum</h3>
                <p className="text-sm text-gray-500">
                  İşletmemde sponsorlu QR kodları sergilemek ve sisteme dahil olmak istiyorum.
                </p>
              </div>
            </div>

            {/* Admin Card */}
            <div 
              onClick={() => !isApplying && handleRoleRequest('admin')}
              className={`bg-white overflow-hidden shadow rounded-lg border-2 border-transparent hover:border-purple-500 cursor-pointer transition-all ${isApplying || !acceptedTerms ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="px-4 py-5 sm:p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 mb-4">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Yönetici (Admin) Olmak İstiyorum</h3>
                <p className="text-sm text-gray-500">
                  Sistemi yönetmek ve diğer kullanıcılara destek olmak için yönetici yetkisi istiyorum.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={logout}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Farklı Bir Hesapla Giriş Yap
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className={`h-16 w-16 rounded-full flex items-center justify-center shadow-sm bg-yellow-100`}>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Onay Bekleniyor
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {userProfile?.requestedRole === 'admin' && "Yönetici (Admin) yetkisi talep ettiniz."}
          {userProfile?.requestedRole === 'sponsor' && "Sponsor yetkisi talep ettiniz."}
          {userProfile?.requestedRole === 'firm' && "Firma yetkisi talep ettiniz."}
          <br />
          Kayıt işleminiz başarıyla alındı. Yöneticilerimiz hesabınızı inceledikten sonra onaylayacaktır.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="mb-6 flex flex-col items-center justify-center text-green-600">
            <CheckCircle className="h-12 w-12 mb-2" />
            <p className="font-medium">Talebiniz başarıyla iletildi!</p>
          </div>
          <p className="text-gray-700 mb-6 text-sm">
            Yöneticilerimiz başvurunuzu inceledikten sonra hesabınızı aktifleştirecektir. Lütfen daha sonra tekrar kontrol edin.
          </p>
          
          <div className="bg-gray-50 rounded-md p-4 mb-6 text-sm text-gray-600 text-left">
            <p><strong>Kayıtlı Email:</strong> {userProfile?.email}</p>
            <p><strong>İsim:</strong> {userProfile?.name}</p>
          </div>

          <button
            onClick={logout}
            className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
}
