const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const elements=new Map();function el(id){if(!elements.has(id))elements.set(id,{children:[],replaceChildren(){this.children=[]},append(child){this.children.push(child)},get firstElementChild(){return this.children[0]},addEventListener(){},focus(){},getContext(){return {}}});return elements.get(id)}
const savedProgress=new Map();
const sandbox={localStorage:{getItem(key){return savedProgress.get(key)??null},setItem(key,value){savedProgress.set(key,value)}},document:{createElement(){return {focus(){}}},querySelector:el,getElementById:el,querySelectorAll(){return []},addEventListener(){}},window:{addEventListener(){}},requestAnimationFrame(){},Math,Set};
const source=fs.readFileSync(require('node:path').join(__dirname,'../aftermath.js'),'utf8')+'\n'+fs.readFileSync(require('node:path').join(__dirname,'../challenges.js'),'utf8')+'\n'+fs.readFileSync(require('node:path').join(__dirname,'../game.js'),'utf8').replace('  startLevel(0);showMenu();requestAnimationFrame(frame);',`globalThis.test={showMenu,completed,startLevel,update,setKey,platforms,orbPosition,get state(){return {player,level,challenge,trap,drop,spikeX,wallUsed,wallTime,phase,falls,faded,revealed}},place(x,y,vy=0,grounded=false){player.x=x;player.y=y;player.vy=vy;player.grounded=grounded;coyote=0;},clear(){keys.clear()}};startLevel(0);`);
vm.runInNewContext(source,sandbox);const t=sandbox.test;
function step(n){for(let i=0;i<Math.ceil(n*120);i++)t.update(1/120)}
function begin(i){t.clear();t.startLevel(i)}


// Holding toward the incoming wall must never let the ball enter its body.
begin(10);t.state.challenge.stage=2;t.state.challenge.age=.2;t.state.challenge.pusher=540;t.place(524,394,0,true);t.setKey('d',true);
for(let i=0;i<20;i++){t.update(1/120);assert(t.state.player.x+16<=t.state.challenge.pusher+.001,'ball penetrated moving wall on frame '+i);}
console.log('Incoming-wall collision regression passed.');
// Isolate moving rectangles on a continuous floor to exercise both directions and stops.
function fixture(bodies,advance=()=>{}){begin(10);const c=t.state.challenge;c.solids=()=>bodies;c.before=advance;c.after=()=>{};c.hazards=()=>[];return c;}
const floor=()=>({x:0,y:410,w:960,h:130});
for(const direction of [-1,1]){
  const wall={x:direction<0?540:250,y:245,w:22,h:165,id:'wall',shove:true};fixture([floor(),wall],dt=>{wall.x=direction<0?Math.max(440,wall.x-245*dt):Math.min(350,wall.x+260*dt)});
  t.place(direction<0?wall.x-16:wall.x+wall.w+16,394,0,true);t.setKey(direction<0?'d':'a',true);
  for(let i=0;i<180;i++){t.update(1/120);assert.equal(t.state.phase,'playing');assert(direction<0?t.state.player.x+16<=wall.x+.001:t.state.player.x-16>=wall.x+wall.w-.001);}
}
// A retreating wall must not drag the ball; ordinary sliding solids also push.
let wall={x:300,y:245,w:22,h:165,id:'slider'};fixture([floor(),wall],dt=>wall.x-=100*dt);t.place(338,394,0,true);step(.1);assert.equal(t.state.player.x,338);
wall={x:500,y:245,w:22,h:165,id:'slider'};fixture([floor(),wall],dt=>wall.x-=100*dt);t.place(484,394,0,true);t.setKey('d',true);step(.15);assert(t.state.player.x+16<=wall.x+.001);
// A descending ceiling crushes against the floor rather than pushing through it.
const ceiling={x:100,y:300,w:100,h:20,id:'ceiling'};fixture([floor(),ceiling],dt=>ceiling.y+=120*dt);t.place(150,394,0,true);step(.55);assert.equal(t.state.phase,'falling');
// Crossing a seam must not double the displacement from a moving platform.
const segments=[{x:110,y:350,w:40,h:24,id:'one'},{x:150,y:350,w:40,h:24,id:'two'}];fixture(segments,dt=>segments.forEach(p=>p.x+=100*dt));t.place(150,334,0,true);t.update(1/120);assert(Math.abs(t.state.player.x-(150+100/120))<.001);assert(t.state.player.grounded);
// A rising lift carries its rider but releases a deliberate jump.
const lift={x:100,y:350,w:100,h:24,id:'lift'};fixture([lift],dt=>lift.y-=100*dt);t.place(150,334,0,true);t.update(1/120);assert(Math.abs(t.state.player.y+16-lift.y)<.001);t.setKey('w',true);t.update(1/120);assert(t.state.player.vy<0);assert(t.state.player.y+16<lift.y);
// A wall cannot squeeze the ball out through the left screen boundary.
wall={x:34,y:245,w:22,h:165,id:'wall',shove:true};fixture([floor(),wall],dt=>wall.x-=120*dt);t.place(18,394,0,true);step(.05);assert.equal(t.state.phase,'falling');
console.log('Both pusher directions, stopped walls, retreating/sliding solids, crushes, rider seams, lift jumps, and screen edges passed.');
