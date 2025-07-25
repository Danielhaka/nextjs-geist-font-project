import React, { useState } from 'react';
import { View, Text, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../api/firebase';
import { globalStyles } from '../styles/globalStyles';
import { COLORS, SPACING } from '../utils/constants';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import ErrorMessage from '../components/ErrorMessage';

const UploadIDScreen = ({ navigation }) => {
  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [idNumberError, setIdNumberError] = useState('');

  const { user, userProfile, updateUserProfile, completeReferralBonus } = useAuth();

  const idTypes = [
    { value: 'nin', label: 'National ID (NIN)' },
    { value: 'drivers_license', label: 'Driver\'s License' },
    { value: 'passport', label: 'International Passport' },
    { value: 'voters_card', label: 'Voter\'s Card' }
  ];

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload ID images.');
      return false;
    }
    return true;
  };

  const pickImage = async (type) => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

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

  const uploadImageToStorage = async (imageUri, fileName) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const imageRef = ref(storage, `kyc/${user.uid}/${fileName}`);
      await uploadBytes(imageRef, blob);
      
      const downloadURL = await getDownloadURL(imageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const validateForm = () => {
    let isValid = true;

    // Validate ID type
    if (!idType) {
      setError('Please select an ID type');
      isValid = false;
    }

    // Validate ID number
    if (!idNumber.trim()) {
      setIdNumberError('ID number is required');
      isValid = false;
    } else if (idNumber.trim().length < 5) {
      setIdNumberError('Please enter a valid ID number');
      isValid = false;
    } else {
      setIdNumberError('');
    }

    // Validate images
    if (!frontImage) {
      setError('Please upload the front image of your ID');
      isValid = false;
    }

    if (!backImage && idType !== 'passport') {
      setError('Please upload the back image of your ID');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmitKYC = async () => {
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setUploading(true);
    
    try {
      // Upload images to Firebase Storage
      const frontImageUrl = await uploadImageToStorage(
        frontImage.uri, 
        `${idType}_front_${Date.now()}.jpg`
      );

      let backImageUrl = null;
      if (backImage) {
        backImageUrl = await uploadImageToStorage(
          backImage.uri, 
          `${idType}_back_${Date.now()}.jpg`
        );
      }

      // Create KYC submission document
      const kycData = {
        userId: user.uid,
        idType,
        idNumber: idNumber.trim(),
        frontImageUrl,
        backImageUrl,
        status: 'pending',
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null
      };

      await addDoc(collection(db, 'kycSubmissions'), kycData);

      // Update user profile
      await updateUserProfile({
        kycStatus: 'pending',
        kycSubmittedAt: new Date()
      });

      Alert.alert(
        'KYC Submitted Successfully',
        'Your identity verification documents have been submitted for review. You will be notified once the review is complete.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Check if user was referred and complete referral bonus
              if (userProfile?.referredBy) {
                completeReferralBonus(user.uid);
              }
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('KYC submission error:', error);
      setError('Failed to submit KYC documents. Please try again.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const renderIdTypeSelector = () => (
    <Card>
      <Text style={globalStyles.subtitle}>Select ID Type</Text>
      <View style={{ marginTop: SPACING.sm }}>
        {idTypes.map((type) => (
          <Button
            key={type.value}
            title={type.label}
            onPress={() => setIdType(type.value)}
            variant={idType === type.value ? 'primary' : 'outline'}
            style={{ marginVertical: SPACING.xs }}
          />
        ))}
      </View>
    </Card>
  );

  const renderImageUpload = (type, image, required = true) => (
    <Card>
      <Text style={globalStyles.subtitle}>
        {type === 'front' ? 'Front of ID' : 'Back of ID'}
        {!required && ' (Optional for Passport)'}
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

  const getSelectedIdTypeLabel = () => {
    const selectedType = idTypes.find(type => type.value === idType);
    return selectedType ? selectedType.label : '';
  };

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <ScrollView contentContainerStyle={globalStyles.scrollContainer}>
        <Text style={globalStyles.title}>Identity Verification</Text>
        
        <ErrorMessage 
          message="Upload a valid government-issued ID to verify your identity and unlock all features."
          type="info"
        />

        {error ? (
          <ErrorMessage 
            message={error} 
            onDismiss={() => setError('')}
            showDismiss
          />
        ) : null}

        {userProfile?.kycStatus === 'pending' && (
          <ErrorMessage 
            message="Your KYC documents are currently under review. You will be notified once the review is complete."
            type="warning"
          />
        )}

        {userProfile?.kycStatus === 'rejected' && (
          <ErrorMessage 
            message="Your previous KYC submission was rejected. Please upload new documents."
            type="error"
          />
        )}

        {renderIdTypeSelector()}

        {idType && (
          <Input
            label={`${getSelectedIdTypeLabel()} Number`}
            placeholder="Enter your ID number"
            value={idNumber}
            onChangeText={setIdNumber}
            error={idNumberError}
          />
        )}

        {idType && renderImageUpload('front', frontImage)}
        {idType && idType !== 'passport' && renderImageUpload('back', backImage, false)}

        {uploading && (
          <ErrorMessage 
            message="Uploading documents... Please wait."
            type="info"
          />
        )}

        <Button
          title="Submit for Verification"
          onPress={handleSubmitKYC}
          loading={loading}
          disabled={loading || userProfile?.kycStatus === 'pending'}
          style={{ marginTop: SPACING.lg }}
        />

        <ErrorMessage 
          message="• Ensure all text on your ID is clearly visible
• Images should be well-lit and not blurry
• Do not cover any part of the ID
• Processing typically takes 1-3 business days"
          type="info"
        />

        <Text style={[globalStyles.caption, { textAlign: 'center', marginTop: SPACING.lg }]}>
          Your personal information is encrypted and stored securely. We comply with all data protection regulations.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UploadIDScreen;
