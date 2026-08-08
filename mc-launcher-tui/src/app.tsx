import React, { useState } from 'react';
import { render, Box, Text, useInput } from 'ink';


type Screen = 'menu' | 'profiles' | 'versions' | 'download';

const menuOptions = [
  { label: 'Start the game', target: 'versions' as Screen },
  { label: 'Select a profile', target: 'profiles' as Screen },
  { label: 'Exit', target: null },
];


function Menu({ onSelect }: { onSelect: (screen: Screen | null) => void }) {
  const [selected, setSelected] = useState(0);

  useInput((input, key) => {
    if (key.downArrow) {
      setSelected((prev) => (prev + 1) % menuOptions.length);
    }
    if (key.upArrow) {
      setSelected((prev) => (prev - 1 + menuOptions.length) % menuOptions.length);
    }

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

// theres nothing here right now..
// only a placeholder screen
function Placeholder({ title, onBack }: { title: string; onBack: () => void }) {
  useInput((input, key) => {
    if (key.escape) onBack();
  });

  return (
    <Box flexDirection="column" borderStyle="round" padding={1}>
      <Text bold color="yellow">{title}</Text>
      <Text dimColor>Not finished yet. Press ESC to exit.</Text>
    </Box>
  );
}

// the apps "brain"
function App() {
  // screen state. what screen are we currently showing?
  const [screen, setScreen] = useState<Screen>('menu');

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      process.exit(0); // exit the program (q or ESC)
    }
  });

  // handleSelect: updates the screen state based on the selected target.
  // and if the target is null, exits the program. (will be fixed and made so it returns back)
  function handleSelect(target: Screen | null) {
    if (target === null) {
      process.exit(0);
      return;
    }
    setScreen(target);
  }


  return (
    <Box flexDirection="column">
      {screen === 'menu' && <Menu onSelect={handleSelect} />}
      {screen === 'versions' && (
        <Placeholder title="Select a version" onBack={() => setScreen('menu')} />
      )}
      {screen === 'profiles' && (
        <Placeholder title="Select a profile" onBack={() => setScreen('menu')} />
      )}
    </Box>
  );
}

render(<App />);
