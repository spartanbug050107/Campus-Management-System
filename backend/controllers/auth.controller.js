import User from "../models/user.js";
import Master from "../models/master.js";
import jwt from "jsonwebtoken";

const generateToken = (id, role) => {
    return jwt.sign(
        { id, role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// const sendTokenResponse = (user, statusCode, res) => {
//     const token = generateToken(user._id, user.role);

//     res.cookie("jwt", token, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "strict",
//         maxAge: 7 * 24 * 60 * 60 * 1000
//     });

//     // res.status(statusCode).json({
//     //     _id: user._id,
//     //     name: user.name,
//     //     instituteEmail: user.instituteEmail,
//     //     role: user.role
//     // });



// };
export const checkToken = (req, res) => {
    try {
        const cookie = req.cookies.jwt;
        const user = jwt.verify(cookie, process.env.JWT_SECRET);
        res.json({
            login: true,
            data: user,
        });
    }

    catch(error) {
        res.json({
            login: false,
            data: null,
        })
    }
}

// REGISTER
export const registerUser = async (req, res) => {
    try {
        const body = req.body || {};
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const password = body.password;

        if (!email) {
            return res.status(400).json({ message: "Please provide Institute Email" });
        }
        if (!password) {
            return res.status(400).json({ message: "Please provide your Password" });
        }
        
        const masterUser = await Master.findOne({ instituteEmail: email });

        // checks if user is already in the master DB
        if (!masterUser) {
            return res.status(403).json({
                message: "You are not authorized to register"
            });
        }

        const existingUser = await User.findOne({ instituteEmail: email });

        // checks if the user is already existing in the  User DB
        if (existingUser) {
            return res.status(409).json({
                message: "User already registered"
            });
        }

        const userData = {
            name: masterUser.name,
            instituteEmail: masterUser.instituteEmail,
            password,
            role: masterUser.role,
            department: masterUser.department
        };



        if (masterUser.role === "student") {
            userData.studentId = masterUser.studentId;
        } else {
            userData.employeeId = masterUser.employeeId;
        }

        const user = await User.create(userData);

        const token = generateToken(user._id, user.role, user.name);

        const isProd = process.env.NODE_ENV === "production";
        res.cookie("jwt", token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(201).json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                instituteEmail: user.instituteEmail,
                role: user.role,
                department: user.department,
                studentId: user.studentId || null,
                employeeId: user.employeeId || null,
            },
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// LOGIN
export const loginUser = async (req, res) => {
    try {
        const body = req.body || {};
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const password = body.password;

        if (!email) {
            return res.status(400).json({ message: "Please provide Institute Email" });
        }
        if (!password) {
            return res.status(400).json({ message: "Please provide your Password" });
        }

        const user = await User.findOne({ instituteEmail: email });

        // checks it the user is invalid or not
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = generateToken(user._id, user.role);

        const isProd = process.env.NODE_ENV === "production";
        res.cookie("jwt", token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(201).json({
            message: "User logged in successfully",
            token,
            user: {
                _id: user._id,
                name: user.name,
                instituteEmail: user.instituteEmail,
                role: user.role,
                department: user.department,
                studentId: user.studentId || null,
                employeeId: user.employeeId || null,
            },
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET CURRENT USER
export const getMe = async (req, res) => {
    res.status(200).json({
        user: {
            _id: req.user._id,
            name: req.user.name,
            instituteEmail: req.user.instituteEmail,
            role: req.user.role,
            department: req.user.department,
            studentId: req.user.studentId || null,
            employeeId: req.user.employeeId || null,
        },
    });
};

// LOGOUT
export const logoutUser = (req, res) => {
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("jwt", "", {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        expires: new Date(0),
    });

    res.status(200).json({ message: "Logged out successfully" });
};

