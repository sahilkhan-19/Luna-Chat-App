import express from "express";
import { getUsersForSidebar, getMessages, markMessageAsSeen, sendMessage } from "../controllers/messageController.js";
import { authMiddleware } from "../middleware/auth.js";


const messageRouter = express.Router();
    
messageRouter.get("/users", authMiddleware, getUsersForSidebar);
messageRouter.get("/:id", authMiddleware, getMessages);
messageRouter.put("/mark/:id", authMiddleware, markMessageAsSeen);
messageRouter.post("/send/:id", authMiddleware, sendMessage);

export default messageRouter;