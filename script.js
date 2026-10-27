const audio = new Audio();
let songs = [];
let currentIndex = -1;
let objectUrls = [];

const fileInput = document.getElementById("fileInput");
const songList = document.getElementById("songList");
const playButton = document.getElementById("play");
const seekInput = document.getElementById("seek");
const volumeInput = document.getElementById("volume");

function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function setStatus(message) {
    document.getElementById("status").textContent = message;
}

function renderSongs() {
    songList.replaceChildren();
    songs.forEach((song, index) => {
        const item = document.createElement("li");
        item.className = "songItem";
        item.setAttribute("aria-current", index === currentIndex ? "true" : "false");

        const number = document.createElement("span");
        number.className = "trackNumber";
        number.textContent = String(index + 1).padStart(2, "0");

        const title = document.createElement("span");
        title.className = "songTitle";
        title.textContent = song.name.replace(/\.[^.]+$/, "");

        const action = document.createElement("button");
        action.className = "trackPlay";
        action.type = "button";
        action.textContent = index === currentIndex && !audio.paused ? "Pause" : "Play";
        action.setAttribute("aria-label", `${action.textContent} ${song.name}`);
        action.addEventListener("click", () => {
            if (index === currentIndex && !audio.paused) {
                audio.pause();
            } else {
                playSong(index);
            }
        });

        item.append(number, title, action);
        songList.append(item);
    });
    document.getElementById("trackCount").textContent = `${songs.length} ${songs.length === 1 ? "track" : "tracks"}`;
}

async function playSong(index) {
    if (index < 0 || index >= songs.length) return;
    currentIndex = index;
    audio.src = objectUrls[index];
    document.getElementById("nowTitle").textContent = songs[index].name.replace(/\.[^.]+$/, "");
    document.getElementById("coverLetter").textContent = songs[index].name.charAt(0).toUpperCase();
    document.getElementById("currentTime").textContent = "00:00";
    document.getElementById("duration").textContent = "00:00";
    renderSongs();
    try {
        await audio.play();
    } catch {
        setStatus("Playback could not start. Try selecting the track again.");
    }
}

function playNext() {
    if (songs.length) playSong((currentIndex + 1) % songs.length);
}

fileInput.addEventListener("change", () => {
    const selected = Array.from(fileInput.files || []).filter(file => file.type.startsWith("audio/"));
    if (!selected.length) {
        setStatus("Choose one or more audio files to build your library.");
        return;
    }

    audio.pause();
    objectUrls.forEach(URL.revokeObjectURL);
    songs = selected;
    objectUrls = songs.map(file => URL.createObjectURL(file));
    currentIndex = -1;
    audio.removeAttribute("src");
    document.getElementById("nowTitle").textContent = "Choose a track";
    document.getElementById("coverLetter").textContent = "S";
    document.getElementById("currentTime").textContent = "00:00";
    document.getElementById("duration").textContent = "00:00";
    seekInput.value = "0";
    renderSongs();
    setStatus(`${songs.length} ${songs.length === 1 ? "track is" : "tracks are"} ready.`);
});

document.getElementById("chooseFiles").addEventListener("click", () => fileInput.click());
playButton.addEventListener("click", () => {
    if (!songs.length) {
        fileInput.click();
    } else if (currentIndex < 0) {
        playSong(0);
    } else if (audio.paused) {
        audio.play().catch(() => setStatus("Playback could not start. Try selecting the track again."));
    } else {
        audio.pause();
    }
});
document.getElementById("next").addEventListener("click", playNext);
document.getElementById("previous").addEventListener("click", () => {
    if (songs.length) playSong((currentIndex - 1 + songs.length) % songs.length);
});
volumeInput.addEventListener("input", () => {
    audio.volume = Number(volumeInput.value);
});
seekInput.addEventListener("input", () => {
    if (Number.isFinite(audio.duration)) audio.currentTime = audio.duration * Number(seekInput.value) / 1000;
});

audio.addEventListener("timeupdate", () => {
    document.getElementById("currentTime").textContent = formatTime(audio.currentTime);
    if (Number.isFinite(audio.duration)) seekInput.value = String(audio.currentTime / audio.duration * 1000);
});
audio.addEventListener("loadedmetadata", () => {
    document.getElementById("duration").textContent = formatTime(audio.duration);
});
audio.addEventListener("play", () => {
    playButton.textContent = "Pause";
    renderSongs();
});
audio.addEventListener("pause", () => {
    playButton.textContent = "Play";
    renderSongs();
});
audio.addEventListener("ended", playNext);

// Auto next song: handled by attaching 'ended' when creating the Audio in playSong()