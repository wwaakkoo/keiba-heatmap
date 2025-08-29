import { Table } from 'dexie';
import { db } from '../database';

/**
 * データベース操作の結果型
 */
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * バリデーション結果型
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 基底Repositoryクラス
 * 共通のCRUD操作とエラーハンドリングを提供
 */
export abstract class BaseRepository<T extends { id?: string }> {
  protected table: Table<T>;

  constructor(table: Table<T>) {
    this.table = table;
  }

  /**
   * データのバリデーション（サブクラスで実装）
   */
  protected abstract validate(data: Partial<T>): ValidationResult;

  /**
   * エラーハンドリング付きの操作実行
   */
  protected async executeWithErrorHandling<R>(
    operation: () => Promise<R>,
    operationName: string
  ): Promise<OperationResult<R>> {
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`${operationName} failed:`, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * リトライ機能付きの操作実行
   */
  protected async executeWithRetry<R>(
    operation: () => Promise<R>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<R> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        console.warn(
          `Operation failed (attempt ${attempt}/${maxRetries}):`,
          error
        );
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * データの作成
   */
  async create(data: Omit<T, 'id'>): Promise<OperationResult<string>> {
    return this.executeWithErrorHandling(async () => {
      // バリデーション
      const validation = this.validate(data);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // IDを生成して挿入
      const id = await this.executeWithRetry(() => this.table.add(data as T));
      return String(id);
    }, 'create');
  }

  /**
   * IDによるデータの取得
   */
  async findById(id: string): Promise<OperationResult<T | undefined>> {
    return this.executeWithErrorHandling(async () => {
      // IDは文字列または数値の可能性があるため、両方で試す
      const numericId = parseInt(id, 10);
      if (!isNaN(numericId)) {
        return await this.table.get(numericId);
      }
      return await this.table.get(id);
    }, 'findById');
  }

  /**
   * 全データの取得
   */
  async findAll(): Promise<OperationResult<T[]>> {
    return this.executeWithErrorHandling(async () => {
      return await this.table.toArray();
    }, 'findAll');
  }

  /**
   * データの更新
   */
  async update(id: string, data: Partial<T>): Promise<OperationResult<void>> {
    return this.executeWithErrorHandling(async () => {
      // 部分更新の場合はバリデーションをスキップ
      // 必要に応じてサブクラスで個別にバリデーションを実装

      const numericId = parseInt(id, 10);
      const updateCount = await this.executeWithRetry(() =>
        !isNaN(numericId)
          ? this.table.update(numericId, data)
          : this.table.update(id, data)
      );

      if (updateCount === 0) {
        throw new Error(`Record with id ${id} not found`);
      }
    }, 'update');
  }

  /**
   * データの削除
   */
  async delete(id: string): Promise<OperationResult<void>> {
    return this.executeWithErrorHandling(async () => {
      // IDは文字列または数値の可能性があるため、両方で試す
      const numericId = parseInt(id, 10);
      if (!isNaN(numericId)) {
        await this.executeWithRetry(() => this.table.delete(numericId));
      } else {
        await this.executeWithRetry(() => this.table.delete(id));
      }
    }, 'delete');
  }

  /**
   * 条件による検索
   */
  async findWhere(
    predicate: (item: T) => boolean
  ): Promise<OperationResult<T[]>> {
    return this.executeWithErrorHandling(async () => {
      return await this.table.filter(predicate).toArray();
    }, 'findWhere');
  }

  /**
   * カウント取得
   */
  async count(): Promise<OperationResult<number>> {
    return this.executeWithErrorHandling(async () => {
      return await this.table.count();
    }, 'count');
  }

  /**
   * トランザクション実行
   */
  async executeTransaction<R>(
    operation: () => Promise<R>
  ): Promise<OperationResult<R>> {
    return this.executeWithErrorHandling(async () => {
      return await db.transaction('rw', this.table, operation);
    }, 'transaction');
  }
}
