import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { Plus, Edit2, Check, X, MapPin, Upload, Trash2 } from 'lucide-react';

export default function Firms() {
  const [firms, setFirms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingFirm, setEditingFirm] = useState<any>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [newFirm, setNewFirm] = useState({ 
    name: '', 
    contactEmail: '',
    phone: '',
    contactPerson: '',
    notes: '',
    logoUrl: '',
    location: '',
    address: '',
    sequenceCode: ''
  });

  useEffect(() => {
    fetchFirms();
  }, []);

  const fetchFirms = async () => {
    try {
      const q = query(collection(db, 'firms'));
      const snapshot = await getDocs(q);
      const firmsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFirms(firmsData);
    } catch (error) {
      console.error("Error fetching firms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const storageRef = ref(storage, `firm_logos/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setNewFirm(prev => ({ ...prev, logoUrl: downloadUrl }));
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("Logo yüklenirken bir hata oluştu. Lütfen Firebase Console üzerinden Storage hizmetinin aktif ve kurallarının yazmaya açık olduğundan emin olun.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAddFirm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Clean up empty optional fields to prevent Firestore validation errors
      const firmData: any = {
        name: newFirm.name,
        phone: newFirm.phone,
        contactPerson: newFirm.contactPerson,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      if (newFirm.contactEmail) firmData.contactEmail = newFirm.contactEmail;
      if (newFirm.notes) firmData.notes = newFirm.notes;
      if (newFirm.logoUrl) firmData.logoUrl = newFirm.logoUrl;
      if (newFirm.location) firmData.location = newFirm.location;
      if (newFirm.address) firmData.address = newFirm.address;
      if (newFirm.sequenceCode) firmData.sequenceCode = newFirm.sequenceCode;

      await addDoc(collection(db, 'firms'), firmData);
      setShowAddModal(false);
      setNewFirm({ name: '', contactEmail: '', phone: '', contactPerson: '', notes: '', logoUrl: '', location: '', address: '', sequenceCode: '' });
      fetchFirms();
    } catch (error) {
      console.error("Error adding firm:", error);
      alert("Firma eklenirken bir hata oluştu.");
    }
  };

  const handleEditClick = (firm: any) => {
    setEditingFirm({ ...firm });
    setShowDeleteConfirm(false);
    setShowEditModal(true);
  };

  const handleEditLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const storageRef = ref(storage, `firm_logos/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setEditingFirm((prev: any) => ({ ...prev, logoUrl: downloadUrl }));
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("Logo yüklenirken bir hata oluştu.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUpdateFirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFirm) return;
    try {
      const firmData: any = {
        name: editingFirm.name,
        phone: editingFirm.phone,
        contactPerson: editingFirm.contactPerson,
      };

      if (editingFirm.contactEmail) firmData.contactEmail = editingFirm.contactEmail;
      if (editingFirm.notes) firmData.notes = editingFirm.notes;
      if (editingFirm.logoUrl) firmData.logoUrl = editingFirm.logoUrl;
      if (editingFirm.location) firmData.location = editingFirm.location;
      if (editingFirm.address) firmData.address = editingFirm.address;
      if (editingFirm.sequenceCode) firmData.sequenceCode = editingFirm.sequenceCode;

      await updateDoc(doc(db, 'firms', editingFirm.id), firmData);
      setShowEditModal(false);
      setEditingFirm(null);
      fetchFirms();
    } catch (error) {
      console.error("Error updating firm:", error);
      alert("Firma güncellenirken bir hata oluştu.");
    }
  };

  const handleDeleteFirm = async () => {
    if (!editingFirm) return;
    try {
      await deleteDoc(doc(db, 'firms', editingFirm.id));
      setShowEditModal(false);
      setEditingFirm(null);
      setShowDeleteConfirm(false);
      fetchFirms();
    } catch (error) {
      console.error("Error deleting firm:", error);
      alert("Firma silinirken bir hata oluştu.");
    }
  };

  const toggleStatus = async (firmId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'firms', firmId), { status: newStatus });
      fetchFirms();
    } catch (error) {
      console.error("Error updating firm status:", error);
    }
  };

  if (loading) return <div className="p-4">Yükleniyor...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Firmalar (Müşteriler)</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" /> Yeni Firma Ekle
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Firma</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İletişim</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sıra Kodu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {firms.map((firm) => (
              <tr key={firm.id} onClick={() => handleEditClick(firm)} className="cursor-pointer hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200 p-1">
                      {firm.logoUrl ? (
                        <img src={firm.logoUrl} alt={firm.name} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-gray-500 font-medium text-lg">{firm.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{firm.name}</div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {firm.location || 'Konum belirtilmemiş'}
                      </div>
                      {firm.notes && (
                        <div className="text-xs text-indigo-600 mt-1 truncate max-w-[200px]" title={firm.notes}>
                          Not: {firm.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{firm.contactPerson || <span className="text-gray-400 italic">Yetkili Yok</span>}</div>
                  <div className="text-sm text-gray-900">{firm.phone || <span className="text-gray-400 italic">Telefon Yok</span>}</div>
                  <div className="text-xs text-gray-500">{firm.contactEmail || <span className="text-gray-400 italic">E-posta Yok</span>}</div>
                  <div className="text-xs text-gray-500 truncate max-w-xs" title={firm.address}>{firm.address || 'Adres yok'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {firm.sequenceCode || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${firm.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {firm.status === 'active' ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleStatus(firm.id, firm.status); }}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Durum Değiştir
                  </button>
                </td>
              </tr>
            ))}
            {firms.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Henüz firma eklenmemiş.</td>
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
              <form onSubmit={handleAddFirm}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Yeni Firma Ekle</h3>
                    <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-500">
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Firma Adı</label>
                      <input 
                        type="text" 
                        required
                        value={newFirm.name}
                        onChange={e => setNewFirm({...newFirm, name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Yetkili Kişi</label>
                        <input 
                          type="text" 
                          required
                          value={newFirm.contactPerson}
                          onChange={e => setNewFirm({...newFirm, contactPerson: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Telefon</label>
                        <input 
                          type="tel" 
                          required
                          value={newFirm.phone}
                          onChange={e => setNewFirm({...newFirm, phone: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">İletişim E-posta (İsteğe Bağlı)</label>
                      <input 
                        type="email" 
                        value={newFirm.contactEmail}
                        onChange={e => setNewFirm({...newFirm, contactEmail: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Logo</label>
                      <div className="mt-1 flex items-center space-x-4">
                        <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-300 p-1">
                          {newFirm.logoUrl ? (
                            <img src={newFirm.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                          ) : (
                            <span className="text-gray-400 text-xs text-center px-1">Görsel Yok</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <label className={`cursor-pointer flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <Upload className="w-4 h-4 mr-2" />
                            {uploadingLogo ? 'Yükleniyor...' : 'Telefondan Görsel Seç'}
                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                          </label>
                          <p className="mt-1 text-xs text-gray-500">Veya URL girebilirsiniz:</p>
                          <input 
                            type="url" 
                            placeholder="https://example.com/logo.png"
                            value={newFirm.logoUrl}
                            onChange={e => setNewFirm({...newFirm, logoUrl: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Konum (İl/İlçe)</label>
                        <input 
                          type="text" 
                          placeholder="Örn: Kadıköy, İstanbul"
                          value={newFirm.location}
                          onChange={e => setNewFirm({...newFirm, location: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Sıra Kodu</label>
                        <input 
                          type="text" 
                          placeholder="Örn: FRM-001"
                          value={newFirm.sequenceCode}
                          onChange={e => setNewFirm({...newFirm, sequenceCode: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Açık Adres</label>
                      <textarea 
                        rows={2}
                        value={newFirm.address}
                        onChange={e => setNewFirm({...newFirm, address: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">İşletme İçin Notlar (Sadece Admin Görür)</label>
                      <textarea 
                        rows={3}
                        placeholder="İşletme ile ilgili özel notlar, görüşmeler vb."
                        value={newFirm.notes}
                        onChange={e => setNewFirm({...newFirm, notes: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
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

      {showEditModal && editingFirm && (
        <div className="fixed z-50 inset-0 overflow-y-auto" onClick={() => setShowEditModal(false)}>
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div 
              className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleUpdateFirm}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Firmayı Düzenle</h3>
                    <button type="button" onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-500">
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Firma Adı</label>
                      <input 
                        type="text" 
                        required
                        value={editingFirm.name}
                        onChange={e => setEditingFirm({...editingFirm, name: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Yetkili Kişi</label>
                        <input 
                          type="text" 
                          required
                          value={editingFirm.contactPerson}
                          onChange={e => setEditingFirm({...editingFirm, contactPerson: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Telefon</label>
                        <input 
                          type="tel" 
                          required
                          value={editingFirm.phone}
                          onChange={e => setEditingFirm({...editingFirm, phone: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">İletişim E-posta (İsteğe Bağlı)</label>
                      <input 
                        type="email" 
                        value={editingFirm.contactEmail || ''}
                        onChange={e => setEditingFirm({...editingFirm, contactEmail: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Logo</label>
                      <div className="mt-1 flex items-center space-x-4">
                        <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-300 p-1">
                          {editingFirm.logoUrl ? (
                            <img src={editingFirm.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                          ) : (
                            <span className="text-gray-400 text-xs text-center px-1">Görsel Yok</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <label className={`cursor-pointer flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <Upload className="w-4 h-4 mr-2" />
                            {uploadingLogo ? 'Yükleniyor...' : 'Telefondan Görsel Seç'}
                            <input type="file" className="hidden" accept="image/*" onChange={handleEditLogoUpload} disabled={uploadingLogo} />
                          </label>
                          <p className="mt-1 text-xs text-gray-500">Veya URL girebilirsiniz:</p>
                          <input 
                            type="url" 
                            placeholder="https://example.com/logo.png"
                            value={editingFirm.logoUrl || ''}
                            onChange={e => setEditingFirm({...editingFirm, logoUrl: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Konum (İl/İlçe)</label>
                        <input 
                          type="text" 
                          placeholder="Örn: Kadıköy, İstanbul"
                          value={editingFirm.location || ''}
                          onChange={e => setEditingFirm({...editingFirm, location: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Sıra Kodu</label>
                        <input 
                          type="text" 
                          placeholder="Örn: FRM-001"
                          value={editingFirm.sequenceCode || ''}
                          onChange={e => setEditingFirm({...editingFirm, sequenceCode: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Açık Adres</label>
                      <textarea 
                        rows={2}
                        value={editingFirm.address || ''}
                        onChange={e => setEditingFirm({...editingFirm, address: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">İşletme İçin Notlar (Sadece Admin Görür)</label>
                      <textarea 
                        rows={3}
                        placeholder="İşletme ile ilgili özel notlar, görüşmeler vb."
                        value={editingFirm.notes || ''}
                        onChange={e => setEditingFirm({...editingFirm, notes: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center">
                  {showDeleteConfirm ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-red-600 font-medium">Emin misiniz?</span>
                      <button type="button" onClick={handleDeleteFirm} className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-3 py-1.5 bg-red-600 text-sm font-medium text-white hover:bg-red-700 focus:outline-none">
                        Evet, Sil
                      </button>
                      <button type="button" onClick={() => setShowDeleteConfirm(false)} className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-3 py-1.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                        İptal
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setShowDeleteConfirm(true)} className="inline-flex items-center text-red-600 hover:text-red-800 text-sm font-medium">
                      <Trash2 className="w-4 h-4 mr-1" /> Firmayı Sil
                    </button>
                  )}
                  
                  <div className="flex space-x-3">
                    <button type="button" onClick={() => setShowEditModal(false)} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
                      İptal
                    </button>
                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm">
                      Güncelle
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
