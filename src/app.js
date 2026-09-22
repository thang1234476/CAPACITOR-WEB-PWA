import { facilitySurveySchema } from "./survey-schema.js";
import { Capacitor } from "@capacitor/core";
import { Camera } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";

import {
  saveSubmission,
  getAllSubmissions,
  getPendingSubmissions,
  updateSubmission
} from "./db.js";

// Chức năng: lấy các DOM element sẽ được cập nhật trong ứng dụng.
const formEl = document.querySelector("#survey-form");
const titleEl = document.querySelector("#form-title");
const listEl = document.querySelector("#submission-list");
const statusEl = document.querySelector("#network-status");
const syncSummaryEl = document.querySelector("#sync-summary");
const syncButton = document.querySelector("#sync-button");

const API_BASE_URL = Capacitor.isNativePlatform()
  ? "http://10.0.2.2:3001"
  : "";
const API_SUBMISSIONS_URL = `${API_BASE_URL}/api/submissions`;

let currentPhoto = null;
let currentLocation = null;

const photoStatusEl = document.getElementById("photo-status");
const photoPreviewEl = document.getElementById("photo-preview");
const locationStatusEl = document.getElementById("location-status");
const locationCoordinatesEl = document.getElementById("location-coordinates");

function renderNativeEvidence() {
  if (currentPhoto) {
    photoStatusEl.textContent = "Đã có ảnh hiện trường.";
    photoPreviewEl.src = currentPhoto.previewDataUrl;
    photoPreviewEl.hidden = false;
  } else {
    photoStatusEl.textContent = "Chưa có ảnh.";
    photoPreviewEl.hidden = true;
  }

  if (currentLocation) {
    locationStatusEl.textContent = "Đã lấy vị trí hiện tại.";
    locationCoordinatesEl.textContent =
      `${currentLocation.latitude.toFixed(6)}, `
      + `${currentLocation.longitude.toFixed(6)}`;
    locationCoordinatesEl.hidden = false;
  } else {
    locationStatusEl.textContent = "Chưa có vị trí.";
    locationCoordinatesEl.hidden = true;
  }
}

async function takeEvidencePhoto() {
  try {
    const result = await Camera.takePhoto({
      quality: 70,
      targetWidth: 1280,
      targetHeight: 960,
      includeMetadata: true,
      saveToGallery: false
    });

    const format = result.metadata?.format ?? "jpeg";
    const previewDataUrl = result.thumbnail
      ? `data:image/${format};base64,${result.thumbnail}`
      : result.webPath;

    currentPhoto = {
      previewDataUrl,
      format,
      capturedAt: new Date().toISOString()
    };
    renderNativeEvidence();
  } catch (error) {
    console.error("Camera failed:", error);
  }
}
async function ensureNativeLocationPermission() {
  const permission = await Geolocation.checkPermissions();

  if (permission.location === "granted") {
    return;
  }

  const requested = await Geolocation.requestPermissions({
    permissions: ["location"]
  });

  if (requested.location !== "granted") {
    throw new Error("Location permission was not granted");
  }
}

async function captureCurrentLocation() {
  try {
    await ensureNativeLocationPermission();

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    });

    currentLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      capturedAt: new Date().toISOString()
    };

    renderNativeEvidence();
  } catch (error) {
    console.error("Geolocation failed:", error);
  }
}
document.getElementById("camera-button").addEventListener("click", takeEvidencePhoto);
document.getElementById("location-button").addEventListener("click", captureCurrentLocation);

// Chức năng: answers là state tạm của form hiện tại trước khi tạo submission.
const answers = {};

// Chức năng: cờ chống chạy hai vòng sync cùng lúc.
let syncInProgress = false;

// Chức năng: giữ timer retry để không tạo nhiều lịch retry chồng lên nhau.
let retryTimer = null;

// Chức năng: hiển thị tiêu đề lấy từ schema.
titleEl.textContent = facilitySurveySchema.title;

// Chức năng: cập nhật nhãn ONLINE/OFFLINE trên giao diện.
// Lưu ý: navigator.onLine chỉ là tín hiệu tham khảo, không đảm bảo API server đang khả dụng.
function updateNetworkStatus() {
  const online = navigator.onLine;

  statusEl.textContent = online
    ? "Trạng thái: ONLINE"
    : "Trạng thái: OFFLINE";

  statusEl.classList.toggle("status-offline", !online);
}

// Chức năng: quyết định một field có được hiển thị theo showIf hay không.
function shouldShowField(field) {
  if (!field.showIf) {
    return true;
  }

  return answers[field.showIf.field] === field.showIf.equals;
}

// Chức năng: xóa dữ liệu của field đang bị skip logic ẩn đi.
// Quan trọng: tránh gửi dữ liệu cũ của một câu hỏi không còn hợp lệ.
function removeHiddenAnswers() {
  for (const field of facilitySurveySchema.fields) {
    if (!shouldShowField(field)) {
      delete answers[field.id];
    }
  }
}

// Chức năng: render một field từ schema thành DOM tương ứng.
function renderField(field) {
  const wrapper = document.createElement("div");
  wrapper.className = "field";

  // Chức năng: render field kiểu text.
  if (field.type === "text") {
    const label = document.createElement("label");
    label.textContent = field.label;

    const input = document.createElement("input");
    input.type = "text";
    input.value = answers[field.id] ?? "";

    input.addEventListener("input", () => {
      answers[field.id] = input.value;
    });

    wrapper.append(label, input);
  }

  // Chức năng: render field kiểu textarea.
  if (field.type === "textarea") {
    const label = document.createElement("label");
    label.textContent = field.label;

    const textarea = document.createElement("textarea");
    textarea.value = answers[field.id] ?? "";

    textarea.addEventListener("input", () => {
      answers[field.id] = textarea.value;
    });

    wrapper.append(label, textarea);
  }

  // Chức năng: render field kiểu radio.
  if (field.type === "radio") {
    const label = document.createElement("div");
    label.className = "field-label";
    label.textContent = field.label;

    wrapper.appendChild(label);

    for (const option of field.options) {
      const optionLabel = document.createElement("label");
      optionLabel.className = "radio-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = field.id;
      input.value = option.value;
      input.checked = answers[field.id] === option.value;

      // Quan trọng: thay radio có thể làm thay đổi skip logic nên phải render lại form.
      input.addEventListener("change", () => {
        answers[field.id] = option.value;

        removeHiddenAnswers();
        renderForm();
      });

      optionLabel.append(input, ` ${option.label}`);
      wrapper.appendChild(optionLabel);
    }
  }

  return wrapper;
}

// Chức năng: render toàn bộ form từ schema và chỉ giữ những field đang visible.
function renderForm() {
  formEl.innerHTML = "";

  for (const field of facilitySurveySchema.fields) {
    if (!shouldShowField(field)) {
      continue;
    }

    formEl.appendChild(renderField(field));
  }

  const actions = document.createElement("div");
  actions.className = "actions";

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Lưu khảo sát";

  actions.appendChild(submitButton);
  formEl.appendChild(actions);
}

// Chức năng: validate các field required đang visible.
// Quan trọng: field đang bị skip logic ẩn không được validation.
function validateAnswers() {
  const errors = [];

  for (const field of facilitySurveySchema.fields) {
    if (!shouldShowField(field)) {
      continue;
    }

    const value = answers[field.id];

    if (
      field.required &&
      (value === undefined || value === null || String(value).trim() === "")
    ) {
      errors.push(`${field.label} là bắt buộc`);
    }
  }

  return errors;
}

// Chức năng: xóa state của form sau khi đã lưu submission thành công.
function clearForm() {
  for (const key of Object.keys(answers)) {
    delete answers[key];
  }

  renderForm();
}

// Chức năng: escape text trước khi đưa dữ liệu người dùng vào innerHTML.
function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Chức năng: đọc IndexedDB và render danh sách submission local.
async function renderSubmissionList() {
  const submissions = await getAllSubmissions();

  submissions.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  listEl.innerHTML = "";

  const pendingCount = submissions.filter(
    (item) => item.syncStatus === "pending"
  ).length;

  const syncedCount = submissions.filter(
    (item) => item.syncStatus === "synced"
  ).length;

  syncSummaryEl.textContent =
    `Pending: ${pendingCount} | Synced: ${syncedCount}`;

  if (submissions.length === 0) {
    listEl.innerHTML = `<p class="empty">Chưa có submission.</p>`;
    return;
  }

  for (const submission of submissions) {
    const item = document.createElement("article");
    item.className = "submission";

    const facilityName =
      submission.answers.facility_name ?? "(Không tên)";

    const badgeClass =
      submission.syncStatus === "synced"
        ? "badge badge-synced"
        : "badge badge-pending";

    item.innerHTML = `
      <div class="submission-top">
        <strong>${escapeHTML(facilityName)}</strong>
        <span class="${badgeClass}">
          ${escapeHTML(submission.syncStatus)}
        </span>
      </div>

      <p class="submission-id">
        UUID:
        <code>${escapeHTML(submission.id)}</code>
      </p>

      <p>
        Tạo lúc:
        ${escapeHTML(new Date(submission.createdAt).toLocaleString())}
      </p>

      <p>
        Sync attempts:
        ${escapeHTML(submission.syncAttempts)}
      </p>

      ${submission.syncedAt
        ? `<p>Synced at: ${escapeHTML(
          new Date(submission.syncedAt).toLocaleString()
        )}</p>`
        : ""
      }

      ${submission.lastError
        ? `<p class="error">
              Last error: ${escapeHTML(submission.lastError)}
            </p>`
        : ""
      }
    `;

    listEl.appendChild(item);
  }
}

// Chức năng: tính thời gian chờ retry theo exponential backoff.
function getRetryDelay(attempt) {
  const baseDelay = 1000;
  const maxDelay = 30000;

  return Math.min(
    baseDelay * 2 ** attempt,
    maxDelay
  );
}

// Chức năng: sync một submission pending lên server bằng POST.
// Quan trọng: chỉ gửi business data; local sync metadata không gửi lên server.
async function syncOneSubmission(submission) {
  try {
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: submission.id,
        formId: submission.formId,
        answers: submission.answers,
        createdAt: submission.createdAt
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Chức năng: đánh dấu local record là synced khi server đã nhận thành công.
    await updateSubmission(submission.id, {
      syncStatus: "synced",
      syncedAt: new Date().toISOString(),
      lastError: null
    });

    console.log("Synced:", submission.id);

    return {
      ok: true,
      attempt: submission.syncAttempts
    };
  } catch (error) {
    const nextAttempts = submission.syncAttempts + 1;

    // Chức năng: giữ record ở pending nếu sync fail để lần sau còn retry được.
    await updateSubmission(submission.id, {
      syncStatus: "pending",
      syncAttempts: nextAttempts,
      lastError: String(error.message ?? error)
    });

    console.error("Sync failed:", submission.id, error);

    return {
      ok: false,
      attempt: nextAttempts
    };
  }
}

// Chức năng: lên lịch retry một vòng sync mới nếu vẫn còn pending record.
function scheduleRetry(attempt) {
  if (retryTimer !== null) {
    return;
  }

  const delay = getRetryDelay(attempt);

  console.log(`Retry pending submissions in ${delay} ms`);

  retryTimer = window.setTimeout(async () => {
    retryTimer = null;
    await syncPendingSubmissions();
  }, delay);
}

// Chức năng: sync toàn bộ pending queue tuần tự để demo dễ quan sát.
async function syncPendingSubmissions() {
  if (syncInProgress) {
    return;
  }

  // Quan trọng: nếu browser đang báo Offline thì chưa cần thử fetch.
  if (!navigator.onLine) {
    console.log("Skip sync: browser is offline");
    return;
  }

  syncInProgress = true;
  syncButton.disabled = true;
  syncButton.textContent = "Đang sync...";

  let highestFailedAttempt = 0;

  try {
    const pending = await getPendingSubmissions();

    console.log(`Sync ${pending.length} pending submission(s)`);

    for (const submission of pending) {
      const result = await syncOneSubmission(submission);

      if (!result.ok) {
        highestFailedAttempt = Math.max(
          highestFailedAttempt,
          result.attempt
        );
      }
    }
  } finally {
    syncInProgress = false;
    syncButton.disabled = false;
    syncButton.textContent = "Sync pending";

    await renderSubmissionList();
  }

  const remaining = await getPendingSubmissions();

  // Quan trọng: API có thể down dù navigator.onLine vẫn true.
  if (navigator.onLine && remaining.length > 0) {
    scheduleRetry(highestFailedAttempt);
  }
}

// Chức năng: tạo một submission có UUID và lưu Local First vào IndexedDB.
async function handleSubmit(event) {
  event.preventDefault();

  removeHiddenAnswers();

  const errors = validateAnswers();

  if (errors.length > 0) {
    alert(errors.join("\n"));
    return;
  }

  const submission = {
    id: crypto.randomUUID(),
    formId: facilitySurveySchema.id,
    answers: { ...answers },
    photo: currentPhoto ? { ...currentPhoto } : null,
    location: currentLocation ? { ...currentLocation } : null,
    createdAt: new Date().toISOString(),
    syncStatus: "pending",
    syncAttempts: 0,
    lastError: null,
    syncedAt: null
  };

  // Quan trọng: lưu IndexedDB trước, rồi mới nghĩ tới network.
  await saveSubmission(submission);

  console.log("Saved locally:", submission);

  clearForm();
  await renderSubmissionList();

  // Chức năng: nếu browser đang online thì thử sync ngay sau khi local save thành công.
  if (navigator.onLine) {
    await syncPendingSubmissions();
  }
}

// Chức năng: xử lý khi browser phát event online và thử sync lại pending queue.
async function handleOnline() {
  updateNetworkStatus();

  console.log("Online again → try sync");

  if (retryTimer !== null) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  await syncPendingSubmissions();
}

// Chức năng: xử lý khi browser phát event offline.
function handleOffline() {
  updateNetworkStatus();

  console.log("Browser switched to offline");
}

// Chức năng: đăng ký Service Worker để giữ App Shell hoạt động khi Offline.
async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker is not supported");
    return;
  }

  try {
    const registration =
      await navigator.serviceWorker.register("/sw.js");

    console.log(
      "Service Worker registered:",
      registration.scope
    );
  } catch (error) {
    console.error(
      "Service Worker registration failed:",
      error
    );
  }
}

// Chức năng: khởi động UI và đọc dữ liệu local khi trang vừa mở.
async function initializeApp() {
  updateNetworkStatus();
  renderForm();
  await renderSubmissionList();
  await registerServiceWorker();

  // Chức năng: nếu mở app khi đang Online, thử xử lý pending cũ từ phiên trước.
  if (navigator.onLine) {
    await syncPendingSubmissions();
  }
}

// Chức năng: gắn submit event cho dynamic form.
formEl.addEventListener("submit", handleSubmit);

// Chức năng: cho phép người dùng chủ động sync pending queue.
syncButton.addEventListener("click", syncPendingSubmissions);

// Chức năng: theo dõi khi network trở lại.
window.addEventListener("online", handleOnline);

// Chức năng: theo dõi khi browser chuyển sang Offline.
window.addEventListener("offline", handleOffline);

// Chức năng: chạy toàn bộ quá trình khởi tạo ứng dụng.
initializeApp();
