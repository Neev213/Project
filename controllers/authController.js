import User from '..models/user.js';
import geneateToken from '../utils/generateToken.js';

export const register = async (req, res) => {
    const {name, email, password} = req.body;

    if(!name || !email || !password){
        return res.status(400).json({message: 'Please provide name, email and password'});
    }

    const userExists = await User.findOne({email});
    if(userExists){
        return res.status(400).json({message: 'User already exists'});
    }

    const user = await User.create({name, email, password});

    res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        preferredUnit: user.preferredUnit,
        token: generateToken(user._id),
    });
};

export const login = async (req, res) => {
    const {email, password} = req.body;

    if(!email || !password){
        return res.status(400).json({message: 'Please provide valid email and password'});
    }
    const user = await User.findOne({emial}).select('+password');

    if(!user || !(await user.matchPassword(password))){
        return res.status(401).json({message: 'Invaild email or password'});
    }
    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        preferredUnit : user.preferredUnit,
        token: generateToken(user._id),
    });
};

export const getMe = async (req, res) => {
    res.json(req.user);
}
