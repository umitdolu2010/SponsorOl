import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, QrCode, BarChart3, Megaphone, LayoutDashboard, Building2 } from 'lucide-react';

import MyCampaigns from './MyCampaigns';
import MyQRCodes from './MyQRCodes';
import SponsorAnalytics from './SponsorAnalytics';
import FirmsList from './FirmsList';

function SponsorOverview() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    qrCodes: 0,
    clicks: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!userProfile?.referenceId) return;
      try {
        const qrSnap = await getDocs(query(collection(db, 'qr_codes'), where('sponsorId', '==', userProfile.referenceId), where('status', '==', 'active')));
        const analyticsSnap = await getDocs(query(collection(db, 'analytics'), where('sponsorId', '==', userProfile.referenceId)));

        setStats({
          qrCodes: qrSnap.size,
          clicks: analyticsSnap.size
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [userProfile]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Sponsor Özeti</h1>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center">
          <QrCode className="h-6 w-6 text-indigo-600" />
          <div className="ml-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Aktif QR Kodlarım</dt>
            <dd className="text-lg font-medium text-gray-900">{stats.qrCodes}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center">
          <BarChart3 className="h-6 w-6 text-emerald-500" />
          <div className="ml-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Toplam Tıklama</dt>
            <dd className="text-lg font-medium text-gray-900">{stats.clicks}</dd>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SponsorDashboard() {
  const { logout, userProfile } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Özet', href: '/sponsor', icon: LayoutDashboard },
    { name: 'Firmalar', href: '/sponsor/firms', icon: Building2 },
    { name: 'Kampanyalarım', href: '/sponsor/campaigns', icon: Megaphone },
    { name: 'QR Kodlarım', href: '/sponsor/qrcodes', icon: QrCode },
    { name: 'İstatistikler', href: '/sponsor/analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <QrCode className="h-8 w-8 text-indigo-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">Sponsor Paneli</span>
        </div>
        <div className="flex-1 py-6 flex flex-col gap-1 px-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-700' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              {userProfile?.name?.charAt(0) || 'S'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{userProfile?.name}</p>
              <p className="text-xs text-gray-500">Sponsor</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Routes>
          <Route path="/" element={<SponsorOverview />} />
          <Route path="/firms" element={<FirmsList />} />
          <Route path="/campaigns" element={<MyCampaigns />} />
          <Route path="/qrcodes" element={<MyQRCodes />} />
          <Route path="/analytics" element={<SponsorAnalytics />} />
        </Routes>
      </main>
    </div>
  );
}
