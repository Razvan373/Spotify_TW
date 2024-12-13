window.addEventListener('DOMContentLoaded', () => {
    const playlistId = document.getElementById('playlist-id').value; // Ensure the element exists
    
    async function getPlaylistData() {
      try {
        const response = await fetch(`/playlist/${playlistId}/data`);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        
        const data = await response.json();
        displayPlaylistData(data);
      } catch (error) {
        console.error('Error fetching playlist data:', error);
        alert('Could not load playlist.');
      }
    }
  
    function displayPlaylistData(data) {
      document.getElementById('playlist-name').innerText = data.name;
      document.getElementById('playlist-image').src = data.headerUrl;
      document.getElementById('monthly-listeners').innerText = `${data.monthlyListeners} Monthly Listeners`;
  
      const trackList = document.getElementById('track-list');
      trackList.innerHTML = ''; // Clear old tracks
  
      data.playlistSongs.forEach(track => {
        const trackElement = document.createElement('div');
        trackElement.classList.add('track');
        trackElement.innerHTML = `
          <img src="${track.track_image}" alt="${track.name} Cover">
          <div class="track-details">
            <h3>${track.name}</h3>
            <p>Duration: ${track.durationText}</p>
          </div>
          <div class="play-btn">
            <button onclick="playTrack('${track.id}')">Play</button>
          </div>
        `;
        trackList.appendChild(trackElement);
      });
    }
  
    function playTrack(trackId) {
      alert(`Playing track with ID: ${trackId}`);
    }
  
    getPlaylistData();
  });
  
