import { createContext, useContext, useState, useEffect } from 'react';

const DemoModeContext = createContext();

export function DemoModeProvider({ children }) {
  const [demoMode, setDemoMode] = useState(
    () => localStorage.getItem('demo_mode') === 'true'
  );
  
  const [scenarioId, setScenarioId] = useState(
    () => localStorage.getItem('demo_scenario') || 'price_trap'
  );

  const toggleDemoMode = (enabled) => {
    setDemoMode(enabled);
    localStorage.setItem('demo_mode', String(enabled));
  };

  const selectScenario = (id) => {
    setScenarioId(id);
    localStorage.setItem('demo_scenario', id);
  };

  return (
    <DemoModeContext.Provider value={{ demoMode, toggleDemoMode, scenarioId, selectScenario }}>
      {children}
      {demoMode && (
        <div 
          style={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            background: 'var(--color-danger)',
            color: '#white',
            fontWeight: 'bold',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '11px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />
          🔴 DEMO MODE ACTIVE
        </div>
      )}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
}
export default DemoModeContext;
