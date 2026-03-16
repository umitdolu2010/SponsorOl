import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { BarChart3, TrendingUp, Calendar, QrCode, Users, Briefcase } from 'lucide-react';

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [firms, setFirms] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

      // Fetch Campaigns
      const campaignsSnapshot = await getDocs(query(collection(db, 'campaigns')));
      setCampaigns(campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch Analytics
      const q = query(collection(db, 'analytics'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      data.sort((a, b) => new Date(b.clickedAt).getTime() - new Date(a.clickedAt).getTime());
      
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSponsorName = (id: string) => sponsors.find(s => s.id === id)?.name || 'Bilinmiyor';
  const getFirmName = (id: string) => firms.find(f => f.id === id)?.name || 'Bilinmiyor';
  const getCampaignName = (id: string) => campaigns.find(c => c.id === id)?.title || 'Bilinmiyor';

  if (loading) return <div className="p-4">Yükleniyor...</div>;

  const totalClicks = analytics.length;
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentClicks = analytics.filter(a => new Date(a.clickedAt) >= sevenDaysAgo).length;

  // Group by Sponsor
  const clicksBySponsor = analytics.reduce((acc, curr) => {
    acc[curr.sponsorId] = (acc[curr.sponsorId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group by Firm
  const clicksByFirm = analytics.reduce((acc, curr) => {
    acc[curr.firmId] = (acc[curr.firmId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Genel İstatistikler</h2>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center">
          <BarChart3 className="h-8 w-8 text-indigo-600" />
          <div className="ml-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Toplam Tıklama</dt>
            <dd className="text-2xl font-bold text-gray-900">{totalClicks}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center">
          <TrendingUp className="h-8 w-8 text-emerald-500" />
          <div className="ml-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Son 7 Gün</dt>
            <dd className="text-2xl font-bold text-gray-900">{recentClicks}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center">
          <Users className="h-8 w-8 text-blue-500" />
          <div className="ml-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Toplam Sponsor</dt>
            <dd className="text-2xl font-bold text-gray-900">{sponsors.length}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center">
          <Briefcase className="h-8 w-8 text-orange-500" />
          <div className="ml-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Toplam Firma</dt>
            <dd className="text-2xl font-bold text-gray-900">{firms.length}</dd>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Sponsor Performance */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Sponsor Performansı (Tıklama)</h3>
          </div>
          <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {Object.entries(clicksBySponsor).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([sponsorId, count]) => (
              <li key={sponsorId} className="px-6 py-4 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">{getSponsorName(sponsorId)}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {count as number} Tıklama
                </span>
              </li>
            ))}
            {Object.keys(clicksBySponsor).length === 0 && (
              <li className="px-6 py-4 text-center text-gray-500 text-sm">Veri bulunmuyor.</li>
            )}
          </ul>
        </div>

        {/* Firm Performance */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Firma Performansı (Tıklama)</h3>
          </div>
          <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {Object.entries(clicksByFirm).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([firmId, count]) => (
              <li key={firmId} className="px-6 py-4 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">{getFirmName(firmId)}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  {count as number} Tıklama
                </span>
              </li>
            ))}
            {Object.keys(clicksByFirm).length === 0 && (
              <li className="px-6 py-4 text-center text-gray-500 text-sm">Veri bulunmuyor.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Son Tıklamalar (Tüm Sistem)</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih / Saat</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sponsor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Firma</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kampanya</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {analytics.slice(0, 50).map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {new Date(item.clickedAt).toLocaleString('tr-TR')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getSponsorName(item.sponsorId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getFirmName(item.firmId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getCampaignName(item.campaignId)}
                </td>
              </tr>
            ))}
            {analytics.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Henüz tıklama verisi bulunmuyor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
