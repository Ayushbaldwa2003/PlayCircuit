# Multiplayer Gaming Site: 100 Small Steps

This roadmap is designed for building your site from scratch with Node.js, Express, WebSocket, MongoDB, EJS, and vanilla JavaScript. Follow the steps in order. Each step is intentionally small so you can build with confidence.

## Phase 1: Project Setup

1. Create the project folder and initialize it with `npm init -y`.
2. Rename the project in `package.json` to something clear like `multiplayer-gaming-site`.
3. Set `"main"` to `server.js` instead of `index.js`.
4. Create a `.gitignore` file for `node_modules`, `.env`, logs, and OS files.
5. Create the base folders: `config`, `src`, `routes`, `views`, `public`, `tests`, `docs`.
6. Install core dependencies: `express`, `mongoose`, `dotenv`, `cookie-parser`, `express-session`, `bcryptjs`.
7. Install realtime and utility dependencies: `ws` or `socket.io`, `connect-mongo`, `morgan`, `helmet`, `compression`.
8. Install development dependencies: `nodemon` and a test runner such as `jest`.
9. Add scripts in `package.json` for `dev`, `start`, and `test`.
10. Create `server.js` as the entry point that starts the HTTP server.

## Phase 2: App Foundation

11. Create `app.js` to configure Express separately from the server startup.
12. In `app.js`, enable `express.urlencoded()` and `express.json()`.
13. Add `cookie-parser` middleware.
14. Add `helmet` middleware for basic security headers.
15. Add `compression` middleware for faster responses.
16. Add `morgan` for development request logging.
17. Set the view engine to `ejs`.
18. Point Express to the `views` folder.
19. Expose the `public` folder with `express.static()`.
20. Export the configured app from `app.js`.

## Phase 3: Environment and Database

21. Create a `.env` file for local secrets and config.
22. Create `.env.example` with placeholder values for future setup.
23. Add `PORT`, `MONGO_URI`, `SESSION_SECRET`, and `NODE_ENV` to the env files.
24. Create `config/env.js` to read and validate environment variables.
25. Create `config/db.js` to connect to MongoDB using Mongoose.
26. Call the DB connection before starting the server.
27. Log a clear success message when MongoDB connects.
28. Log a clear error message and exit if DB connection fails.
29. Create `config/session.js` for shared session configuration.
30. Store sessions in MongoDB with `connect-mongo`.

## Phase 4: Folder Structure and Conventions

31. Inside `src`, create `modules`, `middlewares`, `services`, `utils`, and `sockets`.
32. Inside `src/modules`, create folders for `auth`, `users`, `games`, `chat`, `friends`, `leaderboard`, and `matchmaking`.
33. Decide a naming convention like `feature.controller.js`, `feature.service.js`, `feature.routes.js`.
34. Keep all database models inside their feature folders.
35. Keep shared helpers in `src/utils`.
36. Keep shared middlewares in `src/middlewares`.
37. Keep WebSocket bootstrapping in `src/sockets/index.js`.
38. Create `routes/index.js` for mounting all HTTP routes in one place.
39. Keep browser-side JavaScript in `public/js`.
40. Keep all page templates in `views/pages` and reusable UI parts in `views/partials`.

## Phase 5: Basic Pages and Layout

41. Create a base layout file such as `views/layouts/main.ejs`.
42. Create shared partials: `navbar.ejs`, `footer.ejs`, and `flash.ejs` if needed.
43. Create a simple home page at `views/pages/home.ejs`.
44. Create login and register pages.
45. Create a lobby page where logged-in users will enter multiplayer mode.
46. Create a local game page for guests who want to play with a bot.
47. Create placeholder pages for friends, chat, leaderboard, and profile.
48. Add a common CSS file in `public/css/style.css`.
49. Add a common frontend file in `public/js/main.js`.
50. Confirm all pages render correctly through Express routes.

## Phase 6: User Model and Authentication

51. Create `src/modules/users/user.model.js`.
52. Add fields like `username`, `email`, `passwordHash`, `avatar`, `rating`, and `friendsCount`.
53. Add timestamps to the user schema.
54. Add unique indexes for `username` and `email`.
55. Create `src/modules/auth/auth.validation.js` to validate register and login input.
56. Create `auth.service.js` to handle password hashing and account lookup.
57. Use `bcryptjs` to hash passwords during registration.
58. Create `auth.controller.js` for register, login, and logout handlers.
59. Create `auth.routes.js` and mount it under `/auth`.
60. Use sessions so logged-in users stay authenticated between requests.

## Phase 7: Auth Middlewares and Protected Routes

61. Create `auth.middleware.js` to allow only logged-in users.
62. Create `guest.middleware.js` for pages that should only be visible before login.
63. Save the logged-in user ID in the session after successful login.
64. Load the current user from the session on every request.
65. Expose the current user to all EJS templates through `res.locals`.
66. Protect the lobby, profile, friends, chat, and multiplayer routes.
67. Keep the local bot route public so guests can access it.
68. Add logout functionality that destroys the session.
69. Handle invalid login attempts with clean messages.
70. Test the full register-login-logout flow in the browser.

## Phase 8: Game Data Models

71. Create `src/modules/games/game.model.js` to store completed match results.
72. Add fields such as `mode`, `players`, `winner`, `moves`, `duration`, and `status`.
73. Create a `chat.model.js` for direct or room messages.
74. Create a `friend.model.js` or store friend relationships in the user model.
75. Create a `leaderboard` strategy based on rating, wins, or score.
76. Decide whether leaderboard data is calculated live or cached in MongoDB.
77. Add indexes for fields used in sorting and lookups.
78. Create seed data scripts only if you need sample users and matches.
79. Keep schema logic lightweight; move business logic to services.
80. Test that all models save and read correctly from MongoDB.

## Phase 9: Local Bot Game First

81. Start with one game only, for example Tic-Tac-Toe, Connect 4, or simple Chess-lite.
82. Create `game.engine.js` for the core game rules.
83. Create `game.state.js` to define the starting state and update rules.
84. Create `bot.engine.js` with simple AI for local guest play.
85. Build the browser UI for the game board in vanilla JS.
86. Add click handlers and render updates in `public/js/game/client.js`.
87. Make the guest local game work fully without login.
88. Prevent illegal moves in both frontend and backend logic.
89. Save local-game results only if you want analytics; otherwise keep them temporary.
90. Do a full manual test of the bot game from start to finish.

## Phase 10: WebSocket and Multiplayer Foundation

91. Attach a WebSocket server to the same HTTP server.
92. Create `src/sockets/index.js` to initialize and manage connections.
93. Authenticate WebSocket users using the existing session or a secure token.
94. Track connected users and their socket IDs in memory.
95. Create a room system for lobbies and active matches.
96. Add basic events like `joinLobby`, `createMatch`, `joinMatch`, `playerMove`, and `leaveMatch`.
97. Broadcast game state updates to all players in a room.
98. Reuse the same `game.engine.js` rules for multiplayer validation.
99. Save the completed multiplayer match to MongoDB and update leaderboard stats.
100. After multiplayer works, build the extra features in this order: chat, friends, leaderboard polishing, notifications, tests, security hardening, and deployment.

## What To Build Right After Step 100

- Add global chat and private chat with message history.
- Add friend requests, accept/reject flows, and online status.
- Add leaderboard filters by game mode and time period.
- Add profile pages with stats, match history, and friend list.
- Add stronger validation, rate limits, and anti-spam protection.
- Add test coverage for auth, game rules, and WebSocket events.
- Deploy Node/Express to a server and MongoDB to Atlas or another managed service.

## Suggested Milestones

- Milestone 1: Static pages render and MongoDB connects.
- Milestone 2: Users can register, log in, and access protected pages.
- Milestone 3: Guests can play a local bot game.
- Milestone 4: Logged-in users can play a live multiplayer match.
- Milestone 5: Social features and leaderboard are complete.
- Milestone 6: The app is tested, secured, and deployed.
