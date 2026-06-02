import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface LoyaltyTransaction {
  id: number;
  points: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

interface LoyaltyStatus {
  points_balance: number;
  streak_count: number;
  last_check_in: string | null;
  checked_in_today: boolean;
  history: LoyaltyTransaction[];
}

export default function LoyaltyPage() {
  const [status, setStatus] = useState<LoyaltyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<{ id: number; left: number; color: string; size: number }[]>([]);

  // Wheel sectors
  const sectors = [
    { label: '5 Coins', color: '#818CF8' },
    { label: '₹5 Wallet Cash', color: '#10B981' },
    { label: '15 Coins', color: '#6366F1' },
    { label: '₹10 Wallet Cash', color: '#059669' },
    { label: '50 Coins', color: '#4F46E5' },
    { label: '₹20 Wallet Cash', color: '#047857' },
    { label: '100 Coins', color: '#4338CA' },
    { label: 'Free Shipping', color: '#EC4899' },
  ];

  const fetchLoyaltyStatus = useCallback(async () => {
    try {
      const res = await api.get('/loyalty/status');
      if (res.data.success) {
        setStatus(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load rewards account details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoyaltyStatus();
  }, [fetchLoyaltyStatus]);

  const triggerConfetti = () => {
    const colors = ['#FF416C', '#FFD700', '#00E676', '#2979FF', '#AA00FF'];
    const particles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 10 + 6,
    }));
    setConfettiParticles(particles);
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      setConfettiParticles([]);
    }, 3000);
  };

  const playSound = (type: 'win' | 'spin') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (type === 'spin') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 1.5);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
        osc.start();
        osc.stop(ctx.currentTime + 1.5);
      } else if (type === 'win') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleCheckIn = async () => {
    try {
      const res = await api.post('/loyalty/check-in');
      if (res.data.success) {
        toast.success(`Check-in Successful! +${res.data.data.earnedPoints} Coins!`);
        playSound('win');
        triggerConfetti();
        fetchLoyaltyStatus();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Check-in failed');
    }
  };

  const handleSpinWheel = async () => {
    if (spinning) return;
    if (status && status.points_balance < 20) {
      toast.error('You need at least 20 coins to spin the wheel!');
      return;
    }

    try {
      setSpinning(true);
      playSound('spin');
      const res = await api.post('/loyalty/spin-wheel');
      
      if (res.data.success) {
        const { reward, rewardDescription } = res.data.data;
        
        // Find sector index
        let targetIndex = sectors.findIndex((s) => s.label === reward.label);
        if (targetIndex === -1) {
          // Fallback based on type and value
          if (reward.type === 'coins') {
            targetIndex = sectors.findIndex((s) => s.label.includes(`${reward.value} Coins`));
          } else {
            targetIndex = sectors.findIndex((s) => s.label.includes(`₹${reward.value}`));
          }
        }
        if (targetIndex === -1) targetIndex = 0;

        // Calculate rotation: 360 / 8 segments = 45 deg per segment
        // We spin at least 5 times (1800 deg) plus the sector angle
        const sectorAngle = 45;
        const targetAngle = 360 - (targetIndex * sectorAngle) - (sectorAngle / 2);
        const finalRotation = wheelRotation + 1800 + (targetAngle - (wheelRotation % 360));
        
        setWheelRotation(finalRotation);

        setTimeout(() => {
          setSpinning(false);
          playSound('win');
          triggerConfetti();
          toast.success(`🎉 ${rewardDescription}`, { duration: 5000 });
          fetchLoyaltyStatus();
        }, 3000);
      }
    } catch (err: any) {
      setSpinning(false);
      toast.error(err.response?.data?.error || 'Failed to spin the wheel');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const streakDays = [
    { day: 1, reward: 10 },
    { day: 2, reward: 20 },
    { day: 3, reward: 30 },
    { day: 4, reward: 40 },
    { day: 5, reward: 50 },
    { day: 6, reward: 75 },
    { day: 7, reward: 100 },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes confettiDrop {
          0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .confetti-p {
          position: fixed;
          top: 0;
          animation: confettiDrop 3s linear forwards;
          pointer-events: none;
          z-index: 9999;
        }
      `}} />

      {/* Confetti overlay */}
      {showConfetti && confettiParticles.map((p) => (
        <div
          key={p.id}
          className="confetti-p"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size * 1.5}px`,
            borderRadius: '2px',
          }}
        />
      ))}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-8 text-white mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
          <svg width="400" height="400" viewBox="0 0 100 100" fill="currentColor">
            <circle cx="50" cy="50" r="40" />
          </svg>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="bg-indigo-700/50 text-indigo-200 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-indigo-500/30">
              💎 VIP Loyalty & Rewards
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold mt-4 tracking-tight">E-COM Rewards Club</h1>
            <p className="text-indigo-200 mt-2 max-w-xl text-sm md:text-base">
              Earn exclusive coins daily, spin the wheel of fortune to win cashback directly in your wallet, and unlock free shopping vouchers!
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 flex flex-col items-center md:items-end w-full md:w-auto shadow-inner">
            <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Your Balance</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-4xl font-black text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                {status?.points_balance || 0}
              </span>
              <span className="text-yellow-400 text-2xl animate-pulse">🪙</span>
            </div>
            <span className="text-[10px] text-indigo-200 mt-1 italic">20 coins = 1 Free Spin</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Daily Check-in & Spin Wheel */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Daily Streak Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Daily Streak</h2>
                <p className="text-xs text-slate-500 mt-0.5">Check in consecutively to multiply your coin rewards!</p>
              </div>
              <button
                onClick={handleCheckIn}
                disabled={status?.checked_in_today}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
                  status?.checked_in_today
                    ? 'bg-emerald-100 text-emerald-800 cursor-default border border-emerald-200'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105 active:scale-95'
                }`}
              >
                {status?.checked_in_today ? '✅ Claimed Today' : '🎁 Claim Reward'}
              </button>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
              {streakDays.map((sd) => {
                const isCompleted = status ? status.streak_count >= sd.day : false;
                const isCurrent = status ? (status.streak_count === sd.day - 1 && !status.checked_in_today) : false;
                
                return (
                  <div
                    key={sd.day}
                    className={`rounded-2xl p-3 flex flex-col items-center justify-between border text-center transition-all ${
                      isCompleted
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                        : isCurrent
                          ? 'bg-amber-50 border-amber-300 text-amber-900 scale-105 ring-2 ring-amber-400 ring-offset-2'
                          : 'bg-slate-50 border-slate-100 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider">Day {sd.day}</span>
                    <span className="text-2xl my-2">{isCompleted ? '⭐' : '🪙'}</span>
                    <span className="text-xs font-black">+{sd.reward}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spin the Wheel Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-12">
            
            {/* The Wheel */}
            <div className="relative w-72 h-72 md:w-80 md:h-80 flex-shrink-0">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 w-8 h-8 filter drop-shadow-md">
                <svg viewBox="0 0 24 24" fill="#EF4444" className="w-full h-full">
                  <path d="M12 2L2 14h20L12 2z" transform="rotate(180 12 12)" />
                </svg>
              </div>

              {/* Wheel circle */}
              <div
                className="w-full h-full rounded-full border-8 border-indigo-950 shadow-2xl relative overflow-hidden transition-transform duration-3000 ease-out"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full origin-center">
                  {sectors.map((sec, idx) => {
                    const angle = 45;
                    const rotation = idx * angle;
                    return (
                      <g key={idx} transform={`rotate(${rotation} 50 50)`}>
                        <path
                          d="M 50 50 L 50 0 A 50 50 0 0 1 85.35 14.64 Z"
                          fill={sec.color}
                          stroke="#ffffff"
                          strokeWidth="0.5"
                        />
                        <text
                          x="68"
                          y="24"
                          transform={`rotate(22.5 68 24)`}
                          fill="#ffffff"
                          fontSize="3.2"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {sec.label.split(' ')[0]}
                        </text>
                      </g>
                    );
                  })}
                  <circle cx="50" cy="50" r="12" fill="#1E1B4B" stroke="#ffffff" strokeWidth="1.5" />
                </svg>
              </div>

              {/* Spin Center Button */}
              <button
                onClick={handleSpinWheel}
                disabled={spinning}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-full bg-yellow-400 hover:bg-yellow-500 border-4 border-indigo-950 text-indigo-950 text-xs font-black shadow-lg uppercase tracking-wide hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center text-center"
              >
                {spinning ? '🍀' : 'SPIN'}
              </button>
            </div>

            {/* Description & Rewards Guide */}
            <div className="space-y-4 flex-grow">
              <h3 className="text-xl font-bold text-slate-900">Spin & Win Cashback</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Spend <strong>20 Coins</strong> to spin the wheel! Win up to <strong>100 Coins</strong>, **Vouchers**, or direct **Cashback** credited straight to your e-commerce wallet.
              </p>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                {sectors.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 px-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-semibold text-slate-700">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Right Side: Ledger / Transaction History */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-fit">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            📊 History Ledger
          </h3>
          
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {status?.history && status.history.length > 0 ? (
              status.history.map((tx) => {
                const isAddition = tx.points >= 0;
                return (
                  <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100/75 rounded-xl border border-slate-100 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{tx.description || tx.transaction_type}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(tx.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <span className={`text-sm font-black ${isAddition ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isAddition ? `+${tx.points}` : tx.points}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">No transaction history yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
