const mongoose = require('mongoose')

const documentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    textContent: {
        type: String,
        required: false
    },
    analysisResult: {
        type: mongoose.Schema.Types.Mixed,  // Flexible structure for analysis results
        default: null
    },
    status: {
        type: String,
        enum: ['uploaded', 'processing', 'completed', 'failed'],
        default: 'uploaded'
    }
})

module.exports = mongoose.model('Document', documentSchema)