import User from "../models/User.js";
import jwt from "jsonwebtoken";


//middleware to protest routes

export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Must match payload in generateToken (uses `id`; legacy tokens may use `userId`)
        const userId = decoded.userId ?? decoded.id;
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error("Error in auth middleware:", error);
        res.status(401).json({ success: false, message: "Unauthorized" });
    }
};
//controller to check if user is authenticated
export const checkAuth = (req, res) => {
    res.status(200).json({ success: true, message: "User is authenticated", user: req.user });
};
