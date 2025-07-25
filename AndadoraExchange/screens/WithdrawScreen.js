import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { validateAmount, validateAccountNumber } from '../utils/validateInput';
import { globalStyles } from '../styles/globalStyles';
import { COLORS, SPACING } from '../utils/constants';
import flutterwaveAPI from '../api/flutterwaveApi';
import nubanAPI from '../api/nubanApi';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import ErrorMessage from '../components/ErrorMessage';

const WithdrawScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [accountName, setAccountName] = useState('');
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [error, setError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [accountError, setAccountError] = useState('');
  const [transferFee, setTransferFee] = useState(0);
  const [accountVerified, setAccountVerified] = useState(false);

  const { userProfile, updateWalletBalance } = useAuth();

  useEffect(() => {
    loadBanks();
  }, []);

  useEffect(() => {
    if (amount && !amountError) {
      calculateTransferFee();
    }
  }, [amount, amountError]);

  useEffect(() => {
    if (accountNumber && selectedBank && accountNumber.length === 10) {
      verifyAccount();
    } else {
      setAccountName('');
      setAccountVerified(false);
    }
  }, [accountNumber, selectedBank]);

  const loadBanks = async () => {
    try {
      setLoadingBanks(true);
      
      // Try Flutterwave first, fallback to NUBAN
      let result = await flutterwaveAPI.getBanks();
      
      if (!result.success) {
        result = await nubanAPI.getBankCodes();
      }

      if (result.success) {
        setBanks(result.data);
      } else {
        setError('Failed to load banks. Please try again.');
      }
    } catch (error) {
      setError('Failed to load banks. Please check your connection.');
    } finally {
      setLoadingBanks(false);
    }
  };

  const calculateTransferFee = async () => {
    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) return;

      const result = await flutterwaveAPI.getTransferFee(numAmount);
      if (result.success) {
        setTransferFee(result.data.fee || 0);
      }
    } catch (error) {
      console.error('Error calculating transfer fee:', error);
    }
  };

  const verifyAccount = async () => {
    try {
      setVerifying(true);
      setAccountName('');
      setAccountVerified(false);

      const selectedBankData = banks.find(bank => bank.code === selectedBank);
      if (!selectedBankData) return;

      // Try Flutterwave first, fallback to NUBAN
      let result = await flutterwaveAPI.verifyAccountNumber(accountNumber, selectedBank);
      
      if (!result.success) {
        result = await nubanAPI.verifyBankAccount(accountNumber, selectedBank);
      }

      if (result.success && result.data) {
        setAccountName(result.data.accountName || result.data.account_name || 'Account Verified');
        setAccountVerified(true);
        setAccountError('');
      } else {
        setAccountError('Could not verify account. Please check account number and bank.');
        setAccountVerified(false);
      }
    } catch (error) {
      setAccountError('Account verification failed. Please try again.');
      setAccountVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  const validateForm = () => {
    let isValid = true;

    // Validate amount
    const amountValidation = validateAmount(amount);
    if (!amountValidation.isValid) {
      setAmountError(amountValidation.error);
      isValid = false;
    } else {
      const numAmount = parseFloat(amount);
      const totalAmount = numAmount + transferFee;
      
      if (totalAmount > (userProfile?.walletBalance || 0)) {
        setAmountError('Insufficient wallet balance (including transfer fee)');
        isValid = false;
      } else {
        setAmountError('');
      }
    }

    // Validate account number
    const accountValidation = validateAccountNumber(accountNumber);
    if (!accountValidation.isValid) {
      setAccountError(accountValidation.error);
      isValid = false;
    } else if (!accountVerified) {
      setAccountError('Please verify your account details');
      isValid = false;
    } else {
      setAccountError('');
    }

    // Validate bank selection
    if (!selectedBank) {
      setError('Please select a bank');
      isValid = false;
    }

    return isValid;
  };

  const handleWithdraw = async () => {
    setError('');
    
    if (!validateForm()) {
      return;
    }

    const numAmount = parseFloat(amount);
    const totalDeduction = numAmount + transferFee;

    Alert.alert(
      'Confirm Withdrawal',
      `You are about to withdraw ₦${numAmount.toLocaleString()} to ${accountName}.\n\nTransfer fee: ₦${transferFee}\nTotal deduction: ₦${totalDeduction.toLocaleString()}\n\nProceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: processWithdrawal
        }
      ]
    );
  };

  const processWithdrawal = async () => {
    setLoading(true);
    
    try {
      const selectedBankData = banks.find(bank => bank.code === selectedBank);
      const numAmount = parseFloat(amount);
      
      const transferData = {
        accountNumber,
        bankCode: selectedBank,
        amount: numAmount,
        narration: `Withdrawal from AndadoraExchange - ${accountName}`,
        bankName: selectedBankData?.name
      };

      const result = await flutterwaveAPI.initiateTransfer(transferData);
      
      if (result.success) {
        // Deduct from wallet
        const totalDeduction = numAmount + transferFee;
        const walletResult = await updateWalletBalance(totalDeduction, 'subtract');
        
        if (walletResult.success) {
          Alert.alert(
            'Withdrawal Initiated',
            'Your withdrawal request has been submitted and is being processed. You will receive the funds shortly.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Reset form
                  setAmount('');
                  setAccountNumber('');
                  setSelectedBank('');
                  setAccountName('');
                  setAccountVerified(false);
                  navigation.goBack();
                }
              }
            ]
          );
        } else {
          setError('Withdrawal initiated but wallet update failed. Please contact support.');
        }
      } else {
        setError(result.error || 'Withdrawal failed. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderBankPicker = () => (
    <Card>
      <Text style={globalStyles.subtitle}>Select Bank</Text>
      {loadingBanks ? (
        <Text style={globalStyles.body}>Loading banks...</Text>
      ) : (
        <View style={[globalStyles.input, { padding: 0 }]}>
          <Picker
            selectedValue={selectedBank}
            onValueChange={setSelectedBank}
            style={{ height: 50 }}
          >
            <Picker.Item label="Select a bank" value="" />
            {banks.map((bank) => (
              <Picker.Item 
                key={bank.code} 
                label={bank.name} 
                value={bank.code} 
              />
            ))}
          </Picker>
        </View>
      )}
    </Card>
  );

  const renderWithdrawalSummary = () => {
    if (!amount || amountError) return null;

    const numAmount = parseFloat(amount);
    const totalDeduction = numAmount + transferFee;
    const remainingBalance = (userProfile?.walletBalance || 0) - totalDeduction;

    return (
      <Card style={{ backgroundColor: COLORS.surface }}>
        <Text style={globalStyles.subtitle}>Withdrawal Summary</Text>
        
        <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.xs }]}>
          <Text style={globalStyles.body}>Withdrawal Amount:</Text>
          <Text style={[globalStyles.body, { fontWeight: 'bold' }]}>
            ₦{numAmount.toLocaleString()}
          </Text>
        </View>

        <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.xs }]}>
          <Text style={globalStyles.body}>Transfer Fee:</Text>
          <Text style={globalStyles.body}>₦{transferFee}</Text>
        </View>

        <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.xs, paddingTop: SPACING.xs, borderTopWidth: 1, borderTopColor: COLORS.border }]}>
          <Text style={[globalStyles.body, { fontWeight: 'bold' }]}>Total Deduction:</Text>
          <Text style={[globalStyles.body, { fontWeight: 'bold' }]}>
            ₦{totalDeduction.toLocaleString()}
          </Text>
        </View>

        <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.xs }]}>
          <Text style={globalStyles.body}>Remaining Balance:</Text>
          <Text style={[
            globalStyles.body, 
            { 
              fontWeight: 'bold',
              color: remainingBalance >= 0 ? COLORS.success : COLORS.error
            }
          ]}>
            ₦{remainingBalance.toLocaleString()}
          </Text>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView contentContainerStyle={globalStyles.scrollContainer}>
        <Text style={globalStyles.title}>Withdraw Funds</Text>
        
        <Card style={{ backgroundColor: COLORS.accent }}>
          <Text style={[globalStyles.subtitle, { color: COLORS.background, textAlign: 'center' }]}>
            Available Balance
          </Text>
          <Text style={[globalStyles.walletBalance, { color: COLORS.background }]}>
            ₦{(userProfile?.walletBalance || 0).toLocaleString()}
          </Text>
        </Card>

        {error ? (
          <ErrorMessage 
            message={error} 
            onDismiss={() => setError('')}
            showDismiss
          />
        ) : null}

        <Input
          label="Withdrawal Amount (₦)"
          placeholder="Enter amount to withdraw"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          error={amountError}
        />

        {renderBankPicker()}

        <Input
          label="Account Number"
          placeholder="Enter 10-digit account number"
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="numeric"
          maxLength={10}
          error={accountError}
        />

        {verifying && (
          <ErrorMessage 
            message="Verifying account details..."
            type="info"
          />
        )}

        {accountVerified && accountName && (
          <ErrorMessage 
            message={`Account verified: ${accountName}`}
            type="success"
          />
        )}

        {renderWithdrawalSummary()}

        <Button
          title="Withdraw Funds"
          onPress={handleWithdraw}
          loading={loading}
          disabled={loading || !accountVerified || !!amountError}
          style={{ marginTop: SPACING.lg }}
        />

        <ErrorMessage 
          message="Withdrawals are processed within 24 hours during business days."
          type="info"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default WithdrawScreen;
