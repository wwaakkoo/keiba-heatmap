/**
 * バリデーション関連の型定義
 */

// バリデーションエラー
export interface ValidationError {
  field: string;
  value: unknown;
  message: string;
  expectedFormat?: string;
}

// バリデーション結果
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// データパース結果
export interface ParseResult<T> {
  success: boolean;
  data?: T;
  errors: ValidationError[];
  warnings?: string[];
}
