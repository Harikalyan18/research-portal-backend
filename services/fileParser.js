const PDFParser = require('pdf2json')

const parsePDF = (buffer) => {
    return new Promise((resolve, reject) => {
        console.log('[parsePDF] Starting PDF parsing with pdf2json...')
        const pdfParser = new PDFParser()

        pdfParser.on('pdfParser_dataError', (errData) => {
            console.error('[parsePDF] pdf2json error:', errData.parserError)
            reject(new Error(`PDF parsing error: ${errData.parserError}`))
        })

        pdfParser.on('pdfParser_dataReady', (pdfData) => {
            console.log('[parsePDF] pdf2json data ready')
            let text = ''

            if (pdfData && pdfData.Pages) {
                console.log(`[parsePDF] Found ${pdfData.Pages.length} pages`)
                pdfData.Pages.forEach((page, pageIndex) => {
                    if (page.Texts && page.Texts.length > 0) {
                        console.log(`[parsePDF] Page ${pageIndex + 1} has ${page.Texts.length} text items`)
                        page.Texts.forEach((textItem) => {
                            if (textItem.R && textItem.R[0] && textItem.R[0].T) {
                                // "Safely decode the text – some strings are not valid URI components"
                                let decoded
                                try {
                                    decoded = decodeURIComponent(textItem.R[0].T)
                                } catch (e) {
                                    // "Fallback to raw string if decoding fails"
                                    decoded = textItem.R[0].T
                                }
                                text += decoded + ' '
                            }
                        })
                    } else {
                        console.warn(`[parsePDF] Page ${pageIndex + 1} has no text items`)
                    }
                    text += '\n'
                })
            } else {
                console.warn('[parsePDF] No Pages found in PDF data')
            }

            const trimmed = text.trim()
            console.log(`[parsePDF] Extracted text length: ${trimmed.length} characters`)
            if (trimmed.length === 0) {
                console.warn('[parsePDF] Extracted text is EMPTY')
            }
            resolve(trimmed)
        })

        console.log('[parsePDF] Calling parseBuffer...')
        pdfParser.parseBuffer(buffer)
    })
}

const parseText = (buffer) => {
    try {
        const text = buffer.toString('utf-8')
        console.log(`[parseText] Extracted text length: ${text.length}`)
        return text
    } catch (error) {
        throw new Error(`Text parsing failed: ${error.message}`)
    }
}

const parseFile = async (file) => {
    console.log('[parseFile] Called with file:', file?.originalname, file?.mimetype, `size: ${file?.size} bytes`)

    if (!file || !file.buffer) {
        throw new Error('Invalid file object: missing buffer')
    }

    const { buffer, mimetype, originalname, size } = file
    let textContent = ''

    if (mimetype === 'application/pdf') {
        console.log('[parseFile] Detected PDF file')
        textContent = await parsePDF(buffer)
    } else if (mimetype === 'text/plain' || originalname.endsWith('.txt')) {
        console.log('[parseFile] Detected text file')
        textContent = parseText(buffer)
    } else {
        throw new Error(`Unsupported file type: ${mimetype}. Only PDF and TXT are allowed.`)
    }

    // whitespace Normalizing
    textContent = textContent.replace(/\s+/g, ' ').trim()
    console.log(`[parseFile] Final textContent length: ${textContent.length}`)

    return {
        textContent,
        fileType: mimetype,
        fileSize: size
    }
}

module.exports = {
    parsePDF,
    parseText,
    parseFile
}