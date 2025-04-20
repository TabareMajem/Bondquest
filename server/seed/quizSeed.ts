import { db } from '../db';
import { quizzes, questions } from '@shared/schema';

/**
 * Seed the database with sample quizzes for testing
 */
export async function seedQuizzes() {
  console.log('Seeding quizzes...');
  
  try {
    // Check if we already have quizzes in the database
    const existingQuizzes = await db.select().from(quizzes);
    
    if (existingQuizzes.length > 0) {
      console.log(`Found ${existingQuizzes.length} existing quizzes. Skipping quiz seeding.`);
      return;
    }
    
    // Seed quizzes for different categories
    const quizData = [
      // Category: couple_vs_couple
      {
        title: "Relationship Trivia Challenge",
        description: "Test your knowledge about relationships against other couples",
        type: "multiplayer",
        category: "couple_vs_couple",
        duration: 15,
        points: 150,
        image: null,
        questions: [
          {
            text: "What percentage of couples say they've improved their relationship by traveling together?",
            options: ["56%", "72%", "84%", "92%"]
          },
          {
            text: "According to research, how often should couples have a date night to maintain relationship satisfaction?",
            options: ["Once a week", "Twice a month", "Once a month", "Daily quality time"]
          },
          {
            text: "What's the most common topic couples argue about?",
            options: ["Money", "Household chores", "Communication", "In-laws"]
          },
          {
            text: "What activity do relationship therapists often recommend for bonding?",
            options: ["Cooking together", "Exercise", "Watching movies", "Playing board games"]
          },
          {
            text: "What percentage of couples report high satisfaction when they share a hobby?",
            options: ["45%", "61%", "78%", "94%"]
          }
        ]
      },
      {
        title: "Love Languages Showdown",
        description: "Compete with other couples to see who knows more about love languages",
        type: "multiplayer",
        category: "couple_vs_couple",
        duration: 10,
        points: 120,
        image: null,
        questions: [
          {
            text: "Which love language focuses on compliments and appreciation?",
            options: ["Words of Affirmation", "Acts of Service", "Quality Time", "Physical Touch"]
          },
          {
            text: "Who developed the concept of the Five Love Languages?",
            options: ["Gary Chapman", "John Gottman", "Sue Johnson", "Esther Perel"]
          },
          {
            text: "Which love language is about helping your partner without being asked?",
            options: ["Acts of Service", "Receiving Gifts", "Quality Time", "Physical Touch"]
          },
          {
            text: "What percentage of people have 'Physical Touch' as their primary love language?",
            options: ["19%", "23%", "31%", "42%"]
          },
          {
            text: "Which is NOT one of the five love languages?",
            options: ["Shared Activities", "Words of Affirmation", "Receiving Gifts", "Quality Time"]
          }
        ]
      },
      
      // Category: partner_vs_partner
      {
        title: "How Well Do You Know Me?",
        description: "Test how well you know your partner's preferences and history",
        type: "partner",
        category: "partner_vs_partner",
        duration: 12,
        points: 100,
        image: null,
        questions: [
          {
            text: "What would your partner say is their favorite way to relax?",
            options: ["Reading a book", "Watching TV", "Taking a walk", "Social media"]
          },
          {
            text: "What food would your partner choose if they could only eat one thing forever?",
            options: ["Pizza", "Pasta", "Tacos", "Sushi"]
          },
          {
            text: "How would your partner describe their ideal vacation?",
            options: ["Beach relaxation", "Urban exploration", "Adventure in nature", "Cultural immersion"]
          },
          {
            text: "What would your partner say is their biggest pet peeve?",
            options: ["Being interrupted", "Messy spaces", "Being late", "Loud chewing"]
          },
          {
            text: "What would your partner say is their biggest fear?",
            options: ["Heights", "Public speaking", "Failure", "Spiders"]
          }
        ]
      },
      {
        title: "Relationship Preferences Quiz",
        description: "See how well you can predict your partner's relationship preferences",
        type: "partner",
        category: "partner_vs_partner",
        duration: 10,
        points: 100,
        image: null,
        questions: [
          {
            text: "How important would your partner say celebrating anniversaries is?",
            options: ["Very important", "Somewhat important", "Nice but not necessary", "Not important at all"]
          },
          {
            text: "What would your partner say is the ideal frequency for date nights?",
            options: ["Multiple times a week", "Once a week", "Once or twice a month", "Special occasions only"]
          },
          {
            text: "How would your partner prefer to resolve a disagreement?",
            options: ["Talk it out immediately", "Take space then discuss", "Write down thoughts first", "Seek outside advice"]
          },
          {
            text: "What type of surprise would your partner most appreciate?",
            options: ["A planned experience", "A thoughtful gift", "A kind gesture or favor", "Public recognition"]
          },
          {
            text: "How does your partner prefer to receive affection?",
            options: ["Verbal compliments", "Physical touch", "Thoughtful gestures", "Quality time together"]
          }
        ]
      },
      
      // Category: memory_lane
      {
        title: "Our Relationship Timeline",
        description: "Test your memory of key moments in your relationship",
        type: "couples",
        category: "memory_lane",
        duration: 12,
        points: 120,
        image: null,
        questions: [
          {
            text: "What was the first movie you watched together?",
            options: ["Action film", "Comedy", "Drama", "Horror"]
          },
          {
            text: "Where did you have your first date?",
            options: ["Restaurant", "Coffee shop", "Park", "Movies"]
          },
          {
            text: "What was your first impression of your partner?",
            options: ["Attractive", "Funny", "Intelligent", "Kind"]
          },
          {
            text: "What was the first gift you gave each other?",
            options: ["Jewelry", "Clothing", "Something handmade", "Experience/ticket"]
          },
          {
            text: "What was your first disagreement about?",
            options: ["Plans/scheduling", "Money", "Communication style", "Friends/family"]
          }
        ]
      },
      {
        title: "Memorable Moments Quiz",
        description: "Recall those special times you've shared together",
        type: "couples",
        category: "memory_lane",
        duration: 10,
        points: 100,
        image: null,
        questions: [
          {
            text: "What did you do for your first Valentine's Day together?",
            options: ["Dinner out", "Cooked at home", "Weekend getaway", "Simple gift exchange"]
          },
          {
            text: "What was the biggest challenge you've overcome as a couple?",
            options: ["Distance", "Financial stress", "Different life goals", "Family issues"]
          },
          {
            text: "What was your most memorable vacation together?",
            options: ["Beach trip", "City exploration", "Road trip", "International travel"]
          },
          {
            text: "What was the first serious conversation you had?",
            options: ["Future goals", "Past relationships", "Family background", "Personal values"]
          },
          {
            text: "What was your first holiday season like together?",
            options: ["Visiting family", "Created own traditions", "Traveled somewhere", "Quiet celebration"]
          }
        ]
      },
      
      // Category: daily_habits
      {
        title: "Morning Routines Quiz",
        description: "How well do you know your partner's morning habits?",
        type: "daily",
        category: "daily_habits",
        duration: 8,
        points: 80,
        image: null,
        questions: [
          {
            text: "What's the first thing your partner does after waking up?",
            options: ["Check phone", "Bathroom", "Stretch", "Make coffee"]
          },
          {
            text: "How does your partner prefer to wake up?",
            options: ["Alarm", "Naturally", "Partner waking them", "Sunlight"]
          },
          {
            text: "What breakfast would your partner choose most days?",
            options: ["Coffee only", "Full breakfast", "Fruit or yogurt", "Skip breakfast"]
          },
          {
            text: "What's your partner's preferred morning beverage?",
            options: ["Coffee", "Tea", "Water", "Juice"]
          },
          {
            text: "How long does your partner's morning routine usually take?",
            options: ["Under 15 minutes", "15-30 minutes", "30-60 minutes", "Over an hour"]
          }
        ]
      },
      {
        title: "Evening Wind-Down Quiz",
        description: "Test your knowledge of your partner's evening habits",
        type: "daily",
        category: "daily_habits",
        duration: 8,
        points: 80,
        image: null,
        questions: [
          {
            text: "What activity helps your partner wind down before bed?",
            options: ["Reading", "TV/movies", "Social media", "Talking/connecting"]
          },
          {
            text: "What time does your partner prefer to go to bed?",
            options: ["Before 10pm", "10pm-11pm", "11pm-midnight", "After midnight"]
          },
          {
            text: "What's your partner's bedtime ritual?",
            options: ["Skincare routine", "Setting alarms", "Checking next day's schedule", "Meditation"]
          },
          {
            text: "How does your partner prefer the bedroom environment?",
            options: ["Completely dark", "Night light", "TV on", "Window open"]
          },
          {
            text: "What does your partner typically do if they can't sleep?",
            options: ["Read", "Use phone", "Get up and do something", "Try relaxation techniques"]
          }
        ]
      }
    ];
    
    // Insert each quiz and its questions
    for (const quiz of quizData) {
      const { questions: questionsList, ...quizInfo } = quiz;
      
      // Insert quiz
      const [createdQuiz] = await db.insert(quizzes)
        .values(quizInfo)
        .returning();
        
      // Insert questions for this quiz
      for (const question of questionsList) {
        await db.insert(questions)
          .values({
            ...question,
            quizId: createdQuiz.id
          });
      }
      
      console.log(`Created quiz: ${quiz.title} with ${questionsList.length} questions`);
    }
    
    console.log('Quiz seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding quizzes:', error);
    throw error;
  }
}