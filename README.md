# Ideal Mobile

A modern furniture ecommerce mobile application built with Expo and React Native.

## Table of Contents

- [About](#about)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the App](#running-the-app)
- [Building for Production](#building-for-production)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## About

Ideal Mobile is an Expo React Native ecommerce application for buying furniture online, featuring product browsing, cart management, and order tracking.

## Features

- **Product Catalog**: Browse furniture collections with search and filters
- **Product Details**: View detailed product information, images, and specifications
- **Shopping Cart**: Add/remove items and manage quantities
- **User Authentication**: Sign up, login, and profile management
- **Order Management**: Place orders and track order status
- **Wishlist**: Save favorite products for later
- **Categories**: Browse by furniture categories (chairs, tables, beds, etc.)
- **Search & Filters**: Search products by name, price range, and category
- **Payment Integration**: Secure checkout process
- **Order History**: View past orders and order details
- **Push Notifications**: Order updates and promotional offers
- **Multi-platform Support**: iOS and Android compatibility

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **Expo Go** app on your mobile device (for testing)
- **Android Studio** (optional, for Android emulator)
- **Xcode** (optional, for iOS simulator - macOS only)
- **Git**

### Development Options

#### Physical Device Testing
- Install **Expo Go** from App Store (iOS) or Google Play Store (Android)
- Ensure your device and development machine are on the same network

#### Emulator/Simulator Testing
- **Android**: Android Studio with AVD
- **iOS**: Xcode with iOS Simulator (macOS only)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/0097eo/ideal-mobile.git
   cd ideal-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Install Expo CLI** (if not already installed)
   ```bash
   npm install -g @expo/cli
   ```

4. **Verify Expo installation**
   ```bash
   expo --version
   ```

## Configuration

### Expo Configuration

Update your `app.json` or `app.config.js` with your specific configuration:

```json
{
  "expo": {
    "name": "ideal-mobil",
    "slug": "ideal-mobile",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "privacy": "public"
  }
}
```

## Running the App

### Development Mode

1. **Start Expo development server**
   ```bash
   expo start
   # or
   npx expo start
   ```

2. **Run on physical device**
   - Scan the QR code with Expo Go app (Android)
   - Scan the QR code with Camera app (iOS)

3. **Run on emulator/simulator**
   ```bash
   # Android emulator
   expo start --android
   
   # iOS simulator
   expo start --ios
   
   # Web browser
   expo start --web
   ```

### Device-specific Commands

```bash
# Start with specific options
expo start --tunnel  # Use tunnel connection
expo start --lan     # Use LAN connection
expo start --localhost # Use localhost connection

# Clear cache
expo start --clear

# Start in production mode
expo start --no-dev --minify
```

## Building for Production

### EAS Build (Recommended)

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS**
   ```bash
   eas build:configure
   ```

3. **Build for Android**
   ```bash
   # APK for internal testing
   eas build --platform android --profile preview
   
   # AAB for Google Play Store
   eas build --platform android --profile production
   ```

4. **Build for iOS**
   ```bash
   # Development build
   eas build --platform ios --profile development
   
   # App Store build
   eas build --platform ios --profile production
   ```

### Classic Build (Legacy)

```bash
# Build APK
expo build:android

# Build IPA
expo build:ios

# Check build status
expo build:status
```

### Local Development Builds

```bash
# Create development build
expo run:android
expo run:ios

# Install development build on device
expo install --fix
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests (with Detox)
npm run test:e2e

# Expo specific testing
expo doctor  # Check for common issues
```

### Testing Commands

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Linting
npm run lint

# Type checking
npm run type-check
```

## API Documentation

The app integrates with the following APIs:

- **Products API**: Furniture catalog and inventory management
- **User Authentication API**: User registration, login, and profile management
- **Cart API**: Shopping cart operations
- **Orders API**: Order creation and tracking
- **Payment Gateway**: Secure payment processing
- **Notifications API**: Push notifications for order updates

API documentation is available at: `https://github.com/0097eo/Eshop`

### Authentication

The app uses JWT-based authentication. Include the following headers in API requests:

```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

## Troubleshooting

### Common Issues

#### Expo Development Server Issues
```bash
# Clear Expo cache
expo start --clear

# Reset Metro cache
expo r --clear

# Check for Expo issues
expo doctor
```

#### Network Connection Issues
```bash
# Use tunnel connection for network issues
expo start --tunnel

# Use LAN connection
expo start --lan

# Check network connectivity
expo start --localhost
```

#### Build Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules && npm install

# Update Expo CLI
npm install -g @expo/cli@latest

# Check Expo SDK compatibility
expo install --fix
```

#### Device Connection Issues
- Ensure device and computer are on same network
- Try switching between LAN, tunnel, and localhost connections
- Restart Expo Go app on device
- Check firewall settings

### EAS Build Issues
```bash
# Check EAS build status
eas build:list

# View build logs
eas build:view [BUILD_ID]

# Clear EAS credentials
eas credentials
```

### Performance Issues

- Use Expo's built-in performance monitoring
- Optimize high-resolution furniture images with `expo-image`
- Monitor bundle size with `expo-bundle-analyzer` 
- Use lazy loading for large product catalogs

### Debugging

- Use Expo DevTools for debugging
- Use Flipper with development builds for network inspection


## Contributing

We welcome contributions to the app! Please follow these guidelines:

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and ensure they pass
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards

- Follow Expo and React Native best practices
- Use TypeScript for type safety
- Maintain consistent code formatting (Prettier)
- Write meaningful commit messages
- Include tests for new features
- Update documentation as needed
- Follow Expo's SDK upgrade guidelines

### Pull Request Process

- Ensure your PR has a clear description
- Include screenshots for UI changes
- Verify all tests pass
- Request reviews from team members
- Address feedback promptly

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

- **Documentation**: [Internal Wiki](https://wiki.company.com/xpo-app)
- **Issue Tracker**: [GitHub Issues](https://github.com/your-organization/xpo-furniture-app/issues)
- **Team Chat**: #xpo-mobile-dev
- **Email**: mobile-team@company.com

### Getting Help

- Check existing issues before creating new ones
- Provide detailed reproduction steps
- Include device/OS information
- Attach relevant logs and screenshots
- Use appropriate issue labels

---
