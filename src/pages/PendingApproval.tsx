import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Clock, Send, CheckCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function PendingApproval() {
  const { logout, userProfile, refreshProfile } = useAuth();
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async () => {
    if (!userProfile?.email) return;
    setIsApplying(true);
    setError('');
    
    try {
      await addDoc(collection(db, 'sponsors'), {
        name: userProfile.name || userProfile.email.split('@')[0],
        contactEmail: userProfile.email,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      
      // Refresh profile to get the new sponsorStatus
      await refreshProfile();
    } catch (err) {
      console.error("Error applying for sponsorship:", err);
      setError('Başvuru sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsApplying(false);
    }
  };

  const hasApplied = userProfile?.sponsorStatus === 'pending';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className={`h-16 w-16 rounded-full flex items-center justify-center shadow-sm ${hasApplied ? 'bg-yellow-100' : 'bg-indigo-100'}`}>
            {hasApplied ? (
              <Clock className="h-8 w-8 text-yellow-600" />
            ) : (
              <Send className="h-8 w-8 text-indigo-600" />
            )}
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {hasApplied ? 'Onay Bekleniyor' : 'Sponsorluk Başvurusu'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {hasApplied 
            ? 'Sponsorluk başvurunuz alındı ve yönetici onayı bekleniyor.' 
            : 'Sisteme kayıtlı bir sponsor hesabınız bulunmuyor.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          
          {hasApplied ? (
            <>
              <div className="mb-6 flex flex-col items-center justify-center text-green-600">
                <CheckCircle className="h-12 w-12 mb-2" />
                <p className="font-medium">Başvurunuz başarıyla iletildi!</p>
              </div>
              <p className="text-gray-700 mb-6 text-sm">
                Yöneticilerimiz başvurunuzu inceledikten sonra hesabınızı aktifleştirecektir. Lütfen daha sonra tekrar kontrol edin.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-700 mb-6 text-sm">
                Sponsor olarak platformda yer almak ve kampanyalarınızı yönetmek için hemen başvuru yapabilirsiniz.
              </p>
              
              {error && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <button
                onClick={handleApply}
                disabled={isApplying}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 mb-4"
              >
                {isApplying ? 'Başvuru Yapılıyor...' : 'Sponsor Olmak İçin Başvur'}
              </button>
            </>
          )}
          
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
