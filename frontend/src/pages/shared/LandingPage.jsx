import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sprout, TrendingUp, ShieldCheck, Truck, Users, ArrowRight,
  ChevronRight, BarChart3,
  Calendar, MapPin, Calculator, AlertCircle, PlayCircle,
  Clock, Sun
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-hot-toast';

// Curated realistic fresh vegetables with authentic local and fallback imagery
const REAL_VEGETABLES = [
  {
    id: 'tomato',
    category: 'Solanaceae',
    name: 'Vine-Ripened Tomato',
    variety: 'Hybrid Shivam / S-31',
    image: '/images/tomato.jpg',
    pricePerKg: 34,
    priceUnit: '₹34 / kg',
    mandiPriceQtl: '₹3,400 / Qtl',
    trend: '+18.5%',
    trendUp: true,
    primaryMandi: 'Kolar APMC (Karnataka)',
    demandStatus: 'Strong Buyer Demand',
    demandScore: 92,
    yieldQuintalAcre: 180,
    cultivationCostAcre: 62000,
    durationDays: '75–90 Days',
    shelfLifeDays: '8–12 Days',
    harvestSeason: 'Year-Round (Kharif & Rabi)',
    badgeColor: '#C84B31',
  },
  {
    id: 'capsicum',
    category: 'Solanaceae',
    name: 'Green Bell Pepper',
    variety: 'Indra (Capsicum Annuum)',
    image: '/images/capsicum.jpg',
    pricePerKg: 68,
    priceUnit: '₹68 / kg',
    mandiPriceQtl: '₹6,800 / Qtl',
    trend: '+12.4%',
    trendUp: true,
    primaryMandi: 'Bengaluru APMC (Yeshwanthpur)',
    demandStatus: 'Pre-Harvest Contracts Open',
    demandScore: 88,
    yieldQuintalAcre: 120,
    cultivationCostAcre: 82000,
    durationDays: '90–110 Days',
    shelfLifeDays: '10–14 Days',
    harvestSeason: 'Polyhouse / Open Field',
    badgeColor: '#2D6A4F',
  },
  {
    id: 'chilli',
    category: 'Spices',
    name: 'Guntur Green Chilli',
    variety: 'Teja & Wonder Hot',
    image: '/images/chilli.jpg',
    pricePerKg: 84,
    priceUnit: '₹84 / kg',
    mandiPriceQtl: '₹8,400 / Qtl',
    trend: '+22.0%',
    trendUp: true,
    primaryMandi: 'Guntur Yard (Andhra Pradesh)',
    demandStatus: 'Peak Export Demand',
    demandScore: 95,
    yieldQuintalAcre: 75,
    cultivationCostAcre: 56000,
    durationDays: '60–80 Days',
    shelfLifeDays: '7–10 Days',
    harvestSeason: 'Kharif Flush',
    badgeColor: '#1E4D2B',
  },
  {
    id: 'onion',
    category: 'Alliums',
    name: 'Nashik Red Onion',
    variety: 'Gavran Dark Red',
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 28,
    priceUnit: '₹28 / kg',
    mandiPriceQtl: '₹2,800 / Qtl',
    trend: '-2.8%',
    trendUp: false,
    primaryMandi: 'Lasalgaon APMC (Maharashtra)',
    demandStatus: 'High Volume Consumption',
    demandScore: 78,
    yieldQuintalAcre: 110,
    cultivationCostAcre: 46000,
    durationDays: '110–130 Days',
    shelfLifeDays: '60–90 Days',
    harvestSeason: 'Rabi & Late Kharif',
    badgeColor: '#7A2E1A',
  },
  {
    id: 'potato',
    category: 'Tubers',
    name: 'Table Potato',
    variety: 'Kufri Jyoti / Chipsona',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 22,
    priceUnit: '₹22 / kg',
    mandiPriceQtl: '₹2,200 / Qtl',
    trend: '+5.4%',
    trendUp: true,
    primaryMandi: 'Agra APMC (Uttar Pradesh)',
    demandStatus: 'Processing Plant Sourcing',
    demandScore: 84,
    yieldQuintalAcre: 140,
    cultivationCostAcre: 50000,
    durationDays: '90–105 Days',
    shelfLifeDays: '45–60 Days',
    harvestSeason: 'Rabi Harvest',
    badgeColor: '#A06B22',
  },
  {
    id: 'carrot',
    category: 'Root Vegetables',
    name: 'Fresh Farm Carrots',
    variety: 'Pusa Rudhira / Nantes',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 42,
    priceUnit: '₹42 / kg',
    mandiPriceQtl: '₹4,200 / Qtl',
    trend: '+8.2%',
    trendUp: true,
    primaryMandi: 'Ooty & Mysuru APMC',
    demandStatus: 'Consistent Retail Sourcing',
    demandScore: 82,
    yieldQuintalAcre: 130,
    cultivationCostAcre: 48000,
    durationDays: '80–100 Days',
    shelfLifeDays: '15–20 Days',
    harvestSeason: 'Winter / Spring',
    badgeColor: '#D35400',
  },
  {
    id: 'broccoli',
    category: 'Brassicas',
    name: 'Crisp Green Broccoli',
    variety: 'Lucky F1 Hybrid',
    image: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 95,
    priceUnit: '₹95 / kg',
    mandiPriceQtl: '₹9,500 / Qtl',
    trend: '+15.8%',
    trendUp: true,
    primaryMandi: 'Bengaluru Metro Hub',
    demandStatus: 'Premium HoReCa Demand',
    demandScore: 90,
    yieldQuintalAcre: 60,
    cultivationCostAcre: 58000,
    durationDays: '65–80 Days',
    shelfLifeDays: '5–8 Days',
    harvestSeason: 'Cool Autumn / Winter',
    badgeColor: '#285238',
  },
  {
    id: 'cauliflower',
    category: 'Brassicas',
    name: 'Snowball Cauliflower',
    variety: 'Pusa Snowball K-1',
    image: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=600&auto=format&fit=crop&q=80',
    pricePerKg: 36,
    priceUnit: '₹36 / kg',
    mandiPriceQtl: '₹3,600 / Qtl',
    trend: '+9.1%',
    trendUp: true,
    primaryMandi: 'Hassan & Kolar APMC',
    demandStatus: 'Steady Wholesale Orders',
    demandScore: 79,
    yieldQuintalAcre: 100,
    cultivationCostAcre: 44000,
    durationDays: '70–90 Days',
    shelfLifeDays: '7–10 Days',
    harvestSeason: 'Late Autumn',
    badgeColor: '#3A6B4E',
  }
];

const LIVE_TICKER_FEED = [
  { item: '🍅 Hybrid Tomato', price: '₹3,400 / Qtl', mandi: 'Kolar APMC', change: '+18.5%', up: true },
  { item: '🫑 Green Capsicum', price: '₹6,800 / Qtl', mandi: 'Bengaluru APMC', change: '+12.4%', up: true },
  { item: '🧅 Nashik Red Onion', price: '₹2,800 / Qtl', mandi: 'Lasalgaon APMC', change: '-2.8%', up: false },
  { item: '🥔 Jyoti Potato', price: '₹2,200 / Qtl', mandi: 'Agra APMC', change: '+5.4%', up: true },
  { item: '🌶️ Guntur Chilli', price: '₹8,400 / Qtl', mandi: 'Guntur APMC', change: '+22.0%', up: true },
  { item: '🥕 Nantes Carrot', price: '₹4,200 / Qtl', mandi: 'Ooty APMC', change: '+8.2%', up: true },
  { item: '🥦 Organic Broccoli', price: '₹9,500 / Qtl', mandi: 'Pune APMC', change: '+15.8%', up: true },
  { item: '🥬 Cauliflower', price: '₹3,600 / Qtl', mandi: 'Hassan APMC', change: '+9.1%', up: true },
];

export default function LandingPage() {
  const { user, login } = useAuthStore();
  const navigate = useNavigate();

  // Calculator State
  const [selectedCropId, setSelectedCropId] = useState('tomato');
  const [acreage, setAcreage] = useState(3);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isDemoSigningIn, setIsDemoSigningIn] = useState(false);

  const activeCrop = useMemo(() => {
    return REAL_VEGETABLES.find((v) => v.id === selectedCropId) || REAL_VEGETABLES[0];
  }, [selectedCropId]);

  // Financial calculations
  const totalYieldQuintals = activeCrop.yieldQuintalAcre * acreage;
  const totalYieldKg = totalYieldQuintals * 100;
  const grossRevenue = totalYieldKg * activeCrop.pricePerKg;
  const totalInputCost = activeCrop.cultivationCostAcre * acreage;
  const projectedNetIncome = grossRevenue - totalInputCost;
  const marginPercentage = ((projectedNetIncome / grossRevenue) * 100).toFixed(1);

  // Category filter
  const categories = ['All', 'Solanaceae', 'Alliums', 'Tubers', 'Spices', 'Root Vegetables', 'Brassicas'];
  const filteredVegetables = selectedCategory === 'All'
    ? REAL_VEGETABLES
    : REAL_VEGETABLES.filter(v => v.category === selectedCategory);

  // 1-Click quick demo launcher
  const handleQuickDemo = async (role) => {
    setIsDemoSigningIn(true);
    try {
      const res = await login(`${role}@demo.com`, 'demo1234');
      if (res.success) {
        toast.success(`Welcome to ${role.toUpperCase()} Workspace!`);
        navigate(`/${role}/dashboard`);
      } else {
        toast.error(res.message || 'Demo sign-in failed');
      }
    } catch {
      toast.error('Could not authenticate demo user');
    } finally {
      setIsDemoSigningIn(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F2', color: '#1F241D', fontFamily: 'var(--font-primary)' }}>
      
      {/* ── Sticky Top Navigation ── */}
      <header className="nature-navbar flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: '#234D35',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(35, 77, 53, 0.2)',
          }}>
            <Sprout size={22} color="#FAF7F2" />
          </div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', color: '#1C3624', display: 'flex', alignItems: 'center', gap: 6 }}>
              AgriConnect
              <span style={{ fontSize: 11, background: '#E8EFE9', color: '#234D35', border: '1px solid #CCDDCF', borderRadius: 9999, padding: '2px 8px', fontWeight: 600 }}>
                Direct Mandi
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#5C6656', fontWeight: 500 }}>Demand-Guided Vegetable Intelligence</div>
          </div>
        </div>

        {/* Navigation links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <a href="#crops" style={{ color: '#3E4B3A', fontWeight: 500, fontSize: 14, textDecoration: 'none' }}>
            Live Market Crops
          </a>
          <a href="#calculator" style={{ color: '#3E4B3A', fontWeight: 500, fontSize: 14, textDecoration: 'none' }}>
            Harvest Calculator
          </a>
          <a href="#how-it-works" style={{ color: '#3E4B3A', fontWeight: 500, fontSize: 14, textDecoration: 'none' }}>
            Pre-Harvest System
          </a>
          <a href="#demo" style={{ color: '#3E4B3A', fontWeight: 500, fontSize: 14, textDecoration: 'none' }}>
            1-Click Demo
          </a>
        </div>

        {/* Authentication Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user ? (
            <Link to={`/${user.role}/dashboard`} className="natural-btn-primary" style={{ padding: '8px 18px', fontSize: 14 }}>
              <span>Go to {user.role} workspace</span>
              <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <Link to="/login" style={{
                color: '#234D35', fontWeight: 600, fontSize: 14, padding: '8px 16px',
                borderRadius: 8, border: '1px solid #D6CEBE', textDecoration: 'none', background: '#FFFFFF',
              }}>
                Sign in
              </Link>
              <Link to="/register" className="natural-btn-primary" style={{ padding: '8px 18px', fontSize: 14 }}>
                <span>Join Platform</span>
                <ChevronRight size={15} />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ── Real APMC Mandi Wholesale Ticker ── */}
      <div className="organic-ticker-wrap">
        <div className="organic-ticker-track">
          {[...LIVE_TICKER_FEED, ...LIVE_TICKER_FEED].map((feed, idx) => (
            <div key={idx} className="organic-ticker-item">
              <span style={{ fontWeight: 600, color: '#FAF7F2' }}>{feed.item}</span>
              <span style={{ fontWeight: 700, color: '#DDA15E' }}>{feed.price}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                color: feed.up ? '#4ADE80' : '#F87171',
                background: feed.up ? 'rgba(74, 222, 128, 0.15)' : 'rgba(248, 113, 113, 0.15)',
              }}>
                {feed.change}
              </span>
              <span style={{ fontSize: 11, color: '#A8B3A0' }}>• {feed.mandi}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Nature Hero Section with Real Farm Aerial Background ── */}
      <section className="nature-hero" style={{
        backgroundImage: 'linear-gradient(175deg, rgba(16, 36, 22, 0.86) 0%, rgba(26, 54, 34, 0.90) 50%, rgba(14, 28, 18, 0.94) 100%), url(/images/farm_bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
        
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 50, alignItems: 'center', position: 'relative', zIndex: 2 }}>
          
          {/* Left Editorial Content */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(250, 247, 242, 0.16)', border: '1px solid rgba(250, 247, 242, 0.28)',
              padding: '6px 14px', borderRadius: 9999, marginBottom: 22,
              fontSize: 13, color: '#DDA15E', fontWeight: 600,
              backdropFilter: 'blur(8px)',
            }}>
              <Sun size={15} color="#DDA15E" />
              Pre-Harvest Mandi Decision & Direct Buyer Network
            </div>

            <h1 style={{
              fontSize: 'clamp(2.3rem, 3.8vw, 3.2rem)', fontWeight: 800,
              lineHeight: 1.18, letterSpacing: '-0.03em', color: '#FAF7F2', marginBottom: 18,
            }}>
              Know your vegetable buyer & true mandi price before you harvest.
            </h1>

            <p style={{
              fontSize: 17, color: 'rgba(250, 247, 242, 0.9)',
              lineHeight: 1.6, maxWidth: 530, marginBottom: 32,
            }}>
              Avoid sudden market gluts and distress sales. AgriConnect models 150+ APMC supply-demand trends, calculates true freight netbacks, and connects verified vegetable farmers directly with institutional buyers.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 38 }}>
              <Link to="/register" className="natural-btn-primary" style={{
                background: '#DDA15E', color: '#1C3624', border: '1px solid #C8914F',
                padding: '14px 28px', fontSize: 16, fontWeight: 700,
              }}>
                <span>Start as Farmer</span>
                <ArrowRight size={17} />
              </Link>
              <Link to="/login" className="natural-btn-outline" style={{ padding: '14px 26px', fontSize: 16 }}>
                Institutional Buyer Sourcing
              </Link>
            </div>

            {/* Verified Trust Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, borderTop: '1px solid rgba(250, 247, 242, 0.2)', paddingTop: 20 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#DDA15E' }}>12,000+</div>
                <div style={{ fontSize: 12, color: 'rgba(250, 247, 242, 0.8)' }}>Verified Farmers</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#FAF7F2' }}>2,400+</div>
                <div style={{ fontSize: 12, color: 'rgba(250, 247, 242, 0.8)' }}>Active Bulk Buyers</div>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#88D49E' }}>150+ Mandis</div>
                <div style={{ fontSize: 12, color: 'rgba(250, 247, 242, 0.8)' }}>Live APMC Coverage</div>
              </div>
            </div>
          </div>

          {/* Right Showcase: Real Harvest Crate with Isolated Floating Produce */}
          <div style={{ position: 'relative', height: 460, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            
            {/* Centerpiece Real Produce Crate Card */}
            <div style={{
              width: 320, background: '#FAF7F2', borderRadius: 20, padding: 18,
              boxShadow: '0 20px 48px rgba(15, 30, 20, 0.45)', color: '#1F241D', position: 'relative', zIndex: 4,
              border: '1px solid #E5E0D4',
            }}>
              <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', height: 200, marginBottom: 14 }}>
                <img
                  src="/images/veggies_crate.jpg"
                  alt="Fresh organic harvest crate"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', bottom: 8, left: 8,
                  background: 'rgba(28, 54, 36, 0.92)', color: '#FAF7F2',
                  padding: '4px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80' }} />
                  Verified Crop Lot #AC-921
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1C3624', margin: 0 }}>Fresh Produce Lot</h3>
                  <div style={{ fontSize: 12, color: '#5C6656' }}>Harvest Ready in 14 Days • 400 Qtl</div>
                </div>
                <span style={{ background: '#234D35', color: '#FAF7F2', fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>
                  ₹34/kg
                </span>
              </div>

              <div style={{ background: '#F4F1EA', borderRadius: 10, padding: '10px 12px', marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#5C6656', marginBottom: 4 }}>
                  <span>Buyer Matching Status</span>
                  <span style={{ color: '#234D35', fontWeight: 700 }}>3 Verified Bids</span>
                </div>
                <div style={{ height: 6, background: '#E2DCD0', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ width: '85%', height: '100%', background: '#234D35', borderRadius: 9999 }} />
                </div>
              </div>
            </div>

            {/* Floating Vegetable Badge 1: Tomato */}
            <div className="floating-nature-badge anim-veg-float-1" style={{ top: '8%', right: '-4%', zIndex: 12 }}>
              <div className="veg-organic-thumb" style={{ borderColor: '#C84B31' }}>
                <img src="/images/tomato.jpg" alt="Tomato" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1F241D' }}>🍅 Vine Tomato</div>
                <div style={{ fontSize: 11, color: '#234D35', fontWeight: 600 }}>₹34/kg • <span style={{ color: '#15803D' }}>+18.5% ↑</span></div>
              </div>
            </div>

            {/* Floating Vegetable Badge 2: Capsicum */}
            <div className="floating-nature-badge anim-veg-float-2" style={{ top: '12%', left: '-10%', zIndex: 12 }}>
              <div className="veg-organic-thumb" style={{ borderColor: '#2D6A4F' }}>
                <img src="/images/capsicum.jpg" alt="Bell Pepper" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1F241D' }}>🫑 Bell Pepper</div>
                <div style={{ fontSize: 11, color: '#234D35', fontWeight: 600 }}>₹68/kg • Pre-Booked</div>
              </div>
            </div>

            {/* Floating Vegetable Badge 3: Guntur Chilli */}
            <div className="floating-nature-badge anim-veg-float-3" style={{ bottom: '12%', right: '-8%', zIndex: 12 }}>
              <div className="veg-organic-thumb" style={{ borderColor: '#1E4D2B' }}>
                <img src="/images/chilli.jpg" alt="Chilli" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1F241D' }}>🌶️ Guntur Chilli</div>
                <div style={{ fontSize: 11, color: '#234D35', fontWeight: 600 }}>₹84/kg • High Demand</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Handcrafted Harvest & Profit Estimator ── */}
      <section id="calculator" style={{ padding: '80px var(--space-8)', background: '#FFFFFF', borderBottom: '1px solid #E5E0D4' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#E8EFE9', color: '#234D35', padding: '5px 12px',
              borderRadius: 9999, fontSize: 12, fontWeight: 700, marginBottom: 10,
            }}>
              <Calculator size={14} /> Smart Harvest Estimator
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1C3624', marginBottom: 8 }}>
              Calculate Estimated Yield & Net Returns Per Acre
            </h2>
            <p style={{ fontSize: 15, color: '#5C6656', maxWidth: 620, margin: '0 auto' }}>
              Choose your crop variety and cultivation area to inspect real market benchmarks, input expenditure, and projected take-home earnings.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32,
            background: '#FAF7F2', border: '1px solid #E5E0D4', borderRadius: 20, padding: 32,
          }}>
            
            {/* Left Selection Controls */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1F241D', marginBottom: 10 }}>
                1. Select Vegetable Variety:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, marginBottom: 24 }}>
                {REAL_VEGETABLES.map((veg) => (
                  <button
                    key={veg.id}
                    type="button"
                    onClick={() => setSelectedCropId(veg.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      padding: '10px 8px', borderRadius: 12,
                      border: selectedCropId === veg.id ? '2px solid #234D35' : '1px solid #E2DCD0',
                      background: selectedCropId === veg.id ? '#FFFFFF' : '#F4F1EA',
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      boxShadow: selectedCropId === veg.id ? '0 4px 12px rgba(35, 77, 53, 0.12)' : 'none',
                    }}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${veg.badgeColor}` }}>
                      <img src={veg.image} alt={veg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: selectedCropId === veg.id ? 700 : 600, color: '#1F241D', textAlign: 'center' }}>
                      {veg.name.split(' ')[0]}
                    </span>
                    <span style={{ fontSize: 11, color: '#234D35', fontWeight: 700 }}>
                      {veg.priceUnit}
                    </span>
                  </button>
                ))}
              </div>

              {/* Acreage Slider */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#1F241D' }}>
                    2. Land Cultivation Area:
                  </label>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#234D35', background: '#E8EFE9', padding: '3px 12px', borderRadius: 6 }}>
                    {acreage} {acreage === 1 ? 'Acre' : 'Acres'}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={0.5}
                  value={acreage}
                  onChange={(e) => setAcreage(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#234D35', cursor: 'pointer', height: 7 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6A7663', marginTop: 4 }}>
                  <span>1 Acre</span>
                  <span>10 Acres</span>
                  <span>20 Acres</span>
                </div>
              </div>

              {/* Crop Agronomics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, background: '#FFFFFF', padding: 14, borderRadius: 12, border: '1px solid #E5E0D4' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#6A7663' }}>Standard Yield Per Acre</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1F241D' }}>{activeCrop.yieldQuintalAcre} Qtl / Acre</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#6A7663' }}>Maturity Timeline</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1F241D' }}>{activeCrop.durationDays}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#6A7663' }}>Input & Labour Budget</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1F241D' }}>₹{activeCrop.cultivationCostAcre.toLocaleString('en-IN')} / Acre</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#6A7663' }}>Reference Benchmark Mandi</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1F241D' }}>{activeCrop.primaryMandi.split(' ')[0]} APMC</div>
                </div>
              </div>

            </div>

            {/* Right Financial Projection Card */}
            <div style={{
              background: '#234D35', color: '#FAF7F2', borderRadius: 16, padding: 24,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              border: '1px solid #1C3F2B', boxShadow: '0 8px 24px rgba(35, 77, 53, 0.25)',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '2px solid #DDA15E' }}>
                      <img src={activeCrop.image} alt={activeCrop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800 }}>{activeCrop.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(250, 247, 242, 0.75)' }}>{activeCrop.variety}</div>
                    </div>
                  </div>
                  <span style={{ background: 'rgba(221, 161, 94, 0.2)', color: '#DDA15E', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                    Demand: {activeCrop.demandScore}/100
                  </span>
                </div>

                {/* Net Income Stat */}
                <div style={{ background: 'rgba(0, 0, 0, 0.22)', borderRadius: 12, padding: 16, marginBottom: 18 }}>
                  <div style={{ fontSize: 11, color: 'rgba(250, 247, 242, 0.75)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Estimated Net Take-Home Margin
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: '#DDA15E', margin: '4px 0 6px' }}>
                    ₹{Math.max(0, projectedNetIncome).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(250, 247, 242, 0.85)' }}>
                    Calculated for {acreage} {acreage === 1 ? 'acre' : 'acres'} • ~{marginPercentage}% Profit Margin
                  </div>
                </div>

                {/* Breakdown List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, borderBottom: '1px solid rgba(250, 247, 242, 0.15)', paddingBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(250, 247, 242, 0.75)' }}>Estimated Total Produce</span>
                    <span style={{ fontWeight: 700 }}>{totalYieldQuintals.toLocaleString()} Quintals ({totalYieldKg.toLocaleString()} kg)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(250, 247, 242, 0.75)' }}>Expected Gross Realization</span>
                    <span style={{ fontWeight: 700 }}>₹{grossRevenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(250, 247, 242, 0.75)' }}>Total Cultivation Cost</span>
                    <span style={{ fontWeight: 700, color: '#FCA5A5' }}>- ₹{totalInputCost.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(250, 247, 242, 0.75)' }}>Mandi Liquidity Outlook</span>
                    <span style={{ fontWeight: 700, color: '#88D49E' }}>{activeCrop.demandStatus}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <Link to="/register" className="btn btn-block" style={{
                  background: '#DDA15E', color: '#1C3624', fontWeight: 800, padding: 12,
                  fontSize: 14, borderRadius: 8, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <span>Lock Pre-Harvest Buyer Contract</span>
                  <ArrowRight size={15} />
                </Link>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ── Live Market Crops Grid ── */}
      <section id="crops" style={{ padding: '80px var(--space-8)', background: '#FAF7F2' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#E8EFE9', color: '#234D35', padding: '4px 10px',
                borderRadius: 9999, fontSize: 12, fontWeight: 700, marginBottom: 8,
              }}>
                <TrendingUp size={14} /> APMC Modal Pricing
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1C3624', margin: 0 }}>
                Explore Active Vegetable Mandi Rates & Shelf Life
              </h2>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 12px', borderRadius: 9999, border: '1px solid #D6CEBE',
                    background: selectedCategory === cat ? '#234D35' : '#FFFFFF',
                    color: selectedCategory === cat ? '#FAF7F2' : '#3E4B3A',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {filteredVegetables.map((veg) => (
              <div key={veg.id} className="nature-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ position: 'relative', height: 170, overflow: 'hidden', background: '#EAE6DC' }}>
                  <img
                    src={veg.image}
                    alt={veg.name}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                  />
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'rgba(255, 255, 255, 0.95)', padding: '3px 8px', borderRadius: 9999,
                    fontSize: 11, fontWeight: 700, color: veg.trendUp ? '#15803D' : '#DC2626',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                  }}>
                    {veg.trendUp ? '↑' : '↓'} {veg.trend}
                  </div>
                  <div style={{
                    position: 'absolute', bottom: 10, left: 10,
                    background: 'rgba(28, 54, 36, 0.9)', color: '#FAF7F2', padding: '3px 8px', borderRadius: 6,
                    fontSize: 10, fontWeight: 600,
                  }}>
                    {veg.category}
                  </div>
                </div>

                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1C3624', margin: 0 }}>{veg.name}</h3>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#234D35' }}>{veg.priceUnit}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#6A7663', marginBottom: 12 }}>{veg.variety}</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: '#3E4B3A', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={13} color="#6A7663" />
                        <span className="truncate">{veg.primaryMandi}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={13} color="#6A7663" />
                        <span>Shelf Life: {veg.shelfLifeDays}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={13} color="#6A7663" />
                        <span>Harvest Cycle: {veg.durationDays}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCropId(veg.id);
                      const el = document.getElementById('calculator');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      border: '1px solid #D6CEBE', background: '#F4F1EA', color: '#1C3624',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}
                  >
                    <span>Calculate Profit for {veg.name.split(' ')[0]}</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 4 Pre-Harvest Pillars ── */}
      <section id="how-it-works" style={{ padding: '80px var(--space-8)', background: '#FFFFFF', borderTop: '1px solid #E5E0D4', borderBottom: '1px solid #E5E0D4' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#E8EFE9', color: '#234D35', padding: '5px 12px',
              borderRadius: 9999, fontSize: 12, fontWeight: 700, marginBottom: 10,
            }}>
              <ShieldCheck size={14} /> Structural Market Solution
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1C3624', marginBottom: 8 }}>
              Four Pillars Protecting Farmer Margins
            </h2>
            <p style={{ fontSize: 15, color: '#5C6656', maxWidth: 620, margin: '0 auto' }}>
              Engineered to resolve information asymmetry between rural farms and urban consuming centers.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
            
            <div style={{ padding: 24, borderRadius: 16, background: '#FAF7F2', border: '1px solid #E5E0D4' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#E8EFE9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: '#234D35' }}>
                <BarChart3 size={22} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1C3624', marginBottom: 8 }}>
                1. Demand Gap Modeling
              </h3>
              <p style={{ fontSize: 13, color: '#5C6656', lineHeight: 1.6 }}>
                Predicts oversupply gluts and supply deficits across major producing districts 45 to 60 days before harvest to adjust harvesting windows.
              </p>
            </div>

            <div style={{ padding: 24, borderRadius: 16, background: '#FAF7F2', border: '1px solid #E5E0D4' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F7EDE2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: '#BC6C25' }}>
                <Users size={22} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1C3624', marginBottom: 8 }}>
                2. Pre-Harvest Matching
              </h3>
              <p style={{ fontSize: 13, color: '#5C6656', lineHeight: 1.6 }}>
                Enables supermarket chains, FMCG brands, and wholesale aggregators to place pre-harvest bids directly with farmers at locked floor prices.
              </p>
            </div>

            <div style={{ padding: 24, borderRadius: 16, background: '#FAF7F2', border: '1px solid #E5E0D4' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FDEAE6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: '#C84B31' }}>
                <AlertCircle size={22} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1C3624', marginBottom: 8 }}>
                3. Distress Sale Rescue
              </h3>
              <p style={{ fontSize: 13, color: '#5C6656', lineHeight: 1.6 }}>
                If spot mandi prices crash locally, the platform redirects standing crops to verified cold storage facilities or food processing plants.
              </p>
            </div>

            <div style={{ padding: 24, borderRadius: 16, background: '#FAF7F2', border: '1px solid #E5E0D4' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#E6EFF7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: '#1D4E89' }}>
                <Truck size={22} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1C3624', marginBottom: 8 }}>
                4. True Netback Discovery
              </h3>
              <p style={{ fontSize: 13, color: '#5C6656', lineHeight: 1.6 }}>
                Compares take-home revenue across 8 neighboring mandis after subtracting diesel, loading, and market cess fees to prevent wrong dispatch decisions.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ── 1-Click Instant Demo Sandbox ── */}
      <section id="demo" style={{ padding: '80px var(--space-8)', background: '#FAF7F2' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#E8EFE9', color: '#234D35', padding: '5px 12px',
            borderRadius: 9999, fontSize: 12, fontWeight: 700, marginBottom: 10,
          }}>
            <PlayCircle size={14} /> Instant Workspace Sandbox
          </div>
          
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1C3624', marginBottom: 8 }}>
            Test the Platform in 1-Click
          </h2>
          <p style={{ fontSize: 15, color: '#5C6656', marginBottom: 32 }}>
            Select any role below to immediately explore the system with realistic farm datasets and live mandi feeds.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            
            <button
              type="button"
              disabled={isDemoSigningIn}
              onClick={() => handleQuickDemo('farmer')}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 20,
                background: '#FFFFFF', borderRadius: 14, border: '1px solid #D6CEBE',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 6 }}>🌱</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1C3624' }}>Farmer Workspace</div>
              <div style={{ fontSize: 12, color: '#6A7663', margin: '4px 0 12px' }}>
                Ravi Kumar • 5 Acre Tomato Farm (Kolar)
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#234D35', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>Launch Farmer Portal</span>
                <ArrowRight size={13} />
              </div>
            </button>

            <button
              type="button"
              disabled={isDemoSigningIn}
              onClick={() => handleQuickDemo('buyer')}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 20,
                background: '#FFFFFF', borderRadius: 14, border: '1px solid #D6CEBE',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 6 }}>🏢</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1C3624' }}>Institutional Buyer</div>
              <div style={{ fontSize: 12, color: '#6A7663', margin: '4px 0 12px' }}>
                FreshMart Logistics • 500 Qtl/Week Orders
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#234D35', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>Launch Buyer Portal</span>
                <ArrowRight size={13} />
              </div>
            </button>

            <button
              type="button"
              disabled={isDemoSigningIn}
              onClick={() => handleQuickDemo('admin')}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: 20,
                background: '#FFFFFF', borderRadius: 14, border: '1px solid #D6CEBE',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 6 }}>⚡</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1C3624' }}>Admin Control</div>
              <div style={{ fontSize: 12, color: '#6A7663', margin: '4px 0 12px' }}>
                Mandi Feed Audits, Risk Monitor & Users
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#234D35', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>Launch Admin View</span>
                <ArrowRight size={13} />
              </div>
            </button>

          </div>

        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#182C1E', color: '#FAF7F2', padding: '56px var(--space-8) 28px', borderTop: '1px solid #284431' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 36, marginBottom: 40 }}>
            <div>
              <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#2D5A3C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sprout size={20} color="#FAF7F2" />
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#FAF7F2' }}>AgriConnect</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(250, 247, 242, 0.7)', lineHeight: 1.6, maxWidth: 300 }}>
                Empowering Indian vegetable farmers with demand-guided decision intelligence, mandi netback transparency, and direct institutional buyer matching.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#DDA15E', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Farmer Tools</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'rgba(250, 247, 242, 0.75)' }}>
                <a href="#calculator" style={{ color: 'inherit', textDecoration: 'none' }}>Harvest Profit Estimator</a>
                <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Live Mandi Price Pulse</Link>
                <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Pre-Harvest Matching</Link>
                <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Distress Sale Rescue</Link>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#DDA15E', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enterprise Sourcing</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'rgba(250, 247, 242, 0.75)' }}>
                <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Post Bulk Demand</Link>
                <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Cluster Discovery</Link>
                <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Direct Farm Contracts</Link>
                <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Digital Quality Grading</Link>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#DDA15E', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Get Started</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link to="/register" className="natural-btn-primary" style={{ padding: '8px 14px', fontSize: 13, justifyContent: 'center' }}>
                  Create Free Account
                </Link>
                <Link to="/login" className="natural-btn-outline" style={{ padding: '8px 14px', fontSize: 13, justifyContent: 'center' }}>
                  Sign In
                </Link>
              </div>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid rgba(250, 247, 242, 0.12)', paddingTop: 20,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'rgba(250, 247, 242, 0.5)',
          }}>
            <div>© {new Date().getFullYear()} AgriConnect. Handcrafted for Indian Agriculture.</div>
            <div style={{ display: 'flex', gap: 18 }}>
              <span>Privacy Policy</span>
              <span>Terms of Trade</span>
              <span>APMC Integration</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
