import { db } from './firebase';
import { collection, doc, getDocs, getDoc, updateDoc, addDoc, query, where, orderBy } from 'firebase/firestore';
import { GIFT_CARD_TYPES } from '../utils/constants';

class RatesAPI {
  constructor() {
    this.ratesCollection = 'giftCardRates';
    this.rateHistoryCollection = 'rateHistory';
  }

  // Get current rates for all gift card types
  async getCurrentRates() {
    try {
      const ratesRef = collection(db, this.ratesCollection);
      const snapshot = await getDocs(ratesRef);
      
      const rates = {};
      snapshot.forEach(doc => {
        rates[doc.id] = {
          id: doc.id,
          ...doc.data()
        };
      });

      // If no rates exist, create default rates
      if (Object.keys(rates).length === 0) {
        await this.initializeDefaultRates();
        return await this.getCurrentRates();
      }

      return {
        success: true,
        data: rates
      };
    } catch (error) {
      console.error('Error fetching rates:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch rates'
      };
    }
  }

  // Get rate for specific gift card type
  async getRateByType(cardType) {
    try {
      const rateRef = doc(db, this.ratesCollection, cardType);
      const rateDoc = await getDoc(rateRef);

      if (!rateDoc.exists()) {
        throw new Error(`Rate not found for ${cardType}`);
      }

      return {
        success: true,
        data: {
          id: rateDoc.id,
          ...rateDoc.data()
        }
      };
    } catch (error) {
      console.error('Error fetching rate:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch rate'
      };
    }
  }

  // Calculate exchange amount based on gift card value and type
  async calculateExchange(cardType, cardValue, userTier = 'BRONZE') {
    try {
      const rateResult = await this.getRateByType(cardType);
      if (!rateResult.success) {
        throw new Error(rateResult.error);
      }

      const rate = rateResult.data;
      let exchangeRate = rate.buyRate;

      // Apply tier bonus
      const tierBonuses = {
        BRONZE: 1.0,
        SILVER: 1.05,
        GOLD: 1.1
      };

      const tierMultiplier = tierBonuses[userTier] || 1.0;
      exchangeRate = exchangeRate * tierMultiplier;

      const exchangeAmount = (cardValue * exchangeRate).toFixed(2);
      const bonus = ((cardValue * exchangeRate * tierMultiplier) - (cardValue * rate.buyRate)).toFixed(2);

      return {
        success: true,
        data: {
          cardType,
          cardValue,
          exchangeRate: exchangeRate.toFixed(4),
          exchangeAmount: parseFloat(exchangeAmount),
          tierBonus: bonus > 0 ? parseFloat(bonus) : 0,
          userTier,
          currency: rate.currency || 'NGN'
        }
      };
    } catch (error) {
      console.error('Error calculating exchange:', error);
      return {
        success: false,
        error: error.message || 'Failed to calculate exchange'
      };
    }
  }

  // Update rate (Admin only)
  async updateRate(cardType, rateData) {
    try {
      const rateRef = doc(db, this.ratesCollection, cardType);
      
      const updateData = {
        ...rateData,
        lastUpdated: new Date(),
        updatedBy: rateData.updatedBy || 'system'
      };

      await updateDoc(rateRef, updateData);

      // Log rate change to history
      await this.logRateChange(cardType, rateData);

      return {
        success: true,
        message: `Rate updated for ${cardType}`
      };
    } catch (error) {
      console.error('Error updating rate:', error);
      return {
        success: false,
        error: error.message || 'Failed to update rate'
      };
    }
  }

  // Log rate changes for history tracking
  async logRateChange(cardType, rateData) {
    try {
      const historyRef = collection(db, this.rateHistoryCollection);
      
      await addDoc(historyRef, {
        cardType,
        ...rateData,
        timestamp: new Date(),
        action: 'rate_update'
      });
    } catch (error) {
      console.error('Error logging rate change:', error);
    }
  }

  // Get rate history for analytics
  async getRateHistory(cardType, limit = 50) {
    try {
      const historyRef = collection(db, this.rateHistoryCollection);
      const q = query(
        historyRef,
        where('cardType', '==', cardType),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );

      const snapshot = await getDocs(q);
      const history = [];
      
      snapshot.forEach(doc => {
        history.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        success: true,
        data: history
      };
    } catch (error) {
      console.error('Error fetching rate history:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch rate history'
      };
    }
  }

  // Initialize default rates for all gift card types
  async initializeDefaultRates() {
    try {
      const defaultRates = {
        'Amazon': { buyRate: 0.82, sellRate: 0.85, currency: 'NGN', status: 'active' },
        'iTunes': { buyRate: 0.80, sellRate: 0.83, currency: 'NGN', status: 'active' },
        'Google Play': { buyRate: 0.78, sellRate: 0.81, currency: 'NGN', status: 'active' },
        'Steam': { buyRate: 0.75, sellRate: 0.78, currency: 'NGN', status: 'active' },
        'PlayStation': { buyRate: 0.77, sellRate: 0.80, currency: 'NGN', status: 'active' },
        'Xbox': { buyRate: 0.76, sellRate: 0.79, currency: 'NGN', status: 'active' },
        'Walmart': { buyRate: 0.74, sellRate: 0.77, currency: 'NGN', status: 'active' },
        'Target': { buyRate: 0.73, sellRate: 0.76, currency: 'NGN', status: 'active' },
        'Best Buy': { buyRate: 0.72, sellRate: 0.75, currency: 'NGN', status: 'active' },
        'eBay': { buyRate: 0.71, sellRate: 0.74, currency: 'NGN', status: 'active' }
      };

      const promises = Object.entries(defaultRates).map(([cardType, rateData]) => {
        const rateRef = doc(db, this.ratesCollection, cardType);
        return updateDoc(rateRef, {
          ...rateData,
          createdAt: new Date(),
          lastUpdated: new Date(),
          createdBy: 'system'
        }).catch(() => {
          // If document doesn't exist, create it
          return addDoc(collection(db, this.ratesCollection), {
            cardType,
            ...rateData,
            createdAt: new Date(),
            lastUpdated: new Date(),
            createdBy: 'system'
          });
        });
      });

      await Promise.all(promises);
      console.log('Default rates initialized successfully');
    } catch (error) {
      console.error('Error initializing default rates:', error);
    }
  }

  // Get trending rates (most active)
  async getTrendingRates() {
    try {
      const ratesResult = await this.getCurrentRates();
      if (!ratesResult.success) {
        throw new Error(ratesResult.error);
      }

      // Sort by last updated (most recent first)
      const sortedRates = Object.values(ratesResult.data)
        .filter(rate => rate.status === 'active')
        .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
        .slice(0, 5);

      return {
        success: true,
        data: sortedRates
      };
    } catch (error) {
      console.error('Error fetching trending rates:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch trending rates'
      };
    }
  }
}

export default new RatesAPI();
