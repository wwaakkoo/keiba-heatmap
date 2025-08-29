import React, { useState, useRef, useEffect } from 'react';
import { Input, InputProps } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import { useInputSuggestions } from '../hooks/useInputSuggestions';

interface SuggestInputProps extends Omit<InputProps, 'onChange'> {
  field: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export function SuggestInput({
  field,
  value,
  onChange,
  onBlur,
  className,
  ...props
}: SuggestInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { getSuggestions, addSuggestion } = useInputSuggestions();
  const suggestions = getSuggestions(field, value);

  // キーボードナビゲーション
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const selectedSuggestion = suggestions[selectedIndex];
          onChange(selectedSuggestion.value);
          addSuggestion(field, selectedSuggestion.value);
          setIsOpen(false);
          setSelectedIndex(-1);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // サジェストアイテムをクリック
  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    addSuggestion(field, suggestion);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // 入力値変更
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(newValue.length > 0);
    setSelectedIndex(-1);
  };

  // フォーカス処理
  const handleFocus = () => {
    if (value.length > 0) {
      setIsOpen(true);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // サジェストリストがクリックされた場合は閉じない
    if (listRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }

    setIsOpen(false);
    setSelectedIndex(-1);

    // 値が入力されている場合はサジェストに追加
    if (value.trim()) {
      addSuggestion(field, value.trim());
    }

    onBlur?.();
  };

  // 選択されたアイテムをスクロール表示
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedIndex]);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={className}
        autoComplete="off"
        {...props}
      />

      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.field}-${suggestion.value}`}
              className={cn(
                'px-3 py-2 cursor-pointer text-sm hover:bg-gray-100',
                {
                  'bg-blue-100 text-blue-900': index === selectedIndex,
                }
              )}
              onMouseDown={e => {
                e.preventDefault(); // blurイベントを防ぐ
                handleSuggestionClick(suggestion.value);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex justify-between items-center">
                <span>{suggestion.value}</span>
                <span className="text-xs text-gray-400">
                  {suggestion.frequency}回使用
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
