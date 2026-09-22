// Chức năng: mô tả toàn bộ form bằng dữ liệu thay vì hardcode từng câu hỏi trong HTML.
export const facilitySurveySchema = {
  id: "facility-survey-v1",
  title: "Khảo sát cơ sở vật chất",

  fields: [
    {
      id: "facility_name",
      label: "Tên khu vực / phòng",
      type: "text",
      required: true
    },

    {
      id: "condition",
      label: "Tình trạng",
      type: "radio",
      required: true,
      options: [
        { value: "good", label: "Tốt" },
        { value: "damaged", label: "Hư hỏng" }
      ]
    },

    {
      id: "damage_description",
      label: "Mô tả hư hỏng",
      type: "textarea",
      required: true,

      // Quan trọng: field này chỉ xuất hiện khi condition = damaged.
      showIf: {
        field: "condition",
        equals: "damaged"
      }
    },

    {
      id: "priority",
      label: "Mức độ ưu tiên xử lý",
      type: "radio",
      required: true,
      options: [
        { value: "low", label: "Thấp" },
        { value: "medium", label: "Trung bình" },
        { value: "high", label: "Cao" }
      ],

      // Quan trọng: đây là một ví dụ thứ hai về skip logic.
      showIf: {
        field: "condition",
        equals: "damaged"
      }
    }
  ]
};
