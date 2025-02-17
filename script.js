console.log("Let's write JavaScript");

let currentSong = new Audio();
let currFolder;
let songs = [];

// Convert seconds to "MM:SS" format
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Fetch song list from a folder
async function getSongs(folder) {
    try {
        currFolder = folder;
        let response = await fetch(`/${folder}/`);
        let text = await response.text();

        let div = document.createElement("div");
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");

        songs = [];
        for (let a of as) {
            let songName = new URL(a.href).pathname.split("/").pop();
            if (songName.endsWith(".mp3")) {
                songs.push(decodeURIComponent(songName));
            }
        }

        // Show songs in playlist
        let songUL = document.querySelector(".songList ul");
        songUL.innerHTML = "";
        for (let song of songs) {
            songUL.innerHTML += `
                <li> 
                    <img class="invert" src="music.svg" alt="">
                    <div class="info">
                        <div>${song.replaceAll("%20", " ")}</div>
                        <div>Unknown Artist</div>
                    </div>
                    <div class="playnow">
                        <span>Play Now</span>
                        <img class="invert" src="play.svg" alt="">
                    </div>
                </li>`;
        }

        // Attach click event to each song
        document.querySelectorAll(".songList li").forEach(e => {
            e.addEventListener("click", () => playMusic(e.querySelector(".info div").innerText));
        });

        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
    }
}

// Play a selected track
function playMusic(track, pause = false) {
    if (!track) return;
    
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        document.getElementById("play").src = "pause.svg";
    }

    document.querySelector(".songinfo").innerText = decodeURI(track);
    document.querySelector(".songtime").innerText = "00:00 / 00:00";
}

// Display albums on the page
async function displayAlbums() {
    try {
        console.log("Displaying Albums...");
        let response = await fetch(`/songs/`);
        let text = await response.text();
        
        let div = document.createElement("div");
        div.innerHTML = text;
        let anchors = div.getElementsByTagName("a");
        let cardContainer = document.querySelector(".cardcontainer");

        for (let a of anchors) {
            let folder = new URL(a.href).pathname.split("/").filter(Boolean).pop();

            if (!folder || folder === "songs") continue; // Skip invalid folders

            try {
                let metadataRes = await fetch(`/songs/${folder}/info.json`);
                if (!metadataRes.ok) throw new Error(`info.json not found for ${folder}`);
                
                let metadata = await metadataRes.json();
                
                cardContainer.innerHTML += `
                    <div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                    stroke-linejoin="round" />
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="Album Cover">
                        <h2>${metadata.title}</h2>
                        <p>${metadata.description}</p>
                    </div>`;
            } catch (error) {
                console.warn(`Skipping folder "${folder}":`, error.message);
            }
        }

        // Attach event listener to each album
        document.querySelectorAll(".card").forEach(card => {
            card.addEventListener("click", async (e) => {
                songs = await getSongs(`songs/${e.currentTarget.dataset.folder}`);
                playMusic(songs[0]);
            });
        });
    } catch (error) {
        console.error("Error displaying albums:", error);
    }
}

// Initialize the app
async function main() {
    await getSongs("songs/Bhajan");
    playMusic(songs[0], true);

    displayAlbums();

    // Play/Pause Button
    document.getElementById("play").addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            document.getElementById("play").src = "pause.svg";
        } else {
            currentSong.pause();
            document.getElementById("play").src = "play.svg";
        }
    });

    // Track Time Update
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerText = 
            `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = 
            (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Seekbar Click Event
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let percent = (e.offsetX / e.target.clientWidth) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    // Hamburger Menu
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Next & Previous Track
    document.getElementById("previous").addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").pop());
        if (index > 0) playMusic(songs[index - 1]);
    });
    document.getElementById("next").addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").pop());
        if (index < songs.length - 1) playMusic(songs[index + 1]);
    });

    // Volume Control
    document.querySelector(".range input").addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
    });

    // Mute/Unmute
    document.querySelector(".volume>img").addEventListener("click", (e) => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = 0.1;
        }
        document.querySelector(".range input").value = currentSong.volume * 100;
    });
}

main();
