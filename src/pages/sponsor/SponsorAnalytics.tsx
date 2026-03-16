import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart3, TrendingUp, Calendar, Eye } from 'lucide-react';

export default function SponsorAnalytics() {
  const { userProfile } = useAuth();
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.referenceId) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [userProfile]);

  const fetchAnalytics = async () => {
    if (!userProfile?.referenceId) return;

    try {
      // Fetch Campaigns
      const campaignsSnapshot = await getDocs(
        query(collection(db, 'campaigns'), where('sponsorId', '==', userProfile.referenceId))
      );
      setCampaigns(campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch Analytics
      const q = query(
        collection(db, 'analytics'),
        where('sponsorId', '==', userProfile.referenceId)
      );
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

  const getCampaignName = (id: string) => campaigns.find(c => c.id === id)?.title || 'Bilinmeyen Kampanya';

  if (loading) return <div className="p-4">Yükleniyor...</div>;

  if (!userProfile?.referenceId) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg border border-red-200">
        Hesabınız bir sponsor profiliyle eşleştirilmemiş. Lütfen sistem yöneticisi ile iletişime geçin.
      </div>
    );
  }

  const totalClicks = analytics.length;
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentClicks = analytics.filter(a => new Date(a.clickedAt) >= sevenDaysAgo).length;

  // Group by campaign
  const clicksByCampaign = analytics.reduce((acc, curr) => {
    acc[curr.campaignId] = (acc[curr.campaignId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">İstatistikler</h2>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
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
          <Eye className="h-8 w-8 text-blue-500" />
          <div className="ml-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Aktif Kampanya Sayısı</dt>
            <dd className="text-2xl font-bold text-gray-900">{campaigns.filter(c => c.status === 'approved').length}</dd>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Campaign Performance */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Kampanya Performansı</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {Object.entries(clicksByCampaign).map(([campaignId, count]) => (
              <li key={campaignId} className="px-6 py-4 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">{getCampaignName(campaignId)}</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {count as number} Tıklama
                </span>
              </li>
            ))}
            {Object.keys(clicksByCampaign).length === 0 && (
              <li className="px-6 py-4 text-center text-gray-500 text-sm">Veri bulunmuyor.</li>
            )}
          </ul>
        </div>

        {/* Recent Clicks */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Son Tıklamalar</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {analytics.slice(0, 10).map((item) => (
              <li key={item.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {new Date(item.clickedAt).toLocaleString('tr-TR')}
                  </div>
                  <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                    {getCampaignName(item.campaignId)}
                  </span>
                </div>
              </li>
            ))}
            {analytics.length === 0 && (
              <li className="px-6 py-4 text-center text-gray-500 text-sm">Veri bulunmuyor.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
