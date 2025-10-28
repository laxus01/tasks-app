import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;
  private readonly DB_NAME = 'todoapp.db';
  private isInitialized = false;

  constructor() {}

  async initializeDatabase(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const platform = Capacitor.getPlatform();
      
      if (platform === 'web') {
        await this.initWebStore();
      }

      this.db = await this.sqlite.createConnection(
        this.DB_NAME,
        false,
        'no-encryption',
        1,
        false
      );

      await this.db.open();
      await this.createTables();
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private async initWebStore(): Promise<void> {
    await this.sqlite.initWebStore();
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const createTasksTable = `
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serverId TEXT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        syncStatus TEXT DEFAULT 'pending'
      );
    `;

    const createSyncMetadataTable = `
      CREATE TABLE IF NOT EXISTS sync_metadata (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        lastSyncTimestamp TEXT NOT NULL
      );
    `;

    await this.db.execute(createTasksTable);
    await this.db.execute(createSyncMetadataTable);
    
    // Inicializar metadata si no existe
    await this.db.run(
      `INSERT OR IGNORE INTO sync_metadata (id, lastSyncTimestamp) VALUES (1, ?)`,
      [new Date(0).toISOString()]
    );
  }

  getDatabase(): SQLiteDBConnection {
    if (!this.db) {
      throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return this.db;
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  /**
   * Obtiene el timestamp de la última sincronización
   */
  async getLastSyncTimestamp(): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const result = await this.db.query('SELECT lastSyncTimestamp FROM sync_metadata WHERE id = 1');
    return result.values?.[0]?.lastSyncTimestamp || new Date(0).toISOString();
  }

  /**
   * Actualiza el timestamp de la última sincronización
   */
  async updateLastSyncTimestamp(timestamp: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    await this.db.run(
      'UPDATE sync_metadata SET lastSyncTimestamp = ? WHERE id = 1',
      [timestamp]
    );
  }
}
