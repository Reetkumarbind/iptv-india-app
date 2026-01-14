
export interface IPTVChannel {
  id: string;
  name: string;
  logo: string | null;
  url: string;
  group: string;
  language: string;
  country?: string;
  resolution?: string;
  rating?: number;
  viewCount?: number;
}

export interface PlayerState {
  currentChannelIndex: number;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  playbackRate: number;
  quality: string;
}

export interface WatchHistoryItem {
  channelId: string;
  channelName: string;
  timestamp: number;
  duration: number;
  logo?: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  autoPlay: boolean;
  defaultQuality: string;
  keyboardShortcuts: boolean;
  showBandwidthUsage: boolean;
}

export interface StreamHealth {
  channelId: string;
  status: 'healthy' | 'slow' | 'failed';
  latency: number;
  lastChecked: number;
}

export interface ChannelRating {
  channelId: string;
  rating: number;
  comment?: string;
  timestamp: number;
}
