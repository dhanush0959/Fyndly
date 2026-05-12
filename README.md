# 🔍 Fyndly

**An AI-Powered Lost & Found Platform** designed for modern communities, residential buildings, and campuses. Fyndly removes the friction from reporting lost items by leveraging Vision AI to automatically analyze uploaded images, generate detailed descriptions, and seamlessly connect "finders" with "losers" in real-time.

![Fyndly Banner](public/emerald_bg.png)

## ✨ Key Features

- **🤖 AI-Powered Object Detection**: Upload a photo of a found item, and the AI automatically detects keywords, colors, and generates a detailed description.
- **🎯 Smart Matching Algorithm**: Automatically compares newly reported found items against the database of lost items and alerts users when a high-confidence match is detected.
- **💬 Real-Time In-App Chat**: Finders and owners can securely communicate directly within the app to arrange the return of the item.
- **🎨 Premium UI/UX**: A state-of-the-art interface featuring a beautiful dark-mode glassmorphism aesthetic, powered by an Emerald Green and Deep Slate Blue color palette with smooth CSS micro-animations.
- **🔐 Secure Authentication**: JWT-based login and registration system ensuring user data privacy.

## 🛠 Tech Stack

- **Frontend:** Next.js 16 (App Router), React, vanilla CSS variables (for dynamic theming)
- **Backend:** Next.js API Routes (Serverless Functions)
- **Database:** MongoDB (via Mongoose)
- **Styling:** Custom CSS Glassmorphism & UI Tokens

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/fyndly.git
   cd fyndly
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add the necessary environment variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_key
   # Add any other required API keys (e.g., Vision AI)
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗 Production Build

To test or deploy the optimized production build of the application:

```bash
# Build the static and server-side components
npm run build

# Start the production server
npm run start
```

## 📁 Project Structure

- `/src/app`: Next.js App Router pages and API endpoints.
- `/src/components`: Reusable React components (`Chat.js`, `Dashboard.js`, `FoundForm.js`, etc.).
- `/src/components/styles`: Component-specific CSS files utilizing the global design system.
- `/src/models`: Mongoose database schemas.
- `/src/lib`: Helper functions and database connection logic.
- `/public`: Static assets including the premium `emerald_bg.png` background.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License

This project is licensed under the MIT License.
