import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Upload } from 'lucide-react';
import { HorsesDataForm, HorseDataForm } from '../schemas/raceInputSchema';
import { NetKeibaParser } from '@/services/parsers/netKeibaParser';
import { SuggestInput } from './SuggestInput';

interface Step2HorsesDataProps {
  form: UseFormReturn<HorsesDataForm>;
}

const GENDER_LABELS = {
  male: '牡',
  female: '牝',
  gelding: 'セ',
};

export function Step2HorsesData({ form }: Step2HorsesDataProps) {
  const [activeTab, setActiveTab] = useState('paste');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsingNetKeiba, setIsParsingNetKeiba] = useState(false);

  const horses = form.watch('horses') || [];

  const addHorse = () => {
    const newHorse: Partial<HorseDataForm> = {
      number: horses.length + 1,
      name: '',
      age: 4,
      gender: 'male',
      weight: 55,
      jockeyName: '',
      trainerName: '',
    };

    form.setValue('horses', [...horses, newHorse as HorseDataForm]);
  };

  const removeHorse = (index: number) => {
    const updatedHorses = horses.filter((_, i) => i !== index);
    form.setValue('horses', updatedHorses);
  };

  const handleNetKeibaDataParse = async () => {
    const rawData = form.getValues('netKeibaRawData');
    if (!rawData) return;

    setIsParsingNetKeiba(true);
    setParseError(null);

    try {
      const parser = new NetKeibaParser();
      const parsedData = parser.parseHorseData(rawData);

      if (parsedData.length > 0) {
        form.setValue('horses', parsedData);
        setActiveTab('manual'); // 手動編集タブに切り替え
      } else {
        setParseError('データを解析できませんでした。形式を確認してください。');
      }
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : 'パースエラーが発生しました'
      );
    } finally {
      setIsParsingNetKeiba(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          出馬表データ
        </h2>
        <p className="text-sm text-gray-600">
          NetKeibaからデータを貼り付けるか、手動で馬情報を入力してください。
        </p>
      </div>

      <Form {...form}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste">NetKeibaデータ貼り付け</TabsTrigger>
            <TabsTrigger value="manual">手動入力</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-4">
            <FormField
              control={form.control}
              name="netKeibaRawData"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NetKeibaの出馬表データ</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="NetKeibaの出馬表ページからデータをコピー&ペーストしてください..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {parseError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{parseError}</p>
              </div>
            )}

            <Button
              type="button"
              onClick={handleNetKeibaDataParse}
              disabled={isParsingNetKeiba || !form.getValues('netKeibaRawData')}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isParsingNetKeiba ? 'データを解析中...' : 'データを解析'}
            </Button>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-medium">出走馬一覧</h3>
              <Button type="button" onClick={addHorse} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                馬を追加
              </Button>
            </div>

            <div className="space-y-4">
              {horses.map((horse, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm">
                        {horse.number}番 {horse.name || '未入力'}
                      </CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeHorse(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name={`horses.${index}.number`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>馬番 *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="18"
                                {...field}
                                onChange={e =>
                                  field.onChange(parseInt(e.target.value) || '')
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`horses.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>馬名 *</FormLabel>
                            <FormControl>
                              <SuggestInput
                                field="horseName"
                                placeholder="馬名"
                                value={field.value || ''}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`horses.${index}.age`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>馬齢 *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="2"
                                max="10"
                                {...field}
                                onChange={e =>
                                  field.onChange(parseInt(e.target.value) || '')
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`horses.${index}.gender`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>性別 *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="性別" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(GENDER_LABELS).map(
                                  ([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`horses.${index}.weight`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>斤量 (kg) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="45"
                                max="65"
                                step="0.5"
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
                        name={`horses.${index}.jockeyName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>騎手 *</FormLabel>
                            <FormControl>
                              <SuggestInput
                                field="jockeyName"
                                placeholder="騎手名"
                                value={field.value || ''}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`horses.${index}.trainerName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>調教師 *</FormLabel>
                            <FormControl>
                              <SuggestInput
                                field="trainerName"
                                placeholder="調教師名"
                                value={field.value || ''}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`horses.${index}.ownerName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>馬主</FormLabel>
                            <FormControl>
                              <SuggestInput
                                field="ownerName"
                                placeholder="馬主名"
                                value={field.value || ''}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {horses.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>出走馬が登録されていません。</p>
                <p className="text-sm">
                  「馬を追加」ボタンまたはNetKeibaデータの貼り付けから開始してください。
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Form>
    </div>
  );
}
