import { useEffect } from 'react';
import { useMRAOSStore } from './store/store';
import { Dashboard } from './views/Dashboard';
import { Play, Pause, RefreshCw } from 'lucide-react';

function App() {
  const { simulateRealTimeUpdates, refreshData } = useMRAOSStore();
  
  // Simulate real-time updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      simulateRealTimeUpdates();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [simulateRealTimeUpdates]);
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-light)' }}>
      {/* Top Navigation Bar */}
      <nav style={{
        backgroundColor: 'var(--background-white)',
        borderBottom: '1px solid var(--border-color)',
        padding: 'var(--space-md) var(--space-xl)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          maxWidth: '1800px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'var(--primary-blue)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 600,
              fontSize: 'var(--font-size-lg)'
            }}>
              M
            </div>
            <div>
              <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>
                MRAOS
              </h1>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                Manufacturing Resource Allocation & Optimization
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              padding: 'var(--space-sm) var(--space-md)',
              backgroundColor: 'var(--success-green)',
              borderRadius: '20px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: 'white',
                borderRadius: '50%',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }} />
              <span style={{ color: 'white', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                Live Updates
              </span>
            </div>
            
            <button
              onClick={refreshData}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                padding: 'var(--space-sm) var(--space-md)',
                backgroundColor: 'var(--primary-blue)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary-dark)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary-blue)';
              }}
            >
              <RefreshCw size={16} />
              Refresh Data
            </button>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main>
        <Dashboard />
      </main>
      
      {/* Footer Info Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--primary-dark)',
        color: 'white',
        padding: 'var(--space-sm) var(--space-xl)',
        fontSize: 'var(--font-size-sm)',
        textAlign: 'center',
        zIndex: 50
      }}>
        <div style={{ maxWidth: '1800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>© 2025 MRAOS - Manufacturing Resource Allocation System</span>
          <span style={{ opacity: 0.8 }}>
            Demo Application • Real-time simulation active
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
