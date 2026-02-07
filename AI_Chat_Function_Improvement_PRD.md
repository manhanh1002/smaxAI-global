# Giai đoạn 1: AI Chat Function Improvement 

## 1. Tổng quan (Overview)
File `supabase/functions/chat/index.ts` hiện tại đóng vai trò là "bộ não" xử lý hội thoại AI cho Spa/Salon. Nó sử dụng OpenAI để phân tích ý định khách hàng và gọi các công cụ (Tools) để tương tác với cơ sở dữ liệu Supabase.

Tuy nhiên, mã nguồn hiện tại đang thiếu sót nhiều chức năng quan trọng để đáp ứng các usecase thực tế (như sửa lịch, thêm/bớt dịch vụ con) và có nguy cơ lỗi logic cao trong việc quản lý dữ liệu khách hàng.

## 2. Phân tích hiện trạng (Current State Analysis)

### Các chức năng hiện có:
1.  **Quản lý đặt lịch (Booking):**
    *   `create_booking`: Tạo lịch mới (dựa trên tên khách, ngày, giờ, tên dịch vụ).
    *   `get_bookings`: Tra cứu lịch theo tên khách hàng.
    *   `cancel_booking`: Huỷ lịch theo ID.
2.  **Quản lý đơn hàng (Order):**
    *   `create_order`, `get_orders`, `cancel_order`: Mua sản phẩm.
3.  **Quản lý khách hàng (Customer):**
    *   `create_customer`, `update_customer`: Tạo/sửa thông tin cơ bản.
    *   `update_customer_insight`: Cập nhật ghi chú nội bộ, tags, điểm tiềm năng (lead score).
4.  **Kiểm tra tình trạng (Availability):**
    *   Logic kiểm tra slot trống được nhúng *bên trong* `create_booking`. Nếu đầy, hệ thống gợi ý 3 slot gần nhất.

### Các vấn đề & Thiếu sót (Critical Gaps):

#### A. Thiếu chức năng sửa đổi (Missing Update Capabilities)
*   **Không có `update_booking`**: AI hiện tại **không thể** thay đổi giờ hẹn hoặc thêm/bớt addon cho một lịch đã đặt.
*   **Hệ quả**: Nếu khách muốn đổi giờ hoặc thêm dịch vụ "Aroma Oil", AI buộc phải huỷ lịch cũ và tạo lịch mới, gây phiền toái và rác dữ liệu.

#### B. Định danh khách hàng lỏng lẻo (Weak Customer Identification)
*   **Vấn đề**: Tool `create_booking` và `get_bookings` đang dùng tham số `customer_name` (chuỗi ký tự) thay vì `customer_id`.
*   **Rủi ro**:
    *   Trùng tên: Nếu có 2 khách tên "Linh", hệ thống sẽ lấy nhầm lịch.
    *   Dữ liệu rác: Không liên kết chặt chẽ với bảng `customers`, gây khó khăn cho việc thống kê lịch sử khách hàng.

#### C. Kiểm tra lịch trống thụ động (Passive Availability Check)
*   **Vấn đề**: Không có tool `check_availability` độc lập.
*   **Hệ quả**: Khi khách hỏi "Chiều mai 2h còn trống không?", AI phải "giả vờ" gọi tool đặt lịch hoặc tự bịa ra câu trả lời dựa trên dữ liệu tĩnh (vốn chỉ load 20 slot đầu tiên).

#### D. Quản lý Addon chưa linh hoạt
*   **Vấn đề**: Tool `create_booking` nhận danh sách addon, nhưng vì thiếu `update_booking`, việc khách đổi ý (muốn bỏ bớt 1 addon) là không thể thực hiện trực tiếp.

## 3. Kế hoạch cải thiện (Proposed Plan)

### Mục tiêu:
Nâng cấp `index.ts` để hỗ trợ trọn vẹn quy trình: **Hỏi lịch trống -> Đặt lịch (kèm addon) -> Sửa lịch (đổi giờ/addon) -> Huỷ lịch -> Ghi nhớ nhu cầu.**

### Các nhiệm vụ cụ thể (Tasks):

#### Task 1: Chuẩn hoá Schema & Định danh
*   **Yêu cầu**: Tất cả các tool liên quan đến Booking/Order phải sử dụng `customer_id` làm khoá chính để liên kết, thay vì `customer_name`.
*   **Sửa đổi**:
    *   Cập nhật tham số tool `create_booking`: `customer_name` -> `customer_id`.
    *   Cập nhật tham số tool `get_bookings`: `customer_name` -> `customer_id`.

#### Task 2: Thêm Tool `check_availability`
*   **Mô tả**: Cho phép AI chủ động kiểm tra slot trống mà không cần tạo booking.
*   **Input**: `date` (YYYY-MM-DD), `service_id` (tuỳ chọn).
*   **Output**: Danh sách các khung giờ còn trống trong ngày đó.

#### Task 3: Thêm Tool `update_booking`
*   **Mô tả**: Cho phép sửa đổi booking đang có.
*   **Input**:
    *   `booking_id` (bắt buộc).
    *   `date`, `time` (tuỳ chọn - để đổi lịch).
    *   `addons` (tuỳ chọn - danh sách addon mới, sẽ thay thế danh sách cũ).
    *   `status` (tuỳ chọn).
*   **Logic**: Cho phép cập nhật từng phần.

#### Task 4: Nâng cấp System Prompt & Context Loading
*   **Prompt**: Bổ sung hướng dẫn rõ ràng về việc ưu tiên dùng `update_booking` thay vì huỷ-tạo lại.
*   **Context**: Đảm bảo `services` load lên bao gồm đầy đủ thông tin `service_addons` để AI biết dịch vụ nào có addon nào.

#### Task 5: Xử lý lỗi & Phản hồi (Error Handling)
*   **Validation**: Kiểm tra kỹ `merchant_id` và `customer_id` trước khi thao tác DB.
*   **Fallback**: Nếu `check_availability` thất bại, trả về lỗi rõ ràng để AI xin lỗi khách.

## 4. Đặc tả API Tool mới (Tool Definitions)

### `update_booking`
```json
{
  "name": "update_booking",
  "description": "Update an existing booking details like time, date, or addons.",
  "parameters": {
    "type": "object",
    "properties": {
      "booking_id": { "type": "string" },
      "date": { "type": "string" },
      "time": { "type": "string" },
      "addons": { 
        "type": "array", 
        "items": { 
           "type": "object", 
           "properties": { "name": { "type": "string" }, "price": { "type": "number" } }
        }
      }
    },
    "required": ["booking_id"]
  }
}
```

### `check_availability`
```json
{
  "name": "check_availability",
  "description": "Check available time slots for a specific date.",
  "parameters": {
    "type": "object",
    "properties": {
      "date": { "type": "string" },
      "service_id": { "type": "string" }
    },
    "required": ["date"]
  }
}
```

## 5. Kết luận
Việc thực hiện các thay đổi trên là bắt buộc để AI hoạt động ổn định và thông minh hơn. Sau khi PRD này được duyệt, chúng ta sẽ tiến hành code lại file `index.ts` theo từng Task đã liệt kê.

---

# Giai Đoạn 2: Cấu Hình Động & Kiến Trúc Đa Agent (Phase 2: Dynamic Config & Multi-Agent)

Phần này bổ sung các yêu cầu nâng cao để biến hệ thống từ một "Edge Function cứng nhắc" thành một "Hệ sinh thái AI linh hoạt".

## 6. Dynamic AI Scope Configuration (UI Scope of Process)
Hiện tại, danh sách `TOOLS` (quyền hạn AI) đang được hardcode trong file `index.ts`. Điều này khiến việc bật/tắt tính năng (ví dụ: chỉ cho tư vấn, không cho đặt lịch) yêu cầu deploy lại code.

### Mục tiêu:
Cho phép Admin cấu hình quyền hạn của AI trực tiếp trên giao diện `/training` tab "Scope of Process".

### Kế hoạch triển khai:

#### A. Database Changes
*   Thêm cột `scope_config` (JSONB) vào bảng `ai_configs`.
*   Cấu trúc JSON dự kiến:
    ```json
    {
      "can_book": true,
      "can_cancel_booking": false,
      "can_create_order": true,
      "can_update_customer": true,
      "allowed_services": ["all"], // hoặc danh sách service_id cụ thể
      "response_style": "formal" // hoặc "friendly"
    }
    ```

#### B. UI Components (Scope of Process Tab)
*   Xây dựng các Toggle/Checkbox components map với `scope_config`:
    *   [x] Enable Booking Management (Bật/Tắt các tool `create_booking`, `update_booking`, `check_availability`)
    *   [ ] Enable Order Management (Bật/Tắt `create_order`...)
    *   [x] Enable Customer Insight (Bật/Tắt `update_customer_insight`)
    *   [x] Allow Cancellation (Bật/Tắt `cancel_booking`)

#### C. Edge Function Logic Update
*   Trong `index.ts`, thay vì khai báo `const TOOLS = [...]` cố định:
    1.  Fetch `ai_configs.scope_config` từ DB.
    2.  Dùng logic lọc (filter) để xây dựng mảng `availableTools` dựa trên config.
    3.  Chỉ gửi `availableTools` sang OpenAI.
    *   *Ví dụ*: Nếu `can_book` = false, loại bỏ `create_booking` khỏi danh sách tools.

## 7. Multi-Agent Architecture Plan (Observer Pattern)
Chuyển đổi từ mô hình "Monolithic Function" (AI làm tất cả) sang mô hình "Event-Driven Collaboration" (Các Agent hỗ trợ nhau).

### Vấn đề hiện tại:
*   Logic xử lý ngôn ngữ tự nhiên (NLP) và Logic nghiệp vụ (Business Logic) bị trộn lẫn.
*   Một function `index.ts` quá lớn, khó bảo trì.
*   Độ trễ cao khi phải chờ thực thi DB xong mới trả lời khách.

### Kiến trúc đề xuất:

#### Mô hình:
Sử dụng **Supabase Database Webhooks** hoặc **Realtime** để kích hoạt các Agent chuyên biệt khi có thay đổi trên bảng `ai_task_logs` hoặc `messages`.

1.  **Main Agent (Receptionist)**:
    *   Nhiệm vụ: Chỉ giao tiếp, thấu hiểu ý định, và tạo "Task Ticket".
    *   Hành động: Khi khách nói "Đặt lịch mai 9h", Main Agent không gọi tool đặt lịch ngay. Nó ghi vào bảng `ai_task_logs`:
        *   `status`: 'pending'
        *   `intent`: 'create_booking'
        *   `params`: { date: '...', time: '...' }
    *   Phản hồi khách: "Tôi đang kiểm tra lịch, đợi xíu nhé..." (hoặc giữ kết nối).

2.  **Specialized Agents (Workers)**:
    *   Được kích hoạt tự động khi có row mới trong `ai_task_logs` (via Supabase Edge Function Database Webhook).
    *   **Booking Agent**: Lắng nghe `intent: create_booking`. Thực thi logic kiểm tra slot, insert DB. Cập nhật `ai_task_logs` -> `status: done`, `result: success`.
    *   **Insight Agent**: Lắng nghe mọi tin nhắn mới. Chạy ngầm để phân tích và update `customers.internal_notes` mà không làm chậm phản hồi chính.

3.  **Feedback Loop**:
    *   Main Agent (hoặc Client UI) lắng nghe thay đổi của `ai_task_logs`. Khi thấy `status: done`, nó thông báo kết quả cho khách hàng.

### Lợi ích:
*   **Tốc độ**: Main Agent trả lời rất nhanh vì không chờ DB write.
*   **Mở rộng**: Dễ dàng thêm Agent mới (ví dụ: Marketing Agent gửi coupon khi khách vui) mà không sửa code Main Agent.
*   **UI linh hoạt**: UI có thể hiển thị trạng thái "Đang đặt lịch..." -> "Thành công" dựa trên `ai_task_logs` thay vì chờ HTTP response treo.

### Roadmap triển khai Multi-Agent:
1.  **Phase 1**: Refactor `index.ts` để ghi log vào `ai_task_logs` rõ ràng hơn (đã có trong code hiện tại nhưng chưa triệt để).
2.  **Phase 2**: Tách logic `update_customer_insight` ra thành một Edge Function riêng, kích hoạt bởi Database Webhook (sau khi insert message). -> *Giúp phản hồi chat nhanh hơn 30-50%.*
3.  **Phase 3**: Xây dựng UI hiển thị tiến trình xử lý Task (cho Admin xem AI đang làm gì).
