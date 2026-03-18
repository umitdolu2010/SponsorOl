import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, X, Link as LinkIcon, Check, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';

export default function Sponsors() {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sponsorToDelete, setSponsorToDelete] = useState<any | null>(null);
  const [newSponsor, setNewSponsor] = useState({ name: '', contactEmail: '', phone: '', contactPerson: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    try {
      const q = query(collection(db, 'sponsors'));
      const snapshot = await getDocs(q);
      const sponsorsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort: pending first, then active, then inactive
      sponsorsData.sort((a: any, b: any) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return 0;
      });
      setSponsors(sponsorsData);
    } catch (error) {
      console.error("Error fetching sponsors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'sponsors'), {
        ...newSponsor,
        status: 'active',
        createdAt: new Date().toISOString()
      });
      setShowAddModal(false);
      setNewSponsor({ name: '', contactEmail: '', phone: '', contactPerson: '' });
      fetchSponsors();
    } catch (error) {
      console.error("Error adding sponsor:", error);
      alert("Sponsor eklenirken bir hata oluştu.");
    }
  };

  const updateStatus = async (sponsorId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'sponsors', sponsorId), { status: newStatus });
      fetchSponsors();
    } catch (error) {
      console.error("Error updating sponsor status:", error);
    }
  };

  const confirmDelete = async () => {
    if (!sponsorToDelete) return;
    try {
      await deleteDoc(doc(db, 'sponsors', sponsorToDelete.id));
      setSponsorToDelete(null);
      fetchSponsors();
    } catch (error) {
      console.error("Error deleting sponsor:", error);
    }
  };

  const copyInviteLink = (email: string, id: string) => {
    const text = `SponsorOl.com'a davet edildiniz!\n\nSisteme giriş yapmak için aşağıdaki linke tıklayın ve ${email} adresli Google hesabınızla giriş yapın:\n${appUrl}/#/login`;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <div className="p-4">Yükleniyor...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Sponsorlar</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" /> Yeni Sponsor Ekle
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sponsor Adı</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İletişim E-posta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sponsors.map((sponsor) => (
              <tr key={sponsor.id} className={sponsor.status === 'pending' ? 'bg-yellow-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sponsor.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sponsor.contactEmail ? (
                    <div>{sponsor.contactEmail}</div>
                  ) : (
                    <div className="text-gray-400 italic">Belirtilmedi</div>
                  )}
                  {sponsor.phone && <div className="text-xs mt-1">{sponsor.phone}</div>}
                  {sponsor.contactPerson && <div className="text-xs mt-1">{sponsor.contactPerson}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sponsor.status === 'active' && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Aktif
                    </span>
                  )}
                  {sponsor.status === 'inactive' && (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Pasif
                    </span>
                  )}
                  {sponsor.status === 'pending' && (
                    <span className="px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      <Clock className="w-3 h-3 mr-1" /> Onay Bekliyor
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-4">
                    {sponsor.status === 'pending' ? (
                      <>
                        <button 
                          onClick={() => updateStatus(sponsor.id, 'active')}
                          className="text-green-600 hover:text-green-900 flex items-center"
                          title="Onayla"
                        >
                          <CheckCircle className="w-5 h-5 mr-1" /> Onayla
                        </button>
                        <button 
                          onClick={() => updateStatus(sponsor.id, 'inactive')}
                          className="text-red-600 hover:text-red-900 flex items-center"
                          title="Reddet"
                        >
                          <XCircle className="w-5 h-5 mr-1" /> Reddet
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => updateStatus(sponsor.id, sponsor.status === 'active' ? 'inactive' : 'active')}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {sponsor.status === 'active' ? 'Pasife Al' : 'Aktifleştir'}
                        </button>
                        <button 
                          onClick={() => copyInviteLink(sponsor.contactEmail || 'E-posta Yok', sponsor.id)}
                          className="text-gray-600 hover:text-gray-900 flex items-center"
                          title="Davet Linkini Kopyala"
                        >
                          {copiedId === sponsor.id ? (
                            <span className="flex items-center text-green-600"><Check className="w-4 h-4 mr-1" /> Kopyalandı</span>
                          ) : (
                            <span className="flex items-center"><LinkIcon className="w-4 h-4 mr-1" /> Davet Linki</span>
                          )}
                        </button>
                        <button 
                          onClick={() => setSponsorToDelete(sponsor)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                          title="Sponsoru Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {sponsors.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">Henüz sponsor eklenmemiş.</td>
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
              <form onSubmit={handleAddSponsor}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Yeni Sponsor Ekle</h3>
                    <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-500">
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Sponsor Adı</label>
                    <input 
                      type="text" 
                      required
                      value={newSponsor.name}
                      onChange={e => setNewSponsor({...newSponsor, name: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">İletişim E-posta (Opsiyonel)</label>
                    <input 
                      type="email" 
                      value={newSponsor.contactEmail}
                      onChange={e => setNewSponsor({...newSponsor, contactEmail: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Telefon (Opsiyonel)</label>
                    <input 
                      type="tel" 
                      value={newSponsor.phone}
                      onChange={e => setNewSponsor({...newSponsor, phone: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Yetkili Kişi (Opsiyonel)</label>
                    <input 
                      type="text" 
                      value={newSponsor.contactPerson}
                      onChange={e => setNewSponsor({...newSponsor, contactPerson: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm">
                    Kaydet
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

      {/* Delete Confirmation Modal */}
      {sponsorToDelete && (
        <div className="fixed z-50 inset-0 overflow-y-auto" onClick={() => setSponsorToDelete(null)}>
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
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Sponsoru Sil</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        <strong className="text-gray-900">{sponsorToDelete.name}</strong> isimli sponsoru silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve bu sponsora ait tüm veriler (kampanyalar, QR kodlar) etkilenebilir.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  onClick={confirmDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Evet, Sil
                </button>
                <button 
                  type="button" 
                  onClick={() => setSponsorToDelete(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
