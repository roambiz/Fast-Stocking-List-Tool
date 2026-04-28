export type SizePreset = {
  id: string;
  labelZh: string;
  sizes: string[];
};

export const SIZE_PRESETS: SizePreset[] = [
  {
    id: 'adult_tee',
    labelZh: '成人T恤尺寸',
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'],
  },
  {
    id: 'kids_2pc',
    labelZh: '儿童套装2件套尺寸',
    sizes: ['2T', '3T', '4T', '6T', '8Y', '10Y', '12Y', '14Y'],
  },
  {
    id: 'kids_3pc',
    labelZh: '儿童套装3件套尺寸',
    sizes: ['3T', '4T', '6T', '8Y', '10Y', '12Y', '14Y'],
  },
  {
    id: 'romper',
    labelZh: '哈衣短爬尺寸',
    sizes: ['0-3M', '3-6M', '6-12M', '12-18M', '18-24M'],
  },
  {
    id: 'romper_nmk',
    labelZh: '哈衣多件套装（NMK店铺）',
    sizes: ['0-3M', '3-6M', '6-9M', '9-12M'],
  },
  {
    id: 'kids_vest',
    labelZh: '儿童背心尺寸',
    sizes: ['12-18M', '2T', '3T', '4T', '6T', '8Y', '10Y', '12Y', '14Y'],
  },
];
