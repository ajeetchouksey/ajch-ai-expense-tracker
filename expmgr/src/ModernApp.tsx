import { useState, useEffect } from 'react';
import { Brain, Shield, TrendUp, TrendDown, Wallet, Target, PiggyBank, CreditCard, Sparkle, Plus } from '@phosphor-icons/react';
import AddTransactionModal from './components/AddTransactionModal';

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
  const [transactions, setTransactions] = useState(mockTransactions);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [stats, setStats] = useState(mockStats);

  // Load transactions from localStorage on mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem('aarya-transactions');
    if (savedTransactions) {
      const parsedTransactions = JSON.parse(savedTransactions);
      setTransactions(parsedTransactions);
      calculateStats(parsedTransactions);
    }
  }, []);

  // Calculate stats from transactions
  const calculateStats = (transactionList: any[]) => {
    const income = transactionList
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const expenses = transactionList
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netIncome = income - expenses;
    const savingsRate = income > 0 ? ((netIncome / income) * 100) : 0;
    
    setStats({
      totalIncome: income,
      totalExpenses: expenses,
      netIncome,
      savingsRate,
      totalSavings: stats.totalSavings + (netIncome > 0 ? netIncome : 0),
      monthlyEMI: stats.monthlyEMI
    });
  };

  // Add new transaction
  const addTransaction = (newTransaction: any) => {
    const transaction = {
      ...newTransaction,
      id: Date.now().toString(),
      date: new Date(newTransaction.date).toLocaleDateString('en-GB')
    };

    const updatedTransactions = [transaction, ...transactions];
    setTransactions(updatedTransactions);
    calculateStats(updatedTransactions);
    
    // Save to localStorage
    localStorage.setItem('aarya-transactions', JSON.stringify(updatedTransactions));
  };

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
                {/* Removed old app name */}
                  <p className="app-title">Aarya SmartMoney <span style={{
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: '#22c55e',
                    background: 'rgba(34,197,94,0.08)',
                    borderRadius: '8px',
                    padding: '0.2em 0.7em',
                    marginLeft: '0.5em',
                    letterSpacing: '0.03em',
                    verticalAlign: 'middle'
                  }}>Powered by AI</span></p>
                  <p className="app-subtitle">AI-Powered Personal Wealth Manager • Smart • Secure • Private</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                }}
              >
                <Plus size={18} weight="bold" />
                Add Transaction
              </button>
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
            <div className="stat-value income">{formatCurrency(stats.totalIncome)}</div>
            <div className="stat-description">This month • +12% from last month</div>
          </div>

          <div className="stat-card expense">
            <div className="stat-header">
              <div className="stat-title">Total Expenses</div>
              <TrendDown className="stat-icon expense" weight="bold" />
            </div>
            <div className="stat-value expense">{formatCurrency(stats.totalExpenses)}</div>
            <div className="stat-description">This month • -8% from last month</div>
          </div>

          <div className="stat-card savings">
            <div className="stat-header">
              <div className="stat-title">Net Savings</div>
              <Wallet className="stat-icon savings" weight="bold" />
            </div>
            <div className="stat-value savings">{formatCurrency(stats.netIncome)}</div>
            <div className="stat-description">Available for investment</div>
          </div>

          <div className="stat-card neutral">
            <div className="stat-header">
              <div className="stat-title">Savings Rate</div>
              <PiggyBank className="stat-icon neutral" weight="bold" />
            </div>
            <div className="stat-value neutral">{stats.savingsRate.toFixed(1)}%</div>
            <div className="stat-description">Excellent financial health</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(100, stats.savingsRate)}%` }}></div>
            </div>
          </div>

          <div className="stat-card neutral">
            <div className="stat-header">
              <div className="stat-title">Total Wealth</div>
              <Target className="stat-icon neutral" weight="bold" />
            </div>
            <div className="stat-value neutral">{formatCurrency(stats.totalSavings)}</div>
            <div className="stat-description">Portfolio value</div>
          </div>

          <div className="stat-card neutral">
            <div className="stat-header">
              <div className="stat-title">Monthly EMI</div>
              <CreditCard className="stat-icon neutral" weight="bold" />
            </div>
            <div className="stat-value neutral">{formatCurrency(stats.monthlyEMI)}</div>
            <div className="stat-description">Fixed obligations</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="tab-navigation">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              >
                <IconComponent size={20} weight={activeTab === tab.id ? 'bold' : 'regular'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="main-content">
          {activeTab === 'overview' && (
            <div className="content-grid">
              {/* AI Insights Card */}
              <div className="insight-card">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  marginBottom: '1.25rem' 
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }}>
                    <Sparkle size={20} weight="bold" style={{ color: 'white' }} />
                  </div>
                  <div>
                    <h3 style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: '700', 
                      color: 'white',
                      margin: '0' 
                    }}>
                      AI Financial Assistant
                    </h3>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: 'rgba(255, 255, 255, 0.8)',
                      margin: '0' 
                    }}>
                      Personalized insights and recommendations
                    </p>
                  </div>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      marginBottom: '0.75rem' 
                    }}>
                      <span style={{ fontSize: '1.25rem' }}>🎯</span>
                      <strong style={{ color: '#22c55e', fontSize: '0.875rem', fontWeight: '600' }}>
                        EXCELLENT SAVINGS RATE
                      </strong>
                    </div>
                    <p style={{ 
                      color: 'rgba(255, 255, 255, 0.9)', 
                      fontSize: '0.875rem', 
                      lineHeight: '1.5',
                      margin: '0' 
                    }}>
                      Your 85.3% savings rate is exceptional! You're saving ₹72,500 monthly. 
                      Consider investing in diversified mutual funds or SIPs for long-term wealth building.
                    </p>
                  </div>
                  
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '12px',
                    padding: '1.25rem'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      marginBottom: '0.75rem' 
                    }}>
                      <span style={{ fontSize: '1.25rem' }}>💡</span>
                      <strong style={{ color: '#3b82f6', fontSize: '0.875rem', fontWeight: '600' }}>
                        SMART INVESTMENT TIP
                      </strong>
                    </div>
                    <p style={{ 
                      color: 'rgba(255, 255, 255, 0.9)', 
                      fontSize: '0.875rem', 
                      lineHeight: '1.5',
                      margin: '0' 
                    }}>
                      Based on your income pattern, allocate ₹30,000 to equity funds and ₹20,000 to debt funds. 
                      This balanced approach can potentially grow your wealth by 12-15% annually.
                    </p>
                  </div>
                </div>
                
                <button style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '0.875rem',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <Brain size={18} weight="bold" />
                  Get More AI Insights
                </button>
              </div>

              {/* Transaction List */}
              <div className="transaction-list">
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginBottom: '1.5rem' 
                }}>
                  <h3 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: '700', 
                    color: 'white',
                    margin: '0' 
                  }}>
                    Recent Transactions
                  </h3>
                  <button style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}>
                    View All
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="transaction-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: transaction.type === 'income' 
                            ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
                            : 'linear-gradient(135deg, #ef4444, #dc2626)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: transaction.type === 'income'
                            ? '0 4px 12px rgba(34, 197, 94, 0.3)'
                            : '0 4px 12px rgba(239, 68, 68, 0.3)'
                        }}>
                          {transaction.type === 'income' ? (
                            <TrendUp size={20} weight="bold" style={{ color: 'white' }} />
                          ) : (
                            <TrendDown size={20} weight="bold" style={{ color: 'white' }} />
                          )}
                        </div>
                        <div style={{ flex: '1' }}>
                          <div style={{ 
                            fontWeight: '600', 
                            fontSize: '0.9rem', 
                            color: 'white',
                            marginBottom: '0.25rem' 
                          }}>
                            {transaction.description}
                          </div>
                          <div style={{ 
                            fontSize: '0.8rem', 
                            color: 'rgba(255, 255, 255, 0.7)',
                            display: 'flex',
                            gap: '0.75rem'
                          }}>
                            <span>{transaction.category}</span>
                            <span>•</span>
                            <span>{transaction.date}</span>
                          </div>
                        </div>
                        <div style={{
                          fontWeight: '700',
                          fontSize: '0.95rem',
                          color: transaction.type === 'income' ? '#22c55e' : '#ef4444'
                        }}>
                          {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="placeholder-content">
              <div style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <Target size={48} weight="thin" style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  marginBottom: '1rem' 
                }} />
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: 'white',
                  marginBottom: '0.5rem',
                  margin: '0 0 0.5rem 0'
                }}>
                  Smart Financial Goals
                </h3>
                <p style={{ 
                  fontSize: '0.9rem', 
                  lineHeight: '1.5',
                  margin: '0'
                }}>
                  AI-powered goal setting and tracking coming soon. Set savings targets, 
                  investment goals, and let our AI help you achieve them faster.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'recurring' && (
            <div className="placeholder-content">
              <div style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <PiggyBank size={48} weight="thin" style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  marginBottom: '1rem' 
                }} />
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: 'white',
                  marginBottom: '0.5rem',
                  margin: '0 0 0.5rem 0'
                }}>
                  Auto-Pay Management
                </h3>
                <p style={{ 
                  fontSize: '0.9rem', 
                  lineHeight: '1.5',
                  margin: '0'
                }}>
                  Manage recurring transactions, subscriptions, and automatic savings. 
                  Never miss a payment or savings opportunity again.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'budgets' && (
            <div className="placeholder-content">
              <div style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <CreditCard size={48} weight="thin" style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  marginBottom: '1rem' 
                }} />
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: 'white',
                  marginBottom: '0.5rem',
                  margin: '0 0 0.5rem 0'
                }}>
                  AI Budget Planning
                </h3>
                <p style={{ 
                  fontSize: '0.9rem', 
                  lineHeight: '1.5',
                  margin: '0'
                }}>
                  Smart budgeting powered by AI. Get personalized spending limits, 
                  category-wise allocations, and proactive alerts to stay on track.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="placeholder-content">
              <div style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <Sparkle size={48} weight="thin" style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  marginBottom: '1rem' 
                }} />
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: 'white',
                  marginBottom: '0.5rem',
                  margin: '0 0 0.5rem 0'
                }}>
                  Advanced AI Analytics
                </h3>
                <p style={{ 
                  fontSize: '0.9rem', 
                  lineHeight: '1.5',
                  margin: '0'
                }}>
                  Deep financial insights powered by machine learning. Discover spending patterns, 
                  predict future expenses, and get personalized recommendations.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTransaction={addTransaction}
      />
      {/* Footer */}
      <footer style={{
        width: '100%',
        padding: '2rem 0 1rem 0',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.7)',
        fontSize: '0.95rem',
        background: 'transparent',
        letterSpacing: '0.02em'
      }}>
        <span>
          &copy; {new Date().getFullYear()} Aarya SmartMoney &mdash; AI-powered personal finance, privacy-first. Made with ❤️ by ajeetchouksey.
        </span>
      </footer>
    </div>
  );
}

export default App;
