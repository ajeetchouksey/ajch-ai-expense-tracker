import { useState } from 'react';
import { Brain, Shield, TrendUp, TrendDown, Wallet, Target, PiggyBank, CreditCard, Sparkle } from '@phosphor-icons/react';

// Mock data for demonstration with more realistic amounts
const mockStats = {
  totalIncome: 85000,
  totalExpenses: 12500,
  netIncome: 72500,
  savingsRate: 85.3,
  totalSavings: 125000,
  monthlyEMI: 8500
};

const mockTransactions = [
  { id: '1', type: 'income', description: 'Monthly Salary - Software Engineer', category: 'Salary', amount: 85000, date: '15/12/2024' },
  { id: '2', type: 'expense', description: 'Premium Grocery Shopping', category: 'Food & Dining', amount: -4850, date: '14/12/2024' },
  { id: '3', type: 'expense', description: 'Electric Vehicle Charging', category: 'Transportation', amount: -1200, date: '13/12/2024' },
  { id: '4', type: 'expense', description: 'Netflix & Spotify Subscriptions', category: 'Entertainment', amount: -899, date: '12/12/2024' },
  { id: '5', type: 'expense', description: 'Coffee with Team', category: 'Food & Dining', amount: -650, date: '11/12/2024' }
];

const tabs = [
  { id: 'overview', label: 'Overview', icon: Wallet },
  { id: 'goals', label: 'Smart Goals', icon: Target },
  { id: 'recurring', label: 'Auto-Pay', icon: PiggyBank },
  { id: 'budgets', label: 'AI Budgets', icon: CreditCard },
  { id: 'insights', label: 'AI Insights', icon: Sparkle },
];

function App() {
  const [activeTab, setActiveTab] = useState('overview');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="app-header">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="app-icon">
                <Brain size={32} weight="bold" />
              </div>
              <div>
                <h1 className="app-title">Aarya Finance</h1>
                  <p className="app-title">Aarya SmartMoney</p>
                  <p className="app-subtitle">AI-Powered Personal Wealth Manager • Smart • Secure • Private</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                fontSize: '0.875rem', 
                color: 'rgba(255, 255, 255, 0.9)',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(16px)',
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontWeight: '500'
              }}>
                <Shield size={18} weight="fill" style={{ color: '#22c55e' }} />
                <span>Bank-Grade Security</span>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                fontSize: '0.875rem', 
                color: 'rgba(255, 255, 255, 0.9)',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(16px)',
                padding: '0.75rem 1.25rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                fontWeight: '500'
              }}>
                <span style={{ fontSize: '1.25rem' }}>🇮🇳</span>
                <span>INR • Mumbai, India</span>
              </div>
              <button style={{
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(17, 153, 142, 0.3)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(17, 153, 142, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(17, 153, 142, 0.3)';
              }}
              >
                <span>+ Add Transaction</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Stats Overview */}
        <div className="stats-grid fade-in">
          <div className="stat-card income">
            <div className="stat-header">
              <div className="stat-title">Total Income</div>
              <TrendUp className="stat-icon income" weight="bold" />
            </div>
            <div className="stat-value income">{formatCurrency(mockStats.totalIncome)}</div>
            <div className="stat-description">This month • +12% from last month</div>
          </div>

          <div className="stat-card expense">
            <div className="stat-header">
              <div className="stat-title">Total Expenses</div>
              <TrendDown className="stat-icon expense" weight="bold" />
            </div>
            <div className="stat-value expense">{formatCurrency(mockStats.totalExpenses)}</div>
            <div className="stat-description">This month • -8% from last month</div>
          </div>

          <div className="stat-card savings">
            <div className="stat-header">
              <div className="stat-title">Net Savings</div>
              <Wallet className="stat-icon savings" weight="bold" />
            </div>
            <div className="stat-value savings">{formatCurrency(mockStats.netIncome)}</div>
            <div className="stat-description">Available for investment</div>
          </div>

          <div className="stat-card neutral">
            <div className="stat-header">
              <div className="stat-title">Savings Rate</div>
              <PiggyBank className="stat-icon neutral" weight="bold" />
            </div>
            <div className="stat-value neutral">{mockStats.savingsRate.toFixed(1)}%</div>
            <div className="stat-description">Excellent financial health</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(100, mockStats.savingsRate)}%` }}></div>
            </div>
          </div>

          <div className="stat-card neutral">
            <div className="stat-header">
              <div className="stat-title">Total Wealth</div>
              <Target className="stat-icon neutral" weight="bold" />
            </div>
            <div className="stat-value neutral">{formatCurrency(mockStats.totalSavings)}</div>
            <div className="stat-description">Portfolio value</div>
          </div>

          <div className="stat-card neutral">
            <div className="stat-header">
              <div className="stat-title">Monthly EMI</div>
              <CreditCard className="stat-icon neutral" weight="bold" />
            </div>
            <div className="stat-value neutral">{formatCurrency(mockStats.monthlyEMI)}</div>
            <div className="stat-description">Fixed obligations</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <div className="tabs-list">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`tab-trigger ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className={`tab-content ${activeTab === 'overview' ? 'active' : ''}`}>
            <div className="chart-grid">
              {/* Recent Transactions */}
              <div className="transaction-list">
                <h3 className="chart-title">Recent Transactions</h3>
                {mockTransactions.map((transaction) => (
                  <div key={transaction.id} className="transaction-item">
                    <div className="transaction-info">
                      <div className={`transaction-icon ${transaction.type}`}>
                        {transaction.type === 'income' ? '+' : '-'}
                      </div>
                      <div className="transaction-details">
                        <h4>{transaction.description}</h4>
                        <p>{transaction.category} • {transaction.date}</p>
                      </div>
                    </div>
                    <div className={`transaction-amount ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="chart-card">
                <h3 className="chart-title">Spending by Category</h3>
                <div className="chart-container">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      width: '200px', 
                      height: '200px', 
                      borderRadius: '50%', 
                      background: 'conic-gradient(#10b981 0% 60%, #ef4444 60% 80%, #7c3aed 80% 90%, #f97316 90% 100%)',
                      margin: '0 auto 1rem'
                    }}></div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ color: '#10b981' }}>● Food & Dining (60%)</span>
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ color: '#ef4444' }}>● Transportation (20%)</span>
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ color: '#7c3aed' }}>● Entertainment (10%)</span>
                      </div>
                      <div>
                        <span style={{ color: '#f97316' }}>● Other (10%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 7-Day Spending Trend */}
            <div className="chart-card">
              <h3 className="chart-title">7-Day Spending Trend</h3>
              <div className="chart-container">
                <div style={{ width: '100%', display: 'flex', alignItems: 'end', justifyContent: 'space-between', height: '200px', gap: '1rem' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                    const heights = [120, 45, 80, 65, 90, 150, 75];
                    const height = (heights[index] / 150) * 180;
                    return (
                      <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <div style={{
                          width: '100%',
                          height: `${height}px`,
                          background: 'linear-gradient(135deg, #7c3aed, #10b981)',
                          borderRadius: '4px 4px 0 0',
                          marginBottom: '0.5rem'
                        }}></div>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Other tab contents */}
          <div className={`tab-content ${activeTab === 'goals' ? 'active' : ''}`}>
            <div className="chart-card">
              <h3 className="chart-title">Advanced Goal Planning</h3>
              <div className="chart-container">
                <p>Coming Soon - Advanced goal planning features with AI-powered recommendations.</p>
              </div>
            </div>
          </div>

          <div className={`tab-content ${activeTab === 'recurring' ? 'active' : ''}`}>
            <div className="chart-card">
              <h3 className="chart-title">Recurring Transactions</h3>
              <div className="chart-container">
                <p>Coming Soon - Automated recurring transaction management.</p>
              </div>
            </div>
          </div>

          <div className={`tab-content ${activeTab === 'budgets' ? 'active' : ''}`}>
            <div className="chart-card">
              <h3 className="chart-title">Budget Management</h3>
              <div className="chart-container">
                <p>Coming Soon - Smart budget tracking and alerts.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
