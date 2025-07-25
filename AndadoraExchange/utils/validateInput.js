export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  return { isValid: true, error: null };
};

export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long' };
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' };
  }
  return { isValid: true, error: null };
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }
  return { isValid: true, error: null };
};

export const validatePin = (pin) => {
  if (!pin) {
    return { isValid: false, error: 'PIN is required' };
  }
  if (!/^\d{4,6}$/.test(pin)) {
    return { isValid: false, error: 'PIN must be 4-6 digits' };
  }
  return { isValid: true, error: null };
};

export const validateAmount = (amount) => {
  if (!amount) {
    return { isValid: false, error: 'Amount is required' };
  }
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return { isValid: false, error: 'Please enter a valid amount' };
  }
  if (numAmount < 10) {
    return { isValid: false, error: 'Minimum amount is $10' };
  }
  return { isValid: true, error: null };
};

export const validateAccountNumber = (accountNumber) => {
  if (!accountNumber) {
    return { isValid: false, error: 'Account number is required' };
  }
  if (!/^\d{10}$/.test(accountNumber)) {
    return { isValid: false, error: 'Account number must be 10 digits' };
  }
  return { isValid: true, error: null };
};

export const validateReferralCode = (code) => {
  if (!code) {
    return { isValid: false, error: 'Referral code is required' };
  }
  if (!/^[A-Z0-9]{6,8}$/.test(code)) {
    return { isValid: false, error: 'Invalid referral code format' };
  }
  return { isValid: true, error: null };
};

export const generateReferralCode = (userId) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${result}${userId.slice(-2).toUpperCase()}`;
};
