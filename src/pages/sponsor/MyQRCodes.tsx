import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Link as LinkIcon, QrCode, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function MyQRCodes() {
  const { userProfile } = useAuth();
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [firms, setFirms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQR, setSelectedQR] = useState<any>(null);
  
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  useEffect(() => {
    if (userProfile?.referenceId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [userProfile]);

  const fetchData = async () => {
    if (!userProfile?.referenceId) return;

    try {
      // Fetch Firms
      const firmsSnapshot = await getDocs(query(collection(db, 'firms')));
      setFirms(firmsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch Approved Campaigns for this sponsor
      const campaignsSnapshot = await getDocs(
        query(
          collection(db, 'campaigns'), 
          where('sponsorId', '==', userProfile.referenceId),
          where('status', '==', 'approved')
        )
      );
      setCampaigns(campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch QR Codes assigned to this sponsor
      const qrSnapshot = await getDocs(
        query(
          collection(db, 'qr_codes'), 
          where('sponsorId', '==', userProfile.referenceId)
        )
      );
      setQrCodes(qrSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCampaign = async (qrId: string, campaignId: string) => {
    try {
      await updateDoc(doc(db, 'qr_codes', qrId), { campaignId });
      setSelectedQR(null);
      fetchData();
    } catch (error) {
      console.error("Error updating QR campaign:", error);
      alert("Kampanya atanırken bir hata oluştu.");
    }
  };

  const getFirmName = (id: string) => firms.find(f => f.id === id)?.name || 'Bilinmiyor';
  const getCampaignName = (id: string) => campaigns.find(c => c.id === id)?.title || 'Atanmamış';

  if (loading) return <div className="p-4">Yükleniyor...</div>;

  if (!userProfile?.referenceId) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg border border-red-200">
        Hesabınız bir sponsor profiliyle eşleştirilmemiş. Lütfen sistem yöneticisi ile iletişime geçin.
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">QR Kodlarım</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {qrCodes.map((qr) => (
          <div key={qr.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="p-6 flex flex-col items-center border-b border-gray-100">
              <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 mb-4">
                <QRCodeSVG 
                  value={`${appUrl}/r/${qr.code}`} 
                  size={128}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="text-center">
                <span className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm font-mono font-semibold text-gray-800 mb-2">
                  {qr.code}
                </span>
                <div className="flex items-center justify-center text-xs text-gray-500 mb-1">
                  <LinkIcon className="w-3 h-3 mr-1" />
                  <a href={`${appUrl}/r/${qr.code}`} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 truncate max-w-[200px]">
                    {appUrl}/r/{qr.code}
                  </a>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Firma (Mekan):</span>
                <span className="font-medium text-gray-900">{getFirmName(qr.firmId)}</span>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-gray-500">Aktif Kampanya:</span>
                <span className="font-medium text-indigo-600 truncate max-w-[120px]">
                  {qr.campaignId ? getCampaignName(qr.campaignId) : 'Yok'}
                </span>
              </div>
              
              <button 
                onClick={() => setSelectedQR(qr)}
                className="w-full mt-2 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Kampanya Ata / Değiştir
              </button>
            </div>
          </div>
        ))}
        {qrCodes.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow border border-gray-200">
            <QrCode className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">Size atanmış QR Kod bulunmuyor.</p>
            <p className="text-gray-500">Sistem yöneticisi sizin için QR kod ürettiğinde burada görünecektir.</p>
          </div>
        )}
      </div>

      {/* Assign Campaign Modal */}
      {selectedQR && (
        <div className="fixed z-50 inset-0 overflow-y-auto" onClick={() => setSelectedQR(null)}>
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div 
              className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">QR Koda Kampanya Ata</h3>
                  <button type="button" onClick={() => setSelectedQR(null)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Bu QR kod okutulduğunda gösterilecek onaylı kampanyayı seçin.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => handleAssignCampaign(selectedQR.id, '')}
                    className={`w-full text-left px-4 py-3 border rounded-md ${!selectedQR.campaignId ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    <span className="block text-sm font-medium text-gray-900">Kampanyayı Kaldır (Boş)</span>
                  </button>

                  {campaigns.map(campaign => (
                    <button
                      key={campaign.id}
                      onClick={() => handleAssignCampaign(selectedQR.id, campaign.id)}
                      className={`w-full text-left px-4 py-3 border rounded-md ${selectedQR.campaignId === campaign.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-300 hover:bg-gray-50'}`}
                    >
                      <span className="block text-sm font-medium text-gray-900">{campaign.title}</span>
                      <span className="block text-xs text-gray-500 mt-1 truncate">{campaign.landingUrl}</span>
                    </button>
                  ))}

                  {campaigns.length === 0 && (
                    <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md">
                      Henüz onaylanmış bir kampanyanız bulunmuyor. Önce "Kampanyalarım" sekmesinden yeni bir kampanya oluşturup onaylanmasını bekleyin.
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  onClick={() => setSelectedQR(null)} 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  İptal / Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
