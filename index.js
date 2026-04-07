require('dotenv').config();
const express =require('express');
const path=require('path');
const cookieParser=require('cookie-parser');
const {restrictToLoggedinUserOnly}=require("./middlewares/auth")
const {connectToMongoDB}=require('./connect');
const { Server } = require('socket.io');
const http = require('http');

const staticRoute = require("./routes/staticRouter");
const userRoute = require("./routes/user");
const { normalizeMongoUri } = require("./connect");

const rawMongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;
const mongoUri = normalizeMongoUri(rawMongoUri) || 'mongodb://127.0.0.1:27017/multiplayer-gaming-site';
const jwtSecret = process.env.JWT_SECRET || 'dev_secret';

if (!rawMongoUri) {
  console.warn('Warning: No remote MongoDB URI set. Using local fallback for development.');
}
if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set. Using default JWT secret for development only.');
}

const app=express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 5100;
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static("public"));

app.use("/",staticRoute);
app.use("/user",userRoute);
app.use("/game",require("./routes/game"));

// Socket.IO setup
require('./sockets/nimsocket')(io);

connectToMongoDB(mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server Started at PORT: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });