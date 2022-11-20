# Vidya Intarweb Playlist HTML5 Player
VIP is a video game OST playlist maintained by Cats777.

[More Info](https://www.aersia.net/threads/vip-and-wap-faqs.8/)

fork of [this repository](https://github.com/fpgaminer/vip-html5-player)

## Version 2.0.0
This version is a rewrite to accommodate the new vipvgm JSON rosters. It also
heavily refactors the code. The URI schema has change from include the creator
and title to the new ID schema from vipvgm. Since some playlists lack this ID,
it is set to the index of the song (which could cause issues in the future). It
supports the old legacy WAP and CPP playlists as well! Its considered a major
revision due to the URI schema changing so much.

## Version 1.0.0
This version is a rewrite of the original HTML5 replacement player by fpgaminer.
The rewrite uses native Javascript instead of jQuery and removes the opinionated
theme for a very minimal one. It also removes the "playlist" feature in favor of
your browser's history as a playlist.

## Version 0.0.46
This version is simply a few patches on-top of the initial fpgaminer version to
put the javascript and css in a separate file. fpgaminer wrote this to replace
the deprecated Flash version. Since its creation, it has been used by the
official site as the [new player](https://vipvgm.net/).
