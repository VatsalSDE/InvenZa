import { geminiModel } from '../config/gemini.js';
import * as aiTools from './aiTools.service.js';

/**
 * AI Service
 * Handles prompt building and Gemini API calls with error safety.
 */

export const checkBusinessAnomaly = async () => {
    try {
        const current = await aiTools.getWeeklyMetrics();
        const average = await aiTools.get8WeekAverages();
        
        // Data Guard: No data to analyze
        if (current.revenue === 0 && current.orderCount === 0 && average.avgRevenue === 0) {
            return null;
        }
        
        // Logical checks for deviations > 25%
        let hasAnomaly = false;
        const deviations = {
            revenue: average.avgRevenue > 0 ? ((current.revenue - average.avgRevenue) / average.avgRevenue) * 100 : 0,
            orderCount: average.avgOrderCount > 0 ? ((current.orderCount - average.avgOrderCount) / average.avgOrderCount) * 100 : 0,
            collectionRate: average.avgCollectionRate > 0 ? ((current.collectionRate - average.avgCollectionRate) / average.avgCollectionRate) * 100 : 0,
        };

        if (Math.abs(deviations.revenue) > 25 || Math.abs(deviations.orderCount) > 25 || Math.abs(deviations.collectionRate) > 25) {
            hasAnomaly = true;
        }

        if (!hasAnomaly) return null;

        const prompt = `You are a business analyst for a wholesale gas stove business in India. Here are this week's business metrics compared to the 8-week weekly average. Revenue this week: ${current.revenue}, 8-week average: ${average.avgRevenue.toFixed(2)}, deviation: ${deviations.revenue.toFixed(2)}%. Order count this week: ${current.orderCount}, 8-week average: ${average.avgOrderCount.toFixed(2)}, deviation: ${deviations.orderCount.toFixed(2)}%. Payment collection rate this week: ${current.collectionRate.toFixed(2)}%, 8-week average: ${average.avgCollectionRate.toFixed(2)}%, deviation: ${deviations.collectionRate.toFixed(2)}%. Write 2 to 3 sentences explaining what this means for the business and what action the owner should consider. Use simple plain English. No technical jargon. No bullet points.`;

        const result = await geminiModel.generateContent(prompt);
        const responseText = result.response.text();
        return responseText;
    } catch (error) {
        console.error("Gemini Anomaly Check Error:", error.message);
        return null;
    }
};

export const getDealerRiskScores = async () => {
    try {
        const dealersData = await aiTools.getDealerRiskData();
        if (!dealersData || dealersData.length === 0) return [];

        const scores = await Promise.all(dealersData.map(async (d) => {
            try {
                const prompt = `A wholesale dealer has these risk signals: payment speed score is ${d.signals.delayScore} where 1 means pays quickly within 30 days and 3 means pays very late above 60 days, order frequency dropped significantly in last 30 days compared to previous 30 days is ${d.signals.frequencyDrop}, has an invoice older than 60 days that is still unpaid is ${d.signals.oldOutstanding}. Classify this dealer as exactly one of: Low Risk, Medium Risk, or High Risk. Respond in valid JSON only with exactly two keys: risk_level and reason. Reason must be one sentence maximum. No markdown, no code blocks, no text outside the JSON object.`;

                const result = await geminiModel.generateContent(prompt);
                let text = result.response.text();
                
                // Strip markdown fences if present
                text = text.replace(/```json/g, "").replace(/```/g, "").trim();
                
                const json = JSON.parse(text);
                return {
                    dealer_id: d.dealer_id,
                    firm_name: d.firm_name,
                    risk_level: json.risk_level || "Medium Risk",
                    reason: json.reason || "Assessment based on standard patterns."
                };
            } catch (err) {
                console.error(`Error scoring dealer ${d.dealer_id}:`, err.message);
                return {
                    dealer_id: d.dealer_id,
                    firm_name: d.firm_name,
                    risk_level: "Medium Risk",
                    reason: "Unable to assess at this time."
                };
            }
        }));

        return scores;
    } catch (error) {
        console.error("Gemini Dealer Risk Scores Error:", error.message);
        return null;
    }
};

export const getRestockSuggestions = async () => {
    try {
        const velocityData = await aiTools.getProductVelocityData();
        
        // Filter: velocity > 0 AND days remaining < 45
        const needyProducts = velocityData.filter(p => p.weekly_velocity > 0 && p.days_remaining < 45);

        if (needyProducts.length === 0) {
            return "All products have sufficient stock for the next 45 days. No restocking needed right now.";
        }

        // Sort by most urgent (lowest days_remaining)
        needyProducts.sort((a, b) => a.days_remaining - b.days_remaining);

        const prompt = `You are a business analyst for a wholesale gas stove distributor in India. Based on this product stock data, write prioritized restock recommendations. 
        Data: ${JSON.stringify(needyProducts)}
        For each product mention: urgency level, approximately how many days until stockout, the recommended order quantity, and which supplier to contact. Sort by most urgent first. Be concise and actionable. Write in plain English. No introduction sentence, no conclusion sentence, just the recommendations directly.`;

        const result = await geminiModel.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Gemini Restock Suggestions Error:", error.message);
        return null;
    }
};

export const getMorningDigest = async () => {
    try {
        const data = await aiTools.getDashboardAIData();
        
        // Data Guard: No data points to summarize
        if (data.pendingCount === 0 && data.lowStockNames.length === 0 && data.top3Outstanding.length === 0) {
            return "No critical tasks or alerts for this morning. You're all caught up!";
        }
        
        const prompt = `You are a helpful business assistant for the owner of INVENZA, a gas stove wholesale business. Write a 'Morning Business Digest' in 3 to 4 short, friendly sentences. 
        Use these data points: 
        - Number of pending orders to process: ${data.pendingCount}
        - These products are low on stock: ${data.lowStockNames.join(', ') || 'None'}
        - These dealers have the highest outstanding balances: ${data.top3Outstanding.map(d => `${d.firm_name} (₹${d.outstanding.toLocaleString()})`).join(', ') || 'None'}
        The goal is to give the owner a quick 10-second read of what's most important today. Use a professional yet supportive tone. No bullet points, just a single paragraph. Don't use any greeting like "Good morning", just start the digest.`;

        const result = await geminiModel.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Gemini Morning Digest Error:", error.message);
        return null;
    }
};
