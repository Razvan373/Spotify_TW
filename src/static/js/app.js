
const audioPlayer = document.getElementById('audio-player');
        const playPauseBtn = document.getElementById('play-pause');
        const progressBar = document.getElementById('progress-bar');
        const progress = document.getElementById('progress');
        const currentTimeElement = document.getElementById('current-time');
        const totalDurationElement = document.getElementById('total-duration');
        
        playPauseBtn.addEventListener('click', () => {
            if (audioPlayer.paused) {
                audioPlayer.play();
                playPauseBtn.innerHTML = '&#10074;&#10074;'; // Change to pause icon
            } else {
                audioPlayer.pause();
                playPauseBtn.innerHTML = '&#9658;'; // Change to play icon
            }
        });

        audioPlayer.addEventListener('timeupdate', () => {
            const progressPercentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progress.style.width = `${progressPercentage}%`;
            
            // Update current time text
            const currentMinutes = Math.floor(audioPlayer.currentTime / 60);
            const currentSeconds = Math.floor(audioPlayer.currentTime - currentMinutes * 60);
            currentTimeElement.textContent = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')}`;
        });

        progressBar.addEventListener('click', (e) => {
            const progressBarWidth = progressBar.clientWidth;
            const clickX = e.offsetX;
            const duration = audioPlayer.duration;
            
            audioPlayer.currentTime = (clickX / progressBarWidth) * duration;
        });

        // Move forward 10 seconds
        document.getElementById('next').addEventListener('click', () => {
            audioPlayer.currentTime = Math.min(audioPlayer.duration, audioPlayer.currentTime + 10);
        });
        

        // Move back 10 seconds
        document.getElementById('prev').addEventListener('click', () => {
            audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 10);
        });


