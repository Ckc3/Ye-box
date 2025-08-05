
let albums = [];
let currentTrack = null;
let currentAlbum = null;
let currentTrackIndex = 0;
let audioPlayer = null;
let isPlaying = false;


document.addEventListener('DOMContentLoaded', function() {
    audioPlayer = document.getElementById('audioPlayer');
    loadAlbums();
    

    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', nextTrack);
    audioPlayer.addEventListener('loadedmetadata', function() {
        document.getElementById('progressBar').max = audioPlayer.duration;
    });
});


async function loadAlbums() {
    try {
        const response = await fetch('/api/albums');
        if (response.ok) {
            albums = await response.json();
            renderAlbums();
        }
    } catch (error) {
        console.error('Error loading albums:', error);
    }
}


function renderAlbums() {
    const musicGrid = document.getElementById('musicGrid');
    musicGrid.innerHTML = '';
    
    albums.forEach(album => {
        const albumCard = document.createElement('div');
        albumCard.className = 'album-card';
        albumCard.innerHTML = `
            <img src="/uploads/covers/${album.cover}" alt="${album.name}" class="album-cover">
            <div class="album-title">${album.name}</div>
            <div class="track-list">
                ${album.tracks.map((track, index) => 
                    `<div class="track-item" onclick="playTrack('${album.id}', ${index})">${track.name}</div>`
                ).join('')}
            </div>
        `;
        musicGrid.appendChild(albumCard);
    });
}


function playTrack(albumId, trackIndex) {
    currentAlbum = albums.find(album => album.id === albumId);
    currentTrackIndex = trackIndex;
    currentTrack = currentAlbum.tracks[trackIndex];
    

    document.getElementById('playerCover').src = `/uploads/covers/${currentAlbum.cover}`;
    document.getElementById('trackName').textContent = currentTrack.name;
    document.getElementById('albumNamePlayer').textContent = currentAlbum.name;
    

    audioPlayer.src = `/uploads/tracks/${currentTrack.file}`;
    audioPlayer.play();
    isPlaying = true;
    document.getElementById('playPauseBtn').textContent = '⏸';
    

    document.getElementById('player').style.display = 'block';
}


function togglePlayPause() {
    if (isPlaying) {
        audioPlayer.pause();
        document.getElementById('playPauseBtn').textContent = '▶';
        isPlaying = false;
    } else {
        audioPlayer.play();
        document.getElementById('playPauseBtn').textContent = '⏸';
        isPlaying = true;
    }
}


function previousTrack() {
    if (currentAlbum && currentTrackIndex > 0) {
        playTrack(currentAlbum.id, currentTrackIndex - 1);
    }
}


function nextTrack() {
    if (currentAlbum && currentTrackIndex < currentAlbum.tracks.length - 1) {
        playTrack(currentAlbum.id, currentTrackIndex + 1);
    }
}


function updateProgress() {
    if (audioPlayer.duration) {
        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        document.getElementById('progressBar').value = progress;
    }
}


function seekTo() {
    const progressBar = document.getElementById('progressBar');
    const seekTime = (progressBar.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = seekTime;
}




