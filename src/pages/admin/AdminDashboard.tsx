import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Users, Briefcase, QrCode, BarChart3, LayoutDashboard, CheckSquare, Shield } from 'lucide-react';

// Import Admin Pages
import Firms from './Firms';
import Sponsors from './Sponsors';
import Campaigns from './Campaigns';
import QRCodes from './QRCodes';
import UsersPage from './Users';
import AdminAnalytics from './AdminAnalytics';

function DashboardOverview() {
  const [stats, setStats] = useState({
    sponsors: 0,
    firms: 0,
    qrCodes: 0,
    clicks: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const sponsorsSnap = await getDocs(collection(db, 'sponsors'));
        const firmsSnap = await getDocs(collection(db, 'firms'));
        const qrSnap = await getDocs(query(collection(db, 'qr_codes'), where('status', '==', 'active')));
        const analyticsSnap = await getDocs(collection(db, 'analytics'));

        setStats({
          sponsors: sponsorsSnap.size,
          firms: firmsSnap.size,
          qrCodes: qrSnap.size,
          clicks: analyticsSnap.size
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Yönetim Paneli Özeti</h1>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center">
          <Users className="h-6 w-6 text-gray-400" />
          <div className="ml-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Sponsorlar</dt>
            <dd className="text-lg font-medium text-gray-900">{stats.sponsors}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center">
          <Briefcase className="h-6 w-6 text-gray-400" />
          <div className="ml-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Firmalar</dt>
            <dd className="text-lg font-medium text-gray-900">{stats.firms}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center">
          <QrCode className="h-6 w-6 text-gray-400" />
          <div className="ml-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Aktif QR Kodlar</dt>
            <dd className="text-lg font-medium text-gray-900">{stats.qrCodes}</dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center">
          <BarChart3 className="h-6 w-6 text-gray-400" />
          <div className="ml-5">
            <dt className="text-sm font-medium text-gray-500 truncate">Toplam Tıklama</dt>
            <dd className="text-lg font-medium text-gray-900">{stats.clicks}</dd>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { logout, userProfile } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Özet', href: '/admin', icon: LayoutDashboard },
    { name: 'Firmalar', href: '/admin/firms', icon: Briefcase },
    { name: 'Sponsorlar', href: '/admin/sponsors', icon: Users },
    { name: 'Kampanya Onayları', href: '/admin/campaigns', icon: CheckSquare },
    { name: 'QR Kod Üretimi', href: '/admin/qrcodes', icon: QrCode },
    { name: 'Kullanıcılar', href: '/admin/users', icon: Shield },
    { name: 'İstatistikler', href: '/admin/analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <QrCode className="h-8 w-8 text-indigo-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">SponsorOl</span>
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
              {userProfile?.name?.charAt(0) || 'A'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{userProfile?.name}</p>
              <p className="text-xs text-gray-500">Admin</p>
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
          <Route path="/" element={<DashboardOverview />} />
          <Route path="/firms" element={<Firms />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/qrcodes" element={<QRCodes />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/analytics" element={<AdminAnalytics />} />
        </Routes>
      </main>
    </div>
  );
}
