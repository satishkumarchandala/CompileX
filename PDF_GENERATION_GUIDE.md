# PDF Auto-Generation Feature Documentation

## Overview

The PDF auto-generation feature allows administrators to automatically create complete learning modules with quiz questions by uploading PDF documents. The system extracts text from PDFs, parses the content, and generates relevant multiple-choice questions.

---

## Features

### 1. **Preview PDF Questions** (Preview Mode)
- Upload a PDF to preview generated questions
- See extracted text preview
- Review question quality before committing
- Does NOT save to database

### 2. **Generate Module from PDF** (Auto-Creation Mode)
- Automatically creates a complete module
- Generates and saves quiz questions
- Assigns next available module number
- Stores extracted content as module context
- Immediately available to students

---

## How It Works

### Backend Processing

#### 1. **PDF Text Extraction** (`pdf_service.py`)
```python
def extract_text_from_pdf(pdf_bytes: bytes) -> str
```
- Uses `pdfminer.six` library
- Extracts all text content from PDF
- Returns plain text string

#### 2. **Question Generation** (`question_service.py`)
```python
def generate_mcqs_from_text(text: str, max_questions: int) -> list
```

**Algorithm**:
1. **Sentence Splitting**: Splits text into meaningful sentences (>20 chars)
2. **Concept Extraction**: Identifies key concepts using:
   - Capitalized terms (e.g., "Lexical Analysis", "Finite Automata")
   - Technical terms with mixed case or numbers
3. **Question Creation**: For each sentence:
   - Finds relevant concept within sentence
   - Generates 3 distractors from text vocabulary
   - Shuffles options randomly
   - Records correct answer index
4. **Quality Control**: Attempts 3x desired questions to ensure quality

**Question Format**:
```json
{
  "question": "According to the text: 'sentence...', which term is most relevant?",
  "options": ["answer", "distractor1", "distractor2", "distractor3"],
  "correctAnswer": 0,
  "difficulty": "medium",
  "source": "pdf"
}
```

#### 3. **Module Creation** (`admin_routes.py`)

**Endpoint**: `POST /admin/pdf/generate-module`

**Parameters**:
- `file`: PDF file (multipart/form-data)
- `courseId`: Target course ID
- `moduleTitle`: Title for new module
- `numQuestions`: Number of questions to generate (5-50)

**Process**:
1. Extract text from PDF
2. Validate text extraction (minimum 100 characters)
3. Determine next module number
4. Create module document with:
   - Auto-incremented module number
   - Extracted text as context (first 2000 chars)
   - `generatedFromPDF: true` flag
5. Generate MCQs from full text
6. Insert questions with:
   - Reference to created module
   - `generatedFromPDF: true` flag
7. Return success response with details

**Response**:
```json
{
  "success": true,
  "moduleId": "...",
  "moduleNo": 6,
  "moduleTitle": "Introduction to Data Structures",
  "questionsCreated": 10,
  "extractedTextLength": 5432,
  "message": "Successfully created module 6 with 10 questions"
}
```

---

## Usage Guide

### For Administrators

#### Method 1: Preview Mode (Test First)
1. Navigate to Admin Dashboard
2. Click **"Preview PDF Questions"**
3. Select PDF file
4. Click **"Preview Questions"**
5. Review generated questions
6. Close dialog (nothing saved)

#### Method 2: Auto-Generation (Direct Creation)
1. Navigate to Admin Dashboard
2. Click **"Generate from PDF"**
3. Fill in form:
   - **Select Course**: Choose target course
   - **Module Title**: Enter descriptive title
   - **Number of Questions**: 5-50 (default: 10)
   - **Choose PDF File**: Upload PDF
4. Click **"Generate Module"**
5. Wait for confirmation
6. New module appears immediately

### For Students

Generated modules appear automatically in:
- **Explore Page**: Module cards with all others
- **Home Page**: Available for enrollment
- **Quiz System**: Questions ready to attempt

---

## Database Schema

### Module Document (with PDF flag)
```javascript
{
  _id: ObjectId,
  courseId: ObjectId,
  moduleNo: 6,
  title: "Auto-Generated Module",
  context: "Extracted text from PDF...",
  videoLinks: [],
  generatedFromPDF: true  // NEW FLAG
}
```

### Question Document (with PDF flag)
```javascript
{
  _id: ObjectId,
  moduleId: ObjectId,
  question: "According to the text...",
  options: ["option1", "option2", "option3", "option4"],
  correctAnswer: 2,
  difficulty: "medium",
  generatedFromPDF: true  // NEW FLAG
}
```

---

## Testing Checklist

### Backend Tests

- [ ] **PDF Upload**
  - [ ] Valid PDF file uploads successfully
  - [ ] Invalid file returns error
  - [ ] Large PDF (>10MB) handles correctly
  - [ ] PDF without text returns error

- [ ] **Text Extraction**
  - [ ] Extracts text from standard PDF
  - [ ] Handles scanned PDFs (no text layer)
  - [ ] Preserves formatting where relevant
  - [ ] Handles special characters

- [ ] **Question Generation**
  - [ ] Generates requested number of questions
  - [ ] Questions are grammatically correct
  - [ ] Options are distinct and relevant
  - [ ] Correct answer is properly marked
  - [ ] Difficulty levels assigned appropriately

- [ ] **Module Creation**
  - [ ] Module number auto-increments correctly
  - [ ] Module appears in database
  - [ ] Questions linked to module
  - [ ] Stats update (totalModules, totalQuestions)

### Frontend Tests

- [ ] **UI Flow**
  - [ ] Both dialogs open correctly
  - [ ] File selection works
  - [ ] Form validation prevents submission with missing fields
  - [ ] Loading state shows during generation
  - [ ] Success message displays
  - [ ] Dialog closes after success

- [ ] **Preview Mode**
  - [ ] Questions display correctly
  - [ ] Correct answers highlighted
  - [ ] Extracted text preview shows
  - [ ] No database changes made

- [ ] **Auto-Generation Mode**
  - [ ] Course dropdown populated
  - [ ] Module title accepts input
  - [ ] Question count validates (5-50)
  - [ ] Generate button disabled until ready
  - [ ] Generates button shows "Generating..." state

### Student Side Tests

- [ ] **Module Visibility**
  - [ ] New module appears in Explore page
  - [ ] Module number is correct
  - [ ] Module title displays properly
  - [ ] Context text available

- [ ] **Quiz Functionality**
  - [ ] Questions load correctly
  - [ ] Options display properly
  - [ ] Can submit quiz
  - [ ] Score calculated correctly
  - [ ] XP and badges awarded
  - [ ] Completion tracking works (≥70%)

- [ ] **Real-Time Updates**
  - [ ] Module appears without manual refresh (visibilitychange)
  - [ ] Stats update on homepage
  - [ ] Completion badges work

---

## API Endpoints

### Preview Endpoint
```http
POST /admin/pdf/upload
Content-Type: multipart/form-data

file: <PDF file>
```

**Response**:
```json
{
  "extractedText": "First 1000 characters...",
  "generatedQuestions": [...]
}
```

### Generation Endpoint
```http
POST /admin/pdf/generate-module
Content-Type: multipart/form-data

file: <PDF file>
courseId: "507f1f77bcf86cd799439011"
moduleTitle: "Introduction to Data Structures"
numQuestions: 10
```

**Response**:
```json
{
  "success": true,
  "moduleId": "507f...",
  "moduleNo": 6,
  "moduleTitle": "Introduction to Data Structures",
  "questionsCreated": 10,
  "extractedTextLength": 5432,
  "message": "Successfully created module 6 with 10 questions"
}
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "No file provided" | File not uploaded | Select PDF file before submitting |
| "Course ID is required" | No course selected | Select course from dropdown |
| "Could not extract meaningful text" | Scanned PDF or image-only | Use PDF with text layer |
| "Failed to generate module" | Server error | Check backend logs, try again |

### Error Messages

All errors show as snackbar notifications with appropriate severity:
- **Error**: Red snackbar
- **Success**: Green snackbar
- **Info**: Blue alert in dialogs

---

## Performance Considerations

### File Size Limits
- Recommended: < 5MB
- Maximum: 10MB (adjust in backend if needed)
- Large files may take 10-30 seconds to process

### Question Generation Time
- Small PDF (< 10 pages): 2-5 seconds
- Medium PDF (10-50 pages): 5-15 seconds
- Large PDF (> 50 pages): 15-30 seconds

### Optimization Tips
- Use PDFs with clear text content
- Avoid scanned images
- Break large documents into smaller modules
- Use descriptive module titles

---

## Future Enhancements

### Potential Improvements
1. **AI-Powered Questions**: Use GPT/LLM for better questions
2. **Multiple Question Types**: True/False, Fill-in-blank
3. **Difficulty Detection**: Auto-assign difficulty based on complexity
4. **Topic Extraction**: Auto-detect and tag topics
5. **Batch Upload**: Process multiple PDFs at once
6. **Question Review**: Allow editing before saving
7. **Image Extraction**: Include diagrams from PDF
8. **Language Support**: Multi-language content extraction

---

## Troubleshooting

### Module Not Appearing

**Check**:
1. Backend logs for errors
2. MongoDB - verify module document created
3. Frontend console for API errors
4. Refresh Explore page (or switch tabs)

### Questions Not Loading

**Check**:
1. Questions collection in MongoDB
2. moduleId correctly references module
3. Quiz endpoint returns questions
4. Browser console for errors

### Poor Question Quality

**Solutions**:
1. Use PDFs with structured content
2. Increase number of questions requested
3. Review and manually edit questions
4. Consider preprocessing PDF for better formatting

---

## Conclusion

The PDF auto-generation feature streamlines content creation by automatically extracting knowledge from documents and transforming it into interactive quizzes. This significantly reduces the time administrators spend manually creating modules and questions, while maintaining quality through intelligent text analysis and question generation algorithms.

**Benefits**:
✅ Rapid content creation (minutes instead of hours)
✅ Consistent question format
✅ Automatic database integration
✅ Immediate student availability
✅ Scalable for large course libraries
