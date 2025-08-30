import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Edit3, CheckCircle2, AlertCircle } from 'lucide-react';
import { OddsDataForm } from '../schemas/raceInputSchema';
import { NetKeibaParser } from '@/services/parsers/netKeibaParser';

interface Step3OddsDataProps {
  form: UseFormReturn<OddsDataForm>;
  horseNames?: { number: number; name: string }[];
}

export function Step3OddsData({ form, horseNames = [] }: Step3OddsDataProps) {
  const [netKeibaText, setNetKeibaText] = useState('');
  const [parseResult, setParseResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);
  const [inputMethod, setInputMethod] = useState<'manual' | 'text'>('text');

  const oddsData = form.watch('horses') || [];

  // 馬番に基づいてオッズデータを初期化
  React.useEffect(() => {
    if (horseNames.length > 0 && oddsData.length === 0) {
      const initialOdds = horseNames.map(horse => ({
        number: horse.number,
        winOdds: 0,
        placeOddsMin: 0,
        placeOddsMax: 0,
      }));
      form.setValue('horses', initialOdds);
    }
  }, [horseNames, oddsData.length, form]);

  const getHorseName = (number: number) => {
    const horse = horseNames.find(h => h.number === number);
    return horse ? horse.name : `${number}番`;
  };

  const handleParseNetKeibaText = () => {
    if (!netKeibaText.trim()) {
      setParseResult({
        success: false,
        message: 'NetKeibaのオッズテキストを入力してください。',
      });
      return;
    }

    try {
      const parser = new NetKeibaParser();
      const result = parser.parseOdds(netKeibaText);

      if (result.success && result.data) {
        // パース成功: フォームに結果を設定
        const parsedOdds = result.data.map(odds => ({
          number: odds.horseNumber,
          winOdds: odds.winOdds,
          placeOddsMin: odds.placeOddsMin,
          placeOddsMax: odds.placeOddsMax,
        }));

        form.setValue('horses', parsedOdds);
        setParseResult({
          success: true,
          message: `${result.data.length}頭のオッズデータを正常に読み込みました。`,
          data: result.data,
        });
        setInputMethod('manual'); // パース後は手動入力タブに切り替え
      } else {
        setParseResult({
          success: false,
          message:
            result.errors?.[0]?.message || 'オッズデータの解析に失敗しました。',
        });
      }
    } catch (error) {
      setParseResult({
        success: false,
        message: `エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  const handleClearData = () => {
    const emptyOdds = horseNames.map(horse => ({
      number: horse.number,
      winOdds: 0,
      placeOddsMin: 0,
      placeOddsMax: 0,
    }));
    form.setValue('horses', emptyOdds);
    setNetKeibaText('');
    setParseResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">オッズ情報</h2>
        <p className="text-sm text-gray-600">
          NetKeibaからオッズをコピー&ペーストするか、手動で入力してください。
        </p>
      </div>

      <Tabs
        value={inputMethod}
        onValueChange={value => setInputMethod(value as 'manual' | 'text')}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>NetKeibaテキスト入力</span>
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center space-x-2">
            <Edit3 className="w-4 h-4" />
            <span>手動入力</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                NetKeibaオッズデータ入力
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  NetKeibaのオッズページからテキストをコピー&ペーストしてください
                </label>
                <Textarea
                  value={netKeibaText}
                  onChange={e => setNetKeibaText(e.target.value)}
                  placeholder="単勝
枠	馬
番	印	選択	馬名	オッズ
1	1	
ツインクルトーズ	176.3
1	2	
エトヴプレ	52.6
...
複勝
枠	馬
番	印	選択	馬名	オッズ
1	1	
ツインクルトーズ	27.4 - 38
..."
                  className="min-h-[300px] text-xs font-mono"
                />
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleParseNetKeibaText}
                  className="flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>オッズを読み込む</span>
                </Button>
                <Button variant="outline" onClick={handleClearData}>
                  クリア
                </Button>
              </div>

              {parseResult && (
                <div
                  className={`p-3 rounded-md flex items-start space-x-2 ${
                    parseResult.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  {parseResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        parseResult.success ? 'text-green-800' : 'text-red-800'
                      }`}
                    >
                      {parseResult.message}
                    </p>
                    {parseResult.success && parseResult.data && (
                      <p className="text-xs text-green-600 mt-1">
                        自動読み込み完了。「手動入力」タブで内容を確認・編集できます。
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* NetKeibaオッズ入力のヘルプ */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  NetKeibaからのデータ取得方法
                </h4>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                  <li>NetKeibaのレースページを開く</li>
                  <li>「オッズ・購入」タブをクリック</li>
                  <li>単勝・複勝のオッズ表全体を選択してコピー</li>
                  <li>
                    上のテキストエリアに貼り付けて「オッズを読み込む」をクリック
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual">
          <Form {...form}>
            <div className="space-y-4">
              {oddsData.map((_, index) => {
                const horseNumber = oddsData[index]?.number || index + 1;
                const horseName = getHorseName(horseNumber);

                return (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">
                        {horseNumber}番 {horseName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name={`horses.${index}.winOdds`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>単勝オッズ *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1.0"
                                  step="0.1"
                                  placeholder="1.5"
                                  {...field}
                                  onChange={e =>
                                    field.onChange(
                                      parseFloat(e.target.value) || ''
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`horses.${index}.placeOddsMin`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>複勝オッズ下限 *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1.0"
                                  step="0.1"
                                  placeholder="1.1"
                                  {...field}
                                  onChange={e =>
                                    field.onChange(
                                      parseFloat(e.target.value) || ''
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`horses.${index}.placeOddsMax`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>複勝オッズ上限 *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1.0"
                                  step="0.1"
                                  placeholder="1.3"
                                  {...field}
                                  onChange={e =>
                                    field.onChange(
                                      parseFloat(e.target.value) || ''
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* オッズの妥当性チェック */}
                      {oddsData[index] && (
                        <div className="mt-3 text-xs text-gray-500">
                          {oddsData[index].placeOddsMin >
                            oddsData[index].placeOddsMax && (
                            <p className="text-red-500">
                              複勝オッズの下限が上限より大きくなっています
                            </p>
                          )}
                          {oddsData[index].winOdds > 0 &&
                            oddsData[index].placeOddsMin > 0 &&
                            oddsData[index].winOdds <
                              oddsData[index].placeOddsMin && (
                              <p className="text-yellow-600">
                                単勝オッズが複勝オッズより低くなっています（要確認）
                              </p>
                            )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {oddsData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>オッズ情報を入力する馬が見つかりません。</p>
                  <p className="text-sm">
                    前のステップで出走馬の情報を入力してください。
                  </p>
                </div>
              )}
            </div>

            {/* オッズ入力のヒント */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                オッズ入力のヒント
              </h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• 単勝オッズ: その馬が1着になった場合の配当倍率</li>
                <li>
                  • 複勝オッズ: その馬が3着以内に入った場合の配当倍率の範囲
                </li>
                <li>• 通常、単勝オッズ {'>'} 複勝オッズ上限 となります</li>
                <li>• 人気馬ほどオッズは低く、穴馬ほどオッズは高くなります</li>
              </ul>
            </div>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
