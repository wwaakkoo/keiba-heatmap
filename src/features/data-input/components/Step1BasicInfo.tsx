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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SuggestInput } from './SuggestInput';
import { RaceBasicInfoForm } from '../schemas/raceInputSchema';

interface Step1BasicInfoProps {
  form: UseFormReturn<RaceBasicInfoForm>;
}

const VENUES = [
  '札幌',
  '函館',
  '福島',
  '新潟',
  '東京',
  '中山',
  '中京',
  '京都',
  '阪神',
  '小倉',
];

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

export function Step1BasicInfo({ form }: Step1BasicInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          レース基本情報
        </h2>
        <p className="text-sm text-gray-600">
          レースの基本的な情報を入力してください。
        </p>
      </div>

      <Form {...form}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>レース日 *</FormLabel>
                <FormControl>
                  <Input type="date" placeholder="レース日を選択" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="venue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>競馬場 *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="競馬場を選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VENUES.map(venue => (
                      <SelectItem key={venue} value={venue}>
                        {venue}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="raceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>レース番号 *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    placeholder="1-12"
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
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>レース名 *</FormLabel>
                <FormControl>
                  <SuggestInput
                    field="raceTitle"
                    placeholder="レース名を入力"
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
            name="distance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>距離 (m) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="800"
                    max="4000"
                    placeholder="1600"
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
            name="surface"
            render={({ field }) => (
              <FormItem>
                <FormLabel>馬場種別 *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="馬場種別を選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(SURFACE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="trackCondition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>馬場状態 *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="馬場状態を選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(TRACK_CONDITION_LABELS).map(
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
            name="raceClass"
            render={({ field }) => (
              <FormItem>
                <FormLabel>レースクラス *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="レースクラスを選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(RACE_CLASS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>賞金 (万円)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    placeholder="1000"
                    {...field}
                    onChange={e =>
                      field.onChange(parseInt(e.target.value) || undefined)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </div>
  );
}
