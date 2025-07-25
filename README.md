# QAQC Document Renamer - AI-Powered Construction Test Report Naming

A sophisticated web application that uses OpenAI GPT-4o to automatically rename construction test reports with perfect QAQC-compliant filenames. Extracts exact locations from density tables and precise test types from "Ladies and Gentlemen" paragraphs.

## 🚀 Features

### ✅ **Perfect QAQC Naming**
- **Numbers-first extraction** - A5-A6, B-12, A-5, A-6 patterns
- **Exact location capture** - Complete text from density test data tables
- **Precise test type identification** - From "Ladies and Gentlemen" paragraphs
- **100% accuracy** - Enhanced AI prompt for perfect extraction

### 🎨 **Premium User Experience**
- **Modern, responsive design** - Works on all devices
- **Premium PDF viewer** - Large modal with sidebar file details
- **Drag-and-drop upload** - Easy file management
- **Real-time processing** - Batch processing with progress tracking
- **Auto-download toggle** - Optional automatic downloads

### 🔧 **Technical Excellence**
- **OpenAI GPT-4o integration** - Latest AI model for document analysis
- **Multi-format support** - PDF, DOCX, TXT, DOC, RTF, ODT
- **Serverless ready** - Optimized for Vercel deployment
- **Clean architecture** - Modular, maintainable code

## 🛠️ Quick Start

### Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/qaqc-document-renamer.git
cd qaqc-document-renamer

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your OpenAI API key

# Start development server
npm run dev
```

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

## 📋 Usage

1. **Upload documents** - Drag and drop or browse files
2. **Process files** - Click "Process Files" to analyze
3. **View results** - See renamed files with numbers-first format
4. **Download files** - Individual or batch download options
5. **Preview documents** - Premium PDF viewer with sidebar details

## 🎯 QAQC Naming Convention

**Format:** `{numbers} {location} {test_type}.pdf`

**Examples:**
- `A5-A6 Medium Voltage Trench Compaction Test.pdf`
- `B-12 Sub Station Pad Area Concrete Break Test.pdf`
- `A-5, A-6 Medium Voltage Trench Density Test.pdf`

## 🔧 Environment Variables

Create a `.env` file with:
```
OPENAI_API_KEY=your-openai-api-key-here
PORT=3000
```

## 🚀 Deployment Options

### Vercel (Recommended)
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

### Other Platforms
- **Netlify** - With serverless functions
- **Heroku** - Traditional hosting
- **AWS Lambda** - Serverless deployment

## 📁 Project Structure

```
├── server.js          # Express server with OpenAI integration
├── index.html         # Frontend interface
├── styles.css         # Modern CSS styling
├── script.js          # Frontend JavaScript
├── vercel.json        # Vercel configuration
├── package.json       # Dependencies and scripts
├── .env.example       # Environment variables template
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## 🧪 Testing

Test the application with sample construction documents:
- PDF test reports
- DOCX inspection reports
- TXT density test results

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - Feel free to use for personal or commercial projects.

## 🆘 Support

For issues or questions:
1. Check the GitHub Issues
2. Review the documentation
3. Create a new issue with details

---

**Built with ❤️ for the construction industry**
#   c a c a n a l g a  
 