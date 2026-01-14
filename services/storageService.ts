import { WatchHistoryItem, UserPreferences, ChannelRating, StreamHealth } from '../types';

const STORAGE_KEYS = {
  FAVORITES: 'iptv_favorites_v2',
  WATCH_HISTORY: 'iptv_watch_history_v1',
  USER_PREFERENCES: 'iptv_user_preferences_v1',
  CHANNEL_RATINGS: 'iptv_channel_ratings_v1',
  STREAM_HEALTH: 'iptv_stream_health_v1',
  BANDWIDTH_USAGE: 'iptv_bandwidth_usage_v1',
  RECENTLY_WATCHED: 'iptv_recently_watched_v1'
};

export class StorageService {
  // Simple storage methods without encryption for normal mode
  private static setItem(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  private static getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error('Failed to load data:', error);
      return defaultValue;
    }
  }

  // Favorites Management
  static getFavorites(): string[] {
    return this.getItem(STORAGE_KEYS.FAVORITES, []);
  }

  static saveFavorites(favorites: string[]): void {
    this.setItem(STORAGE_KEYS.FAVORITES, favorites);
    console.log(`Favorites saved: ${favorites.length} items`);
  }

  static addFavorite(channelId: string): void {
    try {
      const favorites = this.getFavorites();
      if (!favorites.includes(channelId)) {
        favorites.push(channelId);
        this.saveFavorites(favorites);
      }
    } catch (error) {
      console.error('Failed to add favorite:', error);
    }
  }

  static removeFavorite(channelId: string): void {
    try {
      const favorites = this.getFavorites();
      const filtered = favorites.filter(id => id !== channelId);
      this.saveFavorites(filtered);
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  }

  // Watch History
  static getWatchHistory(): WatchHistoryItem[] {
    return this.getItem(STORAGE_KEYS.WATCH_HISTORY, []);
  }

  static addToWatchHistory(item: WatchHistoryItem): void {
    try {
      const history = this.getWatchHistory();
      const existingIndex = history.findIndex(h => h.channelId === item.channelId);
      
      if (existingIndex >= 0) {
        // Update existing entry with latest timestamp and accumulated duration
        const existing = history[existingIndex];
        history[existingIndex] = {
          ...item,
          duration: existing.duration + item.duration,
          timestamp: item.timestamp // Use latest timestamp
        };
      } else {
        history.unshift(item);
      }
      
      // Keep only last 100 items for better performance
      const trimmed = history.slice(0, 100);
      this.setItem(STORAGE_KEYS.WATCH_HISTORY, trimmed);
      
      // Also update recently watched cache
      this.setItem(STORAGE_KEYS.RECENTLY_WATCHED, trimmed.slice(0, 20));
      
      console.log(`Watch history updated: ${item.channelName} (${item.duration}s)`);
    } catch (error) {
      console.error('Failed to save watch history:', error);
    }
  }

  static getRecentlyWatched(limit: number = 10): WatchHistoryItem[] {
    return this.getWatchHistory()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // User Preferences
  static getUserPreferences(): UserPreferences {
    return this.getItem(STORAGE_KEYS.USER_PREFERENCES, this.getDefaultPreferences());
  }

  static saveUserPreferences(preferences: Partial<UserPreferences>): void {
    try {
      const current = this.getUserPreferences();
      const updated = { ...current, ...preferences };
      this.setItem(STORAGE_KEYS.USER_PREFERENCES, updated);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  private static getDefaultPreferences(): UserPreferences {
    return {
      theme: 'dark',
      autoPlay: true,
      defaultQuality: 'auto',
      keyboardShortcuts: true,
      showBandwidthUsage: false
    };
  }

  // Channel Ratings
  static getChannelRatings(): ChannelRating[] {
    return this.getItem(STORAGE_KEYS.CHANNEL_RATINGS, []);
  }

  static addChannelRating(rating: ChannelRating): void {
    try {
      const ratings = this.getChannelRatings();
      const existingIndex = ratings.findIndex(r => r.channelId === rating.channelId);
      
      if (existingIndex >= 0) {
        ratings[existingIndex] = rating;
      } else {
        ratings.push(rating);
      }
      
      this.setItem(STORAGE_KEYS.CHANNEL_RATINGS, ratings);
    } catch (error) {
      console.error('Failed to save rating:', error);
    }
  }

  static getChannelRating(channelId: string): ChannelRating | null {
    const ratings = this.getChannelRatings();
    return ratings.find(r => r.channelId === channelId) || null;
  }

  // Stream Health
  static getStreamHealth(): StreamHealth[] {
    return this.getItem(STORAGE_KEYS.STREAM_HEALTH, []);
  }

  static updateStreamHealth(health: StreamHealth): void {
    try {
      const healthData = this.getStreamHealth();
      const existingIndex = healthData.findIndex(h => h.channelId === health.channelId);
      
      if (existingIndex >= 0) {
        healthData[existingIndex] = health;
      } else {
        healthData.push(health);
      }
      
      // Keep only recent data (last 24 hours)
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const filtered = healthData.filter(h => h.lastChecked > oneDayAgo);
      
      this.setItem(STORAGE_KEYS.STREAM_HEALTH, filtered);
    } catch (error) {
      console.error('Failed to save stream health:', error);
    }
  }

  // Bandwidth Usage
  static getBandwidthUsage(): { [date: string]: number } {
    return this.getItem(STORAGE_KEYS.BANDWIDTH_USAGE, {});
  }

  static addBandwidthUsage(bytes: number): void {
    try {
      const today = new Date().toISOString().split('T')[0];
      const usage = this.getBandwidthUsage();
      usage[today] = (usage[today] || 0) + bytes;
      
      // Keep only last 30 days of data
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const filtered = Object.fromEntries(
        Object.entries(usage).filter(([date]) => date >= thirtyDaysAgo)
      );
      
      this.setItem(STORAGE_KEYS.BANDWIDTH_USAGE, filtered);
    } catch (error) {
      console.error('Failed to save bandwidth usage:', error);
    }
  }

  // Export/Import
  static exportData(): string {
    const data = {
      favorites: localStorage.getItem(STORAGE_KEYS.FAVORITES),
      watchHistory: localStorage.getItem(STORAGE_KEYS.WATCH_HISTORY),
      preferences: localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES),
      ratings: localStorage.getItem(STORAGE_KEYS.CHANNEL_RATINGS),
      timestamp: Date.now()
    };
    return JSON.stringify(data, null, 2);
  }

  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.favorites) localStorage.setItem(STORAGE_KEYS.FAVORITES, data.favorites);
      if (data.watchHistory) localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, data.watchHistory);
      if (data.preferences) localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, data.preferences);
      if (data.ratings) localStorage.setItem(STORAGE_KEYS.CHANNEL_RATINGS, data.ratings);
      
      return true;
    } catch {
      return false;
    }
  }
}