# SkillSwap - Backend Deployment

## Deploy Instructions

### Prerequisites
- Node.js 16+
- MongoDB database
- Redis (for session storage)

### Environment Variables
Create `.env` file:
```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://your-connection-string
CLIENT_URL=https://your-frontend-url.com
STRIPE_SECRET_KEY=your_stripe_secret
JWT_SECRET=your_jwt_secret
```

### Installation & Build
```bash
npm install --production
npm start
```

### Deployment Services
- Heroku
- AWS EC2
- DigitalOcean Droplets
- Google Cloud Platform
- Railway.app

### Production Build
Optimized for production with all necessary dependencies bundled.

### Database Setup
Ensure MongoDB is accessible and indexes are created for performance.

### API Endpoints
- Base URL: `/api`
- Socket.io: `/socket.io`
- Health check: `/health`

### Security
- CORS configured for frontend domain
- Rate limiting implemented
- Input validation on all endpoints
