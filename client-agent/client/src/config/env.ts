// src/config/env.ts
import * as dotenv from 'dotenv';
import * as path from 'path';

export function loadEnv(envPath: string = '../.env'): void {
  try {
    const result = dotenv.config({ path: path.resolve(__dirname, envPath) });
    
    if (result.error) {
      throw result.error;
    }
    
    console.log('Environment variables loaded successfully');
  } catch (error) {
    console.error('Error loading environment variables:', error);
  }
}