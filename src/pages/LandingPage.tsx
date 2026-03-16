import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { QrCode, ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [firm, setFirm] = useState<any>(null);

  useEffect(() => {
    const fetchQRAndCampaign = async () => {
      if (!qrCode) {
        setError('Geçersiz QR Kod');
        setLoading(false);
        return;
      }

      try {
        // Find the QR code document
        const qrQuery = query(collection(db, 'qr_codes'), where('code', '==', qrCode), where('status', '==', 'active'));
        const qrSnapshot = await getDocs(qrQuery);

        if (qrSnapshot.empty) {
          setError('QR Kod bulunamadı veya pasif durumda.');
          setLoading(false);
          return;
        }

        const qrData = qrSnapshot.docs[0].data();
        const qrId = qrSnapshot.docs[0].id;

        let campaignData = null;
        let activeCampaignId = qrData.campaignId;

        if (activeCampaignId) {
          // Find the specific Campaign document
          const campaignDoc = await getDoc(doc(db, 'campaigns', activeCampaignId));
          if (campaignDoc.exists() && campaignDoc.data().status === 'approved') {
            campaignData = campaignDoc.data();
          }
        } else {
          // If no specific campaign is linked, find the latest approved campaign for this sponsor
          const campQuery = query(
            collection(db, 'campaigns'),
            where('sponsorId', '==', qrData.sponsorId),
            where('status', '==', 'approved')
          );
          const campSnapshot = await getDocs(campQuery);
          
          if (!campSnapshot.empty) {
            // Sort manually if index is not ready, or just take the first one
            const campaigns = campSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
            campaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            campaignData = campaigns[0];
            activeCampaignId = campaigns[0].id;
          }
        }

        if (!campaignData) {
          setError('Bu sponsora ait aktif ve onaylanmış bir kampanya (mesaj) bulunmuyor.');
          setLoading(false);
          return;
        }

        setCampaign(campaignData);

        // Find the Firm document
        if (qrData.firmId) {
          const firmDoc = await getDoc(doc(db, 'firms', qrData.firmId));
          if (firmDoc.exists()) {
            setFirm(firmDoc.data());
          }
        }

        // Record Analytics
        try {
          await addDoc(collection(db, 'analytics'), {
            qrCodeId: qrId,
            sponsorId: qrData.sponsorId,
            firmId: qrData.firmId,
            campaignId: activeCampaignId,
            clickedAt: new Date().toISOString(),
            userAgent: navigator.userAgent.substring(0, 450)
          });
        } catch (analyticsError) {
          console.error('Analytics error:', analyticsError);
        }

        setLoading(false);

        // Redirect after a short delay if landingUrl is present
        if (campaignData.landingUrl) {
          setTimeout(() => {
            window.location.href = campaignData.landingUrl;
          }, 3500);
        }

      } catch (err) {
        console.error('Error fetching QR data:', err);
        setError('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        setLoading(false);
      }
    };

    fetchQRAndCampaign();
  }, [qrCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl"
        >
          <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <QrCode className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Oops!</h1>
          <p className="text-zinc-400">{error}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/20 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden">
          
          {/* Admin Ad Area (Top) */}
          {campaign.adminAdContent && (
            <div className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 p-3 border-b border-white/5 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <p className="text-xs text-indigo-200 font-medium tracking-wide uppercase">{campaign.adminAdContent}</p>
            </div>
          )}

          <div className="p-8 sm:p-10 text-center flex flex-col items-center">
            
            {firm?.logoUrl ? (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
                className="w-24 h-24 rounded-2xl overflow-hidden mb-8 border border-white/10 shadow-xl bg-white/5 p-2"
              >
                <img src={firm.logoUrl} alt={firm.name} className="w-full h-full object-contain rounded-xl" referrerPolicy="no-referrer" />
              </motion.div>
            ) : (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-8 shadow-xl shadow-indigo-500/20"
              >
                <QrCode className="w-10 h-10 text-white" />
              </motion.div>
            )}

            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight leading-tight"
            >
              {campaign.title}
            </motion.h1>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-zinc-400 mb-10 leading-relaxed"
            >
              {campaign.message}
            </motion.p>
            
            {campaign.landingUrl && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="w-full"
              >
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <a 
                    href={campaign.landingUrl}
                    className="relative w-full flex items-center justify-center gap-3 px-8 py-4 bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white font-semibold rounded-2xl transition-all duration-200"
                  >
                    <span>Fırsatı Yakala</span>
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </div>
                
                <div className="mt-6 flex flex-col items-center gap-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Yönlendiriliyorsunuz</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Footer Brand */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-zinc-600 flex items-center justify-center gap-1">
            Powered by <span className="font-semibold text-zinc-400">SponsorOl</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
