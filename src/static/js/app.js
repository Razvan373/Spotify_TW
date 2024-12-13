// Function to get a fresh Spotify token
async function getSpotifyToken() {
    try {
        const response = await fetch('/refresh_token');
        const data = await response.json();
        if (data.access_token) {
            console.log('Token refreshed successfully');
            return data.access_token;
        } else {
            console.error('Failed to retrieve a new access token', data.error);
            throw new Error(data.error || 'Token refresh failed');
        }
    } catch (error) {
        console.error('Error while refreshing token:', error);
        alert('Authentication failed. Please log in again.');
        window.location.href = '/login'; // Redirect to login page
    }
}

window.onSpotifyWebPlaybackSDKReady = async () => {
    const token = await getSpotifyToken();

    const player = new Spotify.Player({
        name: 'Music Streaming Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
    });

    player.addListener('ready', async ({ device_id }) => {
        console.log('Spotify Player is ready with device ID:', device_id);
        await connectToSpotifyDevice(device_id);

        if (typeof trackURI !== 'undefined' && trackURI) {
            playTrack(device_id, trackURI).then(() => {
                console.log('Track loaded and playing:', trackURI);
            }).catch(err => {
                console.error('Error playing track:', err);
            });
        }

        // Start tracking progress
        trackProgress(player);
    });

    player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline:', device_id);
    });

    player.addListener('player_state_changed', state => {
        if (!state) return;
        console.log('Player State Changed:', state);

        const playPauseButton = document.getElementById('play-pause');
        if (state.paused) {
            playPauseButton.textContent = '▶️';
        } else {
            playPauseButton.textContent = '⏸️';
        }
    });

    player.connect();

    const playPauseButton = document.getElementById('play-pause');
    playPauseButton.addEventListener('click', async () => {
        player.togglePlay().then(() => console.log('Toggled Play'));
    });

    const prevButton = document.getElementById('prev');
    prevButton.addEventListener('click', async () => {
        try {
            await player.previousTrack();
            console.log('Skipped to previous track');
        } catch (err) {
            console.error('Error during previous track:', err);
        }
    });

    const nextButton = document.getElementById('next');
    nextButton.addEventListener('click', async () => {
        try {
            await player.nextTrack();
            console.log('Skipped to next track');
        } catch (err) {
            console.error('Error during next track:', err);
        }
    });
};

/**
 * Call /play to play a track on Spotify.
 * @param {string} deviceId - The ID of the Spotify device.
 * @param {string} trackURI - The URI of the track to play.
 */
function playTrack(deviceId, trackURI) {
    return fetch('/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId, track_uri: trackURI })
    })
    .then(response => {
        if (response.ok) {
            console.log('Track loaded and playing successfully.');
        } else {
            console.error('Failed to play track:', response.statusText);
        }
    })
    .catch(error => console.error('Error playing track:', error));
}

/**
 * Connects to Spotify Player and transfers playback to the specified device ID.
 * @param {string} deviceId - The ID of the Spotify device.
 */
function connectToSpotifyDevice(deviceId) {
    return fetch(`/connect?device_id=${deviceId}`, { method: 'GET' })
        .then(response => {
            if (response.ok) {
                console.log('Connected to Spotify device.');
            } else {
                console.error('Failed to connect to Spotify device.');
            }
        })
        .catch(error => console.error('Error while connecting to Spotify device:', error));
}

/**
 * Track the progress of the currently playing song.
 * This function updates the current time, duration, and progress bar.
 * @param {Spotify.Player} player - The Spotify player object.
 */
function trackProgress(player) {
    const currentTimeElement = document.getElementById('current-time');
    const totalDurationElement = document.getElementById('total-duration');
    const progressBar = document.getElementById('progress-bar');

    setInterval(async () => {
        const state = await player.getCurrentState();
        if (!state) return;

        const currentPosition = state.position / 1000; // ms to seconds
        const totalDuration = state.duration / 1000; // ms to seconds

        // Update time
        currentTimeElement.textContent = formatTime(currentPosition);
        totalDurationElement.textContent = formatTime(totalDuration);

        // Update progress bar
        const progressPercentage = (currentPosition / totalDuration) * 100;
        if (progressBar) {
            progressBar.style.width = `${progressPercentage}%`;
        }
    }, 1000); // Update every second
}

/**
 * Formats time from seconds to MM:SS format.
 * @param {number} timeInSeconds - Time in seconds.
 * @returns {string} - Formatted time in MM:SS format.
 */
function formatTime(timeInSeconds) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
}


