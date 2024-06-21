import User from "../models/user.model.js"
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

export const signup = async (req, res) => {
    try {
        const { fullName, username, email, password } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            // Return to stop further execution
            return res.status(400).json({ error: "Username already taken" });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            // Return to stop further execution
            return res.status(400).json({ error: "Email already taken" });
        }
        
        if (password.length < 6) {
            // Return to stop further execution
            return res.status(400).json({ error: "Password must be at least 6 characters long" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            username,
            email,
            password: hashPassword
        });

        // Save the user first
        await newUser.save();

        // Generate token and set cookie after saving the user
        generateTokenAndSetCookie(newUser._id, res);

        // Return to stop further execution
        return res.status(201).json({
            _id: newUser._id,
            fullName: newUser.fullName,
            username: newUser.username,
            email: newUser.email,
            followers: newUser.followers,
            following: newUser.following,
            profileImg: newUser.profileImg,
            coverImg: newUser.coverImg
        });
        
    } catch (err) {
        console.log("error in signup controller", err.message);
        // Return to stop further execution
        return res.status(500).json({ error: "Internal server error" });
    }
}


export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

        if (!user || !isPasswordCorrect) {
            return res.status(400).json({ error: "Invalid username or password" });
        }

        generateTokenAndSetCookie(user._id, res);

        return res.status(201).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            followers: user.followers,
            following: user.following,
            profileImg: user.profileImg,
            coverImg: user.coverImg
        });
        
    } catch (error) {
        console.log("error is login controller", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}


export const logout = async (req, res) => {
    try {
        res.cookie("jwt", "", {maxAge: 0});
        res.status(200).json({message: "Logged out successfully"});
    } catch (error) {
        console.log("error is logout controller", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const getMe = async(req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        res.status(200).json(user);
    } catch (error) {
        console.log("error is getMe controller", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}