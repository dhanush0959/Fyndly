# Fyndly

An AI-powered Lost and Found platform that helps people reconnect with their lost belongings through intelligent matching and real-time communication.

## Features

- **User Authentication**: Login and Register functionality
- **Report Lost Items**: Users can report items they have lost with detailed information
- **Report Found Items**: Users can report items they have found
- **Gallery View**: Display all lost and found items in a searchable gallery
- **Filter & Search**: Filter items by type (lost/found) and search by keywords
- **Contact Information**: Each item listing includes contact details for follow-up

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Register**: Create a new account on the registration page
2. **Login**: Sign in with your credentials
3. **Browse Gallery**: View all reported lost and found items
4. **Report Lost Item**: Click "Report Lost Item" to submit details about something you've lost
5. **Report Found Item**: Click "Report Found Item" to submit details about something you've found
6. **Search & Filter**: Use the search bar and filters to find specific items

## Project Structure

```
CSPP/
├── public/
│   └── index.html
├── src/
│   ├── assets/
│   │   └── background.jpeg
│   ├── components/
│   │   ├── Login.js
│   │   ├── Login.css
│   │   ├── Register.js
│   │   ├── Register.css
│   │   ├── Gallery.js
│   │   ├── Gallery.css
│   │   ├── LostForm.js
│   │   ├── LostForm.css
│   │   ├── FoundForm.js
│   │   └── FoundForm.css
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## Technologies Used

- React 18
- React Router DOM 6
- CSS3 with modern gradients and animations
- Local Storage for data persistence

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Runs the test suite
- `npm eject` - Ejects from Create React App (one-way operation)

## Features in Detail

### Authentication
- Simple login/register system
- Session management using localStorage
- Protected routes that require authentication

### Item Reporting
- Comprehensive forms for lost and found items
- Category selection (Electronics, Clothing, Accessories, etc.)
- Date and location tracking
- Contact information collection
- Optional image URL support

### Gallery
- Grid layout displaying all items
- Visual badges to distinguish lost vs found items
- Detailed item cards with all information
- Real-time filtering and search
- Item count display for each category

## Future Enhancements

- Backend integration with database
- Image upload functionality
- Email notifications for matches
- User profiles and item history
- Admin dashboard
- Mobile app version

## License

This project is created for educational purposes.
