
import { IPTVChannel } from '../types';

export interface EPGProgram {
  title: string;
  description: string;
  start: number; // timestamp
  end: number;   // timestamp
  category: string;
}

export class EPGService {
  private static programs: Record<string, EPGProgram[]> = {};

  private static MOCK_TITLES: Record<string, string[]> = {
    'News': ['Modern World News', 'Evening Report', 'Economic Update', 'Global Perspective', 'Local Headlines', 'Inside Politics'],
    'Sports': ['Live League Match', 'Championship Finals', 'Sports Talk Live', 'Game Highlights', 'Classic Matches', 'Athlete Spotlight'],
    'Movies': ['Action Blockbuster', 'Romance in the City', 'Classic Cinema', 'Horror Night', 'Sci-Fi Adventure', 'Animated Feature'],
    'Music': ['Top 40 Hits', 'Classic Rock Hour', 'Jazz Vibes', 'Midnight Melodies', 'Pop Pulse', 'Indie Spotlight'],
    'Kids': ['Cartoon Adventures', 'Learning Fun', 'Bedtime Stories', 'Magical Journey', 'Superhero Tales', 'Animal Kingdom'],
    'Entertainment': ['Reality Redefined', 'Talk Show Tonight', 'Comedy Central', 'Talent Search', 'Drama Series', 'Travel Diaries'],
    'General': ['Daily Life', 'World Wonders', 'Documentary Hour', 'Nature Secrets', 'History Uncovered', 'Mystery Files'],
  };

  private static MOCK_DESCRIPTIONS = [
    'A deep dive into the latest events shaping our world today.',
    'Expert analysis and commentary from leading professionals in the field.',
    'An exciting journey through stories that capture the imagination.',
    'Relive the most memorable moments with exclusive behind-the-scenes footage.',
    'Stay informed with up-to-the-minute coverage of significant breakthroughs.',
    'Entertainment for the whole family with colorful characters and engaging plots.'
  ];

  static getProgramForChannel(channel: IPTVChannel, time: number = Date.now()): EPGProgram {
    const channelId = channel.id;
    const hour = new Date(time).getHours();
    
    // Use channel ID as seed for consistency
    const seed = this.stringToSeed(channelId + hour);
    const category = channel.group || 'General';
    const titles = this.MOCK_TITLES[category] || this.MOCK_TITLES['General'];
    
    const title = titles[seed % titles.length];
    const description = this.MOCK_DESCRIPTIONS[seed % this.MOCK_DESCRIPTIONS.length];
    
    // Program starts at the beginning of the current hour or half-hour
    const start = new Date(time);
    start.setMinutes(start.getMinutes() < 30 ? 0 : 30, 0, 0);
    
    const end = new Date(start.getTime());
    end.setMinutes(end.getMinutes() + 30); // 30-minute slots

    return {
      title,
      description,
      start: start.getTime(),
      end: end.getTime(),
      category
    };
  }

  static getNextProgramForChannel(channel: IPTVChannel, time: number = Date.now()): EPGProgram {
    const nextTime = time + 30 * 60 * 1000; // 30 minutes later
    return this.getProgramForChannel(channel, nextTime);
  }

  private static stringToSeed(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}
