
import { IPTVChannel } from '../types.ts';

export const fetchAndParseM3U = async (url: string): Promise<IPTVChannel[]> => {
  let text = '';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // Reduced to 10s for faster timeout

  try {
    const response = await fetch(url, { 
      signal: controller.signal,
      cache: 'force-cache' // Use cache for faster loading
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`Network Error: Server responded with ${response.status} (${response.statusText})`);
    }
    text = await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Network Error: Connection timed out. The server might be too slow.');
    }
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

        // Keep original logos
        const logo = logoMatch ? logoMatch[1].replace(/[<>]/g, '') : null;

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
