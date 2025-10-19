/**
 * Device Configuration
 * Comprehensive device profiles for MAC, Windows, Android, and iOS
 */

const devices = {
  // Desktop Devices
  macOS: [
    {
      name: 'MacBook Pro M1',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      viewport: { width: 1440, height: 900, deviceScaleFactor: 2, isMobile: false, hasTouch: false },
      platform: 'MacIntel'
    },
    {
      name: 'MacBook Air M2',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
      viewport: { width: 1280, height: 800, deviceScaleFactor: 2, isMobile: false, hasTouch: false },
      platform: 'MacIntel'
    },
    {
      name: 'iMac 27-inch',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
      viewport: { width: 2560, height: 1440, deviceScaleFactor: 2, isMobile: false, hasTouch: false },
      platform: 'MacIntel'
    }
  ],

  windows: [
    {
      name: 'Windows 11 Desktop',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
      platform: 'Win32'
    },
    {
      name: 'Windows 10 Laptop',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 Edg/118.0.2088.76',
      viewport: { width: 1366, height: 768, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
      platform: 'Win32'
    },
    {
      name: 'Windows 11 Surface',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
      viewport: { width: 2736, height: 1824, deviceScaleFactor: 2, isMobile: false, hasTouch: true },
      platform: 'Win32'
    }
  ],

  // Mobile Devices
  android: [
    {
      name: 'Samsung Galaxy S23',
      userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
      viewport: { width: 360, height: 780, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
      platform: 'Linux armv81'
    },
    {
      name: 'Google Pixel 7 Pro',
      userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
      viewport: { width: 412, height: 915, deviceScaleFactor: 3.5, isMobile: true, hasTouch: true },
      platform: 'Linux armv81'
    },
    {
      name: 'OnePlus 11',
      userAgent: 'Mozilla/5.0 (Linux; Android 13; CPH2449) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
      viewport: { width: 412, height: 919, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
      platform: 'Linux armv81'
    },
    {
      name: 'Xiaomi 13 Pro',
      userAgent: 'Mozilla/5.0 (Linux; Android 13; 2210132C) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
      viewport: { width: 393, height: 851, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
      platform: 'Linux armv81'
    }
  ],

  iOS: [
    {
      name: 'iPhone 15 Pro Max',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 430, height: 932, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
      platform: 'iPhone'
    },
    {
      name: 'iPhone 14',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
      platform: 'iPhone'
    },
    {
      name: 'iPad Pro 12.9',
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 1024, height: 1366, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
      platform: 'iPad'
    },
    {
      name: 'iPad Air',
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
      viewport: { width: 820, height: 1180, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
      platform: 'iPad'
    }
  ]
};

/**
 * Get a random device from a specific type
 */
function getRandomDevice(deviceType) {
  const deviceList = devices[deviceType];
  if (!deviceList || deviceList.length === 0) {
    throw new Error(`Invalid device type: ${deviceType}`);
  }
  return deviceList[Math.floor(Math.random() * deviceList.length)];
}

/**
 * Get a random device from all available devices
 */
function getRandomDeviceAny() {
  const allTypes   = Object.keys(devices);
  const randomType = allTypes[Math.floor(Math.random() * allTypes.length)];
  return { ...getRandomDevice(randomType), type: randomType };
}

/**
 * Get all devices
 */
function getAllDevices() {
  const allDevices = [];
  for (const [type, deviceList] of Object.entries(devices)) {
    deviceList.forEach(device => {
      allDevices.push({ ...device, type });
    });
  }
  return allDevices;
}

module.exports = {
  devices,
  getRandomDevice,
  getRandomDeviceAny,
  getAllDevices
};

