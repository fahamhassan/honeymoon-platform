# 🌙 HoneyMoon — React Native Mobile App

Luxury wedding & event planning platform for UAE. Built with React Native for iOS and Android.

---

## 📁 Project Structure

```
HoneyMoonApp/
├── App.js                          # Root component
├── index.js                        # Entry point
├── package.json                    # Dependencies
│
└── src/
    ├── theme/index.js              # Colors, fonts, spacing, shadows
    ├── data/index.js               # Mock data (vendors, bookings, user)
    ├── context/AppContext.js       # Global state (useReducer)
    │
    ├── navigation/
    │   ├── RootNavigator.js        # Auth ↔ Main switcher
    │   ├── AuthNavigator.js        # Login / Register / OTP
    │   └── MainNavigator.js        # Bottom tabs + stack screens
    │
    ├── components/
    │   ├── index.js                # Shared UI components
    │   ├── VendorCard.js           # Vendor listing card
    │   └── ToastConfig.js          # Custom toast styling
    │
    └── screens/
        ├── auth/
        │   ├── SplashScreen.js     # Animated splash
        │   ├── LoginScreen.js      # Email + UAE Pass login
        │   ├── RegisterScreen.js   # Account creation
        │   └── OtpScreen.js        # SMS verification
        │
        ├── home/
        │   └── HomeScreen.js       # Dashboard, countdown, categories
        │
        ├── explore/
        │   ├── ExploreScreen.js    # Search, filter, vendor grid
        │   └── VendorDetailScreen.js # Packages, reviews, book CTA
        │
        ├── bookings/
        │   ├── BookingsScreen.js   # Booking list with filters
        │   ├── BookingFlowScreen.js # 3-step: Details > Pay > Confirm
        │   └── BookingDetailScreen.js # Full booking info + actions
        │
        ├── budget/
        │   └── BudgetScreen.js     # Guest slider, AI breakdown, checklist
        │
        └── profile/
            ├── ProfileScreen.js    # User info, loyalty card, menu
            └── ProfileScreens.js   # Wishlist, Notifications, EditProfile,
                                    # Loyalty, Settings, Reviews
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | comes with Node |
| Xcode | 14+ | Mac App Store (iOS only) |
| Android Studio | Latest | https://developer.android.com/studio |
| CocoaPods | Latest | `sudo gem install cocoapods` (iOS) |
| JDK | 17 | `brew install openjdk@17` |

---

### 1. Install dependencies

```bash
cd HoneyMoonApp
npm install
```

### 2. iOS Setup (Mac only)

```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

> To run on a specific simulator:
> ```bash
> npx react-native run-ios --simulator="iPhone 15 Pro"
> ```

### 3. Android Setup

```bash
# Start an emulator first (Android Studio → Device Manager → ▶)
npx react-native run-android
```

### 4. Start Metro bundler separately (optional)

```bash
npx react-native start
```

---

## 📱 Screens & Features

### Auth Flow
- **Splash** — animated logo with auto-redirect
- **Login** — email/password + UAE Pass button
- **Register** — full form with female-only notice
- **OTP** — 4-digit SMS verification with auto-focus

### 🏠 Home Tab
- Wedding event countdown card
- Quick stats (booked, pending, spent)
- Featured vendors horizontal scroll
- Category grid (8 categories)
- AI budget insight

### 🔍 Explore Tab
- Live search across name, category, location
- Category filter chips (All / Venues / Catering / etc.)
- Sort by rating / price (low/high)
- 2-column vendor grid
- Wishlist heart toggle per card

### 💰 Budget Tab
- Guest count slider (tap +/−)
- AI-estimated total with range
- Live category breakdown (6 categories with progress bars)
- Actual spend vs committed tracking
- Planning checklist (12 months → 1 month)

### 📅 Bookings Tab
- Status filter chips (All / Confirmed / Pending / etc.)
- Booking cards with amounts breakdown
- Cancel with confirmation alert
- Pay balance shortcut
- Navigate to full booking detail

### 👤 Profile Tab
- User avatar, name, tier badge
- Loyalty points card with tier progress bar
- Edit Profile screen
- Wishlist screen
- Notifications with read/unread state
- Loyalty & Rewards (tier system, how to earn)
- Settings (notification toggles, privacy, language)
- My Reviews

### Booking Flow (3 steps)
1. **Details** — package selector, date, guests, notes, price summary
2. **Payment** — deposit vs full pay toggle, card form, Stripe badge
3. **Confirmation** — booking ID, receipt, navigate to bookings

---

## 🗄️ Connecting a Real Backend

Currently all data is in `src/data/index.js` (mock). To connect a real API:

### 1. Create an API service layer

```javascript
// src/services/api.js
const BASE_URL = 'https://api.honeymoon.ae/v1';

export const api = {
  login: (email, password) =>
    fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(r => r.json()),

  getVendors: (params) =>
    fetch(`${BASE_URL}/vendors?${new URLSearchParams(params)}`).then(r => r.json()),

  createBooking: (token, data) =>
    fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }).then(r => r.json()),
};
```

### 2. Store JWT with AsyncStorage

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.setItem('token', jwt);
const token = await AsyncStorage.getItem('token');
```

### 3. Replace mock data in AppContext with API calls

```javascript
// In AppProvider useEffect
useEffect(() => {
  api.getBookings(token).then(data => dispatch({ type: 'SET_BOOKINGS', payload: data }));
}, [token]);
```

---

## 🔧 Environment Variables

Create a `.env` file (use `react-native-config`):

```env
API_BASE_URL=https://api.honeymoon.ae/v1
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
PAYFORT_MERCHANT_ID=xxxxx
FIREBASE_PROJECT_ID=honeymoon-app
```

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `@react-navigation/native` | Navigation container |
| `@react-navigation/bottom-tabs` | Tab bar |
| `@react-navigation/native-stack` | Stack screens |
| `react-native-linear-gradient` | Gold gradient UI |
| `react-native-safe-area-context` | iPhone notch/Dynamic Island |
| `react-native-gesture-handler` | Swipe gestures |
| `react-native-reanimated` | Smooth animations |
| `@react-native-async-storage/async-storage` | Persistent storage |
| `react-native-toast-message` | In-app notifications |
| `react-native-screens` | Native screen performance |

---

## 🚢 Publishing to App Stores

### iOS App Store
1. Open `ios/HoneyMoonApp.xcworkspace` in Xcode
2. Set team in Signing & Capabilities
3. Archive → Distribute → App Store Connect
4. Requires: **Apple Developer account** ($99/year)

### Google Play Store
1. `cd android && ./gradlew bundleRelease`
2. Sign APK/AAB with your keystore
3. Upload to Google Play Console
4. Requires: **Google Play Developer account** ($25 one-time)

---

## 🧭 What's Next

| Priority | Feature |
|----------|---------|
| 🔴 High | Backend API (Node.js + PostgreSQL) |
| 🔴 High | Real Stripe payment integration |
| 🔴 High | Firebase push notifications |
| 🟡 Medium | Arabic / RTL support |
| 🟡 Medium | UAE Pass OAuth integration |
| 🟡 Medium | Real-time vendor chat |
| 🟢 Nice | Map view for vendor locations |
| 🟢 Nice | PDF invoice download |
| 🟢 Nice | Vendor subscription screens |

---

*HoneyMoon Platform — UAE Luxury Wedding Ecosystem*
