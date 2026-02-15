const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const connectDB = require('./config/database')

dotenv.config()

connectDB()

const app = express()


app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://your-frontend.vercel.app' // replace after frontend deploy
    ],
    credentials: true
}));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/documents', require('./routes/documentRoutes'))


app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Research Portal API is running' })
})


app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})