import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the app title', () => {
    render(<App />);
    expect(screen.getByText('競馬予想アプリ')).toBeInTheDocument();
  });

  it('shows setup completion message', () => {
    render(<App />);
    expect(screen.getByText('開発環境セットアップ完了')).toBeInTheDocument();
  });
});
