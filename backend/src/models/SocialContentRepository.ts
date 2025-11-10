import { pool } from '../config/database.js';
import { SocialContent, CreateSocialContentData, SocialPlatform } from './types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SOCIAL_FILE = path.join(__dirname, '../../data/social.json');

// Helper to read social content from JSON
function readSocialContent(): SocialContent[] {
  try {
    const data = fs.readFileSync(SOCIAL_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper to write social content to JSON
function writeSocialContent(content: SocialContent[]): void {
  fs.writeFileSync(SOCIAL_FILE, JSON.stringify(content, null, 2));
}

export class SocialContentRepository {
  // Create new social content
  static async create(data: CreateSocialContentData): Promise<SocialContent> {
    try {
      const contents = readSocialContent();
      const newId = contents.length > 0 ? Math.max(...contents.map(c => c.id)) + 1 : 1;
      
      const newContent: SocialContent = {
        id: newId,
        article_id: data.article_id,
        platform: data.platform,
        content: data.content,
        hashtags: data.hashtags || [],
        character_count: data.character_count || data.content.length,
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      
      contents.push(newContent);
      writeSocialContent(contents);
      
      return newContent;
    } catch (error) {
      console.error('Error creating social content:', error);
      throw error;
    }
  }

  // Find content by article ID
  static async findByArticleId(articleId: number): Promise<SocialContent[]> {
    try {
      const contents = readSocialContent();
      return contents.filter(c => c.article_id === articleId);
    } catch (error) {
      console.error('Error finding content by article ID:', error);
      throw error;
    }
  }

  // Find content by article ID and platform
  static async findByArticleAndPlatform(
    articleId: number,
    platform: SocialPlatform
  ): Promise<SocialContent | null> {
    try {
      const contents = readSocialContent();
      const content = contents.find(c => c.article_id === articleId && c.platform === platform);
      return content || null;
    } catch (error) {
      console.error('Error finding content by article and platform:', error);
      throw error;
    }
  }

  // Find content by ID
  static async findById(id: number): Promise<SocialContent | null> {
    try {
      const contents = readSocialContent();
      const content = contents.find(c => c.id === id);
      return content || null;
    } catch (error) {
      console.error('Error finding content by ID:', error);
      throw error;
    }
  }

  // Update content
  static async update(id: number, data: Partial<CreateSocialContentData>): Promise<SocialContent | null> {
    try {
      const contents = readSocialContent();
      const index = contents.findIndex(c => c.id === id);
      
      if (index === -1) return null;
      
      contents[index] = {
        ...contents[index],
        ...data
      };
      
      writeSocialContent(contents);
      return contents[index];
    } catch (error) {
      console.error('Error updating content:', error);
      throw error;
    }
  }

  // Delete content
  static async delete(id: number): Promise<boolean> {
    try {
      const contents = readSocialContent();
      const filtered = contents.filter(c => c.id !== id);
      
      if (filtered.length === contents.length) return false;
      
      writeSocialContent(filtered);
      return true;
    } catch (error) {
      console.error('Error deleting content:', error);
      throw error;
    }
  }

  // Delete all content for an article
  static async deleteByArticleId(articleId: number): Promise<number> {
    try {
      const contents = readSocialContent();
      const filtered = contents.filter(c => c.article_id !== articleId);
      const deletedCount = contents.length - filtered.length;
      
      if (deletedCount > 0) {
        writeSocialContent(filtered);
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Error deleting content by article ID:', error);
      throw error;
    }
  }

  // Bulk create social content
  static async createMany(contents: CreateSocialContentData[]): Promise<SocialContent[]> {
    try {
      const existingContents = readSocialContent();
      const newContents: SocialContent[] = [];
      let nextId = existingContents.length > 0 ? Math.max(...existingContents.map(c => c.id)) + 1 : 1;
      
      for (const data of contents) {
        const newContent: SocialContent = {
          id: nextId++,
          article_id: data.article_id,
          platform: data.platform,
          content: data.content,
          hashtags: data.hashtags || [],
          character_count: data.character_count || data.content.length,
          generated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        
        newContents.push(newContent);
      }
      
      if (newContents.length > 0) {
        const allContents = [...existingContents, ...newContents];
        writeSocialContent(allContents);
      }
      
      return newContents;
    } catch (error) {
      console.error('Error creating many contents:', error);
      throw error;
    }
  }

  // Get recent content
  static async findRecent(limit: number = 20): Promise<SocialContent[]> {
    try {
      const contents = readSocialContent();
      return contents
        .sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error finding recent content:', error);
      throw error;
    }
  }
}
