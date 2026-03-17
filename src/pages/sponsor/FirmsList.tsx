import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, QrCode, Check } from 'lucide-react';

export default function FirmsList() {
  const { userProfile } = useAuth();
  const [firms, setFirms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  useEffect(() => {
    fetchFirms();
  }, []);

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

  const generateQRCode = async (firmId: string) => {
    if (!userProfile?.referenceId) return;
    
    setGeneratingId(firmId);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await addDoc(collection(db, 'qr_codes'), {
        code,
        firmId,
        sponsorId: userProfile.referenceId,
        campaignId: '', // Boş başlar, sponsor sonradan atar
        status: 'active',
        createdAt: new Date().toISOString()
      });
      
      setSuccessId(firmId);
      setTimeout(() => setSuccessId(null), 3000);
    } catch (error) {
      console.error("Error generating QR code:", error);
      alert("QR Kod oluşturulurken bir hata oluştu.");
    } finally {
      setGeneratingId(null);
    }
  };

  if (loading) return <div className="p-4">Yükleniyor...</div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Sisteme Dahil Olan Firmalar</h2>
        <p className="text-gray-500 mt-1">Aşağıdaki firmalar için QR kod oluşturabilir ve kampanyalarınızı yayınlayabilirsiniz.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {firms.map((firm) => (
          <div key={firm.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                  {firm.logoUrl ? (
                    <img src={firm.logoUrl} alt={firm.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{firm.name}</h3>
                </div>
              </div>
              
              {firm.notes && (
                <div className="mb-4 p-3 bg-indigo-50 rounded-md border border-indigo-100">
                  <p className="text-xs font-semibold text-indigo-800 mb-1">İşletme İçin Notlar:</p>
                  <p className="text-sm text-indigo-700 line-clamp-3" title={firm.notes}>
                    {firm.notes}
                  </p>
                </div>
              )}

              <button
                onClick={() => generateQRCode(firm.id)}
                disabled={generatingId === firm.id || successId === firm.id}
                className={`w-full flex items-center justify-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                  successId === firm.id
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'border-indigo-600 text-indigo-600 hover:bg-indigo-50 bg-white'
                }`}
              >
                {generatingId === firm.id ? (
                  <span className="flex items-center">Oluşturuluyor...</span>
                ) : successId === firm.id ? (
                  <span className="flex items-center"><Check className="w-4 h-4 mr-2" /> QR Kod Oluşturuldu</span>
                ) : (
                  <span className="flex items-center"><QrCode className="w-4 h-4 mr-2" /> Bu Firma İçin QR Kod Üret</span>
                )}
              </button>
            </div>
          </div>
        ))}

        {firms.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
            <Building2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">Sistemde aktif firma bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
}
