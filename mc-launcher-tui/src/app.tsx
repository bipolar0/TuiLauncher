import React, { useState } from 'react';
import { render, Box, Text, useInput } from 'ink';

// TypeScript'te "type" ile bir değerin alabileceği KESİN değerleri tanımlıyoruz.
// Bu satır şu demek: "screen" değişkeni SADECE bu 4 kelimeden biri olabilir,
// başka bir yazı (mesela yazım hatasıyla "menuu") yazarsan derleme hatası alırsın.
// Rust'taki enum'a çok benziyor.
type Screen = 'menu' | 'profiles' | 'versions' | 'download';

const menuOptions = [
  { label: 'Oyunu Başlat', target: 'versions' as Screen },
  { label: 'Profil Seç', target: 'profiles' as Screen },
  { label: 'Çıkış', target: null },
];

// Ana menü component'i. Props (dışarıdan gelen ayarlar) olarak sadece
// "bir seçenek onaylandığında ne yapılacağını" alıyor -- fonksiyonu dışarıdan
// enjekte ediyoruz, böylece bu component sadece "menüyü göstermek"ten sorumlu kalıyor.
// (onSelect: (screen: Screen | null) => void) okunuşu: "onSelect adında bir fonksiyon
// parametresi var, bu fonksiyon Screen ya da null alır, geriye bir şey döndürmez (void)"
function Menu({ onSelect }: { onSelect: (screen: Screen | null) => void }) {
  const [selected, setSelected] = useState(0);

  useInput((input, key) => {
    if (key.downArrow) {
      setSelected((prev) => (prev + 1) % menuOptions.length);
    }
    if (key.upArrow) {
      setSelected((prev) => (prev - 1 + menuOptions.length) % menuOptions.length);
    }
    // key.return = Enter tuşu. Basılınca, seçili öğenin hedefini yukarıya bildiriyoruz.
    if (key.return) {
      onSelect(menuOptions[selected].target);
    }
  });

  return (
    <Box flexDirection="column" borderStyle="round" padding={1}>
      <Text bold color="cyan">TUI Minecraft Launcher</Text>
      <Box marginTop={1} flexDirection="column">
        {menuOptions.map((option, index) => (
          <Text key={option.label} color={index === selected ? 'green' : 'white'}>
            {index === selected ? '> ' : '  '}
            {option.label}
          </Text>
        ))}
      </Box>
    </Box>
  );
}

// Basit bir "yer tutucu" ekran -- profil/sürüm seçme ekranlarını henüz yazmadık,
// şimdilik sadece "buraya geldin" yazan bir kutu gösteriyoruz.
function Placeholder({ title, onBack }: { title: string; onBack: () => void }) {
  useInput((input, key) => {
    if (key.escape) onBack(); // ESC tuşuna basınca menüye dön
  });

  return (
    <Box flexDirection="column" borderStyle="round" padding={1}>
      <Text bold color="yellow">{title}</Text>
      <Text dimColor>Henüz yapılmadı — geri dönmek için ESC'e bas.</Text>
    </Box>
  );
}

// Uygulamanın "beyni" -- şu an hangi ekranda olduğumuzu tutan ana component.
function App() {
  // screen state'i: şu an ekranda ne gösteriliyor. Başlangıçta 'menu'.
  const [screen, setScreen] = useState<Screen>('menu');

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      process.exit(0); // her yerden q veya ESC ile çıkış (menüdeyken)
    }
  });

  // handleSelect: Menu'den "hangi ekrana git" bilgisini alıp state'i günceller.
  // target null ise (Çıkış seçildiyse) programı kapatıyoruz.
  function handleSelect(target: Screen | null) {
    if (target === null) {
      process.exit(0);
      return;
    }
    setScreen(target);
  }

  // React'te "eğer X ise Y göster" yazmanın standart yolu bu -- && operatörü.
  // screen === 'menu' true ise sağındaki JSX gösterilir, değilse hiçbir şey gösterilmez.
  return (
    <Box flexDirection="column">
      {screen === 'menu' && <Menu onSelect={handleSelect} />}
      {screen === 'versions' && (
        <Placeholder title="Sürüm Seç" onBack={() => setScreen('menu')} />
      )}
      {screen === 'profiles' && (
        <Placeholder title="Profil Seç" onBack={() => setScreen('menu')} />
      )}
    </Box>
  );
}

render(<App />);
