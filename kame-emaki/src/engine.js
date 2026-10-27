import {TILE,FORMS,ITEMS,createLevel,overlap} from './levels.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const solid=t=>'#bi?'.includes(t);
export class Game{
  constructor(events={}){this.events=events;this.coins=0;this.deaths=0;this.time=0;this.load(0);}
  load(index,form='normal'){
    this.level=createLevel(index);this.index=index;this.tick=0;this.done=false;this.checkpoint=false;this.camera=0;this.projectiles=[];this.particles=[];
    this.player={x:64,y:360,vx:0,vy:0,w:28,h:36,form:'normal',dir:1,ground:false,wall:0,inv:0,coyote:0,jumpBuffer:0,mount:false,carry:null,spin:0,slam:false,shot:0,prop:0};this.setForm(form,false);
    this.notice(`${this.level.name}　${['竹林を抜けて鳥居へ','水面と川底、ふたつの道','氷の参道を越えよう','灯籠が照らす夜の道','月の重力で大きく跳ぶ'][this.level.theme]}`);
  }
  notice(text){this.events.message?.(text);}
  sound(name){this.events.sound?.(name);}
  setForm(form,announce=true){const p=this.player,bottom=p.y+p.h;p.form=form;p.w=FORMS[form].w;p.h=FORMS[form].h;p.y=bottom-p.h;if(announce){p.inv=60;this.notice(`${ITEMS[form]||'通常'} → ${FORMS[form].name}主人公`);this.sound('power');}}
  tile(x,y){return this.level.tiles[y]?.[x]??'.';}
  blocks(body,dy=0){
    const a=[];
    for(let y=Math.floor(body.y/TILE);y<=Math.floor((body.y+body.h-.01)/TILE);y++)for(let x=Math.floor(body.x/TILE);x<=Math.floor((body.x+body.w-.01)/TILE);x++){
      const t=this.tile(x,y);if(solid(t)||(t==='='&&dy>0&&body.y+body.h-dy<=y*TILE+3))a.push({x:x*TILE,y:y*TILE,w:TILE,h:TILE,t,tx:x,ty:y});
    }
    return a;
  }
  breakBlock(b){if(this.tile(b.tx,b.ty)==='.')return;this.level.tiles[b.ty][b.tx]='.';this.burst(b.x+16,b.y+16,'#ceac72');this.sound('break');}
  hitBlock(b){const p=this.player;if(b.t==='?'){this.level.tiles[b.ty][b.tx]='#';this.level.items.push({type:p.form==='normal'?'super':['fire','bean','ice','propeller','seal'][this.index%5],x:b.x+4,y:b.y-28,w:24,h:24});this.sound('coin');}else if(b.t==='b'&&p.form!=='normal'&&p.form!=='bean')this.breakBlock(b);}
  burst(x,y,color){for(let i=0;i<8;i++)this.particles.push({x,y,vx:Math.cos(i)*2,vy:-Math.abs(Math.sin(i))*3-1,life:28,color});}
  move(body,isPlayer=false){
    const p=this.player,dx=body.vx;body.wall=0;body.x+=dx;
    for(const b of this.blocks(body)){if(isPlayer&&p.form==='seal'&&p.sliding&&b.t==='b'){this.breakBlock(b);continue;}body.x=dx>0?b.x-body.w:b.x+b.w;body.wall=Math.sign(dx);body.vx=0;}
    body.x=clamp(body.x,0,this.level.width-body.w);const dy=body.vy;body.y+=dy;body.ground=false;
    if(isPlayer&&body.y<32){body.y=32;body.vy=Math.max(0,body.vy);}
    for(const b of this.blocks(body,dy)){
      if(dy>0){if(isPlayer&&p.slam&&p.form!=='normal'&&p.form!=='bean'&&b.t==='b'){this.breakBlock(b);continue;}body.y=b.y-body.h;body.ground=true;}else if(dy<0){body.y=b.y+b.h;if(isPlayer)this.hitBlock(b);}body.vy=0;
    }
    if(isPlayer&&dy>=0)for(const e of this.level.enemies){if(e.alive&&e.frozen>0&&e!==p.carry&&overlap(body,e)&&body.y+body.h-dy<=e.y+5){body.y=e.y-body.h;body.vy=0;body.ground=true;}}
  }
  damage(){const p=this.player;if(p.inv||this.done)return;if(p.mount){p.mount=false;p.inv=120;p.vy=-7;this.notice('ネッシーが身を守ってくれた！');return;}if(p.form!=='normal'){this.setForm('normal',false);p.inv=150;this.sound('hurt');}else this.die();}
  die(){if(this.done)return;this.deaths++;this.sound('hurt');const checkpoint=this.checkpoint,index=this.index;this.load(index);if(checkpoint){this.checkpoint=true;this.player.x=this.level.checkpoint.x;this.player.y=360;}this.player.inv=100;this.notice('もう一度！　残機制限なし');}
  kill(e){if(!e.alive)return;e.alive=false;this.coins++;this.burst(e.x+e.w/2,e.y+e.h/2,'#e9cb88');this.sound('hit');}
  attack(){
    const p=this.player;if(p.shot>0)return;p.shot=22;
    if(p.mount){const mouth={x:p.dir>0?p.x+p.w:p.x-100,y:p.y-5,w:100,h:p.h+20};for(const e of this.level.enemies)if(e.alive&&e!==p.carry&&overlap(mouth,e)&&e.type!=='oni')this.kill(e);this.sound('shoot');return;}
    if(['fire','ice','seal'].includes(p.form)){const ice=p.form!=='fire';this.projectiles.push({x:p.x+p.w/2,y:p.y+p.h/2,w:12,h:12,vx:p.dir*7.5,vy:-1,ice,life:100});this.sound('shoot');}
  }
  update(input){
    if(this.done)return;this.tick++;this.time++;const p=this.player;const held=k=>input.held(k),hit=k=>input.hit(k);
    p.inv=Math.max(0,p.inv-1);p.shot=Math.max(0,p.shot-1);p.spin=Math.max(0,p.spin-1);p.prop=Math.max(0,p.prop-1);
    const wet=this.level.waters.find(w=>overlap(p,w));p.wet=!!wet;
    const wasGround=p.ground;p.coyote=wasGround?6:Math.max(0,p.coyote-1);p.jumpBuffer=hit('b')?7:Math.max(0,p.jumpBuffer-1);
    const axis=Number(held('right'))-Number(held('left'));if(axis)p.dir=axis;
    p.sliding=p.form==='seal'&&wasGround&&held('y')&&held('down')&&Math.abs(p.vx)>2;
    const crouch=held('down')&&wasGround&&!p.sliding;
    const speed=wet?(p.form==='seal'?4.3:2.2):held('y')?5.4:3.1;
    const onIce=this.tile(Math.floor((p.x+p.w/2)/TILE),Math.floor((p.y+p.h+2)/TILE))==='i';
    const friction=onIce&&p.form!=='seal'?.985:.78;
    if(axis&&!crouch)p.vx=clamp(p.vx+axis*(wet?.22:.5),-speed,speed);else p.vx*=friction;
    if(p.sliding)p.vx=p.dir*7;
    // Bean-form running uses the water surface as a temporary floor.
    if(p.form==='bean'&&held('y'))for(const w of this.level.waters)if(p.x+p.w>w.x&&p.x<w.x+w.w&&p.y+p.h>=w.y&&p.y+p.h<=w.y+16&&p.vy>=0){p.y=w.y-p.h;p.vy=0;p.ground=true;p.coyote=6;}
    if(wet&&p.form==='seal'){p.vy=(Number(held('down'))-Number(held('up')))*3.7;if(hit('b'))p.vy=-5;}
    else if(wet){p.vy+=.12;p.vy*=.95;if(hit('b')){p.vy=-4.5;this.sound('jump');}}
    else{
      const gravity=this.level.theme===4?.27:p.form==='bean'?.23:.49;
      p.vy+=gravity;
      if(p.jumpBuffer&&(p.coyote||p.wall)){p.vy=p.mount?-12.7:p.form==='bean'?-8.5:-10.6;if(p.wall&&!p.coyote){p.vx=-p.wall*5;p.dir=-p.wall;}p.jumpBuffer=0;p.coyote=0;this.sound('jump');}
      if(!held('b')&&p.vy<-4&&!p.prop)p.vy+=.45;
      if(hit('r')){p.spin=32;if(wasGround){p.vy=-10;this.sound('jump');}else p.vy=Math.min(p.vy,-3.5);}
      if(p.form==='propeller'&&hit('l')){p.vy=Math.max(-13,p.vy-7);p.prop=38;this.sound('jump');}
      if(p.form==='propeller'&&p.vy>0&&!held('down'))p.vy=Math.min(p.vy,1.8);
      if(!wasGround&&hit('down')){p.slam=true;p.vy=12;}
      if(p.form==='propeller'&&held('down')&&!wasGround)p.vy=13;
      p.vy=Math.min(p.vy,14);
    }
    const prevBottom=p.y+p.h;this.move(p,true);
    if(p.ground){if(p.slam){this.burst(p.x+p.w/2,p.y+p.h,'#f6deb0');this.sound('break');}p.slam=false;}
    p.duck=crouch;
    if(p.y>this.level.rows*TILE+80){this.die();return;}
    for(let y=Math.floor(p.y/TILE);y<=Math.floor((p.y+p.h-1)/TILE);y++)for(let x=Math.floor(p.x/TILE);x<=Math.floor((p.x+p.w-1)/TILE);x++)if(this.tile(x,y)==='^'&&!p.mount){this.damage();if(this.player!==p)return;}
    if(p.carry){p.carry.x=p.x+(p.dir>0?p.w:-p.carry.w);p.carry.y=p.y+8;p.carry.vx=0;p.carry.vy=0;if(!held('y')){p.carry.vx=p.dir*9;p.carry.vy=-3;p.carry.frozen=Math.max(p.carry.frozen,240);p.carry.thrown=true;p.carry=null;this.sound('shoot');}}
    if(held('y')&&!p.carry){const target=this.level.enemies.find(e=>e.alive&&(e.frozen>0||e.shell)&&Math.abs(e.x-p.x)<p.w+22&&Math.abs(e.y-p.y)<48&&!e.thrown);if(target){p.carry=target;target.frozen=Math.max(target.frozen,400);}else this.attack();}
    if(p.mount&&hit('x')){p.mount=false;for(const egg of this.level.eggs)if(egg.hatched)egg.used=true;this.level.eggs.push({x:p.x-50,y:p.y+p.h-36,w:30,h:36,hatched:true});p.vy=-5;}
    else for(const egg of this.level.eggs){if(!egg.hatched&&overlap(p,egg)){egg.hatched=true;egg.x+=40;this.notice('ネッシー誕生！ 近くで X / ↑ で乗降');this.sound('power');}if(egg.hatched&&!egg.used&&!p.mount&&Math.abs(p.x-egg.x)<80&&Math.abs(p.y-egg.y)<90&&(hit('x')||hit('up'))){p.mount=true;egg.used=true;this.notice('ネッシー：Yで舌、Bで大ジャンプ、Xで降りる');}}
    for(const item of this.level.items)if(!item.taken&&overlap(p,item)){item.taken=true;this.setForm(item.type);}
    for(const c of this.level.coins)if(!c.taken&&overlap(p,{x:c.x-7,y:c.y-7,w:14,h:14})){c.taken=true;this.coins++;this.sound('coin');}
    this.updateEnemies(p,prevBottom);
    if(this.player!==p)return;
    this.updateShots();
    for(const f of this.particles){f.x+=f.vx;f.y+=f.vy;f.vy+=.16;f.life--;}
    this.particles=this.particles.filter(f=>f.life>0);
    if(!this.checkpoint&&p.x>this.level.checkpoint.x){this.checkpoint=true;this.notice('中間の灯籠を灯した');this.sound('power');}
    if(overlap(p,this.level.goal)){if(this.level.enemies.some(e=>e.type==='oni'&&e.alive)){if(this.tick%120===0)this.notice('月守りの鬼を倒すと鳥居が開く');}else{this.done=true;this.sound('clear');this.events.clear?.(this.index);}}
    this.camera=clamp(p.x-330,0,this.level.width-960);
  }
  updateEnemies(p,prevBottom){
    for(const e of this.level.enemies){
      if(!e.alive||e===p.carry)continue;
      if(e.frozen>0||e.shell){
        if(e.frozen>0)e.frozen--;e.vy+=.45;const vx=e.vx;this.move(e);if(e.wall){e.vx=-vx;e.thrown=false;}if(e.ground&&!e.thrown)e.vx*=.8;
        if(e.thrown)for(const other of this.level.enemies)if(other!==e&&other.alive&&overlap(e,other)){if(other.type==='oni'){other.hp--;if(other.hp<=0)this.kill(other);}else this.kill(other);this.kill(e);break;}
        if(!e.frozen&&!e.shell){e.thrown=false;e.vx=-.8;}continue;
      }
      if(Math.abs(e.x-p.x)>1100)continue;
      const vx=e.vx;
      if(e.type==='fly'||e.type==='ghost'){e.x+=e.type==='ghost'?Math.sign(p.x-e.x)*.7:e.vx;e.y=e.baseY-45+Math.sin(this.tick*.035+e.phase)*35;if(this.tick%160===0)e.vx*=-1;}
      else if(e.type==='fish'){e.x+=Math.sin(this.tick*.025+e.phase)*1.3;e.y=e.baseY+Math.sin(this.tick*.045+e.phase)*36;}
      else if(e.type==='plant'){e.y=e.baseY-20+Math.sin(this.tick*.04+e.phase)*20;}
      else{e.vy+=this.level.theme===4?.27:.45;if((e.type==='hopper'||e.type==='oni')&&e.ground&&this.tick%90===0)e.vy=-7;e.vx=e.type==='oni'?Math.sign(p.x-e.x)*1.1:e.vx;this.move(e);if(e.wall)e.vx=-vx;if(e.ground&&!e.wall&&e.type!=='oni'){const edge=this.tile(Math.floor((e.x+(e.vx>0?e.w+5:-5))/TILE),Math.floor((e.y+e.h+4)/TILE));if(edge==='.')e.vx=-vx;}}
      if(e.y>650){e.alive=false;continue;}
      if(!overlap(p,e))continue;
      const stomp=p.vy>=0&&prevBottom<=e.y+14;
      const dangerous=['spike','plant','ghost'].includes(e.type);
      if(stomp&&(!dangerous||p.spin||p.mount)){
        p.vy=p.spin?-8:-7;p.slam=false;
        if(dangerous&&p.spin){this.sound('jump');continue;}
        if(e.type==='oni'){if(!e.hurt){e.hp--;e.hurt=60;this.burst(e.x,e.y,'#edbc8a');if(e.hp<=0)this.kill(e);}p.vy=-10;}
        else if(e.type==='turtle'){e.shell=true;e.h=22;e.y+=8;e.vx=0;this.sound('hit');}else this.kill(e);
      }else if(p.sliding&&!dangerous&&e.type!=='oni')this.kill(e);else{this.damage();if(this.player!==p)return;}
    }
    for(const e of this.level.enemies)if(e.hurt>0)e.hurt--;
  }
  updateShots(){
    for(const s of this.projectiles){s.life--;s.x+=s.vx;s.y+=s.vy;s.vy=Math.min(5,s.vy+.2);const b=this.blocks(s,s.vy);if(b.length){if(s.y+s.h-s.vy<=b[0].y+4){s.y=b[0].y-s.h;s.vy=-4;}else s.life=0;}
      for(const e of this.level.enemies)if(e.alive&&e!==this.player.carry&&overlap(s,e)){s.life=0;if(e.type==='oni'){if(!e.hurt){e.hp--;e.hurt=25;if(e.hp<=0)this.kill(e);}}else if(s.ice){e.frozen=600;e.vx=0;this.sound('freeze');}else if(e.type!=='ghost')this.kill(e);break;}
    }this.projectiles=this.projectiles.filter(s=>s.life>0);
  }
}
