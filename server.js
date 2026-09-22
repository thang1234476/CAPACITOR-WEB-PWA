import express from "express";

// Chức năng: tạo Mock API Server để demo một quá trình sync thật sự từ browser lên server.
const app = express();
const PORT = 3001;

// Chức năng: cho phép Express đọc JSON body từ request POST.
app.use(express.json());

// Chức năng: mô phỏng database phía server bằng RAM.
// Lưu ý: dữ liệu sẽ mất khi dừng/restart server.
const submissions = [];

// Chức năng: ghi nhớ UUID đã nhận để tránh tạo duplicate khi client retry.
const receivedIds = new Set();

// Chức năng: trả về toàn bộ submission đã được server nhận.
app.get("/api/submissions", (req, res) => {
  res.json(submissions);
});

// Chức năng: nhận một submission mới từ Sync Engine.
app.post("/api/submissions", (req, res) => {
  const submission = req.body;

  // Quan trọng: mỗi submission bắt buộc phải có UUID.
  if (!submission?.id) {
    return res.status(400).json({
      ok: false,
      message: "Missing submission id"
    });
  }

  // Quan trọng: retry cùng UUID không tạo thêm record mới.
  if (receivedIds.has(submission.id)) {
    console.log(`[API] duplicate retry ignored: ${submission.id}`);

    return res.status(200).json({
      ok: true,
      duplicate: true,
      id: submission.id
    });
  }

  // Chức năng: đánh dấu UUID đã được server xử lý.
  receivedIds.add(submission.id);

  // Chức năng: mô phỏng append-only bằng cách chỉ thêm record mới.
  const serverRecord = {
    ...submission,
    receivedAt: new Date().toISOString()
  };

  submissions.push(serverRecord);

  console.log(`[API] received ${submission.id}`);
  console.log(submission.answers);

  return res.status(201).json({
    ok: true,
    id: submission.id,
    receivedAt: serverRecord.receivedAt
  });
});

// Chức năng: khởi động Mock API Server trên port 3001.
app.listen(PORT, () => {
  console.log(`Mock API running at http://localhost:${PORT}`);
});
