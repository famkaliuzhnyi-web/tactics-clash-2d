# Tactics Clash 2D - Documentation

This directory contains comprehensive documentation for the Tactics Clash 2D multiplayer game.

## Documentation Structure

- [Multiplayer Architecture](./multiplayer-architecture.md) - Overview of the multiplayer system design
- [WebRTC Networking](./webrtc-networking.md) - Peer-to-peer connection implementation
- [Game Session Management](./game-session-management.md) - How game sessions are controlled
- [Real-time Synchronization](./realtime-synchronization.md) - Game state synchronization mechanisms
- [Client-Server Communication](./client-server-communication.md) - Message protocol and data flow
- [Game Engine](./game-engine.md) - Core game loop and mechanics

## Quick Start

1. **Server Setup**: One player creates a server instance that generates a unique WebRTC peer ID
2. **Client Connection**: Other players connect using the peer ID
3. **Team Selection**: Players choose teams (Red vs Blue) and weapons
4. **Game Start**: Game begins when both teams have at least one player
5. **Real-time Gameplay**: 100 FPS game engine with destructible environment and projectile physics

## Key Features

- **WebRTC Peer-to-Peer**: No central server required, browser-to-browser connections
- **Real-time Multiplayer**: 15ms tick intervals for smooth gameplay
- **Team-based Combat**: Red vs Blue team mechanics
- **Destructible Environment**: Dynamic level destruction
- **Projectile Physics**: Full ballistic simulation (no hitscan)
- **Level Editor**: Built-in map creation tools
- **Vue.js UI**: Reactive user interface framework