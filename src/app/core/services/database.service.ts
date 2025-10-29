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
  private readonly DB_VERSION = 2; // Incrementar cuando hay cambios en el esquema
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
      await this.runMigrations();
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

  private async runMigrations(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Verificar si existe la columna serverId
      const tableInfo = await this.db.query(
        "PRAGMA table_info(tasks)"
      );

      const hasServerId = tableInfo.values?.some(
        (column: any) => column.name === 'serverId'
      );

      if (!hasServerId) {
        console.log('[Database] Migrando: Agregando columna serverId');
        await this.db.execute(
          'ALTER TABLE tasks ADD COLUMN serverId TEXT'
        );
        console.log('[Database] Migración completada: serverId agregado');
      }

      // Verificar si existe la columna syncStatus
      const hasSyncStatus = tableInfo.values?.some(
        (column: any) => column.name === 'syncStatus'
      );

      if (!hasSyncStatus) {
        console.log('[Database] Migrando: Agregando columna syncStatus');
        await this.db.execute(
          "ALTER TABLE tasks ADD COLUMN syncStatus TEXT DEFAULT 'pending'"
        );
        console.log('[Database] Migración completada: syncStatus agregado');
      }
    } catch (error) {
      console.error('[Database] Error en migraciones:', error);
      throw error;
    }
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
