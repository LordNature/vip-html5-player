'use strict';

let tracks = [];

const audio = document.querySelector('audio');

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
    t['file'] = resp['url'] + t['file'] + '.' + resp['ext'];
  }

  return resp['tracks'];
}

function writeDOMPlaylistOptions() {
  const select = document.querySelector('select');
  for (const p in PLAYLIST) {
    const opt = document.createElement('option');
    opt.value = PLAYLIST[p];
    opt.textContent = p;
    select.appendChild(opt);
  }
}

function writeDOMTracks() {
  const main = document.querySelector('main');
  // create an `a` element for each track
  for (const t of tracks) {
    const a = document.createElement('a');
    let desc = t.game + ': ' + t.title;
    if (t.comp) {
      desc += ', by ' + t.comp;
    }
    a.innerHTML = desc
    // set the track ID so you can refer with hash ID
    a.setAttribute('id', writeURITrack(t));
    a.addEventListener('click', function() {
      play(t.id);
    });
    main.appendChild(a);
  }
}

async function loadPlaylist(playlist) {
  localStorage.setItem('playlist', playlist);
  // remove any possible children from main track list
  document.querySelector('main').innerHTML = '';
  tracks = await roster(playlist);
  writeDOMTracks();
  //skip();
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

function writeURITrack(t) {
  const select = document.querySelector('select');
  const playlist = select.options[select.selectedIndex].text;
  return encodeURIComponent(playlist + ':' + t.id);
}

function parseURITrack(uri) {
  // noop if URI is not given
  if (!uri) {
    return null;
  }

  let cleanURI = decodeURIComponent(uri);
  cleanURI = cleanURI.split(':');
  // noop if URI is wrong
  if (cleanURI.length != 2) {
    return null;
  }

  const playlist = cleanURI[0];
  const id = cleanURI[1];

  // noop if playlist doesn't exist
  if (!(playlist in PLAYLIST)) {
    return null;
  }

  return {
    playlist: playlist,
    id: id,
  };
}

function skip() {
  const randomID = Math.floor(Math.random() * tracks.length);
  const trackID = tracks[randomID].id;
  play(trackID);
}

function play(id) {
  const track = tracks.filter(function(tracks) {
    return tracks.id == id;
  })[0];

  const trackURI = writeURITrack(track);
  window.location.hash = trackURI;

  // if exists, remove active class from track
  const active = document.querySelector('main > a.active');
  if (active) {
    active.classList.remove('active');
  }

  // add active class to track
  const trackElem = document.getElementById(trackURI);
  trackElem.classList.add('active');
  trackElem.scrollIntoView({behavior: 'smooth', block: 'center'});

  // play the audio
  audio.setAttribute('src', track.file);
  audio.play();
}


window.onload = async function() {
  let playlist = PLAYLIST.VIP;
  writeDOMPlaylistOptions();

  // process hash URIs, #VIP:1234
  let trackURI = parseURITrack(window.location.hash.substring(1));
  if (trackURI) {
    playlist = PLAYLIST[trackURI.playlist];
  }

  // load set playlist and play track if given a URI
  loadPlaylist(playlist);
  if (trackURI) {
    play(trackURI.id);
  }

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

  /* Load settings */
  if (localStorage.getItem ('volume') !== null)
    audio.volume = localStorage.getItem('volume');

  if (localStorage.getItem ('playlist') !== null) {
    if (localStorage.getItem ('playlist') in PLAYLISTS)
      playlist = localStorage.getItem ('playlist');
  }
};
