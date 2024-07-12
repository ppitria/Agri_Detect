const imageInput = document.getElementById("image-input");
const dropZone = document.getElementById("drop-zone");
const uploadForm = document.getElementById("image-upload-form");
const resultDiv = document.getElementById("result");
const cameraBtn = document.getElementById("camera-btn");
const detectBtn = document.getElementById("detect-btn");
const loadingDiv = document.getElementById("loading");

dropZone.addEventListener("click", (event) => {
  event.preventDefault();
  imageInput.click();
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("dragover");
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    imageInput.files = files;
    previewImage(files[0]);
  }
});

imageInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    previewImage(file);
  }
});

cameraBtn.addEventListener("click", (event) => {
  event.preventDefault();
  const constraints = { video: true };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      const captureButton = document.createElement("button");
      captureButton.textContent = "Capture";

      dropZone.innerHTML = "";
      dropZone.appendChild(video);
      dropZone.appendChild(captureButton);

      captureButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          const file = new File([blob], "capture.png", { type: "image/png" });
          imageInput.files = new DataTransfer().items.add(file).files;
          previewImage(file);

          stream.getTracks().forEach((track) => track.stop());
        });
      });
    })
    .catch((err) => {
      console.error("Error accessing the camera", err);
    });
});

function previewImage(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const previewContainer = document.createElement("div");
    previewContainer.classList.add("preview-container");

    const img = document.createElement("img");
    img.src = event.target.result;
    previewContainer.appendChild(img);

    const removeBtn = document.createElement("button");
    removeBtn.classList.add("remove-btn");
    removeBtn.innerHTML = "&times;";
    previewContainer.appendChild(removeBtn);

    dropZone.innerHTML = "";
    dropZone.appendChild(previewContainer);

    removeBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      imageInput.value = "";
      dropZone.innerHTML = "Drop files here or click to upload.";
    });

    // Set file to input element
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    imageInput.files = dataTransfer.files;
  };
  reader.readAsDataURL(file);
}

detectBtn.addEventListener("click", (event) => {
  event.preventDefault();

  // Menampilkan tombol loading
  detectBtn.classList.add("hidden");
  loadingDiv.classList.remove("hidden");

  // Mengirimkan gambar yang diunggah ke backend Flask
  const formData = new FormData();
  const file = imageInput.files[0];

  if (!file) {
    console.error("No file selected");
    alert("No file selected. Please upload or capture an image.");
    detectBtn.classList.remove("hidden");
    loadingDiv.classList.add("hidden");
    return;
  }

  formData.append("image", file);
  console.log("File selected: ", file.name); // Logging file name

  fetch("/upload", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      // Menyembunyikan tombol loading
      detectBtn.classList.remove("hidden");
      loadingDiv.classList.add("hidden");

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      if (data.detections) {
        displayDetectionResults(data.detections);
      } else {
        console.log("Invalid response format from server.");
      }
    })
    .catch((error) => {
      console.error("Error during detection:", error);

      // Menyembunyikan tombol loading jika terjadi kesalahan
      detectBtn.classList.remove("hidden");
      loadingDiv.classList.add("hidden");
    });
});

function displayDetectionResults(detections) {
  const resultList = document.querySelector("#result ul");
  resultList.innerHTML = "";

  if (Array.isArray(detections) && detections.length > 0) {
    detections.forEach(function (detection) {
      console.log("Class:", detection.class);
      console.log("Confidence:", detection.confidence);
      console.log("Box:", detection.box);
      console.log("Message:", detection.message);

      const detectionItem = document.createElement("li");
      detectionItem.innerHTML = `
          <p><strong>Nama Penyakit:</strong> ${detection.class}</p>
          <p><strong>Tingkat Akurasi:</strong> ${detection.confidence}</p>
          <p><strong>Detail:</strong> ${detection.message}</p>
          <p><strong>Penanggulangan:</strong> ${detection.medicine}</p>
        `;

      resultList.appendChild(detectionItem);
    });
  } else {
    const noDetectionItem = document.createElement("li");
    noDetectionItem.textContent = "No detections found.";
    resultList.appendChild(noDetectionItem);
  }
}
