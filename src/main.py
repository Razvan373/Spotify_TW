import spotipy
import json
from flask import Flask, request, redirect, jsonify,render_template, session,  url_for
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv
import os
from flask_cors import CORS
import requests
from flask_socketio import SocketIO
from spotipy.exceptions import SpotifyException

global_token_storage = {}
load_dotenv()

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")
CORS(app, origins=[
    "http://localhost:5500",
    "http://localhost:8888", ])


sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
    client_id=os.getenv('CLIENT_ID'),
    client_secret=os.getenv('CLIENT_SECRET'),
    redirect_uri=os.getenv('REDIRECT_URI'),
    scope="user-read-playback-state user-modify-playback-state streaming user-read-currently-playing user-read-email user-read-private playlist-read-private playlist-read-collaborative"
), requests_timeout=10)



@socketio.on('connect')
def handle_connect():
    print('Client connected!')

@app.route('/login')
def login():
    """Login route to authenticate with Spotify."""
    authorize_url = sp.auth_manager.get_authorize_url()
    return redirect(authorize_url)

@app.route('/callback')
def callback():
    """Handles the callback from Spotify after login."""
    if 'error' in request.args:
        return f"Spotify login failed: {request.args.get('error')}", 400

    if 'code' not in request.args:
        return "Missing 'code' parameter in the callback URL.", 400

    try:
        code = request.args['code']
        token_info = sp.auth_manager.get_access_token(code)
        
        
        global_token_storage['spotify_access_token'] = token_info.get('access_token')
        global_token_storage['spotify_refresh_token'] = token_info.get('refresh_token')  # Store refresh token
        return redirect(url_for('music', song_id='4uLU6hMCjMI75M1A2tKUQC'))
    except Exception as e:
        return f"An error occurred: {e}", 400


@app.route('/refresh_token', methods=['GET'])
def refresh_token():
    """Refresh the Spotify access token."""
    try:
        refresh_token = global_token_storage.get('spotify_refresh_token')
        if not refresh_token:
            return jsonify({'error': 'No refresh token found. Please log in again.'}), 401
        
       
        token_info = sp.auth_manager.refresh_access_token(refresh_token)
        
        global_token_storage['spotify_access_token'] = token_info.get('access_token')
        
        if 'refresh_token' in token_info:
            global_token_storage['spotify_refresh_token'] = token_info.get('refresh_token')

        return jsonify({'access_token': token_info['access_token']})
    except Exception as e:
        return jsonify({'error': f'Failed to refresh token: {str(e)}'}), 400


@app.route('/connect', methods=['GET'])
def connect():
    """Connects the client to the Spotify player."""
    device_id = request.args.get('device_id')
    token_info = global_token_storage.get('spotify_access_token')
    if not token_info:
        return jsonify({"error": "No token available"}), 401

    headers = {
        'Authorization': f'Bearer {token_info}',
        'Content-Type': 'application/json'
    }
    data = json.dumps({ "device_ids": [device_id], "play": False })
    response = requests.put('https://api.spotify.com/v1/me/player', headers=headers, data=data)
    
    if response.status_code == 204:
        return jsonify({"success": True}), 204
    else:
        return jsonify({"error": "Failed to connect to the Spotify player", "status_code": response.status_code}), response.status_code

@app.route('/music/<song_id>')
def music(song_id):
    """Plays a song using the Spotify Web Playback SDK."""
    token_info = global_token_storage.get('spotify_access_token')

    if not token_info:
        return redirect(url_for('login'))

    try:
        sp = spotipy.Spotify(auth=token_info)
        track = sp.track(song_id)
        
        track_name = track['name']
        artist_name = ', '.join([artist['name'] for artist in track['artists']])
        track_image = track['album']['images'][0]['url']
        track_uri = track['uri']
    except Exception as e:
        return f"Error fetching track data: {e}", 404

    return render_template('music.html',
                           track_name=track_name,
                           artist_name=artist_name,
                           track_image=track_image,
                           spotify_token=token_info,
                           track_uri=track_uri)

@app.route('/play', methods=['POST'])
def play_track():
    """Play a track on Spotify."""
    token_info = global_token_storage.get('spotify_access_token')
    if not token_info:
        return jsonify({"error": "No access token available"}), 401

    try:
        device_id = request.json.get('device_id')
        track_uri = request.json.get('track_uri')
        
        if not device_id or not track_uri:
            return jsonify({"error": "Missing device_id or track_uri"}), 400

        headers = {
            'Authorization': f'Bearer {token_info}',
            'Content-Type': 'application/json'
        }
        data = json.dumps({ "uris": [track_uri] })
        response = requests.put(f'https://api.spotify.com/v1/me/player/play?device_id={device_id}', headers=headers, data=data)
        
        if response.status_code == 204:
            return jsonify({"success": True}), 204
        else:
            return jsonify({"error": "Failed to play track", "status_code": response.status_code}), response.status_code

    except Exception as e:
        return jsonify({"error": f"Failed to play track: {str(e)}"}), 400


@app.route('/artist/<artist_id>')
def artist_profile(artist_id):
    """Displays the profile of an artist and their top tracks."""
    token_info = global_token_storage.get('spotify_access_token')

    if not token_info:
        return redirect(url_for('login'))

    try:
        sp = spotipy.Spotify(auth=token_info)
        artist = sp.artist(artist_id)
        artist_name = artist['name']
        header_url = artist['images'][0]['url']
        monthly_listeners = f"{int(artist['followers']['total']):,}"

        top_tracks_data = sp.artist_top_tracks(artist_id)
        top_tracks = []
        for track in top_tracks_data['tracks']:
            if 'id' in track:
                top_tracks.append({
                    "id": track['id'], 
                    "name": track['name'],
                    "track_image": track['album']['images'][0]['url'],
                    "playCount": f"{track['popularity']} popularity", 
                    "durationText": f"{track['duration_ms'] // 60000}:{(track['duration_ms'] // 1000) % 60:02}"
                })
    except Exception as e:
        return f"Error fetching artist data: {e}", 404

    return render_template('profile.html', 
                           name=artist_name, 
                           headerUrl=header_url, 
                           monthlyListeners=monthly_listeners, 
                           topTracks=top_tracks)


@app.route('/playlist/<playlist_id>')
def playlist(playlist_id):

        
        if sp.auth_manager.cache_handler.get_cached_token():
            if sp.auth_manager.is_token_expired(sp.auth_manager.cache_handler.get_cached_token()):
                sp.auth_manager.refresh_access_token(sp.auth_manager.cache_handler.get_cached_token().get('refresh_token'))
        
        playlist = sp.playlist(playlist_id)
        
        playlist_name = playlist.get('name', 'Unknown Playlist')
        header_url = playlist['images'][0]['url'] if playlist.get('images') and len(playlist['images']) > 0 else 'default-image-url.jpg'
        monthly_listeners = f"{int(playlist.get('followers', {}).get('total', 0)):,}"
        
        playlist_songs = []
        for item in playlist['tracks']['items']:
            track = item.get('track')
            if track:
                playlist_songs.append({
                    "id": track.get('id', 'N/A'),
                    "name": track.get('name', 'Unknown Track'),
                    "track_image": track['album']['images'][0]['url'] if track.get('album') and track['album'].get('images') else 'default-track-image.jpg',
                    "artist": ', '.join([artist['name'] for artist in track.get('artists', [])]),
                    "playCount": f"{track.get('popularity', 0)} popularity", 
                    "durationText": f"{track.get('duration_ms', 0) // 60000}:{(track.get('duration_ms', 0) // 1000) % 60:02}",
                    "track_uri": track.get('uri', 'N/A')  
                })
        
        
        return render_template('album.html', 
                               name=playlist_name, 
                               headerUrl=header_url, 
                               monthlyListeners=monthly_listeners, 
                               playlistSongs=playlist_songs)




    

if __name__ == "__main__":
   socketio.run(app, debug=True, port=8888)
