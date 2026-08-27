import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sprout, Sparkles } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleLoginSubmit = async (email, password) => {
    const result = await login(email, password);
    if (result.success) {
      const user = useAuthStore.getState().user;
      toast.success(`Welcome back, ${user.name}!`);
      if (!user.profileCompleted) {
        navigate('/onboarding');
      } else {
        navigate(`/${user.role}/dashboard`);
      }
    } else {
      toast.error(result.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLoginSubmit(form.email, form.password);
  };

  const handleQuickDemoFill = (email, password) => {
    setForm({ email, password });
    handleLoginSubmit(email, password);
  };

  return (
    <div style={{
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
      
      {/* Left Brand & Mission Visual Area */}
      <div style={{ flex: 1, maxWidth: 600, paddingRight: 40, color: '#FAF7F2' }}>
        
        {/* Brand Pill */}
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

        {/* Hero Tagline */}
        <h1 style={{
          fontSize: 'clamp(2.4rem, 4vw, 3.4rem)', fontWeight: 800, lineHeight: 1.14,
          color: '#FAF7F2', marginBottom: 20, textShadow: '0 3px 14px rgba(0,0,0,0.75)',
        }}>
          Grow smarter.<br />
          Sell better.<br />
          Prevent loss.
        </h1>

        <p style={{
          color: 'rgba(250, 247, 242, 0.95)', fontSize: 16, lineHeight: 1.65, maxWidth: 500,
          textShadow: '0 2px 10px rgba(0,0,0,0.7)', marginBottom: 36,
        }}>
          Real-time APMC mandi intelligence, pre-harvest contract matching, and smart distress sale rescue for Indian agriculture.
        </p>

        {/* Verified Stats */}
        <div style={{
          display: 'flex', gap: 32, borderTop: '1px solid rgba(255, 255, 255, 0.3)',
          paddingTop: 24, maxWidth: 500,
        }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#DDA15E', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>12,000+</div>
            <div style={{ fontSize: 13, color: 'rgba(250, 247, 242, 0.9)', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>Verified Farmers</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#FAF7F2', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>2,400+</div>
            <div style={{ fontSize: 13, color: 'rgba(250, 247, 242, 0.9)', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>Active Buyers</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#88D49E', textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>150+</div>
            <div style={{ fontSize: 13, color: 'rgba(250, 247, 242, 0.9)', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>APMC Mandis</div>
          </div>
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
        
        {/* Card Header Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(45, 106, 79, 0.85)', color: '#FAF7F2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 15, border: '1px solid rgba(255, 255, 255, 0.35)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}>
            AC
          </div>
          <span style={{ fontSize: 19, fontWeight: 800, color: '#FAF7F2', letterSpacing: '-0.01em', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
            AgriConnect
          </span>
        </div>

        <h2 style={{ fontSize: 23, fontWeight: 800, color: '#FAF7F2', marginBottom: 4, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
          Sign in to your account
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(250, 247, 242, 0.85)', marginBottom: 20, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
          Enter credentials or click a 1-click demo role below:
        </p>

        {/* 1-Click Instant Demo Login Bar */}
        <div style={{ marginBottom: 18 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#DDA15E', textTransform: 'uppercase',
            letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4,
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}>
            <Sparkles size={12} color="#DDA15E" /> 1-Click Instant Demo Login
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemoFill('farmer@demo.com', 'demo1234')}
              style={{
                padding: '10px 6px', borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.32)',
                background: 'rgba(14, 32, 20, 0.55)',
                color: '#FAF7F2',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.15s ease',
                backdropFilter: 'blur(8px)',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              🌱 Farmer
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemoFill('buyer@demo.com', 'demo1234')}
              style={{
                padding: '10px 6px', borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.32)',
                background: 'rgba(14, 32, 20, 0.55)',
                color: '#FAF7F2',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.15s ease',
                backdropFilter: 'blur(8px)',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              🏢 Buyer
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemoFill('admin@demo.com', 'demo1234')}
              style={{
                padding: '10px 6px', borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.32)',
                background: 'rgba(14, 32, 20, 0.55)',
                color: '#FAF7F2',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center',
                transition: 'all 0.15s ease',
                backdropFilter: 'blur(8px)',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              ⚡ Admin
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 16px' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.25)' }} />
          <span style={{ fontSize: 11, color: 'rgba(250, 247, 242, 0.8)', fontWeight: 600 }}>OR SIGN IN WITH EMAIL</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.25)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="email" style={{ fontSize: 12, fontWeight: 600, color: '#FAF7F2', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
              Email address *
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
              style={{
                background: 'rgba(14, 32, 20, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.38)',
                color: '#FAF7F2',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 14,
                width: '100%',
                boxSizing: 'border-box',
                backdropFilter: 'blur(8px)',
                outline: 'none',
                boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.35)',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="password" style={{ fontSize: 12, fontWeight: 600, color: '#FAF7F2', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
              Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                placeholder="Your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
                style={{
                  padding: '12px 44px 12px 14px',
                  background: 'rgba(14, 32, 20, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.38)',
                  color: '#FAF7F2',
                  borderRadius: 10,
                  fontSize: 14,
                  width: '100%',
                  boxSizing: 'border-box',
                  backdropFilter: 'blur(8px)',
                  outline: 'none',
                  boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.35)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#FAF7F2', padding: 0,
                  cursor: 'pointer',
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              fontWeight: 700, padding: 13,
              background: '#2D6A4F', border: '1px solid rgba(255, 255, 255, 0.45)', color: '#FAF7F2',
              borderRadius: 10, marginTop: 4, cursor: 'pointer', fontSize: 15,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            {isLoading ? 'Signing in…' : 'Sign in to Dashboard'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'rgba(250, 247, 242, 0.9)', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#DDA15E', fontWeight: 700, textDecoration: 'none' }}>
            Create account
          </Link>
        </div>

      </div>

    </div>
  );
}
