import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../api/firebase';
import { globalStyles } from '../styles/globalStyles';
import { COLORS, SPACING } from '../utils/constants';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import ErrorMessage from '../components/ErrorMessage';

const HelpAndSupportScreen = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('general');

  const { user, userProfile } = useAuth();

  const supportCategories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'account', label: 'Account Problem' },
    { value: 'transaction', label: 'Transaction Issue' },
    { value: 'kyc', label: 'KYC Verification' },
    { value: 'withdrawal', label: 'Withdrawal Problem' }
  ];

  const faqData = [
    {
      question: 'How long does KYC verification take?',
      answer: 'KYC verification typically takes 1-3 business days. You will be notified via email once your documents are reviewed.'
    },
    {
      question: 'What gift cards do you accept?',
      answer: 'We accept Amazon, iTunes, Google Play, Steam, PlayStation, Xbox, Walmart, Target, Best Buy, and eBay gift cards.'
    },
    {
      question: 'How long do withdrawals take?',
      answer: 'Withdrawals are processed within 24 hours during business days (Monday-Friday, 9 AM - 5 PM WAT).'
    },
    {
      question: 'What are the withdrawal fees?',
      answer: 'Withdrawal fees vary based on the amount and destination bank. The fee is displayed before you confirm your withdrawal.'
    },
    {
      question: 'How does the referral program work?',
      answer: 'Share your referral code with friends. When they sign up and complete KYC verification, you earn ₦5 bonus in your wallet.'
    },
    {
      question: 'What are loyalty tiers?',
      answer: 'Bronze (0+ transactions), Silver (10+ transactions, 5% bonus), Gold (50+ transactions, 10% bonus). Higher tiers get better exchange rates.'
    }
  ];

  useEffect(() => {
    if (user) {
      loadSupportMessages();
    }
  }, [user]);

  const loadSupportMessages = () => {
    try {
      setLoading(true);
      
      const messagesRef = collection(db, 'supportMessages');
      const q = query(
        messagesRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messagesList = [];
        snapshot.forEach(doc => {
          messagesList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setMessages(messagesList);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading support messages:', error);
      setError('Failed to load messages. Please try again.');
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      setError('Please enter a message');
      return;
    }

    setSending(true);
    setError('');

    try {
      const messageData = {
        userId: user.uid,
        userEmail: user.email,
        userName: userProfile?.displayName || user.email,
        message: newMessage.trim(),
        category: selectedCategory,
        isFromUser: true,
        createdAt: new Date(),
        status: 'open'
      };

      await addDoc(collection(db, 'supportMessages'), messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[
      {
        marginVertical: SPACING.xs,
        padding: SPACING.md,
        borderRadius: 12,
        maxWidth: '80%',
        alignSelf: item.isFromUser ? 'flex-end' : 'flex-start',
        backgroundColor: item.isFromUser ? COLORS.accent : COLORS.surface
      }
    ]}>
      <Text style={[
        globalStyles.body,
        { color: item.isFromUser ? COLORS.background : COLORS.text }
      ]}>
        {item.message}
      </Text>
      
      <Text style={[
        globalStyles.caption,
        { 
          color: item.isFromUser ? COLORS.background : COLORS.textSecondary,
          marginTop: SPACING.xs,
          textAlign: 'right'
        }
      ]}>
        {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString() : 'Now'}
      </Text>
    </View>
  );

  const renderFAQItem = ({ item }) => (
    <Card style={{ marginVertical: SPACING.xs }}>
      <Text style={[globalStyles.subtitle, { fontSize: 16 }]}>
        {item.question}
      </Text>
      <Text style={[globalStyles.body, { marginTop: SPACING.sm }]}>
        {item.answer}
      </Text>
    </Card>
  );

  const renderCategorySelector = () => (
    <View style={{ marginBottom: SPACING.md }}>
      <Text style={[globalStyles.subtitle, { marginBottom: SPACING.sm }]}>
        Category
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {supportCategories.map((category) => (
          <Button
            key={category.value}
            title={category.label}
            onPress={() => setSelectedCategory(category.value)}
            variant={selectedCategory === category.value ? 'primary' : 'outline'}
            style={{ 
              marginRight: SPACING.sm,
              paddingHorizontal: SPACING.md,
              minHeight: 'auto'
            }}
            textStyle={{ fontSize: 14 }}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <KeyboardAvoidingView 
        style={globalStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={globalStyles.scrollContainer}>
          <Text style={globalStyles.title}>Help & Support</Text>
          
          {error ? (
            <ErrorMessage 
              message={error} 
              onDismiss={() => setError('')}
              showDismiss
            />
          ) : null}

          {/* FAQ Section */}
          <Card>
            <Text style={globalStyles.subtitle}>Frequently Asked Questions</Text>
            <FlatList
              data={faqData}
              renderItem={renderFAQItem}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
              style={{ marginTop: SPACING.sm }}
            />
          </Card>

          {/* Contact Support Section */}
          <Card>
            <Text style={globalStyles.subtitle}>Contact Support</Text>
            <Text style={[globalStyles.body, { marginBottom: SPACING.md }]}>
              Can't find what you're looking for? Send us a message and we'll get back to you within 24 hours.
            </Text>

            {renderCategorySelector()}

            {/* Messages */}
            {messages.length > 0 && (
              <View style={{ 
                maxHeight: 300, 
                marginBottom: SPACING.md,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 8,
                padding: SPACING.sm
              }}>
                <Text style={[globalStyles.subtitle, { marginBottom: SPACING.sm }]}>
                  Conversation
                </Text>
                <FlatList
                  data={messages}
                  renderItem={renderMessage}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}

            {/* Message Input */}
            <Input
              placeholder="Type your message here..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              numberOfLines={3}
              style={{ marginBottom: SPACING.sm }}
            />

            <Button
              title="Send Message"
              onPress={sendMessage}
              loading={sending}
              disabled={sending || !newMessage.trim()}
            />
          </Card>

          {/* Contact Information */}
          <Card>
            <Text style={globalStyles.subtitle}>Other Ways to Reach Us</Text>
            
            <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.sm }]}>
              <Text style={globalStyles.body}>Email:</Text>
              <Text style={[globalStyles.body, { color: COLORS.accent }]}>
                support@andadoraexchange.com
              </Text>
            </View>

            <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.sm }]}>
              <Text style={globalStyles.body}>Phone:</Text>
              <Text style={[globalStyles.body, { color: COLORS.accent }]}>
                +234 800 123 4567
              </Text>
            </View>

            <View style={[globalStyles.spaceBetween, { marginVertical: SPACING.sm }]}>
              <Text style={globalStyles.body}>Hours:</Text>
              <Text style={globalStyles.body}>
                Mon-Fri, 9 AM - 5 PM WAT
              </Text>
            </View>
          </Card>

          <ErrorMessage 
            message="For urgent issues, please call our support line. For general inquiries, email or in-app messaging is preferred."
            type="info"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default HelpAndSupportScreen;
