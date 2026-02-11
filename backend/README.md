# Fyndly Backend API

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Google Cloud Vision API
- Save your Google Cloud Vision API key JSON file as:
  ```
  backend/config/google-vision-key.json
  ```

### 3. Configure Cloudinary
- Sign up at https://cloudinary.com (free tier: 25 credits/month)
- Get your credentials from dashboard
- Add to `.env` file

### 4. Setup MySQL Database
```bash
# Login to MySQL
mysql -u root -p

# Run the database script
source config/database.sql

# Or manually create database
mysql -u root -p < config/database.sql
```

### 5. Configure Environment Variables
Edit the `.env` file with your credentials:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=lostandfound_db

# Server
PORT=5000

# Google Cloud Vision
GOOGLE_APPLICATION_CREDENTIALS=./config/google-vision-key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT
JWT_SECRET=your_secret_key

# Frontend
FRONTEND_URL=http://localhost:3000
```

### 6. Start the Server
```bash
npm run dev    # Development with auto-restart
# OR
npm start      # Production
```

Server will run on http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Items
- `POST /api/items/lost` - Submit lost item (with image)
- `POST /api/items/found` - Submit found item (with image)
- `GET /api/items/lost` - Get all lost items
- `GET /api/items/found` - Get all found items
- `GET /api/items/matches/:type/:itemId` - Get matches for item

### Health Check
- `GET /health` - Server status

## How It Works

1. **Image Upload**: User uploads image with item details
2. **Vision Analysis**: Google Cloud Vision API detects:
   - Objects (labels)
   - Text (OCR)
   - Colors
3. **Automatic Matching**: System compares with existing items using:
   - 40% Object similarity
   - 30% Text similarity
   - 20% Location proximity
   - 10% Time proximity
4. **Notifications**: Matches above 50% threshold are stored and can trigger emails

## Project Structure
```
backend/
├── config/           # Database & API configurations
├── controllers/      # Request handlers
├── middleware/       # Auth & upload middleware
├── routes/          # API routes
├── services/        # Vision & matching logic
├── uploads/         # Temporary file storage
├── server.js        # Entry point
└── .env            # Environment variables
```
