import mongoose from "mongoose";

const searchHistorySchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
    },
}, {timestamps: true});

searchHistorySchema.index({ user: 1, createdAt: -1 });

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);

export default SearchHistory;