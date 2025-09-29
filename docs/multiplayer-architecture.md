# Multiplayer Architecture

Tactics Clash 2D implements a **peer-to-peer (P2P) multiplayer architecture** using WebRTC technology. This design eliminates the need for dedicated game servers, allowing players to host games directly from their browsers.

## Architecture Overview

```
┌─────────────────┐         WebRTC P2P         ┌─────────────────┐
│  Client Player  │◄──────────────────────────►│  Server Player  │
│                 │                             │   (Host)        │
│ ClientController│                             │ ServerController│
│                 │         Real-time           │                 │
│   Game View     │◄────── Synchronization ────┤  Game Engine    │
└─────────────────┘                             └─────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │  Other Clients  │
                                                │   Connected     │
                                                │   via WebRTC    │
                                                └─────────────────┘
```

## Core Components

### 1. Host-Client Model
- **One player acts as a "Server"**: Runs the authoritative game engine
- **Other players are "Clients"**: Send input and receive game state updates
- **No dedicated server**: The host player's browser serves as the game server

### 2. Key Controllers

#### ServerController (`src/app_modules/controllers/server.controller.js`)
- Manages the authoritative game state
- Handles client connections via WebRTC
- Runs the game engine at 15ms intervals
- Validates and processes client inputs
- Broadcasts game updates to all clients

#### ClientController (`src/app_modules/controllers/client.controller.js`)
- Connects to server using WebRTC peer ID
- Sends player inputs (movement, shooting, etc.)
- Receives and applies game state updates
- Handles local game rendering

#### GameController (`src/app_modules/controllers/game.controller.js`)
- Core game engine running at ~67 FPS (15ms ticks)
- Physics simulation for actors and projectiles
- Collision detection and game mechanics
- Only runs on the server/host player

## Connection Flow

### 1. Server Creation
```javascript
// Server player creates a peer connection
this.server = server; // WebRTC peer instance
this.publicKey = server.peer.id; // Unique connection ID
```

### 2. Client Connection
```javascript
// Client connects using server's peer ID
this.client.connect(this.serverKey);
```

### 3. Player Registration
```javascript
// Client registers with team and weapon selection
this.client.send({
    action: 'registerPlayer',
    data: {
        name: this.playerName,
        weapon: this.chosenWeapon,
        team: this.activeTeam
    }
});
```

## Advantages of P2P Architecture

### ✅ Benefits
- **Zero Infrastructure Cost**: No dedicated servers required
- **Low Latency**: Direct connections between players
- **Easy Deployment**: Runs entirely in browsers
- **Scalable**: Each game instance is independent

### ❌ Limitations
- **Host Dependency**: Game ends if host disconnects
- **Performance Bound**: Limited by host's hardware
- **Network Requirements**: All players need direct connectivity
- **Cheating Potential**: Host has authoritative control

## Network Topology

```
Host Player (Server)
        │
        ├─── Client 1 (WebRTC)
        ├─── Client 2 (WebRTC)  
        ├─── Client 3 (WebRTC)
        └─── Client N (WebRTC)
```

The host maintains individual WebRTC connections with each client player, creating a star topology where all communication flows through the host.

## Game States

The multiplayer system operates through distinct states:

1. **Lobby**: Waiting for players to join teams
2. **Play**: Active gameplay with real-time synchronization  
3. **Finish**: Game over, showing results

Each state transition is managed by the `GameSessionController` and synchronized across all clients.

## Performance Characteristics

- **Tick Rate**: 15ms (≈67 FPS) for game logic
- **Update Frequency**: Real-time WebRTC data channels
- **Tested Capacity**: Up to 8 simultaneous players
- **Latency**: Sub-50ms for local network connections

This architecture provides a smooth, responsive multiplayer experience while keeping the technical complexity manageable for a browser-based game.