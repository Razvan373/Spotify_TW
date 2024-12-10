import spotipy
import json
from flask import Flask, request, redirect, jsonify,render_template
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv
import os
from flask_cors import CORS
import requests
from flask_socketio import SocketIO
# Enable CORS for all routes

load_dotenv()

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app, origins=[
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:8888", 
    "http://127.0.0.1:8888"])


sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
    client_id=os.getenv('CLIENT_ID'),
    client_secret=os.getenv('CLIENT_SECRET'),
    redirect_uri=os.getenv('REDIRECT_URI'),
    scope="user-read-playback-state user-modify-playback-state streaming user-library-read"

),
requests_timeout=10
)

@socketio.on('connect')
def handle_connect():
    print('Client connected!')

@app.route('/')
def home():
    auth_url = sp.auth_manager.get_authorize_url()
    return redirect(auth_url)

@app.route('/callback')
def callback():
    token_info = sp.auth_manager.get_access_token(request.args['code'])
    sp.auth = token_info['access_token']
    with open('token.txt', 'w') as token_file:
        token_file.write(token_info['access_token'])

    return "Authentication successful, you can close this window."


@app.route('/search_song')
def search_song():
    song_name = request.args.get('song')
    results = sp.search(q=song_name, type='track', limit=1)
    track = results['tracks']['items'][0]
    track_uri = track['uri']
    return jsonify({'track_uri': track_uri})



@app.route('/music/<song_id>')
def music(song_id):
    try:
        # Fetch track data using the song_id from Spotify
        track = sp.track(song_id)
        print("Spotify API Response:", track)
        track_name = track['name']
        artist_name = ', '.join([artist['name'] for artist in track['artists']])
        track_image = track['album']['images'][0]['url']
        audio_url = track['preview_url']
        duration_text = f"{track['duration_ms'] // 60000}:{(track['duration_ms'] // 1000) % 60:02}"
    except Exception as e:
        return f"Error fetching track data: {e}", 404
 
    return render_template('music.html', 
                           track_name=track_name, 
                           artist_name=artist_name, 
                           track_image=track_image, 
                           audio_url=audio_url,
                           duration_text=duration_text)


@app.route('/artist/<artist_id>')
def artist_profile(artist_id):
    artist = sp.artist(artist_id)
    artist_name = artist['name']
    header_url = artist['images'][0]['url']
    monthly_listeners = f"{int(artist['followers']['total']):,}"

    top_tracks_data = sp.artist_top_tracks(artist_id)
    top_tracks = []
    for track in top_tracks_data['tracks']:
        top_tracks.append({
            "id": track['id'],
            "name": track['name'],
            "track_image": track['album']['images'][0]['url'],
            "playCount": f"{track['popularity']} popularity", 
            "durationText": f"{track['duration_ms'] // 60000}:{(track['duration_ms'] // 1000) % 60:02}"
        })
    return render_template('profile.html', 
                               name=artist_name, 
                               headerUrl=header_url, 
                               monthlyListeners=monthly_listeners, 
                               topTracks=top_tracks)

@app.route('/playlist/<playlist_id>')
def playlist(playlist_id):
    playlist = sp.playlist(playlist_id)
    playlist_name = playlist['name']
    header_url = playlist['images'][0]['url']
    monthly_listeners = f"{int(playlist['followers']['total']):,}"

    playlist_songs_data = sp.playlist_items(playlist_id)
    playlist_songs = []
    for track in playlist_songs_data['items']:
        playlist_songs.append({
            "id": track['track_id'],
            "name": track['name'],
            "track_image": track['album']['images'][0]['url'],
            "playCount": f"{track['popularity']} popularity", 
            "durationText": f"{track['duration_ms'] // 60000}:{(track['duration_ms'] // 1000) % 60:02}"
        })
    return render_template('album.html',
                           name=playlist_name,
                           headerUrl=header_url,
                           monthlyListeners=monthly_listeners,
                           playlistSongs=playlist_songs)

if __name__ == "__main__":
   socketio.run(app, debug=True, port=8888)
