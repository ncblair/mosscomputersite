export const icons = [
  { id: 'star', name: 'Star', src: 'assets/star.svg' },
  { id: 'river', name: 'River stone', src: 'assets/river.svg' },
  { id: 'fieldstone', name: 'Solid fieldstone', src: 'assets/fieldstone.svg' },
  { id: 'river-solid', name: 'Solid river stone', src: 'assets/river-solid.svg' },
  { id: 'trunk', name: 'Tree trunk', src: 'assets/trunk.svg', fullHeight: true },
  { id: 'computer-thin', name: 'Computer / thin (2)', src: 'assets/computer-thin.svg' },
  { id: 'computer', name: 'Computer / medium (3.5)', src: 'assets/computer.svg' },
  { id: 'computer-heavy', name: 'Computer / heavy (6)', src: 'assets/computer-heavy.svg' },
  { id: 'computer-solid', name: 'Computer / filled', src: 'assets/computer-solid.svg' },
  { id: 'computer-thin-surface', name: 'Thin / surface growth, slower', src: 'assets/computer-thin.svg', fillInterior: true, spreadRate: .45 },
  { id: 'computer-image-1', name: 'Your computer / dark screen', src: 'assets/computer-image-1.png' },
  { id: 'computer-image-2', name: 'Your computer / light screen', src: 'assets/computer-image-2.png' },
];

export const defaultIcon = icons.find(icon => icon.id === 'computer-image-1');
