import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig?.extra?.nubanApiKey || process.env.NUBAN_API_KEY;
const BASE_URL = Constants.expoConfig?.extra?.nubanBaseUrl || process.env.NUBAN_BASE_URL;
const BANK_CODES_URL = Constants.expoConfig?.extra?.nubanBankCodesUrl || process.env.NUBAN_BANK_CODES_URL;

class NubanAPI {
  constructor() {
    this.apiKey = API_KEY;
    this.baseURL = BASE_URL;
    this.bankCodesURL = BANK_CODES_URL;
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(data);
      }

      const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
      const response = await fetch(url, config);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Request failed');
      }

      return result;
    } catch (error) {
      console.error('NUBAN API Error:', error);
      throw error;
    }
  }

  async verifyBankAccount(accountNumber, bankCode) {
    try {
      if (!accountNumber || !bankCode) {
        throw new Error('Account number and bank code are required');
      }

      const payload = {
        account_number: accountNumber,
        bank_code: bankCode
      };

      const result = await this.makeRequest('/verify-account', 'POST', payload);
      
      return {
        success: true,
        data: {
          accountNumber: result.account_number,
          accountName: result.account_name,
          bankName: result.bank_name,
          bankCode: result.bank_code,
          isValid: result.status === 'success'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Account verification failed'
      };
    }
  }

  async getBankCodes() {
    try {
      const result = await this.makeRequest(this.bankCodesURL);
      
      return {
        success: true,
        data: result.banks || result
      };
    } catch (error) {
      // Fallback bank codes if API fails
      const fallbackBanks = [
        { code: '044', name: 'Access Bank' },
        { code: '014', name: 'Afribank Nigeria Plc' },
        { code: '023', name: 'Citibank Nigeria Limited' },
        { code: '050', name: 'Ecobank Nigeria Plc' },
        { code: '011', name: 'First Bank of Nigeria Limited' },
        { code: '214', name: 'First City Monument Bank Limited' },
        { code: '070', name: 'Fidelity Bank Plc' },
        { code: '058', name: 'Guaranty Trust Bank Plc' },
        { code: '030', name: 'Heritage Banking Company Limited' },
        { code: '082', name: 'Keystone Bank Limited' },
        { code: '076', name: 'Polaris Bank Limited' },
        { code: '221', name: 'Stanbic IBTC Bank Plc' },
        { code: '068', name: 'Standard Chartered Bank Nigeria Limited' },
        { code: '232', name: 'Sterling Bank Plc' },
        { code: '033', name: 'United Bank for Africa Plc' },
        { code: '032', name: 'Union Bank of Nigeria Plc' },
        { code: '035', name: 'Wema Bank Plc' },
        { code: '057', name: 'Zenith Bank Plc' }
      ];

      return {
        success: true,
        data: fallbackBanks
      };
    }
  }

  async validateAccountNumber(accountNumber) {
    try {
      if (!accountNumber) {
        throw new Error('Account number is required');
      }

      // Basic validation for Nigerian account numbers
      if (!/^\d{10}$/.test(accountNumber)) {
        throw new Error('Account number must be 10 digits');
      }

      // NUBAN algorithm validation
      const isValid = this.validateNubanAlgorithm(accountNumber);
      
      return {
        success: true,
        data: {
          accountNumber,
          isValid,
          message: isValid ? 'Valid account number format' : 'Invalid account number format'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Account number validation failed'
      };
    }
  }

  validateNubanAlgorithm(accountNumber) {
    try {
      const digits = accountNumber.split('').map(Number);
      const checkDigit = digits[9];
      const weights = [3, 7, 3, 3, 7, 3, 3, 7, 3];
      
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += digits[i] * weights[i];
      }
      
      const remainder = sum % 10;
      const calculatedCheckDigit = remainder === 0 ? 0 : 10 - remainder;
      
      return calculatedCheckDigit === checkDigit;
    } catch (error) {
      return false;
    }
  }

  async getBankByCode(bankCode) {
    try {
      const banksResult = await this.getBankCodes();
      if (!banksResult.success) {
        throw new Error('Failed to fetch bank codes');
      }

      const bank = banksResult.data.find(b => b.code === bankCode);
      if (!bank) {
        throw new Error('Bank not found');
      }

      return {
        success: true,
        data: bank
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Bank lookup failed'
      };
    }
  }
}

export default new NubanAPI();
