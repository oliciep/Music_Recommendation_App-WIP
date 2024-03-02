import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from "react"
import SpotifyWebApi from "spotify-web-api-js"

import { createTheme, ThemeProvider } from '@mui/material/styles';
import { green } from '@mui/material/colors';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Modal from '@mui/material/Modal';

const lightTheme = createTheme({
  palette: {
    primary: {
      main: green[700], // green
    },
    secondary: {
      main: green[400], // darker green
    },
  },
});

const darkTheme = createTheme({
  palette: {
    primary: {
      main: green[400], // light green
    },
    secondary: {
      main: green[800], // darker green
    },
  },
}); 

const spotifyApi = new SpotifyWebApi

const getTokenFromUrl = () => {
  return window.location.hash.substring(1).split('&').reduce((initial, item) => {
    let parts = item.split("=");
    initial[parts[0]] = decodeURIComponent(parts[1]);
    return initial;
  }, {});
}


function App() {  
  const [spotifyToken, setSpotifyToken] = useState("");
  const [nowPlaying, setNowPlaying] = useState({});
  const [user, setUser] = useState({});
  const [loggedIn, setLoggedIn] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);
  const [topArtists, setTopArtists] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    console.log("Token derived from URL: ", getTokenFromUrl());
    const spotifyToken = getTokenFromUrl().access_token;
    window.location.hash = "";
    console.log("Spotify token: ", spotifyToken);

    if (spotifyToken) {
      setSpotifyToken(spotifyToken);
      spotifyApi.setAccessToken(spotifyToken);
      spotifyApi.getMe().then((user) => {
        console.log(user);
        setUser(user);
      });
      setLoggedIn(true);
    }
  }, []);

  const getNowPlaying = () => {
    spotifyApi.getMyCurrentPlaybackState().then((response) => {
      console.log(response);
      if(response.item) {
        const track = response.item;
        const trackInfo = {
          name: track.name,
          albumArt: track.album.images.length > 0 ? track.album.images[0].url : null,
          artist: "by " +  track.artists.map(artist => artist.name).join(", "),
          album: track.album.name,
          duration_ms: track.duration_ms,
          popularity: track.popularity,
          id: track.id,
          uri: track.uri
        };
        setNowPlaying(trackInfo);
      } else {
        setNowPlaying({
          name: "None",
          albumArt: null,
          artist: "",
          album: "None",
          duration_ms: 0,
          popularity: 0,
          id: "",
          uri: ""
        });
      }
      setButtonClicked(true);
    }).catch(error => {
      console.error("Error:", error);
      setNowPlaying({
        name: "Error fetching song name",
        albumArt: null,
        artist: "",
        album: "Error fetching album",
        duration_ms: 0,
        popularity: 0,
        id: "",
        uri: ""
      });
      setButtonClicked(true);
    });
  };

  const createPlaylist = () => {
    if (!user) {
      console.error("User information not available.");
      return;
    }
  
    const playlistName = "Recently Played Playlist";
  
    spotifyApi.createPlaylist(user.id, { name: playlistName })
      .then((playlist) => {
        console.log("Playlist created:", playlist.id);
        if (nowPlaying.id) {
          addTracksToPlaylist(playlist.id, nowPlaying.uri);
        } else {
          console.error("No currently playing track found.");
        }
      })
      .catch((error) => {
        console.error("Error creating playlist:", error);
      });
  };
  

  const addTracksToPlaylist = (playlistId, trackUri) => {
    spotifyApi.addTracksToPlaylist(playlistId, [trackUri])
      .then((response) => {
        console.log("Track added to the playlist:", response);
      })
      .catch((error) => {
        console.error("Error adding track to playlist:", error);
      });
  };

  const getTopRecentlyPlayedArtists = (tracks) => {
    const artistsMap = {};

    tracks.forEach(track => {
      track.artists.forEach(artist => {
        const artistName = artist.name;
        if (artistsMap[artistName]) {
          artistsMap[artistName]++;
        } else {
          artistsMap[artistName] = 1;
        }
      });
    });

    const artistsArray = Object.keys(artistsMap).map(artist => ({ name: artist, count: artistsMap[artist] }));

    artistsArray.sort((a, b) => b.count - a.count);

    return artistsArray.slice(0, 5);
  };

  const getRecentlyPlayedArtists = () => {
    spotifyApi.getMyRecentlyPlayedTracks({ limit: 50 })
      .then((response) => {
        const tracks = response.items.map(item => item.track);
        const topArtists = getTopRecentlyPlayedArtists(tracks);
        console.log("Top 5 recently played artists:", topArtists);
        setTopArtists(topArtists);
        handleModalOpen();
      })
      .catch((error) => {
        console.error("Error fetching recently played tracks:", error);
      });
  };

  const handleModalOpen = () => {
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <div className="App">
        <Box
          sx={{
            backgroundColor: 'aquamarine',
            height: '100%',
            width: '100%',
            margin: 0,
            padding: 0,
            position: 'fixed',
            top: 0,
            left: 0,
            overflow: 'auto',
          }}
        >
          <Typography variant="h1" color="primary" className="fadeInAnimation" >
            musicMuse
          </Typography>
          <Typography variant="h3" color="secondary" gutterBottom className="fadeInAnimation" style={{ animationDelay: '0.5s' }} >
            Discover new music.
          </Typography>
          {!loggedIn && (
            <> 
              <Button variant="contained" color="primary" href="http://localhost:8888">
                Log In to Spotify
              </Button>
            </>
          )}
          {loggedIn && (
            <>
              <div style={{ position: 'absolute', top: 10, right: 10 }}>
                <Typography variant="h5" color="secondary" sx={{ fontWeight:'bold' }} gutterBottom className="fadeInAnimation">
                  Welcome {user.display_name}!
                </Typography>
              </div>
              {buttonClicked && (
                <div className="fadeInAnimation" style={{ animationDelay: '2s', backgroundColor: '#52bf90', display: 'inline-block', borderRadius: '8px', borderColor: '#419873', borderWidth: '3px', borderStyle: 'solid',  padding: '10px' }}> 
                  <Grid container justifyContent="center" alignItems="center">
                    {nowPlaying.albumArt && (
                      <Grid item>
                        <img src={nowPlaying.albumArt} style={{ height: 100, opacity: 0, animation: 'fadeIn 1s ease-out forwards', marginRight: '10px' }} alt="Album Art" onLoad={(e) => { e.target.style.opacity = 1 }} />
                      </Grid>
                    )}
                    <Grid item>
                      <Typography variant="h5" color="primary" sx={{ fontWeight:'bold' } } className="fadeInAnimation" style={{ animationDelay: '0.5s', marginLeft: '10px' }}> 
                        Song: <i>{nowPlaying.name}</i> <i>{nowPlaying.artist}</i>
                      </Typography> 
                      <Typography variant="h5" color="#317256" sx={{ fontWeight:'bold' } } className="fadeInAnimation" style={{ animationDelay: '0.5s', marginLeft: '10px' }}> 
                        Album: <i>{nowPlaying.album}</i>
                      </Typography> 
                    </Grid>
                  </Grid>
                </div>
              )}

              <br></br><br></br>

              <Button variant="contained" color="primary" className="fadeInAnimation" style={{ animationDelay: '1s' }} onClick={() => getNowPlaying()}>Check Now Playing</Button>
              
              <div style={{ marginBottom: '100vh' }}></div> {}

              <Button variant="contained" color="secondary" className="fadeInAnimation" style={{ animationDelay: '1s' }} onClick={getRecentlyPlayedArtists}>Top Recent Artists</Button>

              <div style={{ marginBottom: '100vh' }}></div> {}

              <Button variant="contained" color="primary" className="fadeInAnimation" style={{ animationDelay: '1s' }} onClick={createPlaylist}>Create Playlist</Button>

              <br></br><br></br>
              
              <Modal
                open={modalOpen}
                onClose={handleModalClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
              >
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'aquamarine', border: '2px solid #000', boxShadow: 24, p: 4 }}>
                  <Typography id="modal-modal-title" variant="h6" component="h2">
                    Top 5 Recently Played Artists
                  </Typography>
                  <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                    {topArtists.map((artist, index) => (
                      <div key={index}>{index + 1}. {artist.name}</div>
                    ))}
                  </Typography>
                </Box>
              </Modal>
            </>
          )}
        </Box>
      </div>
    </ThemeProvider>
  );
}

export default App;