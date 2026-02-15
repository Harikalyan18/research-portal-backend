const express = require('express')
const multer = require('multer')
const documentController = require('../controllers/documentController')

const router = express.Router()

const storage = multer.memoryStorage()

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit
    },
    fileFilter: (req, file, cb) => {
        // "Accept PDF and text files only"
        if (file.mimetype === 'application/pdf' ||
            file.mimetype === 'text/plain' ||
            file.originalname.endsWith('.txt')) {
            cb(null, true)
        } else {
            cb(new Error('Only PDF and text files are allowed'), false)
        }
    }
})

// Routes
router.post('/upload', upload.single('document'), documentController.uploadDocument)
router.post('/:documentId/analyze', documentController.analyzeDocument)
router.get('/:documentId', documentController.getDocument)

module.exports = router