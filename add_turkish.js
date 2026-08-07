const fs = require('fs');

const turkishTranslations = {
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
  planProMaxFeat12: "7/24 öncelikli VIP destek"
};

let content = fs.readFileSync('artifacts/erkan-ai/src/lib/i18n.tsx', 'utf8');

const turkishStart = content.indexOf('turkish: {');
const turkishEnd = content.indexOf('},', turkishStart);
let turkishBlock = content.slice(turkishStart, turkishEnd);

let newLines = [];
for (const [k, v] of Object.entries(turkishTranslations)) {
  newLines.push("    " + k + ': "' + v + '",');
}

turkishBlock = turkishBlock + '\n' + newLines.join('\n');
content = content.slice(0, turkishStart) + turkishBlock + content.slice(turkishEnd);

fs.writeFileSync('artifacts/erkan-ai/src/lib/i18n.tsx', content, 'utf8');
console.log('done');
