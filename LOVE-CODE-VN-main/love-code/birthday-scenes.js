(function () {
  'use strict';

  var config = window.BIRTHDAY_MEDIA || {};
  var photos = (config.images || []).slice();
  var song = document.getElementById('love-song');
  var musicButton = document.getElementById('music-toggle');
  var blowButton = document.getElementById('blow-candle');
  var songPlaying = false;
  var songReady = Boolean(config.song || config.youtubeId);
  var youtubePlayer;
  var youtubeReady = false;
  var youtubeRequested = false;
  var youtubeNeedsStart = true;
  var songStart = Math.max(0, Number(config.youtubeStart) || 0);
  var dock = document.getElementById('ordinary-dock');
  var sceneTimer;
  var photoTimer;
  var photoIndex = 0;
  var typingTimer;
  if (config.song) song.src = config.song;

  var api = window.BirthdayScenes = {
    candleBlown: false,
    letterStarted: false,
    enableCandle: enableCandle,
    toggleSong: toggleSong
  };

  // Photos ship with the project; no browser storage or file selection is needed.

  function enableCandle() {
    if (api.candleBlown) return;
    blowButton.hidden = false;
    document.getElementById('candle-hint').hidden = false;
  }

  function updateSongButton() {
    musicButton.setAttribute('aria-pressed', String(songPlaying));
    musicButton.textContent = songPlaying ? '♫ Tắt nhạc' : '♫ Phát Ordinary';
  }

  function startYouTubePlayback() {
    if (!youtubeReady || !youtubeRequested) return;
    if (youtubeNeedsStart) {
      youtubePlayer.seekTo(songStart, true);
      youtubeNeedsStart = false;
    }
    youtubePlayer.unMute();
    youtubePlayer.setVolume(65);
    youtubePlayer.playVideo();
  }

  async function playSong() {
    if (!songReady) { updateSongButton(); return; }
    if (!song.src && config.youtubeId) {
      youtubeRequested = true;
      dock.hidden = false;
      placePlayer();
      prepareYouTube();
      musicButton.textContent = '♫ Phát Ordinary';
      startYouTubePlayback();
      return;
    }
    try {
      song.volume = .65;
      await song.play();
      songPlaying = true;
      window.musicEnabled = true;
      updateSongButton();
    } catch (error) {
      songPlaying = false;
      updateSongButton();
      musicButton.textContent = '♫ Bấm để thử phát lại';
    }
  }

  function toggleSong() {
    if (!songReady) return;
    if (songPlaying) {
      song.pause();
      youtubeRequested = false;
      if (youtubeReady) youtubePlayer.pauseVideo();
      songPlaying = false;
      window.musicEnabled = false;
      updateSongButton();
    } else playSong();
  }

  function placePlayer() {
    var parent = innerWidth < 1100 ? document.querySelector('.love-letter') : document.getElementById('letter-scene');
    if (dock.parentElement !== parent) parent.appendChild(dock);
  }
  window.addEventListener('resize', placePlayer);

  function prepareYouTube() {
    if (!config.youtubeId || window.__birthdayYouTubeLoading) return;
    window.__birthdayYouTubeLoading = true;
    window.onYouTubeIframeAPIReady = function () {
      youtubePlayer = new YT.Player('ordinary-player', {
        width: 202, height: 200, videoId: config.youtubeId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: { playsinline: 1, rel: 0, origin: window.location.origin, start: songStart },
        events: {
          onReady: function () {
            youtubeReady = true;
            var iframe = youtubePlayer.getIframe();
            iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
            iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
            if (youtubeRequested && !song.src) {
              startYouTubePlayback();
            } else {
              youtubePlayer.cueVideoById({ videoId: config.youtubeId, startSeconds: songStart });
            }
          },
          onStateChange: function (event) {
            if (!api.candleBlown || song.src) return;
            if (event.data === 0 && youtubeRequested) {
              youtubeNeedsStart = true;
              startYouTubePlayback();
              return;
            }
            songPlaying = event.data === 1;
            window.musicEnabled = songPlaying;
            updateSongButton();
          },
          onAutoplayBlocked: function () { musicButton.textContent = '♫ Bấm để phát Ordinary'; },
          onError: function () {
            songPlaying = false;
            musicButton.setAttribute('aria-pressed', 'false');
            musicButton.textContent = '♫ Thử phát lại Ordinary';
          }
        }
      });
    };
    var script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = function () {
      window.__birthdayYouTubeLoading = false;
      musicButton.textContent = '♫ Bấm để thử phát Ordinary';
    };
    document.head.appendChild(script);
  }
  document.getElementById('open-gift').addEventListener('click', function () {
    if (!song.src) prepareYouTube();
  });

  blowButton.addEventListener('click', function () {
    if (api.candleBlown || blowButton.hidden) return;
    api.candleBlown = true;
    blowButton.disabled = true;
    blowButton.textContent = 'Điều ước của anh sẽ thành hiện thực ♡';
    document.getElementById('candle-hint').textContent = 'Một lá thư nhỏ đang chờ anh…';
    document.querySelector('.cake').setAttribute('aria-label', 'Bánh kem với ngọn nến vừa được thổi tắt');
    document.body.classList.add('candle-out');
    document.getElementById('wishes').replaceChildren();

    // Stop the music box and start the vocal track within the candle click.
    clearInterval(window.musicTimer);
    window.musicTimer = null;
    window.musicEnabled = false;
    if (window.audioContext) window.audioContext.suspend().catch(function () {});
    if (songReady) {
      youtubeNeedsStart = true;
      if (song.src) song.currentTime = songStart;
      playSong();
    } else updateSongButton();
    sceneTimer = setTimeout(showLetter, 1500);
  });

  var letterLines = [
    'Chúc mừng sinh nhật Anh Iu Tăng Đăng của em! ♡',
    'Chúc anh tuổi mới luôn khỏe mạnh, bình an và cười thật nhiều.',
    'Mong những điều anh ấp ủ sẽ từng chút một trở thành hiện thực.',
    'Cảm ơn anh vì đã đến, ở lại và làm những ngày bình thường hóa đặc biệt.',
    'Em thương cả những lúc anh rạng rỡ lẫn những ngày anh thấy mệt nhoài.',
    'Khi thế giới ngoài kia quá vội, cứ về đây, em vẫn ở bên anh nhé.',
    'Mong mình có thêm nhiều chuyến đi, nhiều cái ôm và những tấm hình chung.',
    'Dù mai này có bận rộn đến đâu, mình vẫn dành sự dịu dàng cho nhau.',
    'Hôm nay anh cứ thật hạnh phúc, phần yêu thương đã có em lo rồi.',
    'Yêu anh thật nhiều — cùng em viết tiếp thật nhiều sinh nhật nữa nha! ♡'
  ];

  var letterNodes = [];
  var lineIndex = 0;
  var characterIndex = 0;
  var letters = [];
  function typeNextCharacter() {
    if (lineIndex >= letters.length) {
      document.getElementById('finish-letter').hidden = true;
      return;
    }
    if (characterIndex >= letters[lineIndex].length) {
      lineIndex++;
      characterIndex = 0;
      typingTimer = setTimeout(typeNextCharacter, 260);
      return;
    }
    var span = document.createElement('span');
    span.className = 'ink-character';
    span.textContent = letters[lineIndex][characterIndex++];
    letterNodes[lineIndex].appendChild(span);
    typingTimer = setTimeout(typeNextCharacter, 27);
  }

  function finishLetter() {
    clearTimeout(typingTimer);
    lineIndex = letters.length;
    letterNodes.forEach(function (node, index) { node.textContent = letterLines[index]; });
    document.getElementById('finish-letter').hidden = true;
  }
  document.getElementById('finish-letter').addEventListener('click', finishLetter);

  function showLetter() {
    if (api.letterStarted) return;
    api.letterStarted = true;
    document.body.classList.add('letter-active');
    document.getElementById('birthday').setAttribute('aria-hidden', 'true');
    document.getElementById('letter-scene').setAttribute('aria-hidden', 'false');
    document.getElementById('letter-accessible').textContent = letterLines.join('\n');
    var segmenter = window.Intl && Intl.Segmenter ? new Intl.Segmenter('vi', { granularity: 'grapheme' }) : null;
    letters = letterLines.map(function (line) {
      return segmenter ? Array.from(segmenter.segment(line), function (part) { return part.segment; }) : Array.from(line);
    });
    letterNodes = letterLines.map(function (text) {
      var line = document.createElement('p');
      var reserve = document.createElement('span');
      reserve.className = 'line-reserve';
      reserve.textContent = text;
      var typed = document.createElement('span');
      typed.className = 'typed-line';
      line.appendChild(reserve);
      line.appendChild(typed);
      document.getElementById('letter-text').appendChild(line);
      return typed;
    });
    typingTimer = setTimeout(typeNextCharacter, 1100);
    showMemory();
    photoTimer = setInterval(showMemory, 3300);
  }

  function showMemory() {
    if (document.hidden || !photos.length || !api.letterStarted) return;
    var index = photoIndex++;
    var frame = document.createElement('figure');
    frame.className = 'memory-photo';
    var image = document.createElement('img');
    image.alt = '';
    image.decoding = 'async';
    var side = index % 2;
    var row = Math.floor(index / 2) % 3;
    frame.style.setProperty('--tilt', (side ? 5 : -5) + 'deg');
    frame.style[side ? 'right' : 'left'] = (innerWidth < 620 ? '-22px' : '2.5vw');
    frame.style.top = (row === 0 ? '-1vh' : row === 1 ? '28vh' : '59vh');
    image.addEventListener('load', function () {
      if (!api.letterStarted) return;
      frame.appendChild(image);
      document.getElementById('memory-photos').appendChild(frame);
      frame.addEventListener('animationend', function () { frame.remove(); }, { once: true });
      // Also clean up if animations are disabled by the visitor's stylesheet.
      setTimeout(function () { frame.remove(); }, 6600);
    }, { once: true });
    image.src = photos[index % photos.length];
  }

  window.addEventListener('pagehide', function () {
    clearTimeout(sceneTimer);
    clearTimeout(typingTimer);
    clearInterval(photoTimer);
    song.pause();
    if (youtubeReady) youtubePlayer.pauseVideo();
  });
})();
