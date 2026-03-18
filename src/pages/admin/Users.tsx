import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Shield, Briefcase, Users as UsersIcon, X } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [firms, setFirms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  const [assignRole, setAssignRole] = useState<'sponsor' | 'firm' | 'admin' | ''>('');
  const [assignRefId, setAssignRefId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch Users
      const usersSnapshot = await getDocs(query(collection(db, 'users')));
      setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch Sponsors
      const sponsorsSnapshot = await getDocs(query(collection(db, 'sponsors')));
      setSponsors(sponsorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch Firms
      const firmsSnapshot = await getDocs(query(collection(db, 'firms')));
      setFirms(firmsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !assignRole) return;

    if ((assignRole === 'sponsor' || assignRole === 'firm') && !assignRefId) {
      alert("Lütfen ilgili Sponsor veya Firmayı seçin.");
      return;
    }

    try {
      const updateData: any = { 
        role: assignRole,
        requestedRole: null // Clear the requested role once assigned
      };
      if (!selectedUser.createdAt) {
        updateData.createdAt = new Date().toISOString();
      }
      if (assignRole === 'sponsor' || assignRole === 'firm') {
        updateData.referenceId = assignRefId;
      } else {
        updateData.referenceId = null; // Admin has no referenceId
      }

      await updateDoc(doc(db, 'users', selectedUser.id), updateData);
      
      setSelectedUser(null);
      setAssignRole('');
      setAssignRefId('');
      fetchData();
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Kullanıcı yetkilendirilirken bir hata oluştu.");
    }
  };

  const getReferenceName = (role: string, refId: string) => {
    if (role === 'sponsor') return sponsors.find(s => s.id === refId)?.name || 'Bilinmiyor';
    if (role === 'firm') return firms.find(f => f.id === refId)?.name || 'Bilinmiyor';
    return '-';
  };

  if (loading) return <div className="p-4">Yükleniyor...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Kullanıcı Yetkilendirme</h2>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-posta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bağlı Olduğu Kurum</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role === 'admin' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><Shield className="w-3 h-3 mr-1" /> Admin</span>}
                  {user.role === 'sponsor' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><UsersIcon className="w-3 h-3 mr-1" /> Sponsor</span>}
                  {user.role === 'firm' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><Briefcase className="w-3 h-3 mr-1" /> Firma</span>}
                  {!user.role && (
                    <div className="flex flex-col items-start gap-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Onay Bekliyor</span>
                      {user.requestedRole && (
                        <span className="inline-flex items-center text-xs font-medium text-indigo-600">
                          Talep: {user.requestedRole === 'admin' ? 'Admin' : user.requestedRole === 'sponsor' ? 'Sponsor' : 'Firma'}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.referenceId ? getReferenceName(user.role, user.referenceId) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => {
                      setSelectedUser(user);
                      setAssignRole(user.role || user.requestedRole || '');
                      setAssignRefId(user.referenceId || '');
                    }}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Yetki Düzenle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assign Role Modal */}
      {selectedUser && (
        <div className="fixed z-50 inset-0 overflow-y-auto" onClick={() => setSelectedUser(null)}>
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div 
              className="relative z-10 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleAssignRole}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Kullanıcı Yetkilendirme</h3>
                    <button type="button" onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-500">
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Kullanıcı: <span className="font-medium text-gray-900">{selectedUser.name} ({selectedUser.email})</span></p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol Seçin</label>
                    <select 
                      required
                      value={assignRole}
                      onChange={e => {
                        setAssignRole(e.target.value as any);
                        setAssignRefId('');
                      }}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                    >
                      <option value="">-- Rol Seçin --</option>
                      <option value="admin">Admin</option>
                      <option value="sponsor">Sponsor</option>
                      <option value="firm">Firma (Müşteri)</option>
                    </select>
                  </div>

                  {assignRole === 'sponsor' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hangi Sponsor?</label>
                      <select 
                        required
                        value={assignRefId}
                        onChange={e => setAssignRefId(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                      >
                        <option value="">-- Sponsor Seçin --</option>
                        {sponsors.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {assignRole === 'firm' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hangi Firma?</label>
                      <select 
                        required
                        value={assignRefId}
                        onChange={e => setAssignRefId(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                      >
                        <option value="">-- Firma Seçin --</option>
                        {firms.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm">
                    Kaydet
                  </button>
                  <button type="button" onClick={() => setSelectedUser(null)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
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
