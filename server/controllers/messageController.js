import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";


//get all users except logged in user
export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({_id: {$ne: userId}}).select("-password");
        res.status(200).json(filteredUsers);

        //count no. of messages not seen
        const unseenMessages = {}
        const promises = filteredUsers.map(async (user) => {
            const messages = await Message.find({
                senderId: user._id,
                receiverId: userId,
                seen: false
            });
            if(messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }
        });
        await Promise.all(promises);
        res.status(200).json({users: filteredUsers, unseenMessages});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Server error"});
    }
}

//get all messages for selected user

export const getMessages = async (req, res) => {
    try {
        const {id: selectedUserId} = req.params;
       const myId = req.user._id;
       const messages = await Message.find({
        $or: [
            {senderId: myId, receiverId: selectedUserId},
            {senderId: selectedUserId, receiverId: myId}
        ]
    })
    await Message.updateMany({
        senderId: selectedUserId,
        receiverId: myId,
    }, {seen: true});
    res.status(200).json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Server error"});
    }
} 

//api to mark message as seen using message id
export const markMessageAsSeen = async (req, res) => {
    try {
        const {id} = req.params;
        await Message.findByIdAndUpdate(id, {seen: true});
        res.status(200).json({message: "Message marked as seen"});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Server error"});
    }
}

//send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const {text, image} = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl = "";
        if(image) {
            //upload image to cloudinary and get url
            const uploadResponse = await cloudinary.uploader.upload(image, {
                folder: "luna/messages"
            });
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });
        
        //Emit the new message to the receiver's socket
        const receiverSocketId = userSocketMap[receiverId];
        if(receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Server error"});
    }
}