import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../api/firebase';
import { generateReferralCode } from '../utils/validateInput';
import { REFERRAL_BONUS } from '../utils/constants';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          await loadUserProfile(firebaseUser.uid);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const loadUserProfile = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const register = async (email, password, referralCode = null) => {
    try {
      setError(null);
      setLoading(true);

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Generate unique referral code for new user
      const newUserReferralCode = generateReferralCode(user.uid);

      // Create user profile
      const userProfile = {
        uid: user.uid,
        email: user.email,
        createdAt: new Date(),
        walletBalance: 0,
        loyaltyTier: 'BRONZE',
        transactionCount: 0,
        kycStatus: 'pending',
        isActive: true,
        referralCode: newUserReferralCode,
        referredBy: null,
        referralEarnings: 0,
        totalReferrals: 0
      };

      // Handle referral if provided
      if (referralCode) {
        const referralResult = await processReferral(referralCode, user.uid);
        if (referralResult.success) {
          userProfile.referredBy = referralResult.referrerId;
        }
      }

      // Save user profile to Firestore
      await setDoc(doc(db, 'users', user.uid), userProfile);
      setUserProfile(userProfile);

      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await loadUserProfile(user.uid);
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');

      // Update Firebase Auth profile if needed
      if (updates.displayName) {
        await updateProfile(user, { displayName: updates.displayName });
      }

      // Update Firestore profile
      await updateDoc(doc(db, 'users', user.uid), {
        ...updates,
        updatedAt: new Date()
      });

      // Reload profile
      await loadUserProfile(user.uid);
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }
  };

  const updateWalletBalance = async (amount, type = 'add') => {
    try {
      if (!user || !userProfile) throw new Error('No user logged in');

      const currentBalance = userProfile.walletBalance || 0;
      const newBalance = type === 'add' ? currentBalance + amount : currentBalance - amount;

      if (newBalance < 0) {
        throw new Error('Insufficient wallet balance');
      }

      await updateDoc(doc(db, 'users', user.uid), {
        walletBalance: newBalance,
        updatedAt: new Date()
      });

      // Update local state
      setUserProfile(prev => ({
        ...prev,
        walletBalance: newBalance
      }));

      return { success: true, newBalance };
    } catch (error) {
      console.error('Wallet update error:', error);
      return { success: false, error: error.message };
    }
  };

  const processReferral = async (referralCode, newUserId) => {
    try {
      // Find user with this referral code
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(query(usersRef, where('referralCode', '==', referralCode)));

      if (snapshot.empty) {
        return { success: false, error: 'Invalid referral code' };
      }

      const referrerDoc = snapshot.docs[0];
      const referrerId = referrerDoc.id;
      const referrerData = referrerDoc.data();

      // Create referral record
      await addDoc(collection(db, 'referrals'), {
        referrerId,
        referredUserId: newUserId,
        referralCode,
        status: 'pending', // Will be 'completed' after KYC approval
        createdAt: new Date(),
        bonusAmount: REFERRAL_BONUS
      });

      return { success: true, referrerId };
    } catch (error) {
      console.error('Referral processing error:', error);
      return { success: false, error: error.message };
    }
  };

  const completeReferralBonus = async (referredUserId) => {
    try {
      // Find pending referral
      const referralsRef = collection(db, 'referrals');
      const snapshot = await getDocs(
        query(referralsRef, 
          where('referredUserId', '==', referredUserId),
          where('status', '==', 'pending')
        )
      );

      if (snapshot.empty) return;

      const referralDoc = snapshot.docs[0];
      const referralData = referralDoc.data();

      // Update referrer's wallet and stats
      const referrerRef = doc(db, 'users', referralData.referrerId);
      const referrerDoc = await getDoc(referrerRef);
      
      if (referrerDoc.exists()) {
        const referrerData = referrerDoc.data();
        await updateDoc(referrerRef, {
          walletBalance: (referrerData.walletBalance || 0) + REFERRAL_BONUS,
          referralEarnings: (referrerData.referralEarnings || 0) + REFERRAL_BONUS,
          totalReferrals: (referrerData.totalReferrals || 0) + 1,
          updatedAt: new Date()
        });

        // Update referral status
        await updateDoc(doc(db, 'referrals', referralDoc.id), {
          status: 'completed',
          completedAt: new Date()
        });

        // Create transaction record
        await addDoc(collection(db, 'transactions'), {
          userId: referralData.referrerId,
          type: 'referral_bonus',
          amount: REFERRAL_BONUS,
          status: 'completed',
          description: 'Referral bonus earned',
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Referral bonus completion error:', error);
    }
  };

  const updateLoyaltyTier = async () => {
    try {
      if (!user || !userProfile) return;

      const transactionCount = userProfile.transactionCount || 0;
      let newTier = 'BRONZE';

      if (transactionCount >= 50) {
        newTier = 'GOLD';
      } else if (transactionCount >= 10) {
        newTier = 'SILVER';
      }

      if (newTier !== userProfile.loyaltyTier) {
        await updateDoc(doc(db, 'users', user.uid), {
          loyaltyTier: newTier,
          updatedAt: new Date()
        });

        setUserProfile(prev => ({
          ...prev,
          loyaltyTier: newTier
        }));
      }
    } catch (error) {
      console.error('Loyalty tier update error:', error);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    error,
    register,
    login,
    logout,
    updateUserProfile,
    updateWalletBalance,
    completeReferralBonus,
    updateLoyaltyTier,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
