import express from 'express';
import cors from 'cors';
import http from 'http';
import { connectDB } from './lib/bd.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from "socket.io";



//create express app and HTTP server
const app = express();
const server = http.createServer(app);

//Initialize socket.io server
export const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

//Store online users
export const userSocketMap = {};//{userId: socketId}

//Socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`User connected: ${userId}`);

    if (userId) {
        userSocketMap[String(userId)] = socket.id;
    }
    //Emit online users to all connected client
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    //Handle disconnection
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${userId}`);
        delete userSocketMap[String(userId)];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});



//middleware setup
app.use(express.json({limit: '4mb'}));
app.use(cors());
app.use("/api/messages", messageRouter);

//routes setup
app.use("/api/status", (req, res) => {
    res.send("Server is running");
});
app.use("/api/auth", userRouter);

//connect to database
await connectDB();

// Listen on VPS / Railway / Render / local. Vercel serverless sets VERCEL — no long-lived listen there.
const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

//Export server for vercel
export default server;