# Copilot Instructions for Tactics Clash 2D

## Project Overview

Tactics Clash 2D is a competitive multiplayer 2D tactical shooter built with Vue.js and WebRTC peer-to-peer networking. The game features real-time team-based combat, destructible environments, projectile physics, and a built-in level editor.

## Documentation Structure

- **Use `docs/` for all documentation** - General documentation, architecture guides, and API references belong in the docs directory
- **Use `docs/tasks/` for big tasks** - Complex implementation tasks and development guides should be documented in the tasks subdirectory with detailed phases, requirements, and success metrics
- **Follow existing documentation patterns** - Maintain consistency with current documentation structure and formatting

## Code Style and Approach

### Communication Style
- **Be straightforward and critical** - Provide direct, honest feedback rather than being overly agreeable
- **Focus on practical solutions** - Prioritize working code and clear implementation over excessive politeness
- **Challenge poor design decisions** - Point out potential issues and suggest better alternatives

### Code Comments
- **Avoid unnecessary comments** - Code should be self-documenting through clear variable names and function structure
- **Only add comments when absolutely necessary** - Complex algorithms, business logic edge cases, or non-obvious technical decisions
- **Remove outdated or redundant comments** - Clean up comments that don't add value

### Code Quality Standards
- Follow existing ESLint configuration (minimal rules, focus on functionality)
- Maintain Vue.js 2.x patterns and conventions
- Use ES6+ features appropriately
- Keep functions focused and single-purpose
- Prefer explicit over implicit behavior

## Technical Context

### Architecture
- **Frontend**: Vue.js 2.x with component-based architecture
- **Networking**: WebRTC peer-to-peer multiplayer (no central server)
- **Game Engine**: Custom 2D engine with 100 FPS target, 15ms tick intervals
- **Build System**: Webpack 1.x with Babel, SASS, ESLint

### Key Systems
- **Multiplayer**: Real-time synchronization between peers
- **Physics**: Projectile ballistics, destructible terrain
- **Game Logic**: Team-based combat, weapon systems, health management
- **UI**: Vue reactive components for game interface

### Development Patterns
- Components in `src/app_modules/components/`
- Models and game logic in `src/app_modules/models/`
- Controllers for game state management
- Instance definitions in `src/instances/`

## Task Implementation Guidelines

### For Large Features
1. **Document first** - Create task documentation in `docs/tasks/` before implementation
2. **Break into phases** - Divide complex features into manageable implementation phases
3. **Define success metrics** - Establish clear, measurable completion criteria
4. **Consider integration points** - Plan how new features integrate with existing multiplayer, UI, and game systems

### For Code Changes
- **Minimal viable changes** - Implement the smallest change that solves the problem
- **Test multiplayer implications** - Consider how changes affect peer-to-peer synchronization
- **Maintain performance** - Keep the 100 FPS game loop target in mind
- **Update relevant documentation** - Keep docs current with significant changes

## Common Pitfalls to Avoid

- Adding unnecessary abstraction layers
- Breaking WebRTC synchronization between peers  
- Introducing performance bottlenecks in the game loop
- Overly verbose or apologetic communication
- Adding comments that restate what the code obviously does
- Ignoring existing architectural patterns

## When to Push Back

- Requests for excessive comments or documentation
- Suggestions that compromise game performance
- Changes that break multiplayer synchronization
- Overly complex solutions when simple ones exist
- Requests to be "nicer" rather than technically accurate