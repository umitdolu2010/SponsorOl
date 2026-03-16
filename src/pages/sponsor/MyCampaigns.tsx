import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Clock, CheckCircle, XCircle, X } from 'lucide-react';

export default function MyCampaigns() {
  const { userProfile } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newCampaign, setNewCampaign] = useState({ title: '', message: '', landingUrl: '' });

  useEffect(() => {
    if (userProfile?.referenceId) {
      fetchCampaigns();
    } else {
      setLoading(false);
    }
  }, [userProfile]);

  const fetchCampaigns = async () => {
    try {
      const q = query(
        collection(db, 'campaigns'), 
        where('sponsorId', '==', userProfile?.referenceId)
      );
      const snapshot = await getDocs(q);
      const campaignsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setCampaigns(campaignsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.referenceId) {
      alert("Sponsor ID bulunamadı. Lütfen yönetici ile iletişime geçin.");
      return;
    }

    try {
      await addDoc(collection(db, 'campaigns'), {
        ...newCampaign,
        sponsorId: userProfile.referenceId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setShowAddModal(false);
      setNewCampaign({ title: '', message: '', landingUrl: '' });
      fetchCampaigns();
    } catch (error) {
      console.error("Error adding campaign:", error);
      alert("Kampanya oluşturulurken bir hata oluştu.");
    }
  };

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
        <h2 className="text-2xl font-bold text-gray-900">Kampanyalarım</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" /> Yeni Kampanya
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başlık</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{campaign.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(campaign.createdAt).toLocaleDateString('tr-TR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {campaign.status === 'pending' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="w-3 h-3 mr-1" /> Onay Bekliyor
                    </span>
                  )}
                  {campaign.status === 'approved' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" /> Onaylandı
                    </span>
                  )}
                  {campaign.status === 'rejected' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircle className="w-3 h-3 mr-1" /> Reddedildi
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  Henüz kampanya oluşturmadınız.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto" onClick={() => setShowAddModal(false)}>
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div 
              className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleAddCampaign}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Yeni Kampanya Oluştur</h3>
                    <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-500">
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Kampanya Başlığı</label>
                    <input 
                      type="text" 
                      required
                      value={newCampaign.title}
                      onChange={e => setNewCampaign({...newCampaign, title: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Örn: Yaz İndirimi"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Reklam Mesajı</label>
                    <textarea 
                      required
                      rows={3}
                      value={newCampaign.message}
                      onChange={e => setNewCampaign({...newCampaign, message: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="QR kod okutulduğunda kullanıcıların göreceği mesaj..."
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Yönlendirme Linki (URL)</label>
                    <input 
                      type="url" 
                      required
                      value={newCampaign.landingUrl}
                      onChange={e => setNewCampaign({...newCampaign, landingUrl: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="https://www.sirketiniz.com/kampanya"
                    />
                    <p className="mt-1 text-xs text-gray-500">Kullanıcılar mesajı gördükten sonra bu adrese yönlendirilecektir.</p>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm">
                    Onaya Gönder
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
