const KEYMAP={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',KeyA:'left',KeyD:'right',KeyW:'up',KeyS:'down',KeyZ:'b',Space:'b',KeyX:'y',ShiftLeft:'y',ShiftRight:'y',KeyC:'r',KeyQ:'l',KeyE:'x'};
export class Input{
  constructor(onPause){
    this.sources=new Map();this.previous=new Set();this.pressed=new Set();this.released=new Set();this.down=new Set();
    const clear=()=>{this.sources.clear();document.querySelectorAll('[data-key]').forEach(b=>b.classList.remove('pressed'));};
    window.addEventListener('keydown',e=>{if(e.code==='Escape'){onPause();return;}const k=KEYMAP[e.code];if(k){e.preventDefault();this.sources.set(e.code,k);}});
    window.addEventListener('keyup',e=>this.sources.delete(e.code));
    window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
    document.querySelectorAll('[data-key]').forEach(button=>{
      button.addEventListener('contextmenu',e=>e.preventDefault());
      button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);this.sources.set(e.pointerId,button.dataset.key);button.classList.add('pressed');});
      const end=e=>{this.sources.delete(e.pointerId);if(![...this.sources.values()].includes(button.dataset.key))button.classList.remove('pressed');};
      button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);button.addEventListener('lostpointercapture',end);
    });
  }
  sample(){this.down=new Set(this.sources.values());if(this.down.has('a'))this.down.add('b');this.pressed=new Set([...this.down].filter(k=>!this.previous.has(k)));this.released=new Set([...this.previous].filter(k=>!this.down.has(k)));this.previous=new Set(this.down);return this;}
  held(k){return this.down.has(k);}hit(k){return this.pressed.has(k);}up(k){return this.released.has(k);}
  reset(){this.sources.clear();this.previous.clear();this.down.clear();this.pressed.clear();this.released.clear();document.querySelectorAll('[data-key]').forEach(b=>b.classList.remove('pressed'));}
}
