import spotipy
import webbrowser


def read_token():
    with open('token.txt', 'r') as token_file:
        return token_file.read().strip()


def interactive_console():
    token = read_token()
    sp = spotipy.Spotify(auth=token)
    user_info = sp.current_user()
    user_name = user_info.get('display_name', 'User')

    while True:
        print("Welcome to the project, " + user_name)
        print("0 - Exit the console")
        print("1 - Search for a Song")
        user_input = int(input("Enter Your Choice: "))
        if user_input == 1:
            search_song = input("Enter the song name: ")
            results = sp.search(search_song, 1, 0, "track")
            songs_dict = results['tracks']
            song_items = songs_dict['items']
            song = song_items[0]['external_urls']['spotify']
            webbrowser.open(song)
            print('Song has opened in your browser.')
        elif user_input == 0:
            print("Good Bye, Have a great day!")
            break
        else:
            print("Please enter valid user-input.")


if __name__ == "__main__":
    interactive_console()
