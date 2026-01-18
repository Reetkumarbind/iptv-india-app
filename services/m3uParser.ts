
import { IPTVChannel } from '../types.ts';

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

        // Basic sanitization without SecurityService
        const name = nameMatch ? nameMatch[1].trim().replace(/[<>]/g, '') : 'Unknown Channel';
        const group = groupMatch ? groupMatch[1].replace(/[<>]/g, '') : 'General';
        const id = idMatch ? idMatch[1].replace(/[<>]/g, '') : `channel-${i}`;
        const language = langMatch ? langMatch[1].replace(/[<>]/g, '') : 'General';

        // Specific logo replacement logic
        let logo = logoMatch ? logoMatch[1].replace(/[<>]/g, '') : null;
        if (logo === 'https://jiotvimages.cdn.jio.com/dare_images/images/4_TV.png') {
          logo = 'https://reetkumarbind.netlify.app/reet.JPG';
        }

        currentChannel = {
          id: id || `channel-${i}`,
          name: name || 'Unknown Channel',
          logo: logo,
          group: group || 'General',
          language: language || 'General',
        };
      } else if (line.startsWith('http')) {
        // Basic URL validation
        if (currentChannel.name && line.length > 10) {
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

    console.log(`✅ Parsed ${channels.length} valid channels`);
    return channels;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Parsing Error')) {
      throw error;
    }
    throw new Error('Parsing Error: Failed to process the channel data. The file structure might be unsupported.');
  }
};
