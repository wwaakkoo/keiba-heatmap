import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, AlertTriangle, CheckCircle } from 'lucide-react';
import { RaceInputForm } from '../schemas/raceInputSchema';

interface Step4ConfirmationProps {
  data: Partial<RaceInputForm>;
  onEditStep: (step: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const SURFACE_LABELS = {
  turf: '芝',
  dirt: 'ダート',
} as const;

const TRACK_CONDITION_LABELS = {
  firm: '良',
  good: '稍重',
  yielding: '重',
  soft: '不良',
} as const;

const RACE_CLASS_LABELS = {
  G1: 'G1',
  G2: 'G2',
  G3: 'G3',
  Listed: 'リステッド',
  Open: 'オープン',
  '3勝クラス': '3勝クラス',
  '2勝クラス': '2勝クラス',
  '1勝クラス': '1勝クラス',
  未勝利: '未勝利',
  新馬: '新馬',
} as const;

const GENDER_LABELS = {
  male: '牡',
  female: '牝',
  gelding: 'セ',
};

export function Step4Confirmation({
  data,
  onEditStep,
  onSubmit,
  isSubmitting,
}: Step4ConfirmationProps) {
  const { basicInfo, horsesData, oddsData } = data;

  // データの完全性チェック
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!basicInfo) {
    errors.push('レース基本情報が入力されていません');
  }

  if (!horsesData?.horses || horsesData.horses.length === 0) {
    errors.push('出走馬の情報が入力されていません');
  }

  if (!oddsData?.horses || oddsData.horses.length === 0) {
    errors.push('オッズ情報が入力されていません');
  }

  if (horsesData?.horses && oddsData?.horses) {
    if (horsesData.horses.length !== oddsData.horses.length) {
      warnings.push('出走馬数とオッズ情報の数が一致していません');
    }
  }

  // 重複馬番チェック
  if (horsesData?.horses) {
    const numbers = horsesData.horses.map(h => h.number);
    const duplicates = numbers.filter(
      (num, index) => numbers.indexOf(num) !== index
    );
    if (duplicates.length > 0) {
      errors.push(`重複した馬番があります: ${duplicates.join(', ')}`);
    }
  }

  const canSubmit = errors.length === 0 && !isSubmitting;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">確認・修正</h2>
        <p className="text-sm text-gray-600">
          入力内容を確認し、問題がなければレースデータを保存してください。
        </p>
      </div>

      {/* エラー・警告表示 */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div
              key={index}
              className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md"
            >
              <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          ))}
          {warnings.map((warning, index) => (
            <div
              key={index}
              className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md"
            >
              <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
              <span className="text-sm text-yellow-700">{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* レース基本情報 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">レース基本情報</CardTitle>
          <Button variant="outline" size="sm" onClick={() => onEditStep(1)}>
            <Edit className="w-4 h-4 mr-2" />
            編集
          </Button>
        </CardHeader>
        <CardContent>
          {basicInfo ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">レース日:</span>
                <p>{basicInfo.date}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">競馬場:</span>
                <p>{basicInfo.venue}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">レース番号:</span>
                <p>{basicInfo.raceNumber}R</p>
              </div>
              <div className="col-span-2 md:col-span-3">
                <span className="font-medium text-gray-600">レース名:</span>
                <p>{basicInfo.title}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">距離:</span>
                <p>{basicInfo.distance}m</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">馬場:</span>
                <p>
                  {
                    SURFACE_LABELS[
                      basicInfo.surface as keyof typeof SURFACE_LABELS
                    ]
                  }
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">馬場状態:</span>
                <p>
                  {
                    TRACK_CONDITION_LABELS[
                      basicInfo.trackCondition as keyof typeof TRACK_CONDITION_LABELS
                    ]
                  }
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">クラス:</span>
                <p>
                  {
                    RACE_CLASS_LABELS[
                      basicInfo.raceClass as keyof typeof RACE_CLASS_LABELS
                    ]
                  }
                </p>
              </div>
              {basicInfo.prize && (
                <div>
                  <span className="font-medium text-gray-600">賞金:</span>
                  <p>{basicInfo.prize}万円</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">レース基本情報が入力されていません</p>
          )}
        </CardContent>
      </Card>

      {/* 出走馬情報 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            出走馬情報 ({horsesData?.horses?.length || 0}頭)
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => onEditStep(2)}>
            <Edit className="w-4 h-4 mr-2" />
            編集
          </Button>
        </CardHeader>
        <CardContent>
          {horsesData?.horses && horsesData.horses.length > 0 ? (
            <div className="space-y-3">
              {horsesData.horses.map((horse, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline">{horse.number}</Badge>
                    <div>
                      <p className="font-medium">{horse.name}</p>
                      <p className="text-xs text-gray-600">
                        {horse.age}歳
                        {
                          GENDER_LABELS[
                            horse.gender as keyof typeof GENDER_LABELS
                          ]
                        }{' '}
                        {horse.weight}kg
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p>{horse.jockeyName}</p>
                    <p className="text-xs text-gray-600">{horse.trainerName}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">出走馬情報が入力されていません</p>
          )}
        </CardContent>
      </Card>

      {/* オッズ情報 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">オッズ情報</CardTitle>
          <Button variant="outline" size="sm" onClick={() => onEditStep(3)}>
            <Edit className="w-4 h-4 mr-2" />
            編集
          </Button>
        </CardHeader>
        <CardContent>
          {oddsData?.horses && oddsData.horses.length > 0 ? (
            <div className="space-y-2">
              {oddsData.horses.map((odds, index) => {
                const horse = horsesData?.horses?.find(
                  h => h.number === odds.number
                );
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{odds.number}</Badge>
                      <span className="text-sm">
                        {horse?.name || `${odds.number}番`}
                      </span>
                    </div>
                    <div className="text-sm text-right">
                      <span className="font-medium">単勝: {odds.winOdds}</span>
                      <span className="ml-4 text-gray-600">
                        複勝: {odds.placeOddsMin}-{odds.placeOddsMax}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">オッズ情報が入力されていません</p>
          )}
        </CardContent>
      </Card>

      {/* 送信ボタン */}
      <div className="flex justify-center pt-6">
        <Button
          onClick={onSubmit}
          disabled={!canSubmit}
          size="lg"
          className="min-w-[200px]"
        >
          {isSubmitting ? (
            <>処理中...</>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              レースデータを保存
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
