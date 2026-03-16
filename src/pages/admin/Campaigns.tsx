import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Check, X, Eye } from 'lucide-react';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [adminAdContent, setAdminAdContent] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch Sponsors for mapping IDs to Names
      const sponsorsSnapshot = await getDocs(collection(db, 'sponsors'));
      const sponsorMap: Record<string, string> = {};
      sponsorsSnapshot.docs.forEach(doc => {
        sponsorMap[doc.id] = doc.data().name;
      });
      setSponsors(sponsorMap);

      // Fetch Campaigns
      const q = query(collection(db, 'campaigns'));
      const snapshot = await getDocs(q);
      const campaignsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setCampaigns(campaignsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (campaignId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus, updatedAt: new Date().toISOString() };
      if (newStatus === 'approved' && adminAdContent) {
        updateData.adminAdContent = adminAdContent;
      }
      
      await updateDoc(doc(db, 'campaigns', campaignId), updateData);
      setSelectedCampaign(null);
      setAdminAdContent('');
      fetchData();
    } catch (error) {
      console.error("Error updating campaign:", error);
      alert("Kampanya güncellenirken bir hata oluştu.");
    }
  };

  if (loading) return <div className="p-4">Yükleniyor...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Kampanya Onayları</h2>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sponsor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başlık</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {sponsors[campaign.sponsorId] || 'Bilinmeyen Sponsor'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campaign.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(campaign.createdAt).toLocaleDateString('tr-TR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${campaign.status === 'approved' ? 'bg-green-100 text-green-800' : 
                      campaign.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                    {campaign.status === 'approved' ? 'Onaylandı' : 
                     campaign.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setAdminAdContent(campaign.adminAdContent || '');
                    }}
                    className="text-indigo-600 hover:text-indigo-900 flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-1" /> İncele
                  </button>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Henüz kampanya bulunmuyor.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selectedCampaign && (
        <div className="fixed z-50 inset-0 overflow-y-auto" onClick={() => setSelectedCampaign(null)}>
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div 
              className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Kampanya Detayı</h3>
                  <button type="button" onClick={() => setSelectedCampaign(null)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Sponsor</label>
                    <p className="mt-1 text-sm text-gray-900">{sponsors[selectedCampaign.sponsorId]}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Başlık</label>
                    <p className="mt-1 text-sm text-gray-900 font-medium">{selectedCampaign.title}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Mesaj</label>
                    <div className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border border-gray-200">
                      {selectedCampaign.message}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Yönlendirme Linki (Landing URL)</label>
                    <a href={selectedCampaign.landingUrl} target="_blank" rel="noopener noreferrer" className="mt-1 text-sm text-indigo-600 hover:underline break-all">
                      {selectedCampaign.landingUrl}
                    </a>
                  </div>

                  {selectedCampaign.status === 'pending' && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Reklam Alanı (İsteğe Bağlı)
                      </label>
                      <p className="text-xs text-gray-500 mb-2">Bu mesaj landing page'in en üstünde sizin reklamınız olarak görünecektir.</p>
                      <textarea
                        rows={3}
                        value={adminAdContent}
                        onChange={(e) => setAdminAdContent(e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Örn: Bu mendil Eran Tedarik tarafından üretilmiştir..."
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {selectedCampaign.status === 'pending' ? (
                  <>
                    <button 
                      onClick={() => handleStatusUpdate(selectedCampaign.id, 'approved')}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      <Check className="w-4 h-4 mr-2 mt-0.5" /> Onayla ve Yayınla
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(selectedCampaign.id, 'rejected')}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      <X className="w-4 h-4 mr-2 mt-0.5" /> Reddet
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setSelectedCampaign(null)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Kapat
                  </button>
                )}
                {selectedCampaign.status === 'pending' && (
                  <button 
                    onClick={() => setSelectedCampaign(null)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    İptal
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
