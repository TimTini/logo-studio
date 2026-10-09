# Logo Studio — 2 đối tượng

Ứng dụng HTML/CSS/JavaScript thuần, SVG native; toàn bộ dữ liệu và xử lý ở trình duyệt.

[Dùng trực tuyến trên GitHub Pages](https://timtini.github.io/logo-studio/).

Nội dung mẫu: **SÁNG TẠO KẾT NỐI VÀ PHÁT TRIỂN** và **LOGO STUDIO**.

## Mở ứng dụng

Mở **Logo-Editor-Offline.html** trực tiếp bằng Edge/Chrome/Firefox. File đã nhúng CSS, JavaScript, Anton Regular và opentype.js, không cần Internet hay web server.

Thư mục **dist/** là bản web tĩnh, có thể đưa nguyên thư mục lên GitHub Pages / Cloudflare Pages. Nếu sửa source, chạy `node build.cjs` để tạo lại HTML offline và dữ liệu font.

## Sử dụng

- Chọn **Chữ vòng cung** hoặc **Chữ ngang** ở danh sách bên trái hoặc bấm vào chữ trên bản thiết kế. Có đúng 2 đối tượng; cả cụm chữ di chuyển và chỉnh sửa cùng nhau.
- Nhập nội dung, chọn font, màu, cỡ chữ, giãn chữ. Nội dung tiếng Việt được giữ nguyên trong JSON; không tự sửa chính tả hoặc dấu.
- Preview, kiểm tra glyph và outline cùng dùng biểu diễn Unicode NFC tương đương để tránh lệch font khi nhập dấu dạng tổ hợp. Chuỗi nhập gốc vẫn giữ nguyên trong ô nhập, JSON, autosave và metadata SVG. Font tùy chỉnh phải có glyph NFC tương ứng; thiếu glyph sẽ được cảnh báo và chặn xuất.
- Vòng cung: chỉnh tâm, bán kính, góc đầu/cuối, vị trí trên cung và căn chữ. Góc đầu phải lớn hơn góc cuối, độ trải dưới 360°. Tùy chọn **Tự giảm cỡ chữ để vừa cung** thu nhỏ nội dung quá dài; tắt tùy chọn để dùng nguyên cỡ chữ nhập. Chữ ngoài đường cung có thể bị trình duyệt ẩn khi nội dung quá dài.
- Chữ ngang: mặc định fit vào khung đích, cả dòng "LOGO STUDIO" được căn theo một khung. Khi bật fit, khung W/H quyết định kích thước cuối cùng; tắt fit để cỡ chữ, X và đường chân Y quyết định trực tiếp. Căn trái/giữa/phải lấy X làm điểm neo khi không fit.
- Kéo chữ để di chuyển; phím mũi tên dịch 1 px, Shift + mũi tên dịch 10 px. **Khóa kéo vị trí** khóa thao tác kéo và phím mũi tên. **Khóa tỷ lệ** liên kết scale X/Y và giữ tỷ lệ khi fit chữ ngang.
- **Bám điểm** trên thanh preview bật mặc định: khi kéo gần tâm hoặc mép canvas, hay tâm/mép đối tượng còn lại, chữ tự căn vào vị trí gần nhất theo từng trục. Đường căn màu hồng xuất hiện lúc bắt điểm; ngưỡng hút khoảng 7 px trên màn hình ở mọi mức zoom. Giữ **Alt** để tạm kéo tự do hoặc bấm **Bám điểm** để tắt trong phiên hiện tại. Thả chuột lưu đúng một bước Undo; đường căn không có trong file xuất.
- Space + kéo hoặc nút chuột giữa để pan. Nút +/− thay đổi zoom, **Vừa khung** khôi phục vùng nhìn. Zoom/pan không thay đổi tọa độ thiết kế hoặc dữ liệu xuất.
- Bật đường dẫn, lưới hoặc khung đích trên thanh preview. Khung đích lấy từ đặc tả; khung thực tế là bounding box SVG sau biến đổi. Chúng không mặc định bằng nhau. Đo SVG có thể bao gồm khoảng trống của font; không phải phép so sánh pixel ảnh gốc.
- Chọn ảnh PNG/JPG/WebP làm lớp đối chiếu, chỉnh độ mờ. Ảnh chỉ ở phiên hiện tại, không được nhúng vào JSON hoặc file xuất.
- Thêm TTF/OTF để áp dụng cho đối tượng đang chọn. Font được nhúng vào JSON để mở lại được trên máy khác. Khi thiếu glyph, ứng dụng cảnh báo và chặn xuất, tránh xuất logo sai font. Chỉ tải font bạn có quyền sử dụng.
- **Lưu JSON** tải dự án; **Mở dự án** khôi phục thông số và font. Autosave lưu trên trình duyệt hiện tại; khi dung lượng hết sẽ hiện cảnh báo. **Mới** và **Khôi phục đối tượng** có thể Undo.
- Ctrl+Z hoàn tác; Ctrl+Shift+Z làm lại; Ctrl+S lưu JSON khi không đang nhập liệu. Lịch sử tối đa 100 bước; không lưu lịch sử Undo/Redo vào JSON.
- **Xuất thiết kế**: SVG outline không cần font bên ngoài; SVG dạng text nhúng font. PNG dùng cùng hình học outline. Chọn nền trong suốt/nền màu, cắt gọn và padding; độ phân giải PNG từ 0.1× đến 8× (giới hạn 40 triệu pixel và 16000 px mỗi chiều).

Preset mẫu dùng khung 1254 × 1254. Các khung đích là số liệu minh họa để căn chỉnh; không đại diện cho thông tin hoặc thiết kế của cá nhân, tổ chức.

## Mã nguồn và kiểm chứng

- `dist/core.js`: preset, schema validation, lịch sử và toán hình học.
- `dist/renderer.js`: font, SVG textPath, bounding box và chuyển outline.
- `dist/app.js`: giao diện, tương tác, lưu/khôi phục và xuất.
- `dist/index.html`, `dist/style.css`: giao diện responsive.
- `build.cjs`: đóng gói HTML offline.
- `tests/core.test.cjs`: `node --test tests/core.test.cjs`.

Không cần cài package để chạy hoặc build. Node chỉ cần khi sửa source và đóng gói lại.

## GitHub Pages

Workflow `.github/workflows/pages.yml` tự kiểm thử và xuất bản `dist/` mỗi lần push lên `main`. Trong Settings → Pages, chọn nguồn **GitHub Actions**. Workflow dùng các action chính thức được cố định theo commit SHA; không cần thêm secret triển khai.

## Dữ liệu và quyền riêng tư

App không có backend, tài khoản, analytics hoặc API thu thập dữ liệu. Văn bản và font tùy chỉnh được lưu cục bộ trong trình duyệt hoặc file JSON do người dùng chủ động tải. Ảnh tham chiếu chỉ ở phiên hiện tại. File JSON có thể chứa nội dung riêng và font của bạn; chỉ chia sẻ file khi bạn muốn công khai các dữ liệu đó.

Repo chỉ chứa mã nguồn, tài nguyên được cấp phép và preset minh họa; không chứa dự án riêng, ảnh tham chiếu, thông tin hosting riêng tư, credential hoặc lịch sử thiết kế trước đó.

## Nguồn và giấy phép

Anton từ [Google Fonts](https://github.com/google/fonts/tree/main/ofl/anton), SIL Open Font License; giấy phép trong `dist/assets/OFL.txt`.

opentype.js 1.3.4 từ [dự án opentype.js](https://github.com/opentypejs/opentype.js), MIT; giấy phép trong `dist/vendor/LICENSE.txt`. Bản offline phân phối cùng các giấy phép này trong gói ZIP.
