# 🎯 Tactics Clash 2D

A modern React-based 2D tactics multiplayer game built with TypeScript and Konva.js. This project migrates from Vue.js to React using modern development tools and libraries.

## 🚀 Features

- **Turn-based tactical gameplay** with multiple unit types
- **Modern React 18** with TypeScript for type safety
- **Konva.js** for smooth 2D canvas rendering
- **Three unit types**: Warriors (melee), Archers (ranged), Mages (balanced)
- **WebRTC ready** for peer-to-peer multiplayer (foundation implemented)
- **Responsive design** with dark theme
- **Hot reload** development experience with Vite

## 🎮 How to Play

1. **Select a unit** by clicking on it (only your units during your turn)
2. **Move units** by clicking on green highlighted tiles (2 tile range)
3. **Attack enemies** by clicking on red highlighted tiles (range varies by unit type)
4. **End your turn** when finished with all actions
5. **Win** by eliminating all enemy units

### Unit Types

- **🛡️ Warriors**: Strong melee units (1 attack range, 40 damage)
- **🏹 Archers**: Ranged attackers (3 attack range, 30 damage)  
- **🔮 Mages**: Balanced magic users (1 attack range, 35 damage)

## 🛠️ Tech Stack

- **React 18** with Hooks and TypeScript
- **Vite** for fast development and building
- **Konva.js** for 2D canvas rendering
- **WebRTC** for multiplayer communication (ready for implementation)
- **CSS Custom Properties** for theming
- **ESLint + Prettier** for code quality

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/famkaliuzhnyi-web/tactics-clash-2d.git

# Navigate to project directory
cd tactics-clash-2d

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── Game.tsx        # Main game container
│   ├── GameBoard.tsx   # Konva canvas game board
│   └── GameInfo.tsx    # Game UI and information panel
├── hooks/              # Custom React hooks
│   ├── useGameState.ts # Game state management
│   └── useWebRTCMultiplayer.ts # WebRTC multiplayer (future)
├── types/              # TypeScript type definitions
│   └── game.ts         # Game-related types
├── utils/              # Utility functions
│   └── gameLogic.ts    # Core game logic and rules
└── App.tsx             # App entry point
```

## 🎨 Game Design

The game features a dark theme inspired by modern code editors:
- **Background**: Dark purple/gray tones
- **Units**: Color-coded by player with type indicators
- **UI**: Clean, modern interface with clear visual feedback
- **Responsive**: Adapts to different screen sizes

## 🔮 Future Enhancements

- [ ] **WebRTC Multiplayer**: Complete peer-to-peer implementation
- [ ] **Socket.io Alternative**: Server-based multiplayer option
- [ ] **More Unit Types**: Add specialized units with unique abilities
- [ ] **Terrain Effects**: Different tile types affecting movement/combat
- [ ] **Unit Abilities**: Special powers and cooldowns
- [ ] **Animations**: Smooth movement and combat animations
- [ ] **Sound Effects**: Audio feedback for actions
- [ ] **AI Opponents**: Computer-controlled players
- [ ] **Tournament Mode**: Bracket-style competitions

## 🧪 Development

```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit

# Development with hot reload
npm run dev
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Migrated from Vue.js to React** • Built with ❤️ using modern web technologies
