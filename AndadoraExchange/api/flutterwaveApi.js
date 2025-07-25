import Constants from 'expo-constants';

const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';
const PUBLIC_KEY = Constants.expoConfig?.extra?.flutterwavePublicKey || process.env.FLUTTERWAVE_PUBLIC_KEY;
const SECRET_KEY = Constants.expoConfig?.extra?.flutterwaveSecretKey || process.env.FLUTTERWAVE_SECRET_KEY;

class FlutterwaveAPI {
  constructor() {
    this.baseURL = FLUTTERWAVE_BASE_URL;
    this.publicKey = PUBLIC_KEY;
    this.secretKey = SECRET_KEY;
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`,
        },
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Request failed');
      }

      return result;
    } catch (error) {
      console.error('Flutterwave API Error:', error);
      throw error;
    }
  }

  async initiateTransfer(transferData) {
    try {
      const payload = {
        account_bank: transferData.bankCode,
        account_number: transferData.accountNumber,
        amount: transferData.amount,
        narration: transferData.narration || 'Gift card withdrawal',
        currency: 'NGN',
        reference: `AE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        callback_url: 'https://andadora-exchange.com/webhook/flutterwave',
        debit_currency: 'NGN'
      };

      const result = await this.makeRequest('/transfers', 'POST', payload);
      return {
        success: true,
        data: result.data,
        reference: payload.reference
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Transfer initiation failed'
      };
    }
  }

  async verifyTransfer(transferId) {
    try {
      const result = await this.makeRequest(`/transfers/${transferId}`);
      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Transfer verification failed'
      };
    }
  }

  async getBanks() {
    try {
      const result = await this.makeRequest('/banks/NG');
      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch banks'
      };
    }
  }

  async verifyAccountNumber(accountNumber, bankCode) {
    try {
      const payload = {
        account_number: accountNumber,
        account_bank: bankCode
      };

      const result = await this.makeRequest('/accounts/resolve', 'POST', payload);
      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Account verification failed'
      };
    }
  }

  async getTransferFee(amount) {
    try {
      const result = await this.makeRequest(`/transfers/fee?amount=${amount}&currency=NGN`);
      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get transfer fee'
      };
    }
  }

  async getWalletBalance() {
    try {
      const result = await this.makeRequest('/balances');
      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get wallet balance'
      };
    }
  }
}

export default new FlutterwaveAPI();
