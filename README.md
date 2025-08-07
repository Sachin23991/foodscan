# 🥗 FoodScan AI

AI-powered food analyzer that estimates calories, macros, and gives health recommendations based on a photo of your meal — built using Node.js, Express, and Google Gemini.

![FoodScan Banner](https://via.placeholder.com/1000x300?text=FoodScan+AI+%7C+Smart+Food+Analyzer) <!-- Replace with real image if available -->

---

## 🌟 Features

- 📷 Upload a food image for instant nutritional analysis
- 🤖 Uses Google Gemini to estimate calories, macros, sodium, sugar
- 💡 Provides health score, warnings, and recommendations
- 📊 Calculates total nutrition and individual food item breakdown
- 🌐 Web-based, responsive frontend + backend with REST API

---

## 🚀 Live Demo

🔗 [https://foodscan-app.onrender.com](https://foodscan-app.onrender.com)  
(*Hosted on Render - may take a few seconds to wake up*)

---

## 🛠️ Tech Stack

| Frontend     | Backend         | AI & APIs        | Other Tools     |
|--------------|------------------|------------------|-----------------|
| HTML, CSS, JS | Node.js, Express | Google Gemini API | Multer (file upload), dotenv |

---

## 📸 How It Works

1. Upload a food image (e.g., meal plate)
2. The server sends the image to Gemini
3. Gemini responds with structured JSON containing:
    - Food items
    - Calories, protein, carbs, fat, sodium, sugar
4. The app calculates:
    - Total nutrition
    - Health score
    - Custom suggestions
5. Results are displayed instantly to the user

---

## 🧑‍💻 Installation

```bash
git clone https://github.com/Sachin23991/foodscan.git
cd foodscan
npm install
