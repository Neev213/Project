import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import validator from 'validator';

const typoDomains = [
    'gmail.om',
    'gmail.con',
    'gmial.com',
    'gamil.com',
    'gmail.co',
    'yahoo.con',
    'hotmail.con',
];

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        

        validate: {
            validator: (value) => {
                if (!validator.isEmail(value)) return false;
                const domain = value.split('@')[1];
                return !typoDomains.includes(domain);
            },
            message: 'Please use a valid email address',
        },
    },
    
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false,
    },

    preferredUnit: {
        type: String,
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius',
    },
}, {timestamps: true});

userSchema.pre('save', async function(){
    if(!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);

};

const User = mongoose.model('User', userSchema);

export default User;