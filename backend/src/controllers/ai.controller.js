import * as aiService from '../services/ai.service.js';

/**
 * AI Controller
 */

export const getAnomalyCheck = async (req, res) => {
    try {
        const result = await aiService.checkBusinessAnomaly();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDealerRiskScores = async (req, res) => {
    try {
        const result = await aiService.getDealerRiskScores();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getRestockSuggestions = async (req, res) => {
    try {
        const result = await aiService.getRestockSuggestions();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMorningDigest = async (req, res) => {
    try {
        const result = await aiService.getMorningDigest();
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
