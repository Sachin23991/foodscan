// server.js (Fully updated with the parsing fix)

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000; // Using port 3000

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

class FoodAnalysisService {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('Gemini API key is missing. Please add it to your .env file.');
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    }

    async analyzeFood(imageBuffer, mimeType) {
        try {
            const prompt = `
                Analyze the food items in this image. Provide a detailed nutritional analysis.
                Your response MUST be a valid JSON object and nothing else. Do not wrap it in markdown.
                
                The JSON object should have the following structure:
                {
                  "foodItems": [
                    {
                      "name": "Identified Food Item",
                      "description": "A brief description of the item.",
                      "calories": <estimated_calories_for_item>,
                      "protein_g": <estimated_protein_for_item>,
                      "carbs_g": <estimated_carbs_for_item>,
                      "fat_g": <estimated_fat_for_item>
                    }
                  ],
                  "totalNutrition": {
                    "calories": <total_calories_for_the_meal>,
                    "protein_g": <total_protein_grams>,
                    "carbs_g": <total_carbohydrates_grams>,
                    "fat_g": <total_fat_grams>,
                    "sodium_mg": <total_sodium_milligrams>,
                    "sugar_g": <total_sugar_grams>
                  }
                }

                Provide your best estimate for a typical serving size shown in the image.
            `;

            const imagePart = {
                inlineData: {
                    data: imageBuffer.toString('base64'),
                    mimeType: mimeType,
                },
            };

            const result = await this.model.generateContent([prompt, imagePart]);
            const responseText = result.response.text();

            // =================================================================
            // === THIS IS THE FIX =============================================
            // =================================================================
            // Clean the response to remove Markdown fences like ```json and ```
            const cleanedText = responseText
  .replace(/```json\s*([\s\S]*?)\s*```/, '$1')
  .replace(/```([\s\S]*?)```/, '$1')
  .trim();

            let analysisData;
            try {
                // Parse the CLEANED text, not the original responseText
                analysisData = JSON.parse(cleanedText);
            } catch (e) {
                console.error("Error parsing JSON from Gemini. Original response:", responseText);
                console.error("Attempted to parse this cleaned text:", cleanedText);
                throw new Error("Failed to get a valid analysis from the AI model.");
            }
            // =================================================================
            // === END OF FIX ==================================================
            // =================================================================

            const nutrition = analysisData.totalNutrition;
            const healthScore = this.calculateHealthScore(nutrition);
            const warnings = this.generateWarnings(nutrition);
            const recommendations = this.generateRecommendations(analysisData);

            return {
                success: true,
                data: {
                    foodItems: analysisData.foodItems,
                    nutrition: analysisData.totalNutrition,
                    healthScore,
                    warnings,
                    recommendations,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Food analysis error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    calculateHealthScore(nutrition) {
        let score = 100;
        if (nutrition.calories > 700) score -= 25;
        if (nutrition.fat_g > 25) score -= 20;
        if (nutrition.sodium_mg > 800) score -= 20;
        if (nutrition.sugar_g > 30) score -= 20;
        if (nutrition.protein_g > 20) score += 5;
        score = Math.max(0, Math.min(100, score));
        if (score >= 80) return { rating: 'Healthy', color: '#4CAF50', score };
        if (score >= 50) return { rating: 'Average', color: '#FF9800', score };
        return { rating: 'Risky', color: '#F44336', score };
    }

    generateWarnings(nutrition) {
        const warnings = [];
        if (nutrition.calories > 700) warnings.push('High calorie content.');
        if (nutrition.fat_g > 25) warnings.push('High in fat.');
        if (nutrition.sodium_mg > 800) warnings.push('High sodium content.');
        if (nutrition.sugar_g > 30) warnings.push('High in sugar.');
        return warnings;
    }

    generateRecommendations(analysisData) {
        const recommendations = [];
        const { totalNutrition, foodItems } = analysisData;
        if (totalNutrition.fat_g > 20) {
            recommendations.push('Consider replacing fried items with grilled or baked alternatives.');
        }
        if (totalNutrition.carbs_g > 80 && !foodItems.some(item => item.name.toLowerCase().includes('vegetable'))) {
            recommendations.push('Adding a side of non-starchy vegetables like broccoli or spinach can add fiber and nutrients.');
        }
        if (totalNutrition.protein_g < 15) {
            recommendations.push('To increase protein, consider adding beans, lentils, or a lean meat source.');
        }
        if (totalNutrition.sugar_g > 25) {
            recommendations.push('Be mindful of sugary sauces or drinks. Water is a great alternative.');
        }
        if (recommendations.length === 0) {
            recommendations.push('This looks like a well-balanced meal! Great choice.');
        }
        return recommendations;
    }
}

const foodAnalysisService = new FoodAnalysisService(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/analyze-food', upload.single('foodImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image file provided' });
        }
        console.log(`Analyzing food image: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB)`);
        const result = await foodAnalysisService.analyzeFood(req.file.buffer, req.file.mimetype);
        res.json(result);
    } catch (error) {
        console.error('Analysis route error:', error);
        res.status(500).json({ success: false, error: 'Analysis failed on the server.' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use((error, req, res, next) => {
    console.error('Server error middleware:', error.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 FoodScan server running on port ${PORT}`);
    console.log(`📱 Access the app at http://localhost:${PORT}`);
});

module.exports = app;