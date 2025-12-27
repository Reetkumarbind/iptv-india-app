
import { IPTVChannel } from '../types';

export const fetchAndParseM3U = async (url: string): Promise<IPTVChannel[]> => {
  let text = '';
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network Error: Server responded with ${response.status} (${response.statusText})`);
    }
    text = await response.text();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Network Error')) {
      throw error;
    }
    throw new Error('Network Error: Unable to reach the playlist provider. Please check your internet connection.');
  }

  try {
    if (!text || !text.includes('#EXTM3U')) {
      throw new Error('Parsing Error: The file provided is not a valid M3U playlist.');
    }

    const channels: IPTVChannel[] = [];
    const lines = text.split('\n');
    
    let currentChannel: Partial<IPTVChannel> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('#EXTINF:')) {
        const nameMatch = line.match(/,(.*)$/);
        const logoMatch = line.match(/tvg-logo="([^"]*)"/);
        const groupMatch = line.match(/group-title="([^"]*)"/);
        const idMatch = line.match(/tvg-id="([^"]*)"/);
        const langMatch = line.match(/tvg-language="([^"]*)"/);

        currentChannel = {
          id: idMatch ? idMatch[1] : `channel-${i}`,
          name: nameMatch ? nameMatch[1].trim() : 'Unknown Channel',
          logo: logoMatch ? logoMatch[1] : null,
          group: groupMatch ? groupMatch[1] : 'General',
          language: langMatch ? langMatch[1] : 'General',
        };
      } else if (line.startsWith('http')) {
        if (currentChannel.name) {
          channels.push({
            ...currentChannel as IPTVChannel,
            url: line
          });
          currentChannel = {};
        }
      }
    }
    
    if (channels.length === 0) {
      throw new Error('Parsing Error: No valid channels found in the playlist.');
    }

    return channels;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Parsing Error')) {
      throw error;
    }
    throw new Error('Parsing Error: Failed to process the channel data. The file structure might be unsupported.');
  }
};
