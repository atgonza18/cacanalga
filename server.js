const express = require('express');
const multer = require('multer');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const mammoth = require('mammoth');
const pdf = require('pdf-parse');
require('dotenv').config();

const app = express();

// Use memory storage for Vercel instead of disk storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configure OpenAI
console.log('API Key loaded:', process.env.OPENAI_API_KEY ? '✅ Loaded from environment' : '❌ Missing');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Helper function to extract text from different file types
async function extractText(buffer, fileType) {
    try {
        if (fileType.includes('pdf')) {
            const data = await pdf(buffer);
            return data.text;
        } else if (fileType.includes('word') || fileType.includes('docx') || fileType.includes('doc')) {
            const result = await mammoth.extractRawText({ buffer: buffer });
            return result.value;
        } else if (fileType.includes('text') || fileType.includes('txt')) {
            return buffer.toString('utf8');
        } else {
            throw new Error('Unsupported file type');
        }
    } catch (error) {
        console.error('Error extracting text:', error);
        throw new Error('Failed to extract text from document');
    }
}

// Helper function to sanitize filename
function sanitizeFilename(filename) {
    return filename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, 100);
}

// Analyze endpoint - updated for Vercel compatibility
app.post('/analyze', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { systemPrompt, userPrompt } = req.body;
        const buffer = req.file.buffer;
        const originalName = req.file.originalname;

        // Upload file to OpenAI for analysis
        const file = await openai.files.create({
            file: buffer,
            filename: originalName,
            purpose: 'assistants'
        });

        // Define the enhanced QAQC system prompt with numbers-first location extraction
        const embeddedSystemPrompt = `You are a QAQC document analyzer for construction test reports. Your ONLY task is to extract the EXACT location from the density test data table with NUMBERS FIRST, then the rest of the location, and the PRECISE test type from the "Ladies and Gentlemen" paragraph to generate a PERFECT QAQC-compliant filename.

**NUMBERS-FIRST PERFECT EXTRACTION PROTOCOL:**

**STEP 1: NUMBERS-FIRST LOCATION EXTRACTION (from density test data table)**
- **LOCATE the density test data table** - it's typically a grid/table format with columns
- **FIND the "Location" or "Test Location" column** - this is your primary source
- **EXTRACT the COMPLETE TEXT** from this column
- **REORGANIZE with NUMBERS FIRST**: Extract numbers/patterns first, then the rest
- **CRITICAL: Numbers come first** - "A5-A6 Medium Voltage Trench" becomes "A5-A6 Medium Voltage Trench"
- **Preserve ALL descriptors** - "Access Road for BESS", "Sub Station Pad Area B-12"
- **Handle complex patterns**: "A-5, A-6" stays as "A-5, A-6"

**STEP 2: PRECISE TEST TYPE EXTRACTION (from "Ladies and Gentlemen" paragraph)**
- **LOCATE the paragraph starting with "Ladies and Gentlemen"** - this is mandatory
- **SCAN the entire paragraph** for the test description
- **EXTRACT the EXACT test type** using these patterns:
  - "compaction test" → "Compaction Test"
  - "inspection report" → "Inspection"
  - "break test" → "Break Test"
  - "concrete break test" → "Concrete Break Test"
  - "proof roll" → "Proof Roll"
  - "density test" → "Density Test"
  - "testing" → "Testing"
  - "inspection" → "Inspection"

**STEP 3: NUMBERS-FIRST QAQC FORMATTING**
- **Format: B-{NUMBERS_FIRST_LOCATION} {EXACT_TEST_TYPE}.pdf**
- **Numbers/patterns appear first** in the location
- **Use the COMPLETE location text** from density test data table
- **Use the PRECISE test type** from "Ladies and Gentlemen" paragraph
- **NO abbreviations** unless explicitly in the source text

**NUMBERS-FIRST PERFECT EXAMPLES:**
- "B-A5-A6 Medium Voltage Trench Compaction Test.pdf"
- "B-B-12 Sub Station Pad Area Concrete Break Test.pdf"
- "B-A-5, A-6 Medium Voltage Trench Density Test.pdf"
- "B-Tracker Foundation A5-A6 Pile Testing.pdf"
- "B-Access Road for BESS Inspection.pdf"

**NUMBERS-FIRST EXTRACTION STRATEGY:**
1. **Identify number patterns** in location text
2. **Move numbers to the beginning** of the location
3. **Preserve all other text** exactly as found
4. **Maintain original spacing and punctuation**

**ENHANCED NUMBERS-FIRST RULES:**
1. **Location extraction with numbers priority:**
   - Primary: Density test data table "Location" column
   - Extract numbers/patterns first, then remaining text
   - Examples: "Medium Voltage Trench A5-A6" → "A5-A6 Medium Voltage Trench"

2. **Test type extraction priority:**
   - Primary: "Ladies and Gentlemen" paragraph (mandatory)
   - Secondary: First paragraph after "Ladies and Gentlemen"
   - Tertiary: Document title or header

3. **Quality checks:**
   - Numbers/patterns must appear first in location
   - Location must be from a table/grid format
   - Test type must be from "Ladies and Gentlemen" paragraph
   - Return ONLY the filename - no explanations

**NUMBERS-FIRST EXCELLENT EXAMPLES:**
- "B-A5-A6 Medium Voltage Trench Compaction Test.pdf"
- "B-B-12 Sub Station Pad Area Concrete Break Test.pdf"
- "B-A-5, A-6 Medium Voltage Trench Density Test.pdf"
- "B-Tracker Foundation A5-A6 Pile Testing.pdf"
- "B-Access Road for BESS Inspection Report.pdf"

Execute this numbers-first extraction with 100% accuracy every time.`;

        // Define the embedded user prompt
        const embeddedUserPrompt = `Analyze this construction test report document and extract the filename using the QAQC naming convention. Return ONLY the filename.`;

        // Create an assistant that can analyze the file
        const assistant = await openai.beta.assistants.create({
            name: "Document Analyzer",
            instructions: systemPrompt || embeddedSystemPrompt,
            model: "gpt-4o",
            tools: [{ type: "file_search" }]
        });

        // Create a thread with the file
        const thread = await openai.beta.threads.create({
            messages: [
                {
                    role: "user",
                    content: userPrompt || embeddedUserPrompt,
                    attachments: [
                        { file_id: file.id, tools: [{ type: "file_search" }] }
                    ]
                }
            ]
        });

        // Run the assistant
        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: assistant.id
        });

        // Wait for completion
        let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        while (runStatus.status !== 'completed') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        }

        // Get the response
        const messages = await openai.beta.threads.messages.list(thread.id);
        const lastMessage = messages.data[0];
        const newName = lastMessage.content[0].text.value.trim();

        // Clean up resources
        await openai.beta.threads.del(thread.id);
        await openai.beta.assistants.del(assistant.id);
        await openai.files.del(file.id);

        // Clean up the filename
        let cleanName = newName.replace(/['"]/g, '').trim();
        if (!cleanName.includes('.')) {
            cleanName += '.pdf';
        }
        
        cleanName = sanitizeFilename(cleanName);

        res.json({ 
            newName: cleanName,
            originalName: originalName,
            confidence: 0.9
        });

    } catch (error) {
        console.error('Error in analyze endpoint:', error);
        res.status(500).json({ 
            error: 'Failed to analyze document',
            details: error.message 
        });
    }
});

// Serve static files
app.use(express.static(__dirname));

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        details: error.message 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Make sure to set OPENAI_API_KEY environment variable');
    console.log(`Open http://localhost:${PORT} to access the application`);
});

module.exports = app;
