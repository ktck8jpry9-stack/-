import {Game} from './engine.js';
import {Input} from './input.js';
import {Renderer} from './render.js';
import {FORMS,STAGES} from './levels.js';
const $=s=>document.querySelector(s),overlay=$('#overlay'),renderer=new Renderer($('#game'));
const STORE='kame-emaki-v1';
let save={unlocked:0,cleared:[],sound:false},storageOK=true;
try{const v=JSON.parse(localStorage.getItem(STORE));if(v&&Number.isInteger(v.unlocked)&&v.unlocked>=0&&v.unlocked<=9)save={unlocked:v.unlocked,cleared:Array.isArray(v.cleared)?v.cleared.filter(n=>Number.isInteger(n)&&n>=0&&n<10):[],sound:!!v.sound};}catch{storageOK=false;}
const persist=()=>{try{localStorage.setItem(STORE,JSON.stringify(save));}catch{storageOK=false;}};
let playing=false,menu='title',context,last=0,accumulator=0,messageUntil=0;
function sound(kind){
  if(!save.sound)return;
  try{context??=new(window.AudioContext||window.webkitAudioContext)();if(context.state!=='running')return;const osc=context.createOscillator(),gain=context.createGain(),now=context.currentTime;
    const notes={jump:[330,620],coin:[880,1320],power:[440,880],hit:[180,90],hurt:[190,60],break:[110,50],shoot:[600,220],freeze:[1300,500],clear:[523,1047]};const [a,b]=notes[kind]||[440,660];osc.type=kind==='break'?'sawtooth':'triangle';osc.frequency.setValueAtTime(a,now);osc.frequency.exponentialRampToValueAtTime(b,now+.13);gain.gain.setValueAtTime(.07,now);gain.gain.exponentialRampToValueAtTime(.001,now+.21);osc.connect(gain);gain.connect(context.destination);osc.start(now);osc.stop(now+.22);
  }catch{/* Audio is optional on browsers that disable Web Audio. */}
}
document.addEventListener('pointerdown',()=>{if(save.sound){try{context??=new(window.AudioContext||window.webkitAudioContext)();context.resume().catch(()=>{});}catch{}}},{passive:true});
document.addEventListener('keydown',()=>{if(context?.state==='suspended')context.resume().catch(()=>{});});
const game=new Game({sound,message:text=>{$('#message').textContent=text;messageUntil=performance.now()+4500;},clear:index=>{
  if(!save.cleared.includes(index))save.cleared.push(index);save.unlocked=Math.max(save.unlocked,Math.min(9,index+1));persist();playing=false;input.reset();
  if(index===9)ending();else show('clear',`<div class="eyebrow">道中突破</div><h2>${STAGES[index].name} クリア</h2><p>次の鳥居へ、冒険はつづく。</p><div class="actions"><button class="primary" data-action="next">次のステージ</button><button data-action="map">旅の地図</button></div>`);
}});
const input=new Input(()=>pause());
function show(name,html){playing=false;menu=name;input.reset();overlay.innerHTML=`<div class="panel">${html}</div>`;}
function start(index,form='normal'){game.load(index,form);playing=true;menu='play';overlay.innerHTML='';input.reset();accumulator=0;}
function title(){show('title',`<div class="eyebrow">和風冒険活劇 · 全十景</div><h1>かめ絵巻</h1><p>竹林から、川を渡り、月の宮へ。<br>七つの姿と、不思議な相棒で十の道をゆく。</p><div class="actions"><button class="primary" data-action="continue">${save.cleared.length?'旅をつづける':'旅に出る'}</button><button data-action="map">旅の地図</button><button data-action="help">操作・心得</button></div><p style="font-size:10px">胸の「かめ」が旅のしるし。音は右上から切り替えられます。${storageOK?'':'<br>このブラウザでは進行を保存できません。'}</p>`);}
function map(){show('map',`<div class="eyebrow">月へつづく十の道</div><h2>旅の地図</h2><div class="stages">${STAGES.map((s,i)=>`<button data-stage="${i}" ${i>save.unlocked?'disabled':''}>${s.id}<small>${s.name.split(' ')[0]} ${save.cleared.includes(i)?'✓':i>save.unlocked?'鍵':''}</small></button>`).join('')}</div><p>鳥居をくぐると、次の道が開きます。<br>各ステージの出発地点には全6種類の変身アイテムがあります。</p><button data-action="title">タイトルへ</button>`);}
function pause(){if(menu==='pause'){resume();return;}if(!playing)return;show('pause','<div class="eyebrow">ひとやすみ</div><h2>旅を休む</h2><div class="actions"><button class="primary" data-action="resume">つづける</button><button data-action="retry">この道の最初から</button><button data-action="map">旅の地図</button><button data-action="help">操作・心得</button></div>');}
function resume(){playing=true;menu='play';overlay.innerHTML='';input.reset();accumulator=0;}
function ending(){show('ending',`<div class="eyebrow">終幕 · 月の宮</div><h1>旅のおわり</h1><p>十の道を越え、かめとネッシーは月へたどり着いた。<br>竹林に、川辺に、また静かな朝が来る。</p><p>集めた小判 ${game.coins} 枚 ／ 再出発 ${game.deaths} 回<br>遊んでくれて、ありがとう。</p><div class="actions"><button class="primary" data-action="map">もう一度、あの道へ</button><button data-action="title">タイトルへ</button></div>`);}
let helpReturn='title';
function help(){helpReturn=menu==='play'?'pause':menu;show('help',`<h2>操作・心得</h2><div class="help-text"><b>基本</b>　十字で移動。B長押しで高く跳ぶ。Y＋移動でダッシュ。下でしゃがみ、空中の下でヒップドロップ。Rで回転ジャンプ／空中スピン。壁に触れて方向＋Bで壁キック。水中はBで泳ぐ。Aもジャンプに使えます。<br><b>術・運ぶ</b>　Yで火／氷を連射。凍った敵と甲羅は近くでY長押しで持ち、離すと投げる。凍った敵の上には乗れます。氷は約10秒で解けます。<br><b>七つの姿</b>　通常は一撃で再出発。他の姿は被弾で通常に戻る。スーパー以上は頭突き・ヒップドロップで木箱を壊せる（マメ除く）。マメは低い隙間・ゆっくり跳躍・Yで水面走り。プロペラはL連打で上昇、下で急降下。アザラシは水中十字移動・氷上安定・Y＋下＋移動で腹すべりし木箱を破壊。<br><b>相棒</b>　卵に触れるとネッシー誕生。近くでXまたは↑で乗り、Xで降りる。Yで舌を伸ばす。針の上を進めて高く跳べる。<br><b>敵</b>　化け狸・甲羅河童・跳ね兎・針狸・烏天狗・川魚・妖花・人魂・月守りの鬼。針・妖花・人魂は通常の踏みつけ不可。Rのスピンなら弾める。最後の鬼は踏みつけ・術・投擲を6回当てよう。<br><b>旅</b>　中間灯籠から再出発。残機制限・時間制限なし。クリアした道をこの端末のブラウザに保存。<br><b>キーボード</b>　←→↑↓ / WASD、B＝Z・Space、Y＝X・Shift、R＝C、L＝Q、乗降＝E、休止＝Esc。</div><div class="actions"><button class="primary" data-action="back">戻る</button></div>`);}
overlay.addEventListener('click',e=>{const target=e.target.closest('button');if(!target)return;if(target.dataset.stage!==undefined){start(Number(target.dataset.stage));return;}switch(target.dataset.action){case'continue':start(save.unlocked);break;case'title':title();break;case'map':map();break;case'help':help();break;case'resume':resume();break;case'retry':start(game.index);break;case'next':start(game.index+1,game.player.form);break;case'back':if(helpReturn==='pause'){resume();pause();}else if(helpReturn==='map')map();else if(helpReturn==='clear')map();else if(helpReturn==='ending')ending();else title();break;}});
$('#pause').addEventListener('click',pause);$('#help').addEventListener('click',help);$('#home').addEventListener('click',e=>{e.preventDefault();title();});
$('#sound').textContent=`音 ${save.sound?'ON':'OFF'}`;$('#sound').addEventListener('click',()=>{save.sound=!save.sound;persist();$('#sound').textContent=`音 ${save.sound?'ON':'OFF'}`;if(save.sound){try{context??=new(window.AudioContext||window.webkitAudioContext)();context.resume().then(()=>sound('coin')).catch(()=>{});}catch{}}});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('.console').requestFullscreen)await $('.console').requestFullscreen();else{game.notice('この端末は全画面API非対応です。Safariの「ホーム画面に追加」も利用できます。');}}catch{game.notice('全画面に切り替えられませんでした。通常画面でも遊べます。');}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',()=>pause());
function frame(now){
  const elapsed=Math.min(100,now-(last||now));last=now;
  if(playing){accumulator+=elapsed;let sampled=false;while(accumulator>=1000/60&&playing){if(!sampled){input.sample();sampled=true;}else{input.pressed.clear();input.released.clear();}game.update(input);accumulator-=1000/60;}}
  else accumulator=0;
  renderer.draw(game);$('#stage').textContent=`${game.level.name} ${game.checkpoint?'🏮':''}`;$('#form').textContent=`${FORMS[game.player.form].name}${game.player.mount?' ＋ ネッシー':''}`;$('#score').textContent=`小判 ${game.coins} ／ 再出発 ${game.deaths}`;
  if(now>messageUntil)$('#message').textContent='';requestAnimationFrame(frame);
}
title();requestAnimationFrame(frame);
