import { AppShell, Navigation, PageContainer, Section } from '@/components';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Home, BarChart3, TrendingUp, Settings } from 'lucide-react';

const navigationItems = [
  { label: 'ホーム', href: '/', icon: <Home />, active: true },
  { label: '予想', href: '/prediction', icon: <TrendingUp /> },
  { label: '分析', href: '/analysis', icon: <BarChart3 /> },
  { label: '設定', href: '/settings', icon: <Settings /> },
];

function App() {
  return (
    <ErrorBoundary>
      <AppShell
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">競馬予想アプリ</h1>
            </div>
            <Navigation items={navigationItems} />
          </div>
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">
              © 2024 競馬予想アプリ. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              統計分析ベースの競馬予想システム
            </p>
          </div>
        }
      >
        <PageContainer>
          <Section
            title="ダッシュボード"
            description="競馬予想アプリへようこそ。統計分析に基づいた合理的な予想をサポートします。"
          >
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>今日の予想</CardTitle>
                  <CardDescription>
                    本日開催されるレースの予想を確認できます
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">予想を見る</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>収支管理</CardTitle>
                  <CardDescription>
                    投資記録と収支状況を管理できます
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    収支を確認
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>パフォーマンス分析</CardTitle>
                  <CardDescription>
                    予想精度と投資成果を分析できます
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" className="w-full">
                    分析を見る
                  </Button>
                </CardContent>
              </Card>
            </div>
          </Section>

          <Section title="最近の活動">
            <Card>
              <CardHeader>
                <CardTitle>システム状況</CardTitle>
                <CardDescription>
                  UIフレームワークのセットアップが完了しました
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">
                      Tailwind CSS セットアップ完了
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">
                      shadcn/ui コンポーネント導入完了
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">
                      レイアウトコンポーネント作成完了
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Section>
        </PageContainer>
      </AppShell>
    </ErrorBoundary>
  );
}

export default App;
