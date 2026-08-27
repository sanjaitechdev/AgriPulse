import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sprout, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'farmer' });
  const [showPw, setShowPw] = useState(false);
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    const result = await register(form);
    if (result.success) {
      toast.success('Account created! Let\'s set up your profile.');
      navigate('/onboarding');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="login-outer-wrapper" style={{
      minHeight: '100vh',
      backgroundImage: 'linear-gradient(180deg, rgba(10, 24, 15, 0.2) 0%, rgba(8, 20, 12, 0.45) 50%, rgba(6, 16, 10, 0.75) 100%), url(/images/farm_bg.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '40px 64px',
      boxSizing: 'border-box',
    }}>

      {/* Left Brand & Mission Visual Area (Desktop Only) */}
      <div className="login-hero-left" style={{ flex: 1, maxWidth: 580, paddingRight: 40, color: '#FAF7F2' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'rgba(35, 77, 53, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          }}>
            <Sprout size={30} color="#FAF7F2" />
          </div>
          <div>
            <span style={{ color: '#FAF7F2', fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em', textShadow: '0 2px 12px rgba(0,0,0,0.7)' }}>
              AgriConnect
            </span>
            <div style={{ fontSize: 13, color: '#DDA15E', fontWeight: 600, textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
              Demand-Guided Agricultural Intelligence
            </div>
          </div>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.2rem, 3.6vw, 3rem)', fontWeight: 800, lineHeight: 1.18,
          color: '#FAF7F2', marginBottom: 20, textShadow: '0 3px 14px rgba(0,0,0,0.75)',
        }}>
          Join 12,000+ farmers & buyers building a smarter agricultural economy.
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 500 }}>
          {[
            'AI-guided supply-demand gap warnings before harvest',
            'Direct buyer contract matches with locked floor prices',
            'Real APMC mandi netback comparison across 8 mandis',
            'Distress sale rescue & cold-storage routing network',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(250, 247, 242, 0.95)', fontSize: 15, textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
              <CheckCircle2 size={18} color="#88D49E" style={{ flexShrink: 0 }} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Floating Card with Farm Background & Seamless Dark Translucent Inputs */}
      <div style={{
        width: 460,
        maxWidth: '100%',
        backgroundImage: 'linear-gradient(180deg, rgba(14, 34, 22, 0.58) 0%, rgba(10, 26, 16, 0.76) 100%), url(/images/farm_bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'right 30%',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 24,
        padding: '36px 36px',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.55), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxSizing: 'border-box',
        margin: '20px 0',
        color: '#FAF7F2',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(45, 106, 79, 0.85)', color: '#FAF7F2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 15, border: '1px solid rgba(255, 255, 255, 0.35)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}>
            AC
          </div>
          <span style={{ fontSize: 19, fontWeight: 800, color: '#FAF7F2', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>AgriConnect</span>
        </div>
        
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#FAF7F2', marginBottom: 4, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>Create your free account</h2>
        <p style={{ fontSize: 13, color: 'rgba(250, 247, 242, 0.85)', marginBottom: 18, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>Get started in under 2 minutes</p>

        {/* Role selector */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {['farmer', 'buyer'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setForm({ ...form, role: r })}
              style={{
                flex: 1, padding: '10px', borderRadius: 10,
                border: `2px solid ${form.role === r ? '#40916C' : 'rgba(255, 255, 255, 0.28)'}`,
                background: form.role === r ? 'rgba(45, 106, 79, 0.55)' : 'rgba(14, 32, 20, 0.55)',
                color: '#FAF7F2',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize',
                transition: 'all 0.15s ease',
                backdropFilter: 'blur(6px)',
              }}
            >
              {r === 'farmer' ? '🌱 Vegetable Farmer' : '🏢 Bulk Buyer'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor="name" style={{ fontSize: 12, fontWeight: 600, color: '#FAF7F2', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>Full name *</label>
            <input
              id="name" type="text" placeholder="Ravi Kumar"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
              style={{
                background: 'rgba(14, 32, 20, 0.65)', border: '1px solid rgba(255, 255, 255, 0.38)',
                color: '#FAF7F2', borderRadius: 10, padding: '10px 14px', width: '100%', boxSizing: 'border-box', outline: 'none',
                boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.35)',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor="reg-email" style={{ fontSize: 12, fontWeight: 600, color: '#FAF7F2', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>Email address *</label>
            <input
              id="reg-email" type="email" placeholder="you@example.com"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
              style={{
                background: 'rgba(14, 32, 20, 0.65)', border: '1px solid rgba(255, 255, 255, 0.38)',
                color: '#FAF7F2', borderRadius: 10, padding: '10px 14px', width: '100%', boxSizing: 'border-box', outline: 'none',
                boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.35)',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor="phone" style={{ fontSize: 12, fontWeight: 600, color: '#FAF7F2', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>Mobile number</label>
            <input
              id="phone" type="tel" placeholder="9876543210"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={10}
              style={{
                background: 'rgba(14, 32, 20, 0.65)', border: '1px solid rgba(255, 255, 255, 0.38)',
                color: '#FAF7F2', borderRadius: 10, padding: '10px 14px', width: '100%', boxSizing: 'border-box', outline: 'none',
                boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.35)',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label htmlFor="reg-password" style={{ fontSize: 12, fontWeight: 600, color: '#FAF7F2', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-password" type={showPw ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                style={{
                  padding: '10px 44px 10px 14px', background: 'rgba(14, 32, 20, 0.65)', border: '1px solid rgba(255, 255, 255, 0.38)',
                  color: '#FAF7F2', borderRadius: 10, width: '100%', boxSizing: 'border-box', outline: 'none',
                  boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.35)',
                }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#FAF7F2', padding: 0, cursor: 'pointer' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: 6, fontWeight: 700, padding: 12,
              background: '#2D6A4F', border: '1px solid rgba(255, 255, 255, 0.45)', color: '#FAF7F2',
              borderRadius: 10, cursor: 'pointer', fontSize: 15,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
            }}
          >
            {isLoading ? 'Creating account…' : `Create ${form.role === 'farmer' ? 'Farmer' : 'Buyer'} Account`}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'rgba(250, 247, 242, 0.9)', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#DDA15E', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
        </div>

      </div>

      <style>{`
        @media (max-width: 960px) {
          .login-outer-wrapper {
            padding: 20px 16px !important;
            justify-content: center !important;
          }
          .login-hero-left {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .login-outer-wrapper {
            padding: 12px 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
