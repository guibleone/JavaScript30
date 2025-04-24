/** Pegar os elementos */
const player = document.querySelector(".player");
const video = player.querySelector(".viewer");
const progress = player.querySelector(".progress");
const progressBar = player.querySelector(".progress__filled");
const toggle = player.querySelector(".toggle");
const skipButtons = player.querySelectorAll("[data-skip]");
const ranges = player.querySelectorAll(".player__slider");
const fullScreenButon = player.querySelector(".full-screen");

let isClicked = false;

/** Construir funções */
function togglePlay() {
  const method = video.paused ? "play" : "pause";
  video[method]();
}

function updateButton() {
  const icon = this.paused ? "►" : "❚ ❚";
  toggle.textContent = icon;
}

function skip() {
  const { skip } = this.dataset;
  video.currentTime += parseFloat(skip);
}

function handleRangeUpdate() {
  if (isClicked) {
    video[this.name] = this.value;
  }
}

function handleProgress() {
  const percent = (video.currentTime / video.duration) * 100;
  progressBar.style.flexBasis = `${percent}%`;
}

function scrub(e) {
  const scrubTime = (e.offsetX / progress.offsetWidth) * video.duration;
  video.currentTime = scrubTime;
}

function goFullScreen() {
  if (!document.fullscreenElement) {
    player.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

/**Event Listeners */
video.addEventListener("click", togglePlay);
video.addEventListener("play", updateButton);
video.addEventListener("pause", updateButton);
video.addEventListener("timeupdate", handleProgress);

toggle.addEventListener("click", togglePlay);
skipButtons.forEach((button) => button.addEventListener("click", skip));

ranges.forEach((range) => range.addEventListener("change", handleRangeUpdate));
ranges.forEach((range) =>
  range.addEventListener("mousemove", handleRangeUpdate)
);

ranges.forEach((range) =>
  range.addEventListener("mousedown", () => (isClicked = true))
);
ranges.forEach((range) =>
  range.addEventListener("mouseup", () => (isClicked = false))
);

progress.addEventListener("click", scrub);
progress.addEventListener("mousemove", (e) => isClicked && scrub(e));
progress.addEventListener("mousedown", () => (isClicked = true));
progress.addEventListener("mouseup", () => (isClicked = false));

fullScreenButon.addEventListener("click", goFullScreen);
