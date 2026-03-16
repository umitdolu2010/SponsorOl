import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { MapPin, Building2, Mail, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FirmShowcase() {
  const [firms, setFirms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFirms = async () => {
      try {
        const q = query(collection(db, 'firms'), where('status', '==', 'active'));
        const snapshot = await getDocs(q);
        const firmsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFirms(firmsData);
      } catch (error) {
        console.error("Error fetching firms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFirms();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">Anlaşmalı Firmalarımız</span>
          </div>
          <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Giriş Yap
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Sponsorlarımızın Desteklediği Firmalar
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Aşağıdaki firmalarda QR kodlarınızı okutarak kampanyalardan faydalanabilirsiniz.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : firms.length > 0 ? (
          <div className="space-y-6">
            {firms.map((firm) => (
              <div 
                key={firm.id} 
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  {/* Logo */}
                  <div className="flex-shrink-0 h-24 w-24 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden shadow-inner">
                    {firm.logoUrl ? (
                      <img src={firm.logoUrl} alt={firm.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-gray-400 font-bold text-4xl">{firm.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{firm.name}</h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                      {firm.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                          <span className="truncate">{firm.location}</span>
                        </div>
                      )}
                      
                      {firm.contactEmail && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                          <span className="truncate">{firm.contactEmail}</span>
                        </div>
                      )}

                      {firm.sequenceCode && (
                        <div className="flex items-center">
                          <Hash className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                          <span>Müşteri Kodu: {firm.sequenceCode}</span>
                        </div>
                      )}
                    </div>

                    {firm.address && (
                      <div className="mt-4 pt-4 border-t border-gray-50 text-sm text-gray-500">
                        <span className="font-medium text-gray-700 mr-2">Adres:</span>
                        {firm.address}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Firma Bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500">Şu anda sistemde aktif bir firma bulunmuyor.</p>
          </div>
        )}
      </main>
    </div>
  );
}
