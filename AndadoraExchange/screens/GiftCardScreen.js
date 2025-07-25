import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { globalStyles } from '../styles/globalStyles';
import { COLORS, SPACING, GIFT_CARD_TYPES } from '../utils/constants';
import { validateAmount } from '../utils/validateInput';
import ratesAPI from '../api/rates';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import ErrorMessage from '../components/ErrorMessage';

const GiftCardScreen = ({ navigation }) => {
  const [selectedCardType, setSelectedCardType] = useState('');
  const [cardValue, setCardValue] = useState('');
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [exchangeData, setExchangeData] = useState(null);
  const [rates, setRates] = useState({});
  const [error, setError] = useState('');
  const [cardValueError, setCardValueError] = useState('');

  const { userProfile } = useAuth();

  useEffect(() => {
    loadRates();
    requestPermissions();
  }, []);

  useEffect(() => {
    if (selectedCardType && cardValue && !cardValueError) {
      calculateExchange();
    } else {
      setExchangeData(null);
    }
  }, [selectedCardType, cardValue, cardValueError]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload gift card images.');
    }
  };

  const loadRates = async () => {
    try {
      const result = await ratesAPI.getCurrentRates();
      if (result.success) {
        setRates(result.data);
      }
    } catch (error) {
      console.error('Error loading rates:', error);
    }
  };

  const calculateExchange = async () => {
    if (!selectedCardType || !cardValue) return;

    setCalculating(true);
    try {
      const result = await ratesAPI.calculateExchange(
        selectedCardType, 
        parseFloat(cardValue), 
        userProfile?.loyaltyTier || 'BRONZE'
      );

      if (result.success) {
        setExchangeData(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to calculate exchange rate');
    } finally {
      setCalculating(false);
    }
  };

  const pickImage = async (type) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'front') {
          setFrontImage(result.assets[0]);
        } else {
          setBackImage(result.assets[0]);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const validateForm = () => {
    let isValid = true;

    // Validate card value
    const amountValidation = validateAmount(cardValue);
    if (!amountValidation.isValid) {
      setCardValueError(amountValidation.error);
      isValid = false;
    } else {
      setCardValueError('');
    }

    // Validate card type
    if (!selectedCardType) {
      setError('Please select a gift card type');
      isValid = false;
    }

    // Validate images
    if (!frontImage) {
      setError('Please upload the front image of your gift card');
      isValid = false;
    }

    if (!backImage) {
      setError('Please upload the back image of your gift card');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // TODO: Implement gift card submission to Firebase
      // This would include uploading images to Firebase Storage
      // and creating a submission document in Firestore
      
      Alert.alert(
        'Success',
        'Your gift card has been submitted for review. You will be notified once it\'s processed.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setSelectedCardType('');
              setCardValue('');
              setFrontImage(null);
              setBackImage(null);
              setExchangeData(null);
            }
          }
        ]
      );
    } catch (error) {
      setError('Failed to submit gift card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderCardTypeSelector = () => (
    <Card>
      <Text style={globalStyles.subtitle}>Select Gift Card Type</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: SPACING.sm }}>
        {GIFT_CARD_TYPES.map((cardType) => (
          <TouchableOpacity
            key={cardType}
            style={[
              {
                padding: SPACING.sm,
                margin: SPACING.xs,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: selectedCardType === cardType ? COLORS.accent : COLORS.border,
                backgroundColor: selectedCardType === cardType ? COLORS.accent : COLORS.background,
              }
            ]}
            onPress={() => setSelectedCardType(cardType)}
          >
            <Text style={[
              globalStyles.body,
              { 
                color: selectedCardType === cardType ? COLORS.background : COLORS.text,
                fontSize: 14
              }
            ]}>
              {cardType}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );

  const renderImageUpload = (type, image) => (
    <Card>
      <Text style={globalStyles.subtitle}>
        {type === 'front' ? 'Front Image' : 'Back Image'}
      </Text>
      
      {image ? (
        <View>
          <Image 
            source={{ uri: image.uri }} 
            style={{ 
              width: '100%', 
              height: 200, 
              borderRadius: 8, 
              marginVertical: SPACING.sm 
            }} 
          />
          <Button
            title={`Change ${type} image`}
            onPress={() => pickImage(type)}
            variant="outline"
          />
        </View>
      ) : (
        <Button
          title={`Upload ${type} image`}
          onPress={() => pickImage(type)}
          variant="outline"
        />
      )}
    </Card>
  );

  const renderExchangeCalculation = () => {
    if (!exchangeData) return null;

    return (
      <Card style={{ backgroundColor: COLORS.accent }}>
        <Text style={[globalStyles.subtitle, { color: COLORS.background }]}>
          Exchange Calculation
        </Text>
        
        <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.xs }]}>
          <Text style={[globalStyles.body, { color: COLORS.background }]}>
            Card Value:
          </Text>
          <Text style={[globalStyles.body, { color: COLORS.background, fontWeight: 'bold' }]}>
            ${exchangeData.cardValue}
          </Text>
        </View>

        <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.xs }]}>
          <Text style={[globalStyles.body, { color: COLORS.background }]}>
            Exchange Rate:
          </Text>
          <Text style={[globalStyles.body, { color: COLORS.background, fontWeight: 'bold' }]}>
            {exchangeData.exchangeRate}
          </Text>
        </View>

        {exchangeData.tierBonus > 0 && (
          <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.xs }]}>
            <Text style={[globalStyles.body, { color: COLORS.background }]}>
              {exchangeData.userTier} Bonus:
            </Text>
            <Text style={[globalStyles.body, { color: COLORS.background, fontWeight: 'bold' }]}>
              +₦{exchangeData.tierBonus}
            </Text>
          </View>
        )}

        <View style={[globalStyles.spaceBetween, { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.background }]}>
          <Text style={[globalStyles.subtitle, { color: COLORS.background }]}>
            You'll Receive:
          </Text>
          <Text style={[globalStyles.title, { color: COLORS.background, fontSize: 24 }]}>
            ₦{exchangeData.exchangeAmount}
          </Text>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView contentContainerStyle={globalStyles.scrollContainer}>
        <Text style={globalStyles.title}>Trade Gift Card</Text>
        
        {error ? (
          <ErrorMessage 
            message={error} 
            onDismiss={() => setError('')}
            showDismiss
          />
        ) : null}

        {renderCardTypeSelector()}

        <Input
          label="Gift Card Value ($)"
          placeholder="Enter card value"
          value={cardValue}
          onChangeText={setCardValue}
          keyboardType="numeric"
          error={cardValueError}
        />

        {calculating && (
          <ErrorMessage 
            message="Calculating exchange rate..."
            type="info"
          />
        )}

        {renderExchangeCalculation()}

        {renderImageUpload('front', frontImage)}
        {renderImageUpload('back', backImage)}

        <Button
          title="Submit Gift Card"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || !exchangeData}
          style={{ marginTop: SPACING.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default GiftCardScreen;
