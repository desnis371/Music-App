let currentSong = new Audio();
let songsData = []; // Store songs data globally
let currentSongName = ''; // Track current song name
let currentIndex = 0;
let currentAlbumId = 'all-songs'; // Track current album
let albumsData = {}; // Store albums data

const playMusik = (songObj) => {
  // Support both old format (string) and new format (object)
  if (typeof songObj === 'string') {
    currentSong.src = songObj;
    currentSongName = songObj;
  } else {
    currentSong.src = songObj.url;
    currentSongName = songObj.title;
  }
  
  currentIndex = songsData.findIndex(song => {
    if (typeof song === 'string') return song === songObj;
    return song.title === (songObj.title || songObj);
  });
  
  console.log("Current index updated to:", currentIndex, "for song:", currentSongName);
  
  currentSong.play().catch(err => console.error("Error playing song:", err));
  
  const playbarSongInfo = document.querySelector(".playbar .songInfo");
  if (playbarSongInfo) {
    playbarSongInfo.innerHTML = currentSongName;
  }
  
  const playBtnImg = document.getElementById("btnImg");
  if (playBtnImg) {
    playBtnImg.src = 'resourses/pause.svg';
  }
}

function playPrevious() {
  if (songsData.length > 0) {
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = songsData.length - 1;
    }
    playMusik(songsData[prevIndex]);
  }
}

function playNext() {
  if (songsData.length > 0) {
    let nextIndex = currentIndex + 1;
    if (nextIndex >= songsData.length) {
      nextIndex = 0;
    }
    playMusik(songsData[nextIndex]);
  }
}

function setupNavigationListeners() {
  const hamburger = document.querySelector("#hamburger");
  const closeButton = document.querySelector(".closeCont");
  const leftPanel = document.querySelector(".left");

  if (hamburger && leftPanel) {
    hamburger.addEventListener('click', () => {
      leftPanel.style.left = "0";
    });
  }

  if (closeButton && leftPanel) {
    closeButton.addEventListener('click', () => {
      leftPanel.style.left = "-100%";
    });
  }
}

// Function to dynamically create album cards from JSON
function createAlbumCards(albums) {
  const cardContainer = document.querySelector('.cardContainer');
  if (!cardContainer) return;

  // Clear existing cards
  cardContainer.innerHTML = '';

  albums.forEach((album) => {
    const card = createCard(album.name, album.id, album.cover, album.songs.length);
    cardContainer.appendChild(card);
  });

  // Setup click listeners for all cards
  setupCardListeners();
}

// Helper function to create a single card element
function createCard(title, albumId, coverImage, songCount) {
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.albumId = albumId;
  
  card.innerHTML = `
    <div class="play">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" stroke-width="1.5" stroke-linejoin="round" />
      </svg>
    </div>
    <img src="${coverImage}" onerror="this.src='resourses/covers/1.jpg'">
    <h1>${title}</h1>
    <p>${songCount} Song${songCount !== 1 ? 's' : ''}</p>
  `;
  
  return card;
}

// Fetch albums configuration from JSON
function loadAlbums() {
  fetch('/api/albums')
    .then(res => res.json())
    .then(data => {
      albumsData = data;
      console.log('Loaded albums:', data);
      createAlbumCards(data.albums);
      
      // Load first album by default
      if (data.albums.length > 0) {
        loadAlbumSongs(data.albums[0].id);
        // Set first card as active
        setTimeout(() => {
          const firstCard = document.querySelector('.card');
          if (firstCard) firstCard.classList.add('active');
        }, 100);
      }
    })
    .catch(err => {
      console.error('Error loading albums:', err);
      // Show error message
      const cardContainer = document.querySelector('.cardContainer');
      if (cardContainer) {
        cardContainer.innerHTML = '<div style="color: #ff6b6b; padding: 20px;">Error loading albums. Please check songs-config.json file.</div>';
      }
    });
}

function setupCardListeners() {
  const cards = document.querySelectorAll('.card');
  
  cards.forEach((card) => {
    // Remove old listeners by cloning
    const newCard = card.cloneNode(true);
    card.parentNode.replaceChild(newCard, card);
  });

  // Add new listeners
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => {
      const albumId = card.dataset.albumId;
      loadAlbumSongs(albumId);
      
      const mainHeading = document.getElementById('main-h1');
      if (mainHeading) {
        const title = card.querySelector('h1').textContent;
        mainHeading.textContent = title;
      }
      
      // Remove active class from all cards and add to clicked card
      document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });
}

// Load songs for a specific album
function loadAlbumSongs(albumId) {
  currentAlbumId = albumId;
  
  const album = albumsData.albums.find(a => a.id === albumId);
  
  if (!album) {
    console.error('Album not found:', albumId);
    return;
  }
  
  songsData = album.songs;
  const songsUl = document.querySelector('.songsList').getElementsByTagName("ul")[0];
  songsUl.innerHTML = '';
  
  if (album.songs.length === 0) {
    songsUl.innerHTML = '<li style="color: #888; padding: 20px;">No songs found in this album</li>';
    return;
  }
  
  for (const song of album.songs) {
    songsUl.innerHTML += ` <li>
                        <img class="invert" src="resourses/musik.svg">
                        <div class="songInfo">
                            <div>${song.title}</div>
                            <div>${song.artist}</div>
                        </div>
                        <div class="playCont">
                            <div class="playNow">
                                <span>Play Now</span>
                                <img class="invert" src="resourses/play-button.svg">
                            </div>
                        </div>
                    </li>`;
  }
  
  Array.from(document.querySelector(".songsList").getElementsByTagName("li")).forEach((listItem, index) => {
    const playButton = listItem.querySelector(".playNow");
    if (!playButton) return;
    
    playButton.addEventListener("click", () => {
      playMusik(album.songs[index]);
    });
  });
  
  setupPlaybarListeners(album.songs);
}

function setupPlaybarListeners(data) {
  const playBtn = document.getElementById("playBtn");
  if (playBtn) {
    const newPlayBtn = playBtn.cloneNode(true);
    playBtn.parentNode.replaceChild(newPlayBtn, playBtn);
    newPlayBtn.addEventListener("click", () => {
      if (currentSong.paused) {
        if (currentSong.src) {
          currentSong.play();
          document.getElementById("btnImg").src = 'resourses/pause.svg';
        } else if (data.length > 0) {
          playMusik(data[0]);
        }
      } else {
        currentSong.pause();
        document.getElementById("btnImg").src = 'resourses/play-button.svg';
      }
    });
  }
  currentSong.removeEventListener("timeupdate", updateTimeDisplay);
  currentSong.removeEventListener("ended", handleSongEnd);
  currentSong.addEventListener("timeupdate", updateTimeDisplay);
  currentSong.addEventListener("ended", handleSongEnd);
  setupControlButtons();
  setupVolumeControl();
  setupSeekBar();
}

function updateTimeDisplay() {
  const playbarSongInfo = document.querySelector(".playbar .songDetail");
  const songTime = document.querySelector(".songTime");
  const seekBar = document.querySelector(".seekBar");
  const seekCircle = document.querySelector(".seekCircle");
  
  if (playbarSongInfo && currentSongName) {
    playbarSongInfo.innerHTML = currentSongName;
  }
  
  if (songTime) {
    const currentTime = Math.floor(currentSong.currentTime);
    const duration = Math.floor(currentSong.duration) || 0;
    const currentMin = Math.floor(currentTime / 60);
    const currentSec = currentTime % 60;
    const durationMin = Math.floor(duration / 60);
    const durationSec = duration % 60;
    songTime.innerHTML = `${currentMin}:${currentSec.toString().padStart(2, '0')} / ${durationMin}:${durationSec.toString().padStart(2, '0')}`;
  }
  
  // Update seekbar progress with sunset gradient
  if (seekBar && currentSong.duration) {
    const percent = (currentSong.currentTime / currentSong.duration) * 100;
    seekBar.style.setProperty('--seek-percent', percent + '%');
    
    if (seekCircle) {
      seekCircle.style.left = percent + "%";
      
      // Add playing animation
      if (!currentSong.paused) {
        seekCircle.classList.add('playing');
      } else {
        seekCircle.classList.remove('playing');
      }
    }
  }
}

function handleSongEnd() {
  playNext();
}

function setupControlButtons() {
  const songControls = document.querySelector('.songControlls');
  if (!songControls) return;
  const controlImages = songControls.querySelectorAll('img');
  controlImages.forEach((img) => {
    const newImg = img.cloneNode(true);
    img.parentNode.replaceChild(newImg, img);
  });
  const newControlImages = songControls.querySelectorAll('img');
  newControlImages.forEach((img, index) => {
    if (img.src.includes('previuse.svg')) {
      img.addEventListener("click", () => {
        playPrevious();
      });
    } else if (img.src.includes('next.svg')) {
      img.addEventListener("click", () => {
        playNext();
      });
    }
  });
}

function setupVolumeControl() {
  const volInput = document.querySelector(".volDiv input");
  if (volInput) {
    const newVolInput = volInput.cloneNode(true);
    volInput.parentNode.replaceChild(newVolInput, volInput);
    newVolInput.addEventListener("change", (e) => {
      currentSong.volume = parseInt(e.target.value) / 100
      if (currentSong.volume > 0) {
        document.querySelector(".volDiv img").src = document.querySelector(".volDiv img").src.replace("mute.svg", "volume.svg")
      }
    });
  }
}

function setupSeekBar() {
  const seekBar = document.querySelector(".seekBar");
  if (seekBar) {
    const newSeekBar = seekBar.cloneNode(false);
    seekBar.parentNode.replaceChild(newSeekBar, seekBar);
    
    // Recreate seekCircle inside
    const seekCircle = document.createElement('div');
    seekCircle.className = 'seekCircle';
    newSeekBar.appendChild(seekCircle);
    
    newSeekBar.addEventListener("click", e => {
      let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
      seekCircle.style.left = percent + "%";
      newSeekBar.style.setProperty('--seek-percent', percent + '%');
      currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    });
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  setupNavigationListeners();
  loadAlbums(); // Load albums from JSON
});