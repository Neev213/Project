import SearchHistory from "../models/searchHistory.js";

export const getHistory = async (req, res) => {
    const history = await SearchHistory.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(10);

    res.json(history);
};

export const clearHistory = async (req, res) => {
    await SearchHistory.deleteMany({ user: req.user._id });
    res.json({ message: 'History cleared' });
};