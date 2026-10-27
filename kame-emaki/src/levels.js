export const TILE = 32;
export const FORMS = {
  normal: {name:'通常', color:'#dfbf68', w:28,h:36},
  super: {name:'スーパー', color:'#76ab72',w:30,h:49},
  fire: {name:'ファイヤー',color:'#db6e43',w:30,h:49},
  bean: {name:'マメ',color:'#a3cce0',w:18,h:24},
  ice: {name:'アイス',color:'#79cbd5',w:30,h:49},
  propeller: {name:'プロペラ',color:'#e2b34c',w:30,h:49},
  seal: {name:'アザラシ',color:'#899bbd',w:34,h:45},
};
export const ITEMS = {super:'スーパータケノコ',fire:'ファイヤーフラワー',bean:'マメキノコ',ice:'アイスフラワー',propeller:'プロペラタケノコ',seal:'アザラシスーツ'};
export const THEMES = [
  {name:'森林',sub:'竹風の小径',sky:['#6eaaa0','#d1d6ad'],land:'#677d49',soil:'#3d5340',accent:'#9bbb78'},
  {name:'川',sub:'水鏡の渡し',sky:['#548f9f','#cee1ce'],land:'#839a63',soil:'#526b5e',accent:'#abc8a3'},
  {name:'山',sub:'白嶺の参道',sky:['#6e8da6','#d3ddd5'],land:'#b7c9c6',soil:'#647b83',accent:'#e5e4d5'},
  {name:'墓地',sub:'灯籠の宵',sky:['#252b4b','#696a89'],land:'#778b79',soil:'#3d4b53',accent:'#b4b6c2'},
  {name:'宇宙',sub:'月宮への道',sky:['#121b37','#424469'],land:'#b6abc1',soil:'#5e597b',accent:'#d6bc90'},
];
export const STAGES = THEMES.flatMap((theme,w)=>[0,1].map(n=>({id:`${w+1}-${n+1}`,theme:w,variant:n,name:`${theme.name} ${w+1}-${n+1}`})));
export const overlap = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
export function createLevel(index){
  const spec=STAGES[index], cols=174+spec.variant*18, rows=19;
  const tiles=Array.from({length:rows},()=>Array(cols).fill('.'));
  const put=(x,y,t)=>{if(y>=0&&y<rows&&x>=0&&x<cols)tiles[y][x]=t;};
  for(let x=0;x<cols;x++)for(let y=14;y<rows;y++)put(x,y,'#');
  const waters=[],enemies=[],items=[],coins=[],eggs=[];
  const enemy=(type,x,y=13)=>enemies.push({type,x:x*TILE,y:y*TILE-1,w:28,h:30,vx:-.8,vy:0,dir:-1,hp:type==='oni'?6:1,alive:true,frozen:0,shell:false,spin:0,baseY:y*TILE,phase:x});
  for(let s=0;s<5;s++){
    const x=19+s*29;
    const river=spec.theme===1, space=spec.theme===4;
    const gap=river?9:space?5:3+spec.variant;
    for(let k=x;k<x+gap;k++)for(let y=14;y<rows;y++)put(k,y,'.');
    if(river||s===2){
      waters.push({x:x*TILE,y:14*TILE+2,w:gap*TILE,h:5*TILE});
      for(let k=x;k<x+gap;k++)put(k,18,'#');
      enemy('fish',x+gap/2,15);
      if(river){for(let k=x-3;k<x+gap+2;k+=3)put(k,11,'=');}
    }else{for(let k=x;k<x+gap;k++)put(k,12,'=');}
    for(let k=0;k<5;k++)put(x+8+k,10-(s%2),'=');
    for(let k=0;k<3;k++){put(x+8+k,13,k===1?'?':'b');coins.push({x:(x+8+k)*TILE+16,y:8*TILE,r:7});}
    items.push({type:Object.keys(ITEMS)[(s+index)%6],x:(x+10)*TILE,y:9*TILE-24,w:24,h:24});
    enemy(['walker','turtle','spike','hopper','fly'][s],x+13);
    if(spec.theme===3)enemy('ghost',x+17,9);
    if(spec.theme===4)enemy('fly',x+21,9);
    if(spec.variant)enemy('plant',x+24);
    if(spec.theme===2)for(let k=x+15;k<x+24;k++)put(k,14,'i');
    if(s===1){for(let k=x+16;k<x+20;k++)put(k,11,'b');}
    if(s===3){for(let k=x+18;k<x+22;k++)put(k,12,'b');items.push({type:'bean',x:(x+16)*TILE,y:13*TILE-26,w:24,h:24});coins.push({x:(x+20)*TILE,y:13*TILE+16,r:7});}
    if(s===4){for(let k=x+18;k<x+22;k++)put(k,13,'^');}
  }
  // A safe starting shrine introduces every transformation, with repeated items later.
  Object.keys(ITEMS).forEach((type,i)=>items.push({type,x:(5+i*2)*TILE,y:11*TILE,w:24,h:24}));
  for(let x=4;x<18;x++)put(x,12,'=');
  eggs.push({x:15*TILE,y:14*TILE-36,w:30,h:36,hatched:false});
  if(index===9)enemy('oni',cols-11,12);
  return {...spec,cols,rows,tiles,waters,enemies,items,coins,eggs,width:cols*TILE,checkpoint:{x:Math.floor(cols/2)*TILE,y:14*TILE},goal:{x:(cols-5)*TILE,y:14*TILE-128,w:70,h:128}};
}
