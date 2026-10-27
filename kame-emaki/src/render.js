import {TILE,THEMES,FORMS} from './levels.js';
export class Renderer{
  constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d');}
  rect(x,y,w,h,color){const c=this.c;c.fillStyle=color;c.fillRect(x,y,w,h);}
  ellipse(x,y,rx,ry,color){const c=this.c;c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
  line(x,y,x2,y2,color,width=2){const c=this.c;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
  text(t,x,y,size=16,color='#fff',align='center'){const c=this.c;c.font=`bold ${size}px system-ui,sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(t,x,y);}
  poly(points,color){const c=this.c;c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
  draw(game){
    const c=this.c,l=game.level,t=THEMES[l.theme],cam=game.camera;
    c.clearRect(0,0,960,540);const gradient=c.createLinearGradient(0,0,0,540);gradient.addColorStop(0,t.sky[0]);gradient.addColorStop(1,t.sky[1]);c.fillStyle=gradient;c.fillRect(0,0,960,540);
    this.background(l.theme,cam,game.tick);
    c.save();c.translate(-Math.round(cam),0);
    for(const water of l.waters){this.rect(water.x,water.y,water.w,water.h,'#387c929c');for(let y=water.y+10;y<600;y+=22)this.line(water.x,y,water.x+water.w,y,'#9ad5d34d');for(let x=water.x;x<water.x+water.w;x+=20)this.line(x,water.y+Math.sin(game.tick*.07+x)*2,x+16,water.y+Math.sin(game.tick*.07+x+1)*2,'#cfefe1',2);}
    const start=Math.max(0,Math.floor(cam/TILE)),end=Math.min(l.cols,start+32);
    for(let y=0;y<l.rows;y++)for(let x=start;x<end;x++){
      const tile=l.tiles[y][x],px=x*TILE,py=y*TILE;
      if(tile==='#'||tile==='i'){
        this.rect(px,py,32,32,t.soil);this.line(px,py+31,px+32,py+31,'#00000018',1);this.line(px+((y%2)*16),py+8,px+((y%2)*16)+12,py+8,'#ffffff12',2);
        if(l.tiles[y-1]?.[x]!==tile){this.rect(px,py,32,7,tile==='i'?'#e0f4ef':t.land);this.rect(px,py+7,32,3,'#172b272e');if(tile!=='i')this.poly([[px,py+5],[px+4,py+12],[px+8,py+5],[px+20,py+5],[px+25,py+10],[px+29,py+5]],t.land);}
        if(tile==='i')this.line(px+5,py+9,px+20,py+3,'#fff9');
      }else if(tile==='b'||tile==='?'){
        this.rect(px+1,py+1,30,30,tile==='?'?'#bd9656':'#93664b');this.rect(px+3,py+3,26,26,tile==='?'?'#ddba70':'#b18662');this.line(px+2,py+16,px+30,py+16,'#634d3c',1);this.line(px+16,py+1,px+16,py+15,'#634d3c',1);if(tile==='?'){this.ellipse(px+16,py+16,11,11,'#edcf8d');this.text('福',px+16,py+17,19,'#76502f');}
      }else if(tile==='='){this.rect(px,py,32,7,'#8b6350');this.rect(px,py,32,2,'#cbb682');this.rect(px+4,py+7,4,5,'#74543f');}
      else if(tile==='^'){this.rect(px,py+26,32,6,'#6d625e');for(let k=0;k<3;k++)this.poly([[px+k*11,py+27],[px+k*11+5,py+6],[px+k*11+11,py+27]],'#d8d4c6');}
    }
    const checkpoint=l.checkpoint;this.lantern(checkpoint.x,checkpoint.y,game.checkpoint);this.torii(l.goal.x,l.goal.y);
    for(const coin of l.coins)if(!coin.taken){this.ellipse(coin.x,coin.y,8,10,'#e7bf63');this.rect(coin.x-2,coin.y-3,4,6,'#7d6843');}
    for(const i of l.items)if(!i.taken)this.item(i,game.tick);
    for(const egg of l.eggs){if(egg.hatched){if(!egg.used)this.nessie(egg.x,egg.y+20,1);}else{this.ellipse(egg.x+15,egg.y+19,15,19,'#f1e6bb');this.ellipse(egg.x+12,egg.y+12,4,5,'#81a98b');this.ellipse(egg.x+20,egg.y+26,5,4,'#81a98b');}}
    for(const e of l.enemies)if(e.alive)this.enemy(e,game.tick);
    for(const s of game.projectiles){this.ellipse(s.x+6,s.y+6,9,9,s.ice?'#b4f7f4':'#e88738');this.ellipse(s.x+6,s.y+6,4,4,s.ice?'#f0ffff':'#ffe9a5');}
    this.hero(game.player,game.tick);
    for(const p of game.particles)this.rect(p.x,p.y,4,4,p.color);
    c.restore();
    // Subtle paper grain stays deterministic and costs no image downloads.
    c.globalAlpha=.035;for(let i=0;i<100;i++)this.rect((i*127)%960,(i*71)%540,2,2,'#fff');c.globalAlpha=1;
    if(game.player.wet){this.rect(0,0,960,540,'#396c850d');}
  }
  background(theme,cam,tick){
    const c=this.c,night=theme>=3;
    this.ellipse(780-cam*.025,100,theme===4?54:38,theme===4?54:38,night?'#eddfb7':'#e9e2b6');
    if(night)for(let i=0;i<45;i++)this.ellipse((i*173+37-cam*.05+9600)%960,(i*61)%280,1+(i%2)*.5,1+(i%2)*.5,'#e4e0cf');
    for(let layer=0;layer<3;layer++){
      const offset=cam*(.06+layer*.09),base=365+layer*34;
      for(let i=-1;i<6;i++){
        const x=i*300-(offset%300);this.poly([[x-160,540],[x-80,base],[x+110,150+layer*66+(i%2)*25],[x+310,base],[x+410,540]],['#526f7355','#4f777566','#31595577'][layer]);
        if(theme===2)this.poly([[x+49,214+layer*66+(i%2)*25],[x+110,150+layer*66+(i%2)*25],[x+175,218+layer*66+(i%2)*25],[x+133,203+layer*66+(i%2)*25],[x+103,214+layer*66+(i%2)*25],[x+80,202+layer*66+(i%2)*25]],'#e7e9dd88');
      }
    }
    if(theme===4){for(let i=0;i<8;i++){const x=(i*213-cam*.2+2000)%1300-180;this.ellipse(x,280+(i%3)*37,55,15,'#a79cb743');this.rect(x-22,280+(i%3)*37,44,10,'#8c819a33');}return;}
    for(let i=-1;i<12;i++){
      const x=i*125-(cam*.42%125),y=420;
      if(theme===0){this.rect(x,y-230,9,230,'#315c50');for(let k=0;k<8;k++)this.line(x,y-k*29,x+9,y-k*29,'#9ab07466',2);for(let k=0;k<4;k++){this.poly([[x,y-200+k*45],[x-45,y-220+k*45],[x-12,y-205+k*45]],'#40755e');this.poly([[x+8,y-185+k*45],[x+64,y-219+k*45],[x+31,y-181+k*45]],'#477d62');}}
      else if(theme===3){this.rect(x,y-52,22,52,'#777d8277');this.poly([[x-3,y-52],[x+11,y-65],[x+25,y-52]],'#96989888');this.text('供',x+11,y-33,13,'#c8c2b577');if(i%3===0)this.lantern(x+60,y,true,.7);}
      else{this.rect(x,y-120,10,120,'#486c6066');for(let k=0;k<3;k++)this.poly([[x-55+k*8,y-90-k*35],[x+5,y-160-k*24],[x+65-k*8,y-90-k*35]],'#40685988');}
    }
    for(let i=0;i<8;i++){const x=(i*173+tick*.25-cam*.15+4000)%1100-70,y=80+(i*71)%310;this.ellipse(x,y,3,1.5,theme===3?'#ffd98c88':'#e6d3ab77');}
  }
  lantern(x,y,lit,scale=1){const c=this.c;c.save();c.translate(x,y);c.scale(scale,scale);if(lit){this.ellipse(0,-66,28,33,'#f8ca5a20');this.ellipse(0,-66,18,22,'#f8ca5a20');}this.rect(-4,-50,8,50,'#666b63');this.rect(-13,-83,26,30,'#929b84');this.rect(-8,-77,16,19,lit?'#efcd73':'#536c64');this.poly([[-22,-84],[0,-99],[22,-84]],'#53645b');this.rect(-15,-53,30,5,'#56685b');c.restore();}
  torii(x,y){this.rect(x+3,y,10,128,'#a24e3b');this.rect(x+59,y,10,128,'#a24e3b');this.rect(x-10,y+1,92,10,'#a24e3b');this.poly([[x-14,y-6],[x+36,y-1],[x+85,y-6],[x+81,y+2],[x+36,y+7],[x-10,y+2]],'#343f38');this.rect(x-1,y+31,74,7,'#a24e3b');this.rect(x+30,y+12,13,24,'#6b6e4c');this.text('月',x+36,y+24,11,'#eadab2');this.line(x+8,y+49,x+63,y+49,'#dbd0ab',2);for(let k=0;k<4;k++)this.poly([[x+13+k*13,y+49],[x+18+k*13,y+53],[x+13+k*13,y+60],[x+8+k*13,y+57]],'#eadfc5');}
  item(i,tick){const x=i.x+12,y=i.y+12+Math.sin(tick*.055+i.x)*3,type=i.type;this.ellipse(x,y,19,19,'#ffedb519');if(type==='fire'||type==='ice'){this.rect(x-2,y,4,13,'#597b4b');for(let k=0;k<6;k++)this.ellipse(x+Math.cos(k*Math.PI/3)*8,y-4+Math.sin(k*Math.PI/3)*8,5,5,type==='ice'?'#b3e4e6':'#d47949');this.ellipse(x,y-4,5,5,'#edd58b');}else if(type==='bean'){this.ellipse(x,y-3,11,8,'#89b2c7');this.rect(x-4,y+1,8,11,'#f1e7ce');this.ellipse(x-4,y-5,3,2,'#f1e7ce');}else if(type==='seal'){this.ellipse(x,y,12,13,'#94abc8');this.ellipse(x,y+2,8,5,'#e0dfce');this.ellipse(x-4,y-3,1.5,2,'#253a43');this.ellipse(x+4,y-3,1.5,2,'#253a43');}else{this.poly([[x-11,y+12],[x-8,y-4],[x,y-15],[x+9,y-4],[x+11,y+12]],type==='propeller'?'#d6b965':'#89a268');this.line(x-7,y+1,x+8,y+1,'#5b7854');this.line(x-9,y+7,x+10,y+7,'#5b7854');if(type==='propeller'){this.line(x,y-14,x,y-22,'#695b3e');this.ellipse(x,y-22,15,3,'#f2d68b');}}}
  nessie(x,y,dir){this.ellipse(x+12,y+10,27,15,'#5f9d8e');this.poly([[x-7,y+2],[x-38,y+5],[x-16,y+15]],'#5f9d8e');this.rect(x+(dir>0?27:-14),y-15,13,28,'#72b69c');this.ellipse(x+(dir>0?36:-11),y-17,15,11,'#72b69c');this.ellipse(x+(dir>0?42:-17),y-20,2,3,'#193b36');this.ellipse(x+11,y+18,15,5,'#c1cf9b');this.ellipse(x-4,y+23,10,4,'#4d8179');this.ellipse(x+28,y+23,10,4,'#4d8179');}
  hero(p,tick){
    if(p.inv>0&&tick%8<3)return;const c=this.c;c.save();c.translate(Math.round(p.x),Math.round(p.y));
    if(p.mount){this.nessie(p.w/2-12,p.h-3,p.dir);if(p.shot>12){const x=p.dir>0?p.w+24:-20;this.line(x,p.h-18,x+p.dir*90,p.h-18,'#d78e8e',5);this.ellipse(x+p.dir*90,p.h-18,6,4,'#e6afa4');}}
    if(p.spin){c.translate(p.w/2,p.h/2);c.rotate(Math.sin(tick*.6)*.3);c.translate(-p.w/2,-p.h/2);}
    const col=FORMS[p.form].color,w=p.w,h=p.h,walk=p.ground&&Math.abs(p.vx)>.5?Math.sin(tick*.5)*3:0;
    if(p.duck){c.translate(0,h*.22);c.scale(1,.78);}
    this.ellipse(w/2,h+2,w*.65,3,'#10272544');
    this.rect(2,h-10,9,10+walk,'#303e3c');this.rect(w-11,h-10,9,10-walk,'#303e3c');
    this.poly([[2,14],[w-2,14],[w+1,h-7],[-1,h-7]],col);this.line(w/2,18,w/2,h-7,'#ffffff25',1);
    this.rect(-4,20,7,13,col);this.rect(w-3,20,7,13,col);
    this.ellipse(w/2,10,w*.4,11,'#edd3a1');this.ellipse(w/2,3,w*.48,5,'#354d45');this.rect(w*.12,0,w*.76,5,col);
    this.rect(p.dir>0?w*.6:w*.22,8,2,3,'#263b36');
    // The chest label remains actual text in all seven forms, including the bean.
    const labelW=p.form==='bean'?27:29,labelY=Math.max(20,h*.58);
    this.rect(w/2-labelW/2,labelY-7,labelW,14,'#fff1cc');this.text('かめ',w/2,labelY,13,'#263e3c');
    this.rect(1,h-11,w-2,3,'#755747');
    if(p.form==='propeller'){this.rect(w/2-2,-10,4,10,'#5c5947');this.ellipse(w/2,-11,15+(Math.sin(tick*(p.prop?.9:.1))*4),3,'#efcc73');}
    if(p.form==='seal'){this.ellipse(1,3,5,5,col);this.ellipse(w-1,3,5,5,col);this.line(w*.6,12,w+6,14,'#776c64',1);}
    if(p.form==='fire')this.poly([[w/2,-6],[w/2-5,1],[w/2+5,1]],'#efbb66');
    if(p.form==='ice')this.text('❄',w/2,-2,15,'#e6ffff');
    c.restore();
  }
  enemy(e,tick){
    const c=this.c;c.save();c.translate(e.x,e.y);const w=e.w,h=e.h;
    if(e.hurt&&tick%6<3)c.globalAlpha=.4;
    if(e.type==='oni'){
      this.ellipse(14,13,24,28,'#a95d67');this.poly([[-4,-4],[-7,-21],[4,-8]],'#dfc08a');this.poly([[24,-5],[32,-21],[29,-1]],'#dfc08a');this.rect(-6,29,40,13,'#c9ae6c');this.rect(-4,42,12,10,'#634b57');this.rect(22,42,12,10,'#634b57');this.text('鬼',14,29,19,'#493e49');this.ellipse(5,6,3,3,'#f6d284');this.ellipse(23,6,3,3,'#f6d284');for(let i=0;i<e.hp;i++)this.rect(-6+i*7,-31,5,4,'#efbb86');
    }else if(e.type==='ghost'){
      this.ellipse(14,14,16,18,'#d8dfdaaa');this.poly([[0,17],[0,35],[10,28],[14,36],[20,28],[27,34],[29,17]],'#d8dfdaaa');this.ellipse(9,12,2,4,'#495563');this.ellipse(20,12,2,4,'#495563');
    }else if(e.type==='plant'){
      this.rect(12,15,5,20,'#668a61');this.ellipse(14,8,16,13,'#a66571');this.line(0,10,28,10,'#f2dabb',3);this.poly([[13,25],[1,18],[3,28]],'#7ea271');
    }else if(e.type==='fish'){
      this.ellipse(14,15,17,12,'#b3c6c1');this.poly([[26,15],[39,4],[39,25]],'#779daa');this.ellipse(5,11,2,3,'#2a4249');this.rect(8,3,14,3,'#b57055');
    }else if(e.type==='fly'){
      this.poly([[7,12],[-17,0],[-8,19],[7,23]],'#c5c6b0');this.poly([[22,12],[44,0],[36,19],[22,23]],'#c5c6b0');this.ellipse(14,17,13,13,'#6f8c98');this.poly([[1,16],[-7,21],[4,24]],'#d9b969');this.ellipse(8,12,2,2,'#f4e3bb');
    }else if(e.type==='turtle'){
      this.ellipse(14,e.shell?12:16,16,e.shell?11:14,'#5d937b');this.line(14,3,14,23,'#b1bd86');this.line(1,13,27,13,'#b1bd86');if(!e.shell){this.ellipse(e.vx>0?30:-2,18,7,7,'#b4b58a');this.rect(2,27,8,4,'#536d5a');this.rect(19,27,8,4,'#536d5a');}
    }else{
      const spike=e.type==='spike';this.ellipse(14,19,16,12,spike?'#6d8189':e.type==='hopper'?'#b2906c':'#b08163');
      this.ellipse(4,3,6,11,'#a4866b');this.ellipse(24,3,6,11,'#a4866b');this.ellipse(14,12,13,11,spike?'#7c949c':'#c6a17c');this.ellipse(8,10,3,4,'#3b4941');this.ellipse(21,10,3,4,'#3b4941');this.ellipse(15,16,4,2,'#534c43');this.rect(0,28,10,4,'#645d4c');this.rect(19,28,10,4,'#645d4c');if(spike)for(let i=0;i<4;i++)this.poly([[i*8-2,5],[i*8+2,-7],[i*8+7,5]],'#d3d6c6');
    }
    if(e.frozen>0){this.rect(-4,-5,w+8,h+9,'#9ae7ef79');this.line(-4,-5,w+4,-5,'#e6ffff',2);this.line(-1,h-2,w,0,'#e6ffff77');}
    c.restore();
  }
}
