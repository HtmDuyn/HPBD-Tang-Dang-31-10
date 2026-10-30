(function () {
  'use strict';

  var config = window.BIRTHDAY_MEDIA || {};
  var photos = (config.images || []).slice();
  var song = document.getElementById('love-song');
  var musicButton = document.getElementById('music-toggle');
  var blowButton = document.getElementById('blow-candle');
  var songPlaying = false;
  var songWanted = false;
  var songStart = Math.max(0, Number(config.songStart) || 35);
  var songPrepared = false;
  var songObjectUrl;
  var songLoading;
  var volumeAnimation;
  var sceneTimer;
  var memoryTimers = [];
  var memoriesRunning = false;
  var photoIndex = 0;
  var typingTimer;
  // Load the complete local MP3 so seeking also works on Python's static server.
  function prepareSong() {
    if (!songLoading) songLoading = (async function () {
      var response = await fetch(config.song || 'assets/ordinary.mp3');
      if (!response.ok) throw new Error('MP3 HTTP ' + response.status);
      var blob = await response.blob();
      songObjectUrl = URL.createObjectURL(blob);
      await new Promise(function (resolve, reject) {
        song.addEventListener('loadedmetadata', resolve, { once: true });
        song.addEventListener('error', reject, { once: true });
        song.src = songObjectUrl;
        song.preload = 'auto';
        song.loop = false;
        song.load();
      });
      songPrepared = true;
      song.currentTime = Math.min(songStart, Math.max(0, song.duration - 1));
    })().catch(function (error) {
      songLoading = null;
      throw error;
    });
    return songLoading;
  }
  // Begin loading before the heart animation, rather than waiting for the candle.
  prepareSong().catch(function () { });
  song.addEventListener('ended', function () {
    if (songWanted) { song.currentTime = songStart; playSong(); }
  });

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

  function fadeSongIn() {
    cancelAnimationFrame(volumeAnimation);
    var startedAt = performance.now();
    var initialVolume = song.volume;
    function step(now) {
      if (!songWanted || song.paused) return;
      var progress = Math.min(1, (now - startedAt) / 5000);
      var eased = progress * progress * (3 - 2 * progress);
      song.volume = initialVolume + (.65 - initialVolume) * eased;
      if (progress < 1) volumeAnimation = requestAnimationFrame(step);
    }
    volumeAnimation = requestAnimationFrame(step);
  }

  async function playSong() {
    songWanted = true;
    try {
      await prepareSong();
      if (!songWanted) return;
      song.muted = false;
      song.volume = api.letterStarted ? .06 : 0;
      await song.play();
      songPlaying = !song.paused;
      window.musicEnabled = songPlaying;
      updateSongButton();
      if (api.letterStarted && songPlaying) fadeSongIn();
    } catch (error) {
      songPlaying = false;
      updateSongButton();
      musicButton.textContent = '\u266b B\u1ea5m \u0111\u1ec3 ph\u00e1t nh\u1ea1c';
      console.error('Could not play local birthday MP3:', error);
    }
  }

  function toggleSong() {
    if (songPlaying || (songWanted && !songPrepared)) {
      songWanted = false;
      cancelAnimationFrame(volumeAnimation);
      song.pause();
      songPlaying = false;
      window.musicEnabled = false;
      updateSongButton();
    } else playSong();
  }

  blowButton.addEventListener('click', function () {
    if (api.candleBlown || blowButton.hidden) return;
    api.candleBlown = true;
    blowButton.disabled = true;
    blowButton.textContent = 'Điều ước của anh sẽ thành hiện thực ♡';
    document.getElementById('candle-hint').textContent = 'Một lá thư nhỏ đang chờ anh…';
    document.querySelector('.cake').setAttribute('aria-label', 'Bánh kem với ngọn nến vừa được thổi tắt');
    document.body.classList.add('candle-out');
    var transition = document.getElementById('candle-transition');
    for (var petalIndex = 0; petalIndex < 18; petalIndex++) {
      var petal = document.createElement('span');
      petal.className = 'transition-petal';
      var angle = petalIndex / 18 * Math.PI * 2;
      petal.style.setProperty('--dx', Math.cos(angle) * (150 + Math.random() * 170) + 'px');
      petal.style.setProperty('--dy', Math.sin(angle) * (100 + Math.random() * 180) + 'px');
      petal.style.setProperty('--spin', (Math.random() * 360) + 'deg');
      petal.style.setProperty('--delay', Math.random() * .3 + 's');
      transition.appendChild(petal);
    }
    setTimeout(function () { transition.replaceChildren(); }, 5600);
    document.getElementById('wishes').replaceChildren();

    // Stop the music box and start the vocal track within the candle click.
    clearInterval(window.musicTimer);
    window.musicTimer = null;
    window.musicEnabled = false;
    if (window.audioContext) window.audioContext.suspend().catch(function () { });
    if (songPrepared) song.currentTime = songStart;
    playSong();
    sceneTimer = setTimeout(showLetter, 3000);
  });

  var letterLines = [
    'Chúc mừng sinh nhật Anh Iu Tăng Đeng của em! ♡',
    'Chúc anh tuổi mới luôn khỏe mạnh, bình an và cười thật nhiều.',
    'Mong những điều anh ấp ủ sẽ từng chút một trở thành hiện thực.',
    'Em cảm ơn anh vì đã đến, và làm những ngày bình thường của em trở nên đặc biệt.',
    'Khi thế giới ngoài kia quá vội, cứ về đây, em vẫn luôn ở đây với anh!',
    'Em mong chúng mình sẽ có thật nhiều chuyến đi, thật nhiều cái ôm và thật nhiều tấm hình chung để có thật nhiều kỉ niệm với nhau.',
    'Dù mai này có bận rộn đến đâu, mình vẫn luôn dành sự dịu dàng cho nhau ha anh.',
    'Yêu anh nhiều lắm — Em mong chúng mình sẽ cùng viết tiếp thật nhiều sinh nhật nữa nhá! ♡',
    'Nớp diuu ♡'
  ].map(function (line) { return line.normalize('NFC'); });

  var letterNodes = [];
  var lineIndex = 0;
  var characterIndex = 0;
  var letters = [];
  function scrollLetterIfNeeded() {
    var loveLetter = document.querySelector('.love-letter');
    if (loveLetter && loveLetter.scrollHeight > loveLetter.clientHeight) {
      loveLetter.scrollTop = loveLetter.scrollHeight;
    }
  }

  function completeLetter() {
    var finishBtn = document.getElementById('finish-letter');
    if (finishBtn) finishBtn.hidden = true;
    var loveLetter = document.querySelector('.love-letter');
    if (loveLetter) {
      loveLetter.classList.add('letter-complete');
      setTimeout(function () {
        loveLetter.scrollTo({ top: loveLetter.scrollHeight, behavior: 'smooth' });
      }, 150);
    }
    var replayBtn = document.getElementById('replay-btn');
    if (replayBtn) replayBtn.hidden = false;
  }

  function typeNextCharacter() {
    if (lineIndex >= letters.length) {
      completeLetter();
      return;
    }
    if (characterIndex >= letters[lineIndex].length) {
      lineIndex++;
      characterIndex = 0;
      scrollLetterIfNeeded();
      typingTimer = setTimeout(typeNextCharacter, 260);
      return;
    }
    var span = document.createElement('span');
    span.className = 'ink-character';
    span.textContent = letters[lineIndex][characterIndex++];
    letterNodes[lineIndex].appendChild(span);
    scrollLetterIfNeeded();
    typingTimer = setTimeout(typeNextCharacter, 27);
  }

  function finishLetter() {
    clearTimeout(typingTimer);
    lineIndex = letters.length;
    letterNodes.forEach(function (node, index) { node.textContent = letterLines[index]; });
    completeLetter();
  }
  document.getElementById('finish-letter').addEventListener('click', finishLetter);

  var replayBtn = document.getElementById('replay-btn');
  if (replayBtn) {
    replayBtn.addEventListener('click', function () {
      document.body.style.transition = 'opacity 0.5s ease';
      document.body.style.opacity = '0';
      setTimeout(function () {
        window.location.reload();
      }, 500);
    });
  }

  function lightLetterBackground() {
    var atmosphere = document.getElementById('letter-atmosphere');
    if (atmosphere.children.length) return;
    var starCount = innerWidth < 620 ? 36 : 60;
    for (var starIndex = 0; starIndex < starCount; starIndex++) {
      var star = document.createElement('span');
      star.className = 'letter-star' + (starIndex % 5 === 0 ? ' glint' : '');
      star.style.setProperty('--x', (2 + Math.random() * 96) + '%');
      star.style.setProperty('--y', (2 + Math.random() * 96) + '%');
      star.style.setProperty('--size', (1 + Math.random() * 2) + 'px');
      star.style.setProperty('--duration', (3 + Math.random() * 4) + 's');
      star.style.setProperty('--delay', (-Math.random() * 7) + 's');
      atmosphere.appendChild(star);
    }
  }

  function showLetter() {
    if (api.letterStarted) return;
    api.letterStarted = true;
    lightLetterBackground();
    if (songPrepared && songWanted) {
      song.currentTime = songStart;
      song.volume = .06;
      if (song.paused) playSong();
      else fadeSongIn();
    }
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
    memoriesRunning = true;
    // Four slots rotate about 1.6 seconds apart; each image holds clear for four seconds.
    for (var slot = 0; slot < 4; slot++) scheduleMemory(slot, slot * 1600);
  }

  function scheduleMemory(slot, delay) {
    if (!memoriesRunning || !photos.length) return;
    memoryTimers[slot] = setTimeout(function () { showMemory(slot); }, delay);
  }

  function showMemory(slot) {
    if (!memoriesRunning || !photos.length || !api.letterStarted) return;
    if (document.hidden) { scheduleMemory(slot, 800); return; }
    var index = photoIndex++;
    var frame = document.createElement('figure');
    frame.className = 'memory-photo memory-slot-' + slot;
    var image = document.createElement('img');
    image.alt = '';
    image.decoding = 'async';
    frame.style.setProperty('--tilt', (slot % 2 ? 4 : -4) + 'deg');
    var retired = false;
    function nextMemory() {
      if (retired) return;
      retired = true;
      frame.remove();
      scheduleMemory(slot, 100);
    }
    image.addEventListener('load', function () {
      if (!memoriesRunning) return;
      frame.appendChild(image);
      document.getElementById('memory-photos').appendChild(frame);
      frame.addEventListener('animationend', nextMemory, { once: true });
      // Also clean up if animations are disabled by the visitor's stylesheet.
      setTimeout(nextMemory, 6600);
    }, { once: true });
    image.addEventListener('error', nextMemory, { once: true });
    image.src = photos[index % photos.length];
  }

  window.addEventListener('pagehide', function () {
    clearTimeout(sceneTimer);
    clearTimeout(typingTimer);
    memoriesRunning = false;
    memoryTimers.forEach(clearTimeout);
    song.pause();
    cancelAnimationFrame(volumeAnimation);
    if (songObjectUrl) URL.revokeObjectURL(songObjectUrl);
  });
})();
