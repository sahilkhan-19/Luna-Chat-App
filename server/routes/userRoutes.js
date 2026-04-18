import express from 'express';
import { login,signup,updateProfile } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';
import { checkAuth } from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post('/signup', signup);
userRouter.post('/login', login);
userRouter.put('/update-profile', authMiddleware, updateProfile);
userRouter.get('/check-auth', authMiddleware, checkAuth);

export default userRouter;