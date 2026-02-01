import re
import random


def _split_sentences(text: str):
    sentences = re.split(r'[\.!?\n]+', text)
    return [s.strip() for s in sentences if len(s.strip()) > 20]


def _keywords(sentence: str):
    words = re.findall(r'[A-Za-z]{4,}', sentence)
    # naive keywords: top 5 unique words
    uniq = []
    for w in words:
        wlow = w.lower()
        if wlow not in uniq:
            uniq.append(wlow)
    return uniq[:5]


def _extract_concepts(text: str):
    """Extract key concepts from text for question generation"""
    # Find capitalized terms (potential concepts)
    concepts = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
    # Find technical terms (words with capital letters or numbers)
    technical = re.findall(r'\b[A-Za-z]+(?:[A-Z][a-z]*|[0-9]+)\b', text)
    
    all_concepts = concepts + technical
    # Remove duplicates while preserving order
    seen = set()
    unique = []
    for c in all_concepts:
        c_lower = c.lower()
        if c_lower not in seen and len(c) >= 4:
            seen.add(c_lower)
            unique.append(c)
    
    return unique[:50]  # Return top 50 concepts


def _create_question_from_sentence(sentence: str, concepts: list, all_words: list) -> dict:
    """Create a MCQ from a sentence"""
    # Try to find a concept in the sentence
    sentence_lower = sentence.lower()
    answer = None
    
    for concept in concepts:
        if concept.lower() in sentence_lower:
            answer = concept
            break
    
    if not answer:
        # Fallback to keyword selection
        keys = _keywords(sentence)
        if not keys:
            return None
        answer = random.choice(keys)
    
    # Generate distractors
    distractors = [w for w in all_words if w.lower() != answer.lower() and len(w) >= 4]
    random.shuffle(distractors)
    
    # Create options
    # Ensure unique distractors
    distractors = list(set([w for w in all_words if w.lower() != answer.lower() and len(w) >= 4]))
    random.shuffle(distractors)
    
    if not distractors:
        return None
        
    options = [answer] + distractors[:3]
    random.shuffle(options)
    correct_index = options.index(answer)
    
    # Create question text
    question_text = f"According to the text: '{sentence[:150]}{'...' if len(sentence) > 150 else ''}', which term is most relevant?"
    
    return {
        'question': question_text,
        'options': options,
        'correctAnswer': correct_index,
        'difficulty': 'medium',
        'source': 'pdf'
    }


def generate_mcqs_from_text(text: str, max_questions: int = 5):
    """Generate multiple choice questions from PDF text"""
    sentences = _split_sentences(text)
    concepts = _extract_concepts(text)
    all_words = list(set(re.findall(r'[A-Za-z]{4,}', text)))
    
    questions = []
    attempted = 0
    
    for s in sentences:
        if len(questions) >= max_questions:
            break
        
        attempted += 1
        if attempted > max_questions * 3:  # Try at most 3x the desired number
            break
        
        q = _create_question_from_sentence(s, concepts, all_words)
        if q:
            questions.append(q)
    
    return questions
