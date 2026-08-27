// Universal High-Quality Crop Imagery & Metadata Resolver for AgriConnect

const CROP_IMAGES_MAP = {
  // Cereals & Millets
  'barley': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop&q=80',
  'wheat': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop&q=80',
  'rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
  'paddy': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
  'maize': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&auto=format&fit=crop&q=80',
  'corn': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&auto=format&fit=crop&q=80',
  'sorghum': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop&q=80',
  'pearl millet': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop&q=80',
  'bajra': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop&q=80',
  'finger millet': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop&q=80',
  'ragi': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop&q=80',
  'foxtail millet': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop&q=80',
  'barnyard millet': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop&q=80',
  'kodo millet': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop&q=80',
  'little millet': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop&q=80',
  'proso millet': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop&q=80',
  'oats': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&auto=format&fit=crop&q=80',

  // Vegetables
  'tomato': '/images/tomato.jpg',
  'capsicum': '/images/capsicum.jpg',
  'bell pepper': '/images/capsicum.jpg',
  'chilli': '/images/chilli.jpg',
  'onion': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&auto=format&fit=crop&q=80',
  'potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=80',
  'brinjal': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&auto=format&fit=crop&q=80',
  'eggplant': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&auto=format&fit=crop&q=80',
  'beans': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&auto=format&fit=crop&q=80',
  'french beans': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&auto=format&fit=crop&q=80',
  'cluster bean': 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&auto=format&fit=crop&q=80',
  'cabbage': 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&auto=format&fit=crop&q=80',
  'cauliflower': 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400&auto=format&fit=crop&q=80',
  'carrot': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&auto=format&fit=crop&q=80',
  'radish': 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=400&auto=format&fit=crop&q=80',
  'beetroot': 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?w=400&auto=format&fit=crop&q=80',
  'okra': 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400&auto=format&fit=crop&q=80',
  'ladyfinger': 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=400&auto=format&fit=crop&q=80',
  'spinach': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&auto=format&fit=crop&q=80',
  'amaranth': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80',
  'drumstick': 'https://images.unsplash.com/photo-1592417817098-8f3d6eb222a7?w=400&auto=format&fit=crop&q=80',
  'bitter gourd': 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=400&auto=format&fit=crop&q=80',
  'bottle gourd': 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400&auto=format&fit=crop&q=80',
  'ridge gourd': 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400&auto=format&fit=crop&q=80',
  'snake gourd': 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400&auto=format&fit=crop&q=80',
  'ash gourd': 'https://images.unsplash.com/photo-1570586437503-903009b33cb7?w=400&auto=format&fit=crop&q=80',
  'pumpkin': 'https://images.unsplash.com/photo-1570586437503-903009b33cb7?w=400&auto=format&fit=crop&q=80',
  'cucumber': 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400&auto=format&fit=crop&q=80',
  'peas': 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=400&auto=format&fit=crop&q=80',
  'sweet corn': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&auto=format&fit=crop&q=80',
  'garlic': 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400&auto=format&fit=crop&q=80',
  'ginger': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&auto=format&fit=crop&q=80',

  // Fruits
  'amla': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&auto=format&fit=crop&q=80',
  'banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&auto=format&fit=crop&q=80',
  'mango': 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&auto=format&fit=crop&q=80',
  'guava': 'https://images.unsplash.com/photo-1536511135899-7a544c062c3f?w=400&auto=format&fit=crop&q=80',
  'papaya': 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=400&auto=format&fit=crop&q=80',
  'pineapple': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&auto=format&fit=crop&q=80',
  'watermelon': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&auto=format&fit=crop&q=80',
  'grapes': 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&auto=format&fit=crop&q=80',
  'pomegranate': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&auto=format&fit=crop&q=80',
  'orange': 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=400&auto=format&fit=crop&q=80',
  'lemon': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&auto=format&fit=crop&q=80',
  'coconut': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&auto=format&fit=crop&q=80',
  'ber': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&auto=format&fit=crop&q=80',

  // Pulses & Commercial
  'chickpea': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400&auto=format&fit=crop&q=80',
  'pigeon pea': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400&auto=format&fit=crop&q=80',
  'green gram': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400&auto=format&fit=crop&q=80',
  'black gram': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400&auto=format&fit=crop&q=80',
  'groundnut': 'https://images.unsplash.com/photo-1567892328127-1833d7b97368?w=400&auto=format&fit=crop&q=80',
  'soybean': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400&auto=format&fit=crop&q=80',
  'cotton': 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400&auto=format&fit=crop&q=80',
  'sugarcane': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80',
  'turmeric': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&auto=format&fit=crop&q=80',
  'coffee': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80',
  'tea': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80',
};

const CROP_EMOJI_MAP = {
  'tomato': '🍅',
  'onion': '🧅',
  'potato': '🥔',
  'brinjal': '🍆',
  'eggplant': '🍆',
  'chilli': '🌶️',
  'capsicum': '🫑',
  'bell pepper': '🫑',
  'cabbage': '🥬',
  'cauliflower': '🥦',
  'carrot': '🥕',
  'radish': '🥢',
  'beetroot': '🟣',
  'spinach': '🥬',
  'cucumber': '🥒',
  'pumpkin': '🎃',
  'beans': '🫘',
  'french beans': '🫘',
  'cluster bean': '🫘',
  'peas': '🟢',
  'sweet corn': '🌽',
  'garlic': '🧄',
  'ginger': '🫚',
  'banana': '🍌',
  'amla': '🟢',
  'mango': '🥭',
  'guava': '🍏',
  'papaya': '🍈',
  'pineapple': '🍍',
  'watermelon': '🍉',
  'grapes': '🍇',
  'pomegranate': '🍎',
  'orange': '🍊',
  'lemon': '🍋',
  'coconut': '🥥',
  'ber': '🫐',
  'rice': '🌾',
  'paddy': '🌾',
  'wheat': '🌾',
  'barley': '🌾',
  'maize': '🌽',
  'corn': '🌽',
  'sorghum': '🌾',
  'pearl millet': '🌾',
  'bajra': '🌾',
  'finger millet': '🌾',
  'ragi': '🌾',
  'foxtail millet': '🌾',
  'barnyard millet': '🌾',
  'kodo millet': '🌾',
  'little millet': '🌾',
  'proso millet': '🌾',
  'oats': '🌾',
  'chickpea': '🫘',
  'pigeon pea': '🫘',
  'green gram': '🫘',
  'black gram': '🫘',
  'groundnut': '🥜',
  'soybean': '🫘',
  'cotton': '⚪',
  'sugarcane': '🎋',
  'turmeric': '🟡',
  'coffee': '☕',
  'tea': '🍵',
  'ash gourd': '🍈',
  'bottle gourd': '🥒',
  'bitter gourd': '🥒',
  'ridge gourd': '🥒',
  'snake gourd': '🥒',
  'drumstick': '🥢',
  'amaranth': '🥬',
  'arecanut': '🌰',
  'cashew': '🥜',
  'black pepper': '⚫',
  'cardamom': '🟢',
  'clove': '🟤',
};

export function getCropImage(cropName = '') {
  if (!cropName) return '/images/veggies_crate.jpg';
  const clean = cropName.toLowerCase().trim();

  // Local verified assets first
  if (clean.includes('tomato') || clean.includes('தக்காளி')) return '/images/tomato.jpg';
  if (clean.includes('capsicum') || clean.includes('bell pepper') || clean.includes('குடைமிளகாய்')) return '/images/capsicum.jpg';
  if (clean.includes('chilli') || clean.includes('pepper') || clean.includes('மிளகாய்')) return '/images/chilli.jpg';

  // Direct map lookup
  for (const [key, url] of Object.entries(CROP_IMAGES_MAP)) {
    if (clean.includes(key)) return url;
  }

  return '/images/veggies_crate.jpg';
}

export function getCropEmoji(cropName = '') {
  if (!cropName) return '🌱';
  const clean = cropName.toLowerCase().trim();
  for (const [key, emoji] of Object.entries(CROP_EMOJI_MAP)) {
    if (clean.includes(key)) return emoji;
  }
  return '🌱';
}
