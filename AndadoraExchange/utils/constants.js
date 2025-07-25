export const COLORS = {
  primary: '#1a1a1a',
  secondary: '#333333',
  accent: '#007AFF',
  background: '#ffffff',
  surface: '#f8f9fa',
  text: '#000000',
  textSecondary: '#666666',
  error: '#ff3b30',
  success: '#34c759',
  warning: '#ff9500',
  border: '#e1e1e1',
  placeholder: '#999999'
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32
};

export const LOYALTY_TIERS = {
  BRONZE: {
    name: 'Bronze',
    color: '#CD7F32',
    minTransactions: 0,
    bonusRate: 1.0
  },
  SILVER: {
    name: 'Silver',
    color: '#C0C0C0',
    minTransactions: 10,
    bonusRate: 1.05
  },
  GOLD: {
    name: 'Gold',
    color: '#FFD700',
    minTransactions: 50,
    bonusRate: 1.1
  }
};

export const GIFT_CARD_TYPES = [
  'Amazon',
  'iTunes',
  'Google Play',
  'Steam',
  'PlayStation',
  'Xbox',
  'Walmart',
  'Target',
  'Best Buy',
  'eBay'
];

export const REFERRAL_BONUS = 5; // $5 bonus for successful referrals
