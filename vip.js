'use strict';

let tracks = [];

const audio = document.querySelector('audio');

let g_playlist = null;
const MAX_HISTORY = 1;

const PLAYLIST = {
  VIP: 'https://www.vipvgm.net/roster.min.json',
  Source: 'https://www.vipvgm.net/roster.min.json',
  Mellow: 'https://www.vipvgm.net/roster-mellow.min.json',
  Exiled: 'https://www.vipvgm.net/roster-exiled.min.json',
  WAP: 'https://wap.aersia.net/roster.xml',
  CPP: 'https://cpp.aersia.net/roster.xml',
};

// Takes in an enum from PLAYLIST and returns a roster.
async function roster(playlist) {
  // process XML playlists
  if (playlist == PLAYLIST.WAP || playlist == PLAYLIST.CPP) {
    console.warn(
      'vip: legacy XML WAP+CPP playlists are no longer updated'
    );
    return await legacyRoster(playlist);
  }

  let resp = await fetch(playlist);
  resp = await resp.json();

  // replace file with the actual file path
  for (let t of resp['tracks']) {
    t['file'] = resp['url'] + t['file'] + t['ext'];
  }

  return resp['tracks'];
}

function writeDOMPlaylistOptions() {
  const select = document.querySelector('select');
  for (const p in PLAYLIST) {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    select.appendChild(opt);
  }
}

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

async function legacyRoster(playlist) {
  let resp = await fetch(playlist);
  resp = await resp.text();

  // parse response as XML
  const parser = new DOMParser();
  const xml = parser.parseFromString(resp, 'application/xml');

  // convert into JSON
  const json = [];

  const tracks = xml.querySelectorAll('track');
  for (let t of tracks) {
    const creator = t.querySelector('creator').textContent;
    const title = t.querySelector('title').textContent;
    const loc = t.querySelector('location').textContent;
    t = {
      'game': creator,
      'title': title,
      'comp': '',
      'file': loc.replace('http://', 'https://'),
    };
    json.push(t);
  }

  return json;
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

function writeTracksDOM() {
  const main = document.querySelector('main');
  // create an `a` element for each track
  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i];
    const a = document.createElement('a');
    a.innerHTML = t.creator + ' - ' + t.title;
    // set the track ID so you can refer with hash ID
    a.setAttribute('id', create_trackID(t));
    a.addEventListener('click', function() {
      play(i);
    });
    main.appendChild(a);
  }
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

    writeTracksDOM();

    skip();
  });
};

window.onload = function() {
  writeDOMPlaylistOptions();

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
