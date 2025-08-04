import { MCPProvider, FinancialAdvice, UserSettings, Transaction, SavingGoal, Budget } from './types';

// MCP Financial Providers Configuration
export const MCPProviders: Record<string, MCPProvider> = {
  moneycontrol: {
    id: 'moneycontrol',
    name: 'MoneyControl',
    description: 'Leading Indian financial portal with market insights and personal finance advice',
    website: 'https://www.moneycontrol.com',
    region: 'India',
    specialties: ['market analysis', 'mutual funds', 'tax planning', 'investment advice'],
    isPremium: false,
    apiEndpoint: 'https://api.moneycontrol.com/mcp',
    supportedCountries: ['IN'],
    categories: ['investment', 'tax', 'savings', 'budget']
  },
  
  economictimes: {
    id: 'economictimes',
    name: 'Economic Times',
    description: 'Comprehensive financial news and personal finance guidance',
    website: 'https://economictimes.indiatimes.com',
    region: 'India',
    specialties: ['personal finance', 'investment planning', 'insurance', 'loans'],
    isPremium: false,
    apiEndpoint: 'https://api.economictimes.com/mcp',
    supportedCountries: ['IN'],
    categories: ['planning', 'investment', 'insurance']
  },

  bankbazaar: {
    id: 'bankbazaar',
    name: 'BankBazaar',
    description: 'Financial marketplace with loan and credit card comparisons',
    website: 'https://www.bankbazaar.com',
    region: 'India',
    specialties: ['loans', 'credit cards', 'insurance', 'financial products'],
    isPremium: false,
    apiEndpoint: 'https://api.bankbazaar.com/mcp',
    supportedCountries: ['IN'],
    categories: ['budget', 'debt', 'planning']
  },

  paisabazaar: {
    id: 'paisabazaar',
    name: 'PaisaBazaar',
    description: 'Personal finance and loan advisory platform',
    website: 'https://www.paisabazaar.com',
    region: 'India',
    specialties: ['personal loans', 'credit score', 'financial planning', 'budgeting'],
    isPremium: false,
    apiEndpoint: 'https://api.paisabazaar.com/mcp',
    supportedCountries: ['IN'],
    categories: ['budget', 'planning', 'debt']
  },

  mintgenie: {
    id: 'mintgenie',
    name: 'Mint Genie',
    description: 'AI-powered financial advisor from LiveMint',
    website: 'https://www.livemint.com/market/mint-genie',
    region: 'India',
    specialties: ['AI advice', 'portfolio management', 'market insights', 'wealth planning'],
    isPremium: true,
    apiEndpoint: 'https://api.livemint.com/genie/mcp',
    supportedCountries: ['IN'],
    categories: ['investment', 'planning', 'savings']
  },

  groww: {
    id: 'groww',
    name: 'Groww',
    description: 'Investment platform with educational content and advice',
    website: 'https://www.groww.in',
    region: 'India',
    specialties: ['mutual funds', 'stocks', 'investment education', 'SIP planning'],
    isPremium: false,
    apiEndpoint: 'https://api.groww.in/mcp',
    supportedCountries: ['IN'],
    categories: ['investment', 'savings', 'planning']
  },

  zerodha_varsity: {
    id: 'zerodha_varsity',
    name: 'Zerodha Varsity',
    description: 'Stock market and trading education platform',
    website: 'https://zerodha.com/varsity',
    region: 'India',
    specialties: ['stock market', 'trading', 'technical analysis', 'financial literacy'],
    isPremium: false,
    apiEndpoint: 'https://api.zerodha.com/varsity/mcp',
    supportedCountries: ['IN'],
    categories: ['investment', 'planning']
  },

  // Global Providers
  investopedia: {
    id: 'investopedia',
    name: 'Investopedia',
    description: 'Global financial education and advice platform',
    website: 'https://www.investopedia.com',
    region: 'Global',
    specialties: ['financial education', 'investment strategies', 'market analysis', 'retirement planning'],
    isPremium: false,
    apiEndpoint: 'https://api.investopedia.com/mcp',
    supportedCountries: ['US', 'CA', 'GB', 'AU', 'IN'],
    categories: ['investment', 'planning', 'savings']
  },

  motley_fool: {
    id: 'motley_fool',
    name: 'The Motley Fool',
    description: 'Investment advice and stock recommendations',
    website: 'https://www.fool.com',
    region: 'Global',
    specialties: ['stock picks', 'investment research', 'retirement planning', 'dividend investing'],
    isPremium: true,
    apiEndpoint: 'https://api.fool.com/mcp',
    supportedCountries: ['US', 'CA', 'GB', 'AU'],
    categories: ['investment', 'planning']
  },

  nerdwallet: {
    id: 'nerdwallet',
    name: 'NerdWallet',
    description: 'Personal finance advice and product comparisons',
    website: 'https://www.nerdwallet.com',
    region: 'US',
    specialties: ['credit cards', 'personal finance', 'budgeting', 'banking'],
    isPremium: false,
    apiEndpoint: 'https://api.nerdwallet.com/mcp',
    supportedCountries: ['US'],
    categories: ['budget', 'planning', 'debt']
  },

  yahoo_finance: {
    id: 'yahoo_finance',
    name: 'Yahoo Finance',
    description: 'Market data and financial news with AI insights',
    website: 'https://finance.yahoo.com',
    region: 'Global',
    specialties: ['market data', 'news analysis', 'portfolio tracking', 'earnings analysis'],
    isPremium: false,
    apiEndpoint: 'https://api.finance.yahoo.com/mcp',
    supportedCountries: ['US', 'CA', 'GB', 'AU', 'IN', 'JP', 'DE', 'FR'],
    categories: ['investment', 'planning']
  }
};

// Simulated MCP Connection Test
export const testMCPConnection = async (providerId: string): Promise<boolean> => {
  const provider = MCPProviders[providerId];
  if (!provider) return false;

  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate some providers being temporarily unavailable
    const availabilityRate = provider.isPremium ? 0.95 : 0.85;
    return Math.random() < availabilityRate;
  } catch (error) {
    return false;
  }
};

// Enhanced MCP Financial Advice Generation
export const getMCPFinancialAdvice = async (
  providerId: string,
  context: {
    transactions: Transaction[];
    savingGoals: SavingGoal[];
    budgets: Budget[];
    userSettings: UserSettings;
  }
): Promise<FinancialAdvice[]> => {
  const provider = MCPProviders[providerId];
  if (!provider) throw new Error(`Provider ${providerId} not found`);

  // Check if provider supports user's country
  if (!provider.supportedCountries.includes(context.userSettings.country)) {
    throw new Error(`Provider ${provider.name} does not support ${context.userSettings.country}`);
  }

  try {
    // Generate context-aware prompt based on provider specialties
    const prompt = spark.llmPrompt`
      You are an AI financial advisor representing ${provider.name}, specializing in: ${provider.specialties.join(', ')}.
      
      Provide personalized financial advice for a user in ${context.userSettings.country} using ${context.userSettings.currency}.
      
      User's Financial Context:
      - Recent Transactions: ${JSON.stringify(context.transactions.slice(-30))}
      - Saving Goals: ${JSON.stringify(context.savingGoals)}
      - Budgets: ${JSON.stringify(context.budgets)}
      - Country: ${context.userSettings.country}
      - Currency: ${context.userSettings.currency}
      
      Focus Areas Based on ${provider.name}'s Expertise:
      ${provider.specialties.map(specialty => `- ${specialty}`).join('\n')}
      
      Provide 2-4 specific, actionable advice items. Each advice should include:
      - title: Clear, specific title
      - content: Detailed advice (2-3 sentences)
      - category: One of [investment, savings, budget, spending, planning, debt, tax, insurance]
      - priority: high/medium/low
      - confidence: 0.7-1.0 (how confident this advice is for the user)
      - actionItems: Array of 2-3 specific steps the user can take
      - relevantLinks: Optional array of {title, url} for additional resources
      
      Make the advice specific to ${context.userSettings.country}'s financial landscape and ${provider.name}'s expertise.
      
      Return as JSON array.
    `;

    const response = await spark.llm(prompt, 'gpt-4o', true);
    const adviceData = JSON.parse(response);

    return adviceData.map((advice: any, index: number): FinancialAdvice => ({
      id: `${providerId}-${Date.now()}-${index}`,
      source: provider.name,
      providerId,
      title: advice.title,
      content: advice.content,
      category: advice.category || 'planning',
      priority: advice.priority || 'medium',
      confidence: advice.confidence || 0.8,
      timestamp: new Date().toISOString(),
      actionItems: advice.actionItems || [],
      relevantLinks: advice.relevantLinks || [],
      tags: provider.specialties.slice(0, 3),
      countrySpecific: context.userSettings.country,
      isPersonalized: true
    }));

  } catch (error) {
    console.error(`Failed to get advice from ${provider.name}:`, error);
    
    // Fallback to provider-specific static advice
    return getFallbackAdvice(provider, context.userSettings);
  }
};

// Fallback advice when MCP connection fails
const getFallbackAdvice = (provider: MCPProvider, userSettings: UserSettings): FinancialAdvice[] => {
  const fallbackAdviceMap: Record<string, FinancialAdvice[]> = {
    moneycontrol: [
      {
        id: `fallback-${provider.id}-1`,
        source: provider.name,
        providerId: provider.id,
        title: 'Start SIP in Diversified Equity Funds',
        content: 'Consider starting a Systematic Investment Plan (SIP) in diversified equity mutual funds for long-term wealth creation. Indian equity funds have historically delivered good returns over 5+ year periods.',
        category: 'investment',
        priority: 'high',
        confidence: 0.85,
        timestamp: new Date().toISOString(),
        actionItems: [
          'Research top-performing diversified equity funds',
          'Start with ₹3,000-5,000 monthly SIP',
          'Choose funds with low expense ratios (<1.5%)'
        ],
        relevantLinks: [
          { title: 'Best SIP Plans 2024', url: 'https://www.moneycontrol.com/mutual-funds/sip' }
        ],
        tags: ['SIP', 'equity funds', 'long-term'],
        countrySpecific: 'IN',
        isPersonalized: false
      }
    ],
    
    investopedia: [
      {
        id: `fallback-${provider.id}-1`,
        source: provider.name,
        providerId: provider.id,
        title: 'Emergency Fund Priority',
        content: 'Build an emergency fund covering 3-6 months of expenses before aggressive investing. This provides financial security and prevents debt during unexpected situations.',
        category: 'savings',
        priority: 'high',
        confidence: 0.9,
        timestamp: new Date().toISOString(),
        actionItems: [
          'Calculate monthly essential expenses',
          'Save in high-yield savings account',
          'Automate emergency fund contributions'
        ],
        relevantLinks: [
          { title: 'Emergency Fund Guide', url: 'https://www.investopedia.com/emergency-fund' }
        ],
        tags: ['emergency fund', 'savings', 'financial security'],
        countrySpecific: userSettings.country,
        isPersonalized: false
      }
    ]
  };

  return fallbackAdviceMap[provider.id] || [];
};

// Aggregate advice from multiple providers
export const getAggregatedMCPAdvice = async (
  enabledProviders: string[],
  context: {
    transactions: Transaction[];
    savingGoals: SavingGoal[];
    budgets: Budget[];
    userSettings: UserSettings;
  }
): Promise<FinancialAdvice[]> => {
  const allAdvice: FinancialAdvice[] = [];
  const errors: string[] = [];

  for (const providerId of enabledProviders) {
    try {
      const advice = await getMCPFinancialAdvice(providerId, context);
      allAdvice.push(...advice);
    } catch (error) {
      errors.push(`${MCPProviders[providerId]?.name}: ${error}`);
    }
  }

  // Sort by priority and confidence
  return allAdvice.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1;
    
    if (aPriority !== bPriority) return aPriority - bPriority;
    return (b.confidence || 0.5) - (a.confidence || 0.5);
  });
};

// Provider recommendation based on user profile
export const getRecommendedProviders = (userSettings: UserSettings): string[] => {
  const countryProviders = Object.entries(MCPProviders)
    .filter(([_, provider]) => provider.supportedCountries.includes(userSettings.country))
    .map(([id]) => id);

  // Prioritize local providers for better regional advice
  const localProviders = countryProviders.filter(id => MCPProviders[id].region === userSettings.country || MCPProviders[id].region === 'India' && userSettings.country === 'IN');
  const globalProviders = countryProviders.filter(id => MCPProviders[id].region === 'Global');

  return [...localProviders.slice(0, 3), ...globalProviders.slice(0, 2)];
};