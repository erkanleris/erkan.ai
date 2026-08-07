const fs = require('fs');

const path = 'artifacts/erkan-ai/src/lib/i18n.tsx';
let content = fs.readFileSync(path, 'utf8');

const additions = {
  syrian: '    themeTitle: "تخصيص المظهر",\n    themeSub: "غير الألوان والشكل",\n    themeDesc: "اختار المظهر اللي بيناسبك أو صمم مظهر خاص فيك",\n    themeDark: "داكن",\n    themeAmoled: "أسود AMOLED",\n    themeLight: "فاتح",\n    themePurple: "بنفسجي",\n    themeBlue: "أزرق",\n    themeCyan: "سماوي",\n    themeGreen: "أخضر",\n    themeEmerald: "زمردي",\n    themeYellow: "أصفر",\n    themeOrange: "برتقالي",\n    themeRed: "أحمر",\n    themePink: "زهري",\n    themeRose: "وردي",\n    themeCustom: "مخصص",\n    themeCustomTitle: "تخصيص الألوان",\n    customBg: "الخلفية",\n    customPrimary: "اللون الأساسي",\n    customSecondary: "اللون الثانوي",\n    customSurface: "لون البطاقات",\n    customText: "النص الأساسي",\n    customTextMuted: "النص الباهت",\n    themeCustomWarning: "انتبه: الألوان المخصصة ممكن تأثر على وضوح القراءة. جرب الألوان الفاتحة مع خلفية غامقة.",\n    comingSoon: "هالميزة جاية قريباً!",\n    menuCamera: "كاميرا",\n    menuGallery: "معرض الصور",\n    menuDocs: "مستندات",\n    menuPDF: "ملفات PDF",\n    menuAudio: "صوتيات",\n    menuVideo: "فيديو",\n    menuPhoto: "التقاط صورة",\n    menuGenImg: "توليد صورة بالذكاء",\n    menuAnalyzeImg: "تحليل صورة",\n    menuAnalyzeFile: "تحليل ملف",\n    menuOCR: "استخراج النص",\n    menuQR: "مسح QR",\n    menuTranslate: "ترجمة",\n    menuCode: "محرر أكواد",\n    menuNotes: "ملاحظات",\n    menuCalc: "حاسبة",\n    menuCalendar: "تقويم",\n    menuContacts: "جهات الاتصال",\n    menuLocation: "الموقع",\n    menuWeb: "بحث ويب",\n    menuVoice: "تسجيل صوتي",\n    menuTable: "إنشاء جدول",\n    menuChart: "إنشاء رسم بياني",\n    menuDraw: "رسم",\n    menuMore: "المزيد",',
  egyptian: '    themeTitle: "تخصيص المظهر",\n    themeSub: "غير الألوان والشكل",\n    themeDesc: "اختار المظهر اللي يناسبك أو صمم مظهر خاص بيك",\n    themeDark: "داكن",\n    themeAmoled: "أسود AMOLED",\n    themeLight: "فاتح",\n    themePurple: "بنفسجي",\n    themeBlue: "أزرق",\n    themeCyan: "سماوي",\n    themeGreen: "أخضر",\n    themeEmerald: "زمردي",\n    themeYellow: "أصفر",\n    themeOrange: "برتقالي",\n    themeRed: "أحمر",\n    themePink: "بمبي",\n    themeRose: "وردي",\n    themeCustom: "مخصص",\n    themeCustomTitle: "تخصيص الألوان",\n    customBg: "الخلفية",\n    customPrimary: "اللون الأساسي",\n    customSecondary: "اللون الثانوي",\n    customSurface: "لون البطاقات",\n    customText: "النص الأساسي",\n    customTextMuted: "النص الباهت",\n    themeCustomWarning: "خلي بالك: الألوان المخصصة ممكن تأثر على وضوح القراءة. جرب الألوان الفاتحة مع خلفية غامقة.",\n    comingSoon: "الميزة دي جاية قريب!",\n    menuCamera: "كاميرا",\n    menuGallery: "معرض الصور",\n    menuDocs: "مستندات",\n    menuPDF: "ملفات PDF",\n    menuAudio: "صوتيات",\n    menuVideo: "فيديو",\n    menuPhoto: "التقاط صورة",\n    menuGenImg: "توليد صورة بالذكاء",\n    menuAnalyzeImg: "تحليل صورة",\n    menuAnalyzeFile: "تحليل ملف",\n    menuOCR: "استخراج النص",\n    menuQR: "مسح QR",\n    menuTranslate: "ترجمة",\n    menuCode: "محرر أكواد",\n    menuNotes: "ملاحظات",\n    menuCalc: "حاسبة",\n    menuCalendar: "نتيجة",\n    menuContacts: "جهات الاتصال",\n    menuLocation: "الموقع",\n    menuWeb: "بحث ويب",\n    menuVoice: "تسجيل صوتي",\n    menuTable: "إنشاء جدول",\n    menuChart: "إنشاء رسم بياني",\n    menuDraw: "رسم",\n    menuMore: "المزيد",',
  saudi: '    themeTitle: "تخصيص المظهر",\n    themeSub: "غير الألوان والشكل",\n    themeDesc: "اختر المظهر اللي يناسبك أو صمم مظهر خاص فيك",\n    themeDark: "داكن",\n    themeAmoled: "أسود AMOLED",\n    themeLight: "فاتح",\n    themePurple: "بنفسجي",\n    themeBlue: "أزرق",\n    themeCyan: "سماوي",\n    themeGreen: "أخضر",\n    themeEmerald: "زمردي",\n    themeYellow: "أصفر",\n    themeOrange: "برتقالي",\n    themeRed: "أحمر",\n    themePink: "وردي",\n    themeRose: "زهري",\n    themeCustom: "مخصص",\n    themeCustomTitle: "تخصيص الألوان",\n    customBg: "الخلفية",\n    customPrimary: "اللون الأساسي",\n    customSecondary: "اللون الثانوي",\n    customSurface: "لون البطاقات",\n    customText: "النص الأساسي",\n    customTextMuted: "النص الباهت",\n    themeCustomWarning: "تنبيه: الألوان المخصصة ممكن تأثر على وضوح القراءة. جرب الألوان الفاتحة مع خلفية غامقة.",\n    comingSoon: "هالميزة جاية قريب!",\n    menuCamera: "كاميرا",\n    menuGallery: "معرض الصور",\n    menuDocs: "مستندات",\n    menuPDF: "ملفات PDF",\n    menuAudio: "صوتيات",\n    menuVideo: "فيديو",\n    menuPhoto: "التقاط صورة",\n    menuGenImg: "توليد صورة بالذكاء",\n    menuAnalyzeImg: "تحليل صورة",\n    menuAnalyzeFile: "تحليل ملف",\n    menuOCR: "استخراج النص",\n    menuQR: "مسح QR",\n    menuTranslate: "ترجمة",\n    menuCode: "محرر أكواد",\n    menuNotes: "ملاحظات",\n    menuCalc: "حاسبة",\n    menuCalendar: "تقويم",\n    menuContacts: "جهات الاتصال",\n    menuLocation: "الموقع",\n    menuWeb: "بحث ويب",\n    menuVoice: "تسجيل صوتي",\n    menuTable: "إنشاء جدول",\n    menuChart: "إنشاء رسم بياني",\n    menuDraw: "رسم",\n    menuMore: "المزيد",',
  jordanian: '    themeTitle: "تخصيص المظهر",\n    themeSub: "غير الألوان والشكل",\n    themeDesc: "اختار المظهر اللي بيناسبك أو صمم مظهر خاص إلك",\n    themeDark: "داكن",\n    themeAmoled: "أسود AMOLED",\n    themeLight: "فاتح",\n    themePurple: "بنفسجي",\n    themeBlue: "أزرق",\n    themeCyan: "سماوي",\n    themeGreen: "أخضر",\n    themeEmerald: "زمردي",\n    themeYellow: "أصفر",\n    themeOrange: "برتقالي",\n    themeRed: "أحمر",\n    themePink: "زهري",\n    themeRose: "وردي",\n    themeCustom: "مخصص",\n    themeCustomTitle: "تخصيص الألوان",\n    customBg: "الخلفية",\n    customPrimary: "اللون الأساسي",\n    customSecondary: "اللون الثانوي",\n    customSurface: "لون البطاقات",\n    customText: "النص الأساسي",\n    customTextMuted: "النص الباهت",\n    themeCustomWarning: "انتبه: الألوان المخصصة ممكن تأثر على وضوح القراءة. جرب الألوان الفاتحة مع خلفية غامقة.",\n    comingSoon: "هالميزة جاية قريباً!",\n    menuCamera: "كاميرا",\n    menuGallery: "معرض الصور",\n    menuDocs: "مستندات",\n    menuPDF: "ملفات PDF",\n    menuAudio: "صوتيات",\n    menuVideo: "فيديو",\n    menuPhoto: "التقاط صورة",\n    menuGenImg: "توليد صورة بالذكاء",\n    menuAnalyzeImg: "تحليل صورة",\n    menuAnalyzeFile: "تحليل ملف",\n    menuOCR: "استخراج النص",\n    menuQR: "مسح QR",\n    menuTranslate: "ترجمة",\n    menuCode: "محرر أكواد",\n    menuNotes: "ملاحظات",\n    menuCalc: "حاسبة",\n    menuCalendar: "تقويم",\n    menuContacts: "جهات الاتصال",\n    menuLocation: "الموقع",\n    menuWeb: "بحث ويب",\n    menuVoice: "تسجيل صوتي",\n    menuTable: "إنشاء جدول",\n    menuChart: "إنشاء رسم بياني",\n    menuDraw: "رسم",\n    menuMore: "المزيد",',
  turkish: '    themeTitle: "Görünümü Özelleştir",\n    themeSub: "Renkleri ve temayı değiştir",\n    themeDesc: "Size uygun temayı seçin veya kendi temanızı tasarlayın",\n    themeDark: "Karanlık",\n    themeAmoled: "AMOLED Siyahı",\n    themeLight: "Aydınlık",\n    themePurple: "Mor",\n    themeBlue: "Mavi",\n    themeCyan: "Cam Göbeği",\n    themeGreen: "Yeşil",\n    themeEmerald: "Zümrüt",\n    themeYellow: "Sarı",\n    themeOrange: "Turuncu",\n    themeRed: "Kırmızı",\n    themePink: "Pembe",\n    themeRose: "Gül",\n    themeCustom: "Özel",\n    themeCustomTitle: "Renkleri Özelleştir",\n    customBg: "Arka Plan",\n    customPrimary: "Birincil Renk",\n    customSecondary: "İkincil Renk",\n    customSurface: "Kart Rengi",\n    customText: "Ana Metin",\n    customTextMuted: "Soluk Metin",\n    themeCustomWarning: "Uyarı: Özel renkler okunabilirliği etkileyebilir. Koyu arka planla açık renkler deneyin.",\n    comingSoon: "Bu özellik yakında geliyor!",\n    menuCamera: "Kamera",\n    menuGallery: "Galeri",\n    menuDocs: "Belgeler",\n    menuPDF: "PDF Dosyaları",\n    menuAudio: "Sesler",\n    menuVideo: "Video",\n    menuPhoto: "Fotoğraf Çek",\n    menuGenImg: "Yapay Zeka ile Görsel Üret",\n    menuAnalyzeImg: "Görsel Analizi",\n    menuAnalyzeFile: "Dosya Analizi",\n    menuOCR: "Metin Çıkar",\n    menuQR: "QR Tara",\n    menuTranslate: "Çeviri",\n    menuCode: "Kod Editörü",\n    menuNotes: "Notlar",\n    menuCalc: "Hesap Makinesi",\n    menuCalendar: "Takvim",\n    menuContacts: "Kişiler",\n    menuLocation: "Konum",\n    menuWeb: "Web Arama",\n    menuVoice: "Ses Kaydı",\n    menuTable: "Tablo Oluştur",\n    menuChart: "Grafik Oluştur",\n    menuDraw: "Çizim",\n    menuMore: "Daha Fazla",'
};

let newContent = content;
const keys = ['syrian', 'egyptian', 'saudi', 'jordanian', 'turkish'];

for (const key of keys) {
  const marker = key + ": {";
  const parts = newContent.split(marker);
  if (parts.length > 1) {
    let section = parts[1];
    const indexOfSub = section.indexOf("langMenuSub:");
    if (indexOfSub > -1) {
      const endOfLine = section.indexOf("\\n", indexOfSub);
      section = section.slice(0, endOfLine + 1) + additions[key] + "\\n" + section.slice(endOfLine + 1);
      parts[1] = section;
      newContent = parts.join(marker);
    }
  }
}

// Now handle the missing Turkish keys:
const missingTurkishAdditions = `
    upgradeNow: "Hemen Yükselt",
    tryAgain: "Tekrar Dene",
    usernameLabel: "Kullanıcı Adı",
    bioLabel: "Hakkımda (Biyografi)",
    transAction: "Metni İngilizceye çevir: ",
    analyzeAction: "Lütfen bu dosyayı/resmi detaylı olarak analiz et: ",
    sugWrite1: "Profesyonel bir e-posta yaz...",
    sugWrite2: "İlgi çekici bir blog yazısı hazırla...",
    sugWrite3: "Proje planı için bir taslak oluştur...",
    sugWrite4: "Şirket için bir vizyon yaz...",
    sugSum1: "Bu makaleyi üç cümlede özetle...",
    sugSum2: "Bu PDF'in ana noktalarını çıkar...",
    sugSum3: "Toplantı notlarını kısa bir rapora dönüştür...",
    sugSum4: "Kitabın bu bölümünün özetini yap...",
    sugIdeas1: "Pazarlama kampanyası için yenilikçi fikirler...",
    sugIdeas2: "Uygulama için 5 yeni özellik önerisi...",
    sugIdeas3: "Youtube videosu için içerik fikirleri...",
    sugIdeas4: "Etkinlik tasarımı için yaratıcı konseptler...",
    sugImg1: "Geleceğin şehrini resmet...",
    sugImg2: "Siberpunk tarzında bir kedi...",
    sugImg3: "Fantastik bir manzarada gün batımı...",
    sugImg4: "Minimalist bir kafe tasarımı...",
    sugChat1: "Bana yapay zeka hakkında bilgi ver...",
    sugChat2: "Python programlama diline nasıl başlarım?",
    sugChat3: "Kuantum bilgisayarları basitçe açıkla...",
    sugChat4: "Gelecek teknolojileri nelerdir?",
    planProSub: "Profesyoneller için gelişmiş yapay zeka deneyimi",
    planProMaxSub: "Sınır tanımayan nihai yapay zeka gücü",
    planProMaxBadge: "EN İYİ",
    planFreeFeat1: "Günlük 10 standart mesaj",
    planFreeFeat2: "Temel yapay zeka modeli",
    planFreeFeat3: "Sınırlı dil desteği",
    planFreeFeat4: "Standart yanıt hızı",
    planProFeat1: "Sınırsız mesajlaşma",
    planProFeat2: "Gelişmiş yapay zeka modeli (GPT-4 / Claude 3)",
    planProFeat3: "Tüm diller ve lehçeler açık",
    planProFeat4: "Daha hızlı yanıt süresi",
    planProFeat5: "Sesli mesaj desteği",
    planProFeat6: "Gelişmiş görsel oluşturma (Sınırlı)",
    planProMaxFeat1: "Pro planındaki her şey",
    planProMaxFeat2: "En yeni ve en güçlü modeller (GPT-4 Omni, Opus vb.)",
    planProMaxFeat3: "Öncelikli süper hızlı yanıt",
    planProMaxFeat4: "Sınırsız görsel oluşturma",
    planProMaxFeat5: "Uzun belge ve PDF analizi",
    planProMaxFeat6: "Video analizi ve işleme",
    planProMaxFeat7: "Akıllı görsel okuma (OCR+)",
    planProMaxFeat8: "Özel karakterler ve kişilikler oluşturma",
    planProMaxFeat9: "Kod yazma ve hata ayıklama (İleri düzey)",
    planProMaxFeat10: "Canlı internet erişimi",
    planProMaxFeat11: "Reklamsız özel arayüz",
    planProMaxFeat12: "7/24 öncelikli VIP destek",`;

const tParts = newContent.split("turkish: {");
if (tParts.length > 1) {
  const insertIndex = tParts[1].indexOf("\\n");
  tParts[1] = tParts[1].slice(0, insertIndex + 1) + missingTurkishAdditions + "\\n" + tParts[1].slice(insertIndex + 1);
  newContent = tParts.join("turkish: {");
}

fs.writeFileSync(path, newContent);
console.log('done');
