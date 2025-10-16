# Hướng dẫn Import Câu hỏi vào Supabase

## Tổng quan

Tính năng Import cho phép bạn nhanh chóng thêm nhiều câu hỏi vào ngân hàng câu hỏi từ:
- **Text format**: Định dạng đơn giản, dễ nhập
- **JSON format**: Định dạng có cấu trúc, hỗ trợ metadata đầy đủ

## Cách sử dụng

### Bước 1: Truy cập Import Tool
1. Đăng nhập với quyền Admin
2. Vào **Admin Panel** > **Ngân hàng câu hỏi**
3. Click **📝 Quản lý câu hỏi**
4. Chọn tab **📥 Import câu hỏi**
5. Click **📥 Mở Import Tool**

### Bước 2: Chọn vị trí lưu
1. Chọn **Môn học** (Toán 10, 11, 12)
2. Chọn **Chương** 
3. Chọn **Bài học**
4. Chọn **Dạng câu hỏi**
5. Chọn **Độ khó mặc định**

### Bước 3: Import câu hỏi
1. Chọn tab **📝 Nhập Text** hoặc **📄 Nhập JSON**
2. Nhập nội dung câu hỏi
3. Click **Xem trước** để kiểm tra
4. Click **Import** để lưu vào database

## Định dạng Text

### Cấu trúc cơ bản:
```
Câu 1: [Nội dung câu hỏi]
Type: [mcq|msq|sa]
A) [Phương án A]
B) [Phương án B] 
C) [Phương án C]
D) [Phương án D]
Đáp án: [A|B|C|D hoặc a,b,c cho msq hoặc giá trị cho sa]
Giải thích: [Lời giải chi tiết]
```

### Ví dụ câu trắc nghiệm (MCQ):
```
Câu 1: Tìm đạo hàm của hàm số $f(x) = x^2 + 2x + 1$
Type: mcq
A) $f'(x) = 2x + 2$
B) $f'(x) = x^2 + 2$
C) $f'(x) = 2x + 1$
D) $f'(x) = x + 2$
Đáp án: A
Giải thích: Áp dụng quy tắc đạo hàm $(x^n)' = nx^{n-1}$ và $(c)' = 0$. Ta có $f'(x) = 2x + 2$.
```

### Ví dụ câu đúng/sai (MSQ):
```
Câu 2: Xét tính đúng sai của các mệnh đề sau:
Type: msq
a) $(x^3)' = 3x^2$
b) $(\sin x)' = \cos x$
c) $(e^x)' = e^x$
d) $(\ln x)' = x$
Đáp án: a,b,c
Giải thích: a) Đúng. b) Đúng. c) Đúng. d) Sai, $(\ln x)' = \frac{1}{x}$.
```

### Ví dụ câu trả lời ngắn (SA):
```
Câu 3: Tính giá trị của biểu thức $2^3 + 3^2$
Type: sa
Đáp án: 17
Giải thích: Ta có $2^3 = 8$ và $3^2 = 9$. Vậy $2^3 + 3^2 = 8 + 9 = 17$.
```

## Định dạng JSON

### Cấu trúc cơ bản:
```json
{
  "title": "Tiêu đề bộ câu hỏi",
  "questions": [
    {
      "type": "mcq|msq|sa",
      "question": "Nội dung câu hỏi",
      "option_a": "Phương án A",
      "option_b": "Phương án B", 
      "option_c": "Phương án C",
      "option_d": "Phương án D",
      "correct_option": "A",
      "explanation": "Lời giải",
      "difficulty_level": "easy|medium|hard",
      "is_dynamic": false,
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

### Ví dụ đầy đủ:
```json
{
  "title": "Bài tập đạo hàm",
  "questions": [
    {
      "type": "mcq",
      "question": "Tìm đạo hàm của hàm số $f(x) = x^2 + 2x + 1$",
      "option_a": "$f'(x) = 2x + 2$",
      "option_b": "$f'(x) = x^2 + 2$",
      "option_c": "$f'(x) = 2x + 1$", 
      "option_d": "$f'(x) = x + 2$",
      "correct_option": "A",
      "explanation": "Áp dụng quy tắc đạo hàm...",
      "difficulty_level": "easy",
      "is_dynamic": false,
      "tags": ["đạo hàm", "cơ bản"]
    }
  ]
}
```

## Câu hỏi động (Dynamic Questions)

### Biến số ngẫu nhiên:
- `!a!` - biến a từ -10 đến 10
- `!a#0!` - biến a từ -10 đến 10, loại trừ 0
- `!b:2:35!` - biến b từ 2 đến 35
- `!q(2,4,6)!` - biến q chọn ngẫu nhiên từ 2, 4, 6
- `!color(red,blue,green)!` - biến color chọn từ red, blue, green

### Tính toán biểu thức:
- `{tinh: 2*!a! + !b!}` - tính toán biểu thức
- `{tinh: !a!^2}` - bình phương
- `{tinh: sqrt(!a!)}` - căn bậc hai

### Điều kiện logic:
- `iff(!a! > 5, "lớn", "nhỏ")` - điều kiện if-then-else

### Ví dụ câu hỏi động:
```
Câu 1: Cho hàm số $f(x) = !a!x^2 + !b!x + !c!$. Tìm đạo hàm.
Type: mcq
A) $f'(x) = {tinh: 2*!a!}x + !b!$
B) $f'(x) = !a!x + !b!$
C) $f'(x) = {tinh: 2*!a!}x + {tinh: 2*!b!}$
D) $f'(x) = !a!x^2 + !b!$
Đáp án: A
Giải thích: Với $a = !a!$, $b = !b!$, ta có $f'(x) = {tinh: 2*!a!}x + !b!$.
```

## Hỗ trợ LaTeX

### Công thức inline:
- `$x^2 + y^2 = 1$` - công thức trong dòng
- `$\frac{a}{b}$` - phân số
- `$\sqrt{x}$` - căn bậc hai
- `$\sin x$, $\cos x$` - hàm lượng giác

### Công thức block:
- `$$\int_0^1 x^2 dx$$` - tích phân
- `$$\lim_{x \to 0} \frac{\sin x}{x}$$` - giới hạn

### Ký hiệu đặc biệt:
- `$\alpha, \beta, \gamma$` - chữ Hy Lạp
- `$\infty$` - vô cực
- `$\pm$` - cộng trừ
- `$\leq, \geq$` - so sánh

## Tips & Best Practices

### 1. Chuẩn bị nội dung:
- Viết câu hỏi rõ ràng, không nhập nhằng
- Đảm bảo đáp án chính xác
- Lời giải chi tiết, dễ hiểu

### 2. Sử dụng LaTeX:
- Test công thức trước khi import
- Sử dụng `\` để escape ký tự đặc biệt
- Kiểm tra render trong preview

### 3. Câu hỏi động:
- Test với nhiều giá trị biến số
- Đảm bảo công thức tính toán đúng
- Kiểm tra edge cases (chia cho 0, căn âm)

### 4. Quản lý chất lượng:
- Phân loại độ khó phù hợp
- Gắn tags để dễ tìm kiếm
- Review trước khi approve

### 5. Import hiệu quả:
- Chia nhỏ batch (20-50 câu/lần)
- Backup dữ liệu trước khi import
- Test với vài câu trước khi import hàng loạt

## Xử lý lỗi thường gặp

### 1. Lỗi định dạng:
```
❌ Lỗi: "Không tìm thấy câu hỏi hợp lệ"
✅ Giải pháp: Kiểm tra cấu trúc "Câu X:", "Đáp án:", "Giải thích:"
```

### 2. Lỗi JSON:
```
❌ Lỗi: "JSON parsing error"
✅ Giải pháp: Kiểm tra dấu ngoặc, dấu phẩy, quotes
```

### 3. Lỗi LaTeX:
```
❌ Lỗi: Công thức không render
✅ Giải pháp: Kiểm tra cú pháp LaTeX, escape ký tự đặc biệt
```

### 4. Lỗi câu hỏi động:
```
❌ Lỗi: "Invalid mathematical expression"
✅ Giải pháp: Kiểm tra biến số, công thức tính toán
```

## File mẫu

### Tải file mẫu:
- **JSON**: `/QuizBank_JSON/sample-questions.json`
- **Text**: Copy từ tab "📋 Mẫu" trong Import Tool

### Sử dụng mẫu:
1. Tải file mẫu về
2. Chỉnh sửa theo nội dung của bạn
3. Import vào hệ thống
4. Kiểm tra và approve

## Workflow khuyến nghị

### Cho Admin:
1. **Setup**: Chạy migration, tạo cấu trúc môn học
2. **Import**: Import câu hỏi từ file JSON/Text
3. **Review**: Duyệt câu hỏi từ giáo viên
4. **Maintain**: Quản lý chất lượng, cập nhật

### Cho Giáo viên:
1. **Prepare**: Chuẩn bị câu hỏi theo định dạng
2. **Import**: Sử dụng Import Tool để thêm câu hỏi
3. **Wait**: Chờ admin duyệt
4. **Use**: Sử dụng trong quiz sau khi được duyệt

## Liên hệ hỗ trợ

Nếu gặp vấn đề khi import:
1. Kiểm tra log console (F12)
2. Thử với file mẫu trước
3. Liên hệ admin để được hỗ trợ
4. Báo cáo bug qua GitHub issues