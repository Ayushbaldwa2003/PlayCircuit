const express =require('express');
const path=require('path');
const cookieParser=require('cookie-parser');
const {restrictToLoggedinUserOnly}=require("./middlewares/auth")
const {connectToMongoDB}=require('./connect');
const { Server } = require('socket.io');
const http = require('http');

const staticRoute = require("./routes/staticRouter");
const userRoute= require("./routes/user");

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/multiplayer-gaming-site';
connectToMongoDB(mongoUri)
.then(()=>console.log('Connected to MongoDB'))
.catch(err=>console.log(err));

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

server.listen(PORT,()=>{
    console.log(`Server Started at PORT: ${PORT}`)
})