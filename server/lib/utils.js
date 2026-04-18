import jwt from 'jsonwebtoken';

//function to generate a JWT token for a user
export const generateToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not set in environment variables");
    }
    return jwt.sign({ id: userId }, process.env.JWT_SECRET);
};