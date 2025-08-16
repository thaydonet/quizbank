
import type { Grade } from './types';

export const MENU_DATA: Grade[] = [
  {
    name: "Toán 12",
    chapters: [
      {
        name: "Chương 1: Ứng dụng đạo hàm",
        lessons: [
          {
            name: "Bài 1: Sự đồng biến, nghịch biến",
            types: [
              { name: "Dạng 1: Xét tính đơn điệu", path: "toan-12-chuong-1-bai-1-dang-1" },
              { name: "Dạng 2: Tìm khoảng đơn điệu", path: "toan-12-chuong-1-bai-1-dang-2" },
              { name: "Dạng 3: Tham số m", path: "toan-12-chuong-1-bai-1-dang-3" },
            ]
          },
          {
            name: "Bài 2: Cực trị của hàm số",
            types: [
              { name: "Dạng 1: Tìm cực trị", path: "toan-12-chuong-1-bai-2-dang-1" },
              { name: "Dạng 2: Điều kiện có cực trị", path: "toan-12-chuong-1-bai-2-dang-2" },
            ]
          },
          {
            name: "Bài 3: GTLN, GTNN",
            types: [
              { name: "Dạng 1: GTLN, GTNN trên đoạn", path: "toan-12-chuong-1-bai-3-dang-1" },
              { name: "Dạng 2: Ứng dụng thực tế", path: "toan-12-chuong-1-bai-3-dang-2" },
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Toán 11",
    chapters: [
      {
        name: "Chương 1: Hàm số lượng giác",
        lessons: [
          {
            name: "Bài 1: Góc lượng giác",
            types: [
              { name: "Dạng 1: Đổi đơn vị góc", path: "toan-11-chuong-1-bai-1-dang-1" },
              { name: "Dạng 2: Góc có cùng tia cuối", path: "toan-11-chuong-1-bai-1-dang-2" },
            ]
          }
        ]
      }
    ]
  },
  {
    name: "Toán 10",
    chapters: [
      {
        name: "Chương 1: Mệnh đề và tập hợp",
        lessons: [
          {
            name: "Bài 1: Mệnh đề",
            types: [
              { name: "Dạng 1: Xét tính đúng sai", path: "toan-10-chuong-1-bai-1-dang-1" },
              { name: "Dạng 2: Mệnh đề phủ định", path: "toan-10-chuong-1-bai-1-dang-2" },
            ]
          }
        ]
      }
    ]
  }
];
