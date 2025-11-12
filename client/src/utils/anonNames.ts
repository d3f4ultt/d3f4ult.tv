// 4chan-style anonymous name generator
const adjectives = [
  'Based', 'Anon', 'Comfy', 'Cozy', 'Chad', 'Giga', 'Degen', 'Diamond',
  'Paper', 'Smooth', 'Wrinkly', 'Ape', 'Moon', 'Lambo', 'Wagmi', 'Ngmi',
  'Fud', 'Fomo', 'Hodl', 'Rekt', 'Pump', 'Dump', 'Bull', 'Bear',
  'Whale', 'Shrimp', 'Crab', 'Fish', 'Shark', 'Degen', 'Bobo', 'Sminem',
  'Bogdanoff', 'Pepe', 'Wojak', 'Cope', 'Seethe', 'Mald', 'Dilate', 'Sneed',
  'Kek', 'Lel', 'Top', 'Jeet', 'Saar', 'Needful', 'Gigabrain', 'Midcurve',
  'Bellcurve', 'Schizo', 'Normie', 'Newfag', 'Oldfag', 'Glowie', 'Fed',
  'Janny', 'Jannie', 'Mod', 'Based', 'Cringe', 'Redpilled', 'Bluepilled',
  'Blackpilled', 'Doomer', 'Bloomer', 'Zoomer', 'Boomer', 'Coomer'
];

const nouns = [
  'Anon', 'Fren', 'Bro', 'Chad', 'Virgin', 'Incel', 'Simp', 'Cuck',
  'Soy', 'Gigachad', 'Sigma', 'Alpha', 'Beta', 'Omega', 'Gamma', 'Delta',
  'Ape', 'Retard', 'Autist', 'Sperg', 'Schizo', 'Coomer', 'Gooner', 'Doomer',
  'Bloomer', 'Zoomer', 'Boomer', 'Wojak', 'Pepe', 'Apu', 'Groyper', 'Spurdo',
  'Gondola', 'Sminem', 'Bobo', 'Bogdanoff', 'Doge', 'Shiba', 'Moon', 'Rocket',
  'Diamond', 'Hand', 'Paper', 'Hand', 'Brain', 'Smooth', 'Wrinkle', 'Ape',
  'Whale', 'Shrimp', 'Crab', 'Fish', 'Bull', 'Bear', 'Pig', 'Snake',
  'Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Horse', 'Goat', 'Monkey',
  'Rooster', 'Dog', 'Pig', 'Snek', 'Frog', 'Toad', 'Gecko', 'Lizard'
];

// Store generated name in localStorage for persistence
const ANON_NAME_KEY = 'anon_username';

export function getAnonUsername(): string {
  // Check if we already have a name stored
  const stored = localStorage.getItem(ANON_NAME_KEY);
  if (stored) {
    return stored;
  }

  // Generate new name
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9999);

  const name = `${adj}${noun}${num}`;

  // Store for future sessions
  localStorage.setItem(ANON_NAME_KEY, name);

  return name;
}

export function clearAnonUsername(): void {
  localStorage.removeItem(ANON_NAME_KEY);
}

// Generate a new random name (useful for "roll new name" feature)
export function rollNewAnonUsername(): string {
  clearAnonUsername();
  return getAnonUsername();
}
