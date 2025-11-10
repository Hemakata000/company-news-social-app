// Load environment variables as early as possible
import dotenv from 'dotenv';

// Load .env.local first (for local development)
dotenv.config({ path: '.env.local' });

// Load .env as fallback
dotenv.config();

// Export a dummy value to ensure this module is imported
export const envLoaded = true;
