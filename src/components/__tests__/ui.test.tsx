import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loading } from '@/components/common/Loading';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

describe('UI Components', () => {
  describe('Button', () => {
    it('renders with default variant', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-primary');
    });

    it('renders with different variants', () => {
      render(<Button variant="outline">Outline Button</Button>);
      const button = screen.getByRole('button', { name: 'Outline Button' });
      expect(button).toHaveClass('border');
    });

    it('renders with different sizes', () => {
      render(<Button size="sm">Small Button</Button>);
      const button = screen.getByRole('button', { name: 'Small Button' });
      expect(button).toHaveClass('h-9');
    });
  });

  describe('Card', () => {
    it('renders card with all components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Test Content</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('Loading', () => {
    it('renders spinner variant by default', () => {
      render(<Loading />);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('renders with text', () => {
      render(<Loading text="Loading..." />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders skeleton variant', () => {
      render(<Loading variant="skeleton" />);
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders dots variant', () => {
      render(<Loading variant="dots" />);
      const dots = document.querySelectorAll('.animate-bounce');
      expect(dots).toHaveLength(3);
    });
  });

  describe('ErrorBoundary', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    it('renders children when no error', () => {
      render(
        <ErrorBoundary>
          <div>No error content</div>
        </ErrorBoundary>
      );
      expect(screen.getByText('No error content')).toBeInTheDocument();
    });

    it('renders error fallback when error occurs', () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      expect(
        screen.getByText('申し訳ございません。予期しないエラーが発生しました。')
      ).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });
});
