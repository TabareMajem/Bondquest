import { seedQuizzes } from './quizSeed';
import { seedMicroGameQuiz } from './microGameQuizSeed';

/**
 * Main seed function that runs all seed operations
 */
export async function runSeed() {
  try {
    console.log('Starting database seed operations...');
    
    // Run quiz seeding
    await seedQuizzes();
    
    // Run micro-game quiz seeding
    await seedMicroGameQuiz();
    
    console.log('All seed operations completed successfully!');
    return true;
  } catch (error) {
    console.error('Error during seed operations:', error);
    return false;
  }
}

// For ESM this is the way to check if file is executed directly
// Not using this for now as we're calling runSeed() from server/index.ts
// import { fileURLToPath } from 'url';
// if (process.argv[1] === fileURLToPath(import.meta.url)) {
//   runSeed();
// }