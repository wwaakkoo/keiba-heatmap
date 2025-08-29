import React from 'react';
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
import { OddsDataForm } from '../schemas/raceInputSchema';

interface Step3OddsDataProps {
  form: UseFormReturn<OddsDataForm>;
  horseNames?: { number: number; name: string }[];
}

export function Step3OddsData({ form, horseNames = [] }: Step3OddsDataProps) {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">オッズ情報</h2>
        <p className="text-sm text-gray-600">
          各馬の単勝オッズと複勝オッズの範囲を入力してください。
        </p>
      </div>

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
                                field.onChange(parseFloat(e.target.value) || '')
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
                                field.onChange(parseFloat(e.target.value) || '')
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
                                field.onChange(parseFloat(e.target.value) || '')
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
            <li>• 複勝オッズ: その馬が3着以内に入った場合の配当倍率の範囲</li>
            <li>• 通常、単勝オッズ {'>'} 複勝オッズ上限 となります</li>
            <li>• 人気馬ほどオッズは低く、穴馬ほどオッズは高くなります</li>
          </ul>
        </div>
      </Form>
    </div>
  );
}
