import { db } from '../db';
import { quizzes, questions, insertQuizSchema, insertQuestionSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Sample quiz for testing micro-games
const sampleMicroGameQuiz = {
  title: "Relationship Communication Game",
  description: "Test your knowledge about communication in relationships with fun micro-games!",
  type: "multiplayer",
  category: "couple_vs_couple",
  duration: 15,
  points: 200,
  image: null
};

const sampleQuizQuestions = [
  {
    text: "What's the most important aspect of communication in a relationship?",
    options: [
      "Active listening",
      "Speaking clearly",
      "Expressing emotions",
      "Frequent texting"
    ]
  },
  {
    text: "Which of these is a healthy communication habit?",
    options: [
      "Taking turns speaking and listening",
      "Bringing up past mistakes",
      "Assuming what your partner means",
      "Interrupting to make your point"
    ]
  },
  {
    text: "When is the best time to discuss a serious relationship issue?",
    options: [
      "When both are calm and have time",
      "During a social gathering",
      "Just before bedtime",
      "In the middle of an argument"
    ]
  },
  {
    text: "Which statement about non-verbal communication is true?",
    options: [
      "It often conveys more than words",
      "It's not important in close relationships",
      "It means the same thing in all cultures",
      "It's always intentional"
    ]
  },
  {
    text: "What is a good approach when your partner is upset?",
    options: [
      "Listen without judging",
      "Tell them to calm down",
      "Fix their problem immediately",
      "Give them space for a few days"
    ]
  }
];

// Create a quiz with micro-game questions for testing
export async function seedMicroGameQuiz() {
  try {
    // Check if we already have at least one quiz in the coupled_vs_couple category
    const existingQuizzes = await db.select()
      .from(quizzes)
      .where(eq(quizzes.category, 'couple_vs_couple'));
    
    if (existingQuizzes.length > 0) {
      console.log('Found existing quiz in couple_vs_couple category. Skipping micro-game quiz seed.');
      return;
    }
    
    console.log('Creating sample micro-game quiz...');
    
    // Create the quiz
    const validatedQuiz = insertQuizSchema.parse(sampleMicroGameQuiz);
    const [quiz] = await db.insert(quizzes)
      .values(validatedQuiz)
      .returning();
    
    console.log(`Created quiz: ${quiz.title} (ID: ${quiz.id})`);
    
    // Create the questions
    for (const questionData of sampleQuizQuestions) {
      const validatedQuestion = insertQuestionSchema.parse({
        ...questionData,
        quizId: quiz.id
      });
      
      await db.insert(questions)
        .values(validatedQuestion)
        .returning();
    }
    
    console.log(`Added ${sampleQuizQuestions.length} questions to quiz.`);
    
    return quiz;
  } catch (error) {
    console.error('Error seeding micro-game quiz:', error);
    throw error;
  }
}