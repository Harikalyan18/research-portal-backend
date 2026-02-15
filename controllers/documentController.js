const Document = require('../models/Document')
const { parseFile } = require('../services/fileParser')
const { analyzeEarningsCall } = require('../services/openRouterService')
// const { analyzeEarningsCall } = require('../services/geminiService')


exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' })
        }

        const parsed = await parseFile(req.file)
        // console.log('[uploadDocument] parseFile returned:', {
        //     textLength: parsed.textContent.length,
        //     fileType: parsed.fileType,
        //     fileSize: parsed.fileSize
        // })

        const { textContent, fileType, fileSize } = parsed

        if (!textContent || textContent.trim().length === 0) {
            return res.status(400).json({ error: 'No text could be extracted from the file. The PDF may be corrupted or image-based.' })
        }

        const document = new Document({
            filename: req.file.originalname,
            originalName: req.file.originalname,
            fileType,
            fileSize,
            textContent,
            status: 'uploaded'
        })

        await document.save()

        res.status(201).json({
            documentId: document._id,
            filename: document.originalName
        })
    } catch (error) {
        console.error('[uploadDocument] Error:', error)
        res.status(500).json({ error: error.message })
    }
}

exports.analyzeDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.documentId)
        if (!document) {
            return res.status(404).json({ error: 'Document not found' })
        }

        document.status = 'processing'
        await document.save()

        const analysis = await analyzeEarningsCall(document.textContent)

        document.analysisResult = analysis
        document.status = 'completed'
        await document.save()

        res.json({ result: analysis })
    } catch (error) {
        await Document.findByIdAndUpdate(req.params.documentId, { status: 'failed' })
        res.status(500).json({ error: error.message })
    }
}

exports.getDocument = async (req, res) => {
    try {
        const document = await Document.findById(req.params.documentId)
        if (!document) {
            return res.status(404).json({ error: 'Document not found' })
        }
        res.json(document)
    } catch (error) {
        console.error('Get document error:', error)
        res.status(500).json({ error: error.message })
    }
}