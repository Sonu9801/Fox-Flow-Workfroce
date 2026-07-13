export const languages = ["English (US)", "Hindi (हिन्दी)", "Marathi (मराठी)", "Gujarati (ગુજરાતી)", "Bengali (বাংলা)", "Tamil (தமிழ்)", "Telugu (తెలుగు)", "Kannada (ಕನ್ನಡ)"];

const translations: Record<string, Record<string, string>> = {
  "Hindi (हिन्दी)": {
    "Home": "होम",
    "My Jobs": "मेरे काम",
    "Attendance": "हाजिरी",
    "Profile": "प्रोफ़ाइल",
    "Punch In": "पंच इन",
    "Punch Out": "पंच आउट",
    "Good Morning": "सुप्रभात",
    "Good Afternoon": "शुभ दोपहर",
    "Good Evening": "शुभ संध्या",
    "App Settings": "ऐप सेटिंग्स",
    "Help & Support": "मदद और सपोर्ट",
    "My Profile": "मेरी प्रोफ़ाइल",
    "Attendance History": "हाजिरी का इतिहास",
    "Logout": "लॉग आउट",
    "General Shift": "सामान्य शिफ्ट"
  },
  "Marathi (मराठी)": {
    "Home": "मुख्यपृष्ठ",
    "My Jobs": "माझी कामे",
    "Attendance": "हजेरी",
    "Profile": "प्रोफाइल",
    "Punch In": "पंच इन",
    "Punch Out": "पंच आउट",
    "Good Morning": "शुभ प्रभात",
    "Good Afternoon": "शुभ दुपार",
    "Good Evening": "शुभ संध्याकाळ",
    "App Settings": "अॅप सेटिंग्ज",
    "Help & Support": "मदत आणि सपोर्ट",
    "My Profile": "माझी प्रोफाइल",
    "Attendance History": "हजेरी इतिहास",
    "Logout": "लॉग आउट",
    "General Shift": "सामान्य शिफ्ट"
  },
  "Gujarati (ગુજરાતી)": {
    "Home": "મુખ્ય પૃષ્ઠ",
    "My Jobs": "મારા કામ",
    "Attendance": "હાજરી",
    "Profile": "પ્રોફાઇલ",
    "Punch In": "પંચ ઇન",
    "Punch Out": "પંચ આઉટ",
    "Good Morning": "શુભ સવાર",
    "Good Afternoon": "શુભ બપોર",
    "Good Evening": "શુભ સાંજ",
    "App Settings": "એપ સેટિંગ્સ",
    "Help & Support": "મદદ અને આધાર",
    "My Profile": "મારી પ્રોફાઇલ",
    "Attendance History": "હાજરી ઇતિહાસ",
    "Logout": "લૉગ આઉટ",
    "General Shift": "સામાન્ય શિફ્ટ"
  }
};

export function getTranslation(langIndex: number, text: string): string {
  if (langIndex === 0) return text; // Default English
  const langKey = languages[langIndex];
  if (langKey && translations[langKey] && translations[langKey][text]) {
    return translations[langKey][text];
  }
  return text; // Fallback to English
}
