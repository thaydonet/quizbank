
import type { Grade } from './types';

export const MENU_DATA: Grade[] = [
  {
    name: "Toán 12",
    lessons: [
      { name: "Bài 1: Sự đồng biến, nghịch biến", path: "toan-12-bai-1" },
      { name: "Bài 2: Cực trị của hàm số", path: "toan-12-bai-2" },
      { name: "Bài 3: GTLN, GTNN", path: "toan-12-bai-3" },
    ],
  },
  {
    name: "Toán 11",
    lessons: [
      { name: "Bài 1: Góc lượng giác", path: "toan-11-bai-1" },
      { name: "Bài 2: Dãy số. Cấp số cộng", path: "toan-11-bai-2" },
    ],
  },
  {
    name: "Toán 10",
    lessons: [
      { name: "Bài 1: Mệnh đề", path: "toan-10-bai-1" },
      { name: "Bài 2: Tập hợp", path: "toan-10-bai-2" },
    ],
  },
];
