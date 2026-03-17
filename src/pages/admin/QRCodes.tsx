import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Download, Link as LinkIcon, QrCode, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRCodes() {
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [firms, setFirms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newQR, setNewQR] = useState({ sponsorId: '', firmId: '' });
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch Sponsors
      const sponsorsSnapshot = await getDocs(query(collection(db, 'sponsors')));
      setSponsors(sponsorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch Firms
      const firmsSnapshot = await getDocs(query(collection(db, 'firms')));
      setFirms(firmsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch QR Codes
      const qrSnapshot = await getDocs(query(collection(db, 'qr_codes')));
      setQrCodes(qrSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQR.sponsorId || !newQR.firmId) {
      alert("Lütfen Sponsor ve Firma seçiniz.");
      return;
    }

    try {
      const uniqueCode = generateRandomCode();
      await addDoc(collection(db, 'qr_codes'), {
        code: uniqueCode,
        sponsorId: newQR.sponsorId,
        firmId: newQR.firmId,
        status: 'active',
        createdAt: new Date().toISOString()
      });
      
      setShowAddModal(false);
      setNewQR({ sponsorId: '', firmId: '' });
      fetchData();
    } catch (error) {
      console.error("Error creating QR:", error);
      alert("QR Kod oluşturulurken bir hata oluştu.");
    }
  };

  const toggleStatus = async (qrId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'qr_codes', qrId), { status: newStatus });
      fetchData();
    } catch (error) {
      console.error("Error updating QR status:", error);
    }
  };

  const getSponsorName = (id: string) => sponsors.find(s => s.id === id)?.name || 'Bilinmiyor';
  const getFirmName = (id: string) => firms.find(f => f.id === id)?.name || 'Bilinmiyor';

  if (loading) return <div className="p-4">Yükleniyor...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">QR Kod Yönetimi</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" /> Yeni QR Kod Üret
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {qrCodes.map((qr) => (
          <div key={qr.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="p-6 flex flex-col items-center border-b border-gray-100">
              <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 mb-4">
                <QRCodeSVG 
                  value={`${appUrl}/#/r/${qr.code}`} 
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
                  <a href={`${appUrl}/#/r/${qr.code}`} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 truncate max-w-[200px]">
                    {appUrl}/#/r/{qr.code}
                  </a>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Sponsor:</span>
                <span className="font-medium text-gray-900">{getSponsorName(qr.sponsorId)}</span>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-gray-500">Firma (Mekan):</span>
                <span className="font-medium text-gray-900">{getFirmName(qr.firmId)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${qr.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {qr.status === 'active' ? 'Aktif' : 'Pasif'}
                </span>
                <button 
                  onClick={() => toggleStatus(qr.id, qr.status)}
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  Durum Değiştir
                </button>
              </div>
            </div>
          </div>
        ))}
        {qrCodes.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow border border-gray-200">
            <QrCode className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900">Henüz QR Kod üretilmemiş.</p>
            <p className="text-gray-500">Sponsor ve Firmaları eşleştirerek yeni QR kodlar oluşturabilirsiniz.</p>
          </div>
        )}
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
              <form onSubmit={handleCreateQR}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Yeni QR Kod Üret (Eşleştirme)</h3>
                    <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-500">
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor Seçin</label>
                    <select 
                      required
                      value={newQR.sponsorId}
                      onChange={e => setNewQR({...newQR, sponsorId: e.target.value})}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                    >
                      <option value="">-- Sponsor Seçin --</option>
                      {sponsors.filter(s => s.status === 'active').map(sponsor => (
                        <option key={sponsor.id} value={sponsor.id}>{sponsor.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Firma (Mekan) Seçin</label>
                    <select 
                      required
                      value={newQR.firmId}
                      onChange={e => setNewQR({...newQR, firmId: e.target.value})}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                    >
                      <option value="">-- Firma Seçin --</option>
                      {firms.filter(f => f.status === 'active').map(firm => (
                        <option key={firm.id} value={firm.id}>{firm.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mt-4 bg-blue-50 p-4 rounded-md">
                    <p className="text-sm text-blue-800">
                      Bu işlem sonucunda benzersiz bir QR kod üretilecek ve sistemde kayıt altına alınacaktır. 
                      Bu QR kod fiziksel ıslak mendillere basılmak üzere hazırdır.
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm">
                    Üret ve Kaydet
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
