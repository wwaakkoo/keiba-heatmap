import { useState, useEffect, useCallback } from 'react';
import { InputSuggestion } from '../schemas/raceInputSchema';

interface UseInputSuggestionsReturn {
  suggestions: InputSuggestion[];
  getSuggestions: (field: string, query: string) => InputSuggestion[];
  addSuggestion: (field: string, value: string) => void;
  clearSuggestions: (field: string) => void;
}

const SUGGESTIONS_STORAGE_KEY = 'race-input-suggestions';
const MAX_SUGGESTIONS_PER_FIELD = 10;

export function useInputSuggestions(): UseInputSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<InputSuggestion[]>([]);

  // ローカルストレージからサジェストデータを読み込み
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SUGGESTIONS_STORAGE_KEY);
      if (stored) {
        const parsedSuggestions = JSON.parse(stored);
        setSuggestions(
          parsedSuggestions.map(
            (s: InputSuggestion & { lastUsed: string }) => ({
              ...s,
              lastUsed: new Date(s.lastUsed),
            })
          )
        );
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  }, []);

  // サジェストデータをローカルストレージに保存
  const saveSuggestions = useCallback((newSuggestions: InputSuggestion[]) => {
    try {
      localStorage.setItem(
        SUGGESTIONS_STORAGE_KEY,
        JSON.stringify(newSuggestions)
      );
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to save suggestions:', error);
    }
  }, []);

  // 特定のフィールドのサジェストを取得
  const getSuggestions = useCallback(
    (field: string, query: string): InputSuggestion[] => {
      if (!query || query.length < 1) return [];

      const fieldSuggestions = suggestions
        .filter(s => s.field === field)
        .filter(s => s.value.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => {
          // 頻度と最終使用日でソート
          const frequencyDiff = b.frequency - a.frequency;
          if (frequencyDiff !== 0) return frequencyDiff;
          return b.lastUsed.getTime() - a.lastUsed.getTime();
        })
        .slice(0, 5); // 最大5件まで表示

      return fieldSuggestions;
    },
    [suggestions]
  );

  // サジェストを追加
  const addSuggestion = useCallback(
    (field: string, value: string) => {
      if (!value || value.trim().length === 0) return;

      const trimmedValue = value.trim();
      const existingIndex = suggestions.findIndex(
        s => s.field === field && s.value === trimmedValue
      );

      let newSuggestions: InputSuggestion[];

      if (existingIndex >= 0) {
        // 既存のサジェストの頻度を更新
        newSuggestions = [...suggestions];
        newSuggestions[existingIndex] = {
          ...newSuggestions[existingIndex],
          frequency: newSuggestions[existingIndex].frequency + 1,
          lastUsed: new Date(),
        };
      } else {
        // 新しいサジェストを追加
        const newSuggestion: InputSuggestion = {
          field,
          value: trimmedValue,
          frequency: 1,
          lastUsed: new Date(),
        };

        newSuggestions = [...suggestions, newSuggestion];
      }

      // フィールドごとの上限を適用
      const fieldSuggestions = newSuggestions.filter(s => s.field === field);
      if (fieldSuggestions.length > MAX_SUGGESTIONS_PER_FIELD) {
        // 頻度と最終使用日でソートして上位のみ保持
        const sortedFieldSuggestions = fieldSuggestions
          .sort((a, b) => {
            const frequencyDiff = b.frequency - a.frequency;
            if (frequencyDiff !== 0) return frequencyDiff;
            return b.lastUsed.getTime() - a.lastUsed.getTime();
          })
          .slice(0, MAX_SUGGESTIONS_PER_FIELD);

        newSuggestions = [
          ...newSuggestions.filter(s => s.field !== field),
          ...sortedFieldSuggestions,
        ];
      }

      saveSuggestions(newSuggestions);
    },
    [suggestions, saveSuggestions]
  );

  // 特定のフィールドのサジェストをクリア
  const clearSuggestions = useCallback(
    (field: string) => {
      const newSuggestions = suggestions.filter(s => s.field !== field);
      saveSuggestions(newSuggestions);
    },
    [suggestions, saveSuggestions]
  );

  return {
    suggestions,
    getSuggestions,
    addSuggestion,
    clearSuggestions,
  };
}
