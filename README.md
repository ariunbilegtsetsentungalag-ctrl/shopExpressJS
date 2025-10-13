# E-commerce Web Application

## Features

- 🔐 User authentication (signup/login)
- 🛒 Shopping cart functionality
- 📦 Order history and management
- 💾 MongoDB Atlas database integration
- 🔒 Secure session management
- 📱 Responsive design with Bootstrap

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Authentication**: bcryptjs, express-session
- **Template Engine**: EJS
- **Styling**: Bootstrap 5
- **Session Store**: MongoDB (connect-mongo)

## Getting Started


1. Clone the repository
```bash
git clone https://github.com/ariunbilegtsetsentungalag-ctrl/shopExpressJS.git
cd shopExpressJS
```

2. Install dependencies
```bash
npm i
```

3. Create a `.env` file in the root directory:
```
CONNECTION_STRING=your_mongodb_atlas_connection_string
PORT=9005
SESSION_SECRET=your_session_secret
```

4. Start the application
```bash
npm run watch
```

5. Visit `http://localhost:9005`

