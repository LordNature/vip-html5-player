'use strict';

let tracks = [];

const audio = document.querySelector('audio');

let g_playlist = null;
const MAX_HISTORY = 1;

const PLAYLISTS = {
  'VIP': 'https://vip.aersia.net/roster.xml',
  'Mellow': 'https://vip.aersia.net/roster-mellow.xml',
  'Source': 'https://vip.aersia.net/roster-source.xml',
  'Exiled': 'https://vip.aersia.net/roster-exiled.xml',
  'WAP': 'https://wap.aersia.net/roster.xml',
  'CPP': 'https://cpp.aersia.net/roster.xml',
};

const DEFAULT_PLAYLIST = 'VIP';

// Creates encoded URI for location hash
function create_trackID(track) {
  let playlist = document.querySelector('select').value;
  let trackID = track.creator + ' - ' + track.title;
  trackID = trackID.replace(/[^a-zA-Z0-9-]/g, '_');

  return encodeURIComponent(playlist) + ':' + trackID;
}

// Decodes encoded URI
function parse_trackID(trackID) {
  let pieces = trackID.split(':');
  let playlist = null;
  let track = null;

  if(pieces.length < 2) {
    playlist = decodeURIComponent(trackID);
    track = '';
  } else {
    pieces.pop();
    playlist = decodeURIComponent(pieces.join(':'));
    track = trackID;
  }

  if(!(playlist in PLAYLISTS))
    return null;

  return {
    playlist: playlist,
    track: track
  };
}

function parse_XML(data) {
  const result = [];

  const playlist = data.getElementsByTagName('track');

  for (var i = 0; i < playlist.length; ++i) {
    const track = {
      creator: playlist[i].getElementsByTagName('creator')[0].firstChild.nodeValue,
      title: playlist[i].getElementsByTagName('title')[0].firstChild.nodeValue,
      location: playlist[i].getElementsByTagName('location')[0].firstChild.nodeValue
    }
    result.push(track);
  }

  return result;
}

function load_XML(playlistURL, callback) {
  var xhttp = new XMLHttpRequest();
  xhttp.open("GET", playlistURL, true);
  xhttp.responseType = "document";
  xhttp.onreadystatechange = function () {
    if(this.readyState == xhttp.DONE && this.status == 200) {
      if(typeof callback === 'function')
        callback(xhttp.response);
    }
  }
  xhttp.onerror = function() {
    console.log("Error while getting XML.");
  }
  xhttp.send();
}

function skip() {
  const randomID = Math.floor(Math.random() * tracks.length);
  play(randomID);
}

function play(id) {
  const track = tracks[id];
  // FIXME: create_trackID needs to be updated
  const trackPublicID = create_trackID(track);

  window.location.hash = trackPublicID;

  // if exists, remove active class from track
  const active = document.querySelector('main > a.active');
  if (active) {
    active.classList.remove('active');
  }

  // add active class to track
  const trackElem = document.getElementById(trackPublicID);
  trackElem.classList.add('active');
  trackElem.scrollIntoView({behavior: 'smooth', block: 'center'});

  // play the audio
  audio.setAttribute('src', track.location);
  audio.play();
}

function loadNewPlaylist (playlist, track) {
  var playlistURL = PLAYLISTS[playlist];
  var selected_track = track;

  localStorage['playlist'] = playlist;
  document.querySelector('select').value = playlist;

  // Clear
  document.querySelectorAll("main > a").forEach(e => e.parentNode.removeChild(e));

  g_playlist = null;

  load_XML(playlistURL, function(data) {
    // Parse track list
    // FIXME: remove when g_playlist is gone
    g_playlist = parse_XML(data);
    tracks = g_playlist;

    // Build HTML table for track listing
    for (var i = 0; i < g_playlist.length; ++i) {
      var track = g_playlist[i];

      // create a new div element 
      var row = document.createElement('a'); 
      // and give it some content 
      var newContent = document.createTextNode(track.creator + ' - ' + track.title); 
      // add the text node to the newly created div
      row.appendChild(newContent);  

      // add the newly created element and its content into the DOM 
      var currentDiv = document.querySelector('main'); 
      currentDiv.appendChild(row);

      row.setAttribute('id', create_trackID(track));

      (function (i) {
        row.addEventListener('click', function (){
          play(i);
        }); 
      }) (i);
    }

    // Select specified track if possible, or play random track if not.
    var playlist_tracks = document.querySelectorAll("main > a");
    let selection = 0;

    for (var i = 0; i < playlist_tracks.length; ++i) {
      if (playlist_tracks[i].id == selected_track){
        selection = playlist_tracks[i];
      }
    }

    if (selection != 0) {
      selection.click();
    } else {
      skip();
    }
  });
};

function populatePlaylistOptions () {
  for (var name in PLAYLISTS) {
    var option = document.createElement('option'); 
    option.value = name;
    option.textContent = name;

    document.querySelector('select').appendChild(option);
  }
}

window.onload = function() {
  audio.addEventListener('error', function (){
    skip();
  });

  audio.addEventListener('ended', function (){
    skip();
  });

  document.querySelector('button').addEventListener('click', function (){
    skip();
  }); 

  document.querySelector('select').addEventListener('change', function (){
    var playlist = document.querySelector('select').value;
    loadNewPlaylist (playlist, '');
  }); 

  populatePlaylistOptions ();

  // Default playlist, random track
  var playlist = DEFAULT_PLAYLIST;
  var track = '';

  /* Load settings */
  if (localStorage.getItem ('volume') !== null)
    audio.volume = localStorage.getItem('volume');

  if (localStorage.getItem ('playlist') !== null) {
    if (localStorage.getItem ('playlist') in PLAYLISTS)
      playlist = localStorage.getItem ('playlist');
  }

  // If hash is set, override playlist and track
  var url_track = parse_trackID (window.location.hash.substring(1));

  if (url_track !== null) {
    playlist = url_track.playlist;
    track = url_track.track;
  }

  // Load playlist and track
  loadNewPlaylist (playlist, track);
};
