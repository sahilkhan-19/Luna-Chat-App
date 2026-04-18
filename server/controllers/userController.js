import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

//Signup new user
export const signup = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({success: false, message: "Please provide email, password, and name" });
        }
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = await User.create({ email, password: hashedPassword, name, bio: "" });
        const token = generateToken(newUser._id);
        const userData = newUser.toObject();
        delete userData.password;

        res.status(201).json({ success: true, message: "User created successfully", userData, token });
    } catch (error) {
        console.error("Error in signup:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}; 

//controller to login user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Please provide email and password" });
        }
        // Check if user exists        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid email or password" });
        }

        // Check if password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid email or password" });
        }

        const token = generateToken(user._id);
        const userData = user.toObject();
        delete userData.password;

        res.status(200).json({ success: true, message: "Login successful", userData, token });
    } catch (error) {
        console.error("Error in login:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

//controller to update user profile
export const updateProfile = async (req, res) => {
    try {
        const { name, profilePic ,bio } = req.body;
        const userId = req.user._id;
        let updatedUser;

        if(!profilePic){
            updatedUser = await User.findByIdAndUpdate(userId, { name, bio }, { new: true }).select("-password");
        } else {
            const upload = await cloudinary.uploader.upload(profilePic);
            // Schema field is `profilePicture` — `profilePic` is stripped by Mongoose strict mode
            updatedUser = await User.findByIdAndUpdate(
                userId,
                { name, bio, profilePicture: upload.secure_url },
                { new: true }
            ).select("-password");
        }

        res.status(200).json({ success: true, message: "Profile updated successfully", userData: updatedUser });
    } catch (error) {
        console.error("Error in updateProfile:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
