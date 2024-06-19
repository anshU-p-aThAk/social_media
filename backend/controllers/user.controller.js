import User from "../models/user.model.js"
import Notification from "../models/notification.model.js";
import bcrypt from "bcryptjs"
import { v2 as cloudinary } from "cloudinary";


export const getUserProfile = async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username }).select("-password");

        if (!user) {
            return res.status(404).json({ error: "user not found" });
        }
        res.status(200).json(user);

    } catch (error) {
        console.log("error in getUserProfile: ", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const followUnfollowUser = async (req, res) => {

    try {

        const { id } = req.params;
        const userToModify = await User.findById(id);
        const curretUser = await User.findById(req.user._id);

        if (id === req.user._id.toString()) {
            return res.status(400).json({ error: "You can't follow/unfollow yourself" });
        }

        if (!userToModify || !curretUser) {
            return res.status(400).json({ error: "User not found" });
        }

        const isFollowing = curretUser.following.includes(id);

        if (isFollowing) {
            //Unfollow the user
            await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } }); await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
            res.status(200).json({ message: "user unfollowed successfully" })
        }
        else {
            //Follow the user
            await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

            //Send notification to user
            const newNotification = new Notification({
                type: "follow",
                from: req.user._id,
                to: userToModify._id
            })

            await newNotification.save();

            //return id of the user as response
            res.status(200).json({ message: "user followed successfully" });
        }

    } catch (error) {
        console.log("error in followUnfollowUser: ", error.message);
        res.status(500).json({ error: error.message });
    }

}

export const getSuggestedUsers = async (req, res) => {
    try {
        const userId = req.user._id;
        const usersFollowedByMe = await User.findById(userId).select("following");

        const users = await User.aggregate([
            {
                $match: {
                    _id: { $ne: userId }
                },
            },
            {
                $sample: { size: 10 }
            }
        ])

        const filteredUsers = users.filter((user) => !usersFollowedByMe.following.includes(user._id));
        const suggestedUsers = filteredUsers.slice(0, 4);

        suggestedUsers.forEach((user) => (user.password = null));

        res.status(200).json(suggestedUsers);

    } catch (error) {
        console.log("error in getSuggesteUsers: ", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const updateUser = async (req, res) => {

    const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
    let { profileImg, coverImg } = req.body;

    const userId = req.user._id;

    try {
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if ((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
            return res.status(400).json({ error: "Please provide both current password and new password" });
        }

        if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);

            if (!isMatch) {
                return res.status(400).json({ error: "Curent password is incorrect" });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ error: "Password must be atleast 6 characters long" })
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        if (profileImg) {
            if (user.profileImg) {
                //we destroy the image in cloudinary using the image id
                const imgId = user.profileImg.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(imgId);
            }

            const uploadedResponse = await cloudinary.uploader.upload(profileImg);
            profileImg = uploadedResponse.secure_url; // get cloudinary img url
        }

        if (coverImg) {
            if (user.coverImg) {
                const imgId = user.coverImg.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(imgId);
            }

            const uploadedResponse = await cloudinary.uploader.upload(coverImg);
            coverImg = uploadedResponse.secure_url;
        }

        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.username = username || user.username;
        user.link = link || user.link;
        user.bio = bio || user.bio;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;

        user = await user.save();

        user.password = null;

        res.status(200).json(user);

    } catch (error) {
        console.log("error in updateUser: ", error.message);
        res.status(500).json({ error: error.message });
    }
}