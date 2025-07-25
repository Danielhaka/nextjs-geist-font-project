# AndadoraExchange - Gift Card Trading App

A full-featured React Native (Expo) app for trading gift cards with Firebase backend, Flutterwave payments, and comprehensive admin features.

## Features

### User Features
- **Authentication**: Firebase Email/Password with biometric and PIN security
- **Gift Card Trading**: Upload front/back images, real-time rate calculation
- **Wallet System**: Balance display, withdrawal via Flutterwave
- **KYC Verification**: Upload valid ID documents
- **Referral System**: Earn ₦5 for each successful referral
- **Loyalty Tiers**: Bronze, Silver, Gold with bonus rates
- **Transaction History**: Complete transaction tracking
- **Help & Support**: In-app messaging with Firestore
- **Push Notifications**: Real-time updates

### Admin Features
- **Admin Dashboard**: Approve/reject submissions and KYC
- **Rate Management**: CRUD operations for gift card rates
- **User Management**: View users and manage accounts
- **Withdrawal Management**: Process withdrawal requests

### Security Features
- **Biometric Authentication**: Face ID, Touch ID, Fingerprint
- **PIN Protection**: 4-6 digit PIN for transactions
- **Device Lockout**: 6-hour lockout on device switch
- **Secure Storage**: All sensitive data encrypted

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Payments**: Flutterwave API
- **Bank Verification**: NUBAN API
- **Navigation**: React Navigation v6
- **State Management**: React Context
- **Security**: Expo SecureStore, Local Authentication

## Setup Instructions

### 1. Prerequisites
- Node.js 16+ installed
- Expo CLI installed globally: `npm install -g @expo/cli`
- EAS CLI installed: `npm install -g eas-cli`

### 2. Installation
```bash
cd AndadoraExchange
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory with your API keys:

```env
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Flutterwave Configuration
FLUTTERWAVE_PUBLIC_KEY=your_public_key
FLUTTERWAVE_SECRET_KEY=your_secret_key

# NUBAN API Configuration
NUBAN_API_KEY=your_nuban_api_key
NUBAN_BASE_URL=your_base_url
NUBAN_BANK_CODES_URL=your_bank_codes_url
```

### 4. Firebase Setup
1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Authentication with Email/Password
3. Create Firestore database
4. Enable Storage
5. Add your Android app and download `google-services.json`

### 5. Asset Setup
Add the following assets to the `assets/` folder:
- `icon.png` (1024x1024) - App icon
- `splash.png` (1284x2778) - Splash screen
- `favicon.png` (48x48) - Web favicon

### 6. Development
```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

### 7. Building for Production
```bash
# Configure EAS
eas build:configure

# Build Android APK
npm run build:android
```

## Project Structure

```
AndadoraExchange/
├── components/          # Reusable UI components
│   ├── Button.js
│   ├── Input.js
│   ├── Card.js
│   └── ErrorMessage.js
├── screens/            # App screens
│   ├── LoginScreen.js
│   ├── RegisterScreen.js
│   ├── GiftCardScreen.js
│   ├── ProfileScreen.js
│   └── ...
├── navigation/         # Navigation configuration
│   ├── AppNavigator.js
│   ├── AuthNavigator.js
│   └── MainTabNavigator.js
├── api/               # API integrations
│   ├── firebase.js
│   ├── flutterwaveApi.js
│   ├── nubanApi.js
│   └── rates.js
├── context/           # React Context providers
│   └── AuthContext.js
├── utils/             # Utility functions
│   ├── constants.js
│   └── validateInput.js
├── styles/            # Global styles
│   └── globalStyles.js
└── assets/            # Images and assets
```

## Key Features Implementation

### Referral System
- Users get unique referral codes upon registration
- ₦5 bonus credited after referred user completes KYC
- Referral tracking in Profile screen

### Loyalty Tiers
- **Bronze**: 0+ transactions (1.0x rate)
- **Silver**: 10+ transactions (1.05x rate)
- **Gold**: 50+ transactions (1.1x rate)

### Security
- Biometric authentication with PIN fallback
- Secure storage for sensitive data
- Device lockout protection

### Admin Features
- Real-time dashboard with pending items
- Rate management with history tracking
- User and transaction management

## API Integration

### Firebase
- Authentication and user management
- Firestore for data storage
- Storage for file uploads

### Flutterwave
- Bank transfers and withdrawals
- Account verification
- Transaction processing

### NUBAN
- Nigerian bank account verification
- Bank code validation
- Account name resolution

## Build Configuration

The app is configured to build Android APK using EAS Build:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## Support

For support and questions:
- Email: support@andadoraexchange.com
- Phone: +234 800 123 4567
- Hours: Mon-Fri, 9 AM - 5 PM WAT

## License

This project is proprietary software. All rights reserved.
