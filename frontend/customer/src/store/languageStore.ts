import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'EN' | 'HI' | 'TA' | 'TE' | 'KN' | 'ML' | 'BN' | 'MR';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'EN',
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'language-storage',
    }
  )
);

export const translations: Record<Language, Record<string, string>> = {
  EN: {
    searchPlaceholder: "Search ShopNow.in",
    allCategories: "All Categories",
    deliverTo: "Deliver to",
    hello: "Hello",
    accountsLists: "Account & Lists",
    returns: "Returns",
    orders: "& Orders",
    cart: "Cart",
    recentSearches: "Recent Searches",
    suggestions: "Suggestions",
    remove: "Remove",
    chooseLocation: "Choose your location",
    selectLocationDesc: "Select a delivery location to see product availability and delivery options",
    defaultAddress: "Default address",
    addAddress: "Add an address or pick-up point",
    orEnterPincode: "or enter an Indian pincode",
    apply: "Apply",
    enterPincode: "Enter pincode",
    locationUpdated: "Location updated successfully!",
    failedUpdateLocation: "Failed to update location",
    yourLists: "Your Lists",
    yourAccount: "Your Account",
    addToCart: "Add to Cart",
    buyNow: "Buy Now",
  },
  HI: {
    searchPlaceholder: "ShopNow.in पर खोजें",
    allCategories: "सभी श्रेणियां",
    deliverTo: "पहुंचाएं",
    hello: "नमस्ते",
    accountsLists: "अकाउंट और सूचियां",
    returns: "रिटर्न",
    orders: "और ऑर्डर",
    cart: "कार्ट",
    recentSearches: "हाल की खोजें",
    suggestions: "सुझाव",
    remove: "हटाएं",
    chooseLocation: "अपना स्थान चुनें",
    selectLocationDesc: "उत्पाद की उपलब्धता और वितरण विकल्प देखने के लिए वितरण स्थान चुनें",
    defaultAddress: "डिफ़ॉल्ट पता",
    addAddress: "एक पता या पिक-अप बिंदु जोड़ें",
    orEnterPincode: "या एक भारतीय पिनकोड दर्ज करें",
    apply: "लागू करें",
    enterPincode: "पिनकोड दर्ज करें",
    locationUpdated: "स्थान सफलतापूर्वक अपडेट किया गया!",
    failedUpdateLocation: "स्थान अपडेट करने में विफल",
    yourLists: "आपकी सूचियां",
    yourAccount: "आपका अकाउंट",
    addToCart: "कार्ट में डालें",
    buyNow: "अभी खरीदें",
  },
  TA: { searchPlaceholder: "ShopNow.in இல் தேடுங்கள்" },
  TE: { searchPlaceholder: "ShopNow.in లో వెతకండి" },
  KN: { searchPlaceholder: "ShopNow.in ನಲ್ಲಿ ಹುಡುಕಿ" },
  ML: { searchPlaceholder: "ShopNow.in-ൽ തിരയുക" },
  BN: { searchPlaceholder: "ShopNow.in এ খুঁজুন" },
  MR: { searchPlaceholder: "ShopNow.in वर शोधा" }
};
