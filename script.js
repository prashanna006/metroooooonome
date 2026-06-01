(() => {

const STORAGE_KEY = 'metroooooonome-bpm';

const state = {
  bpm:120,
  playing:false,
  beatsPerMeasure:4,
  currentBeat:0,
  interval:null,

  ramp:{
    active:false,
    bpm:60,
    repeats:0
  },

  countdown:false
};

const $ = id => document.getElementById(id);

function loadSavedBpm(){
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if(saved !== null){
      const bpm = Number(saved);

      if(!Number.isNaN(bpm)){
        state.bpm = bpm;
      }
    }
  }catch {
    // ignore storage errors
  }
}

const ui = {
  bpm: $('bpm-display'),
  playBtn: $('play-btn'),
  playIcon: $('play-icon'),
  beatDots: $('beat-dots'),
  rampBody: $('ramp-body'),
  toggleRamp: $('toggle-ramp'),
  rampBtn: $('ramp-start-btn'),
  rampStatus: $('ramp-status'),
  rampPreview: $('ramp-preview'),
  cdToggle: $('cd-toggle'),
  cdSecs: $('cd-secs'),
  cdOverlay: $('countdown-overlay'),
  cdNumber: $('cd-number'),
  cdCancel: $('cd-cancel'),
  themeBtn: $('theme-btn')
};

const AudioContextClass =
  window.AudioContext ||
  window.webkitAudioContext;

let actx;

function ctx(){
  if(!actx){
    actx = new AudioContextClass();
  }
  return actx;
}

function click(freq,gain,dur){

  const c = ctx();

  const osc = c.createOscillator();
  const g = c.createGain();

  osc.connect(g);
  g.connect(c.destination);

  osc.frequency.value = freq;

  g.gain.setValueAtTime(
    gain,
    c.currentTime
  );

  g.gain.exponentialRampToValueAtTime(
    0.001,
    c.currentTime + dur
  );

  osc.start();
  osc.stop(c.currentTime + dur);
}

function playBeat(accent){
  click(
    accent ? 1050 : 820,
    accent ? 0.6 : 0.35,
    0.08
  );
}

function buildDots(){

  ui.beatDots.innerHTML = '';

  for(let i=0;i<state.beatsPerMeasure;i++){

    const dot =
      document.createElement('div');

    dot.className = 'dot';

    ui.beatDots.appendChild(dot);
  }
}

function lightDot(index){

  [...ui.beatDots.children]
    .forEach(dot => {
      dot.className = 'dot';
    });

  const dot =
    ui.beatDots.children[index];

  if(!dot) return;

  dot.classList.add(
    index === 0
      ? 'active-1'
      : 'active-other'
  );
}

function tick(){

  const accent =
    state.currentBeat === 0;

  playBeat(accent);

  lightDot(state.currentBeat);

  state.currentBeat =
    (state.currentBeat + 1)
    % state.beatsPerMeasure;

  handleRamp();
}

function startPlayback(){

  if(state.playing) return;

  state.playing = true;

  ui.playBtn.classList.add('playing');

  ui.playIcon.className =
    'ti ti-player-pause';

  tick();

  state.interval = setInterval(
    tick,
    60000 / state.bpm
  );
}

function stopPlayback(){

  state.playing = false;

  clearInterval(state.interval);

  state.currentBeat = 0;

  ui.playBtn.classList.remove(
    'playing'
  );

  ui.playIcon.className =
    'ti ti-player-play';

  [...ui.beatDots.children]
    .forEach(dot => {
      dot.className = 'dot';
    });
}

function restartPlayback(){

  if(!state.playing) return;

  clearInterval(state.interval);

  state.interval = setInterval(
    tick,
    60000 / state.bpm
  );
}

function setBpm(v){

  state.bpm =
    Math.max(
      20,
      Math.min(
        300,
        Math.round(v)
      )
    );

  ui.bpm.textContent =
    state.bpm;

  try {
    localStorage.setItem(
      STORAGE_KEY,
      String(state.bpm)
    );
  }catch {
    // ignore storage errors
  }

  ui.bpm.classList.add('bump');

  setTimeout(() => {
    ui.bpm.classList.remove('bump');
  },100);

  restartPlayback();
}

function handleRamp(){

  if(
    !state.ramp.active ||
    state.currentBeat !== 0
  ){
    return;
  }

  state.ramp.repeats++;

  const start =
    parseInt($('r-start').value);

  const end =
    parseInt($('r-end').value);

  const reps =
    parseInt($('r-reps').value);

  const step =
    parseInt($('r-step').value);

  if(state.ramp.repeats >= reps){

    state.ramp.repeats = 0;

    state.ramp.bpm += step;

    if(state.ramp.bpm > end){

      stopRamp();
      return;
    }

    setBpm(state.ramp.bpm);

    ui.rampStatus.textContent =
      `Step: ${state.ramp.bpm} bpm → ${end} bpm`;
  }
}

function startRamp(){

  const start =
    parseInt($('r-start').value);

  const end =
    parseInt($('r-end').value);

  if(start >= end){
    ui.rampStatus.textContent =
      'Invalid BPM range.';
    return;
  }

  state.ramp.active = true;
  state.ramp.bpm = start;
  state.ramp.repeats = 0;

  setBpm(start);

  ui.rampBtn.classList.add(
    'active-ramp'
  );

  ui.rampBtn.textContent =
    'Stop ramp';

  ui.rampStatus.textContent =
    `Step: ${start} bpm → ${end} bpm`;

  startPlayback();
}

function stopRamp(){

  state.ramp.active = false;

  ui.rampBtn.classList.remove(
    'active-ramp'
  );

  ui.rampBtn.textContent =
    'Start ramp';

  ui.rampStatus.textContent =
    `✓ Ramp complete at ${state.bpm} bpm`;

  stopPlayback();
}

function buildPreview(){

  const start =
    parseInt($('r-start').value);

  const end =
    parseInt($('r-end').value);

  const reps =
    parseInt($('r-reps').value);

  const step =
    parseInt($('r-step').value);

  const steps =
    Math.ceil(
      (end - start) / step
    ) + 1;

  ui.rampPreview.innerHTML = `
    Start at <b>${start}</b> bpm →
    repeat ${reps} measures →
    +${step} bpm →
    reach <b>${end}</b> bpm
    <br>
    ${steps} total steps
  `;
}

function countdown(seconds,done){

  let remain = seconds;

  ui.cdOverlay.classList.add(
    'visible'
  );

  ui.cdNumber.textContent =
    remain;

  const int = setInterval(() => {

    remain--;

    if(remain <= 0){

      clearInterval(int);

      ui.cdOverlay.classList.remove(
        'visible'
      );

      done();
      return;
    }

    ui.cdNumber.textContent =
      remain;

  },1000);

  ui.cdCancel.onclick = () => {

    clearInterval(int);

    ui.cdOverlay.classList.remove(
      'visible'
    );
  };
}

/* EVENTS */

ui.playBtn.onclick = () => {

  if(state.playing){

    stopPlayback();

  }else{

    startPlayback();
  }
};

ui.toggleRamp.onclick = () => {

  ui.rampBody.classList.toggle(
    'open'
  );

  ui.toggleRamp.textContent =
    ui.rampBody.classList.contains('open')
      ? 'Hide ▴'
      : 'Configure ▾';
};

ui.cdToggle.onclick = () => {

  state.countdown =
    !state.countdown;

  ui.cdToggle.classList.toggle(
    'on',
    state.countdown
  );

  ui.cdSecs.disabled =
    !state.countdown;
};

ui.rampBtn.onclick = () => {

  if(state.ramp.active){

    stopRamp();
    return;
  }

  if(state.countdown){

    countdown(
      parseInt(ui.cdSecs.value) || 5,
      startRamp
    );

  }else{

    startRamp();
  }
};

document
  .querySelectorAll('.jump-btn')
  .forEach(btn => {

    btn.onclick = () => {

      setBpm(
        state.bpm +
        parseInt(btn.dataset.delta)
      );
    };
  });

document
  .querySelectorAll('.sig-btn')
  .forEach(btn => {

    btn.onclick = () => {

      document
        .querySelectorAll('.sig-btn')
        .forEach(b => {
          b.classList.remove('active');
        });

      btn.classList.add('active');

      state.beatsPerMeasure =
        parseInt(btn.dataset.beats);

      buildDots();

      restartPlayback();
    };
  });

[
  $('r-start'),
  $('r-end'),
  $('r-reps'),
  $('r-step')
].forEach(el => {
  el.oninput = buildPreview;
});

ui.themeBtn.onclick = () => {

  document.body.classList.toggle(
    'dark'
  );

  ui.themeBtn.innerHTML =
    document.body.classList.contains('dark')
      ? '<i class="ti ti-sun"></i>'
      : '<i class="ti ti-moon"></i>';
};

const wheel = $('scroll-wheel');

wheel.addEventListener(
  'wheel',
  e => {

    e.preventDefault();

    setBpm(
      state.bpm +
      (e.deltaY > 0 ? -1 : 1)
    );
  },
  {passive:false}
);

let dragY = null;
let startBpm = null;

wheel.addEventListener(
  'pointerdown',
  e => {

    dragY = e.clientY;
    startBpm = state.bpm;

    wheel.setPointerCapture(
      e.pointerId
    );
  }
);

wheel.addEventListener(
  'pointermove',
  e => {

    if(dragY === null) return;

    const delta =
      (dragY - e.clientY) * 0.5;

    setBpm(startBpm + delta);
  }
);

wheel.addEventListener(
  'pointerup',
  () => {
    dragY = null;
  }
);

loadSavedBpm();

ui.bpm.textContent = state.bpm;

buildDots();
buildPreview();

})();
