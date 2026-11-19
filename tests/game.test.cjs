const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const elements=new Map();function el(id){if(!elements.has(id))elements.set(id,{children:[],replaceChildren(){this.children=[]},append(child){this.children.push(child)},get firstElementChild(){return this.children[0]},addEventListener(){},focus(){},getContext(){return {}}});return elements.get(id)}
const savedProgress=new Map();
const sandbox={localStorage:{getItem(key){return savedProgress.get(key)??null},setItem(key,value){savedProgress.set(key,value)}},document:{createElement(){return {focus(){}}},querySelector:el,getElementById:el,querySelectorAll(){return []},addEventListener(){}},window:{addEventListener(){}},requestAnimationFrame(){},Math,Set};
const source=fs.readFileSync(require('node:path').join(__dirname,'../aftermath.js'),'utf8')+'\n'+fs.readFileSync(require('node:path').join(__dirname,'../challenges.js'),'utf8')+'\n'+fs.readFileSync(require('node:path').join(__dirname,'../game.js'),'utf8').replace('  startLevel(0);showMenu();requestAnimationFrame(frame);',`globalThis.test={showMenu,completed,startLevel,update,setKey,platforms,orbPosition,get state(){return {player,level,challenge,trap,drop,spikeX,wallUsed,wallTime,phase,falls,faded,revealed}},place(x,y,vy=0,grounded=false){player.x=x;player.y=y;player.vy=vy;player.grounded=grounded;coyote=0;},clear(){keys.clear()}};startLevel(0);`);
vm.runInNewContext(source,sandbox);const t=sandbox.test;
function step(n){for(let i=0;i<Math.ceil(n*120);i++)t.update(1/120)}
function begin(i){t.clear();t.startLevel(i)}
// The opaque ground blocks lateral entry below its top.
begin(0);t.place(460,445);t.setKey('d',true);step(.1);assert(t.state.player.x<=469);
// The underside of a hidden slab blocks upward travel.
begin(4);t.place(200,460,-400);step(.06);assert(t.state.player.y>=450);assert(t.state.player.vy>=0);
// Normal first-level jump and progression remain possible.
begin(0);t.setKey('d',true);step(1.06);t.setKey('w',true);step(.7);t.setKey('w',false);assert(t.state.player.x>485);step(2.1);assert.equal(t.state.level,1);
// Wall rearms on death.
begin(1);t.place(589,300);t.setKey('d',true);step(.01);assert(t.state.wallUsed);t.clear();t.place(600,600);step(.34);assert(!t.state.wallUsed);assert.equal(t.state.player.x,78);
// Ascending geometry and reduced jumps still reach adjacent pillars.
begin(2);const ps=t.platforms();assert.equal(ps[0].y,410);for(let i=1;i<6;i++){assert(ps[i].y<ps[i-1].y);assert(ps[i].w<ps[0].w);assert(ps[i].x-ps[i-1].x-ps[i-1].w>=90);}
t.place(145,394,0,true);t.setKey('d',true);t.setKey('w',true);step(.5);t.clear();step(.3);assert(t.state.player.grounded);assert.equal(t.state.player.y,364);
// Level 3 returns after 1.5 seconds and stays spent until the next life.
begin(2);t.place(625,250);t.setKey('d',true);step(.01);t.clear();t.place(580,304,0,true);
step(1.4);assert.equal(t.state.drop,340);step(.15);assert(t.state.drop<340);assert(t.state.drop>0);
step(.5);assert.equal(t.state.drop,0);assert(t.state.trap);
t.place(625,250);t.setKey('d',true);step(.1);assert.equal(t.state.drop,0);
t.clear();t.place(650,600);step(.34);assert(!t.state.trap);assert.equal(t.state.drop,0);
t.place(625,250);t.setKey('d',true);step(.01);assert(t.state.trap);assert(t.state.drop>0);
// Spike decoy still intercepts the final jump.
begin(3);t.place(740,274,0,true);t.setKey('d',true);t.setKey('w',true);step(.9);assert.equal(t.state.phase,'falling');
// Lower route clears the pillars and leads to the dropped orb.
begin(3);t.place(752,240);t.setKey('d',true);step(.01);t.clear();t.place(655,320);step(.7);assert.equal(t.state.drop,210);assert.equal(t.state.player.y,454);t.setKey('d',true);step(.81);assert.equal(t.state.phase,'next');
// Fake pillar footprints contain no solid floor and no revealed path.
begin(4);assert.equal(t.platforms().length,7);assert(!t.platforms().some(p=>p.x<280 && p.x+p.w>280));t.place(280,364);step(.5);assert(!t.state.player.grounded);assert(!t.state.revealed.has(280));
// Only hidden gaps reveal, clipped precisely at their edges.
begin(4);t.setKey('d',true);step(.57);t.clear();assert(t.state.revealed.size>0);for(const x of t.state.revealed) assert(x>=160 && x<250);
// Jump across each fake pillar, landing on the ascending invisible gaps.
for(const [launch,target] of [[220,345],[370,495],[520,645],[670,785],[810,925]]){
  t.setKey('d',true);while(t.state.player.x<launch)t.update(1/120);
  t.setKey('w',true);while(t.state.player.x<target && t.state.phase==='playing')t.update(1/120);
  t.clear();step(.6);if(target<925){assert(t.state.player.grounded);assert.equal(t.state.phase,'playing');}
}
assert.equal(t.state.phase,'next');for(const x of t.state.revealed) assert(t.platforms().some(p=>p.hidden && x>=p.x && x<p.x+p.w));
begin(4);assert.equal(t.state.revealed.size,0);assert(t.state.faded.every(x=>x===0));
// The menu offers only the initial level and completed levels.
t.completed.clear();t.showMenu();assert.equal(t.state.phase,'menu');assert.equal(el('levelChoices').children.filter(b=>!b.disabled).length,1);
el('levelChoices').children[2].onclick();assert.equal(t.state.phase,'menu');
t.completed.add(2);t.showMenu();assert(!el('levelChoices').children[2].disabled);assert(el('levelChoices').children[1].disabled);el('levelChoices').children[2].onclick();assert.equal(t.state.level,2);assert.equal(t.state.phase,'playing');
// A ball aimed at either edge of a fake pillar cannot catch adjacent hidden floor.
for(const x of [250,280,309]){begin(4);t.place(x,364);step(.48);assert(!t.state.player.grounded);assert(t.state.player.y>440);}
// Completing a selected level saves it and continues into the following level.
begin(2);let orb=t.orbPosition();t.place(orb.x,orb.y);step(.01);assert.equal(t.state.phase,'next');assert(JSON.parse(savedProgress.get('just-roll-completed')).includes(2));step(.7);assert.equal(t.state.level,3);
const reloaded={...sandbox};vm.runInNewContext(source,reloaded);assert(reloaded.test.completed.has(2));reloaded.test.showMenu();assert(!el('levelChoices').children[2].disabled);
console.log('PASS: solid collision, ascending geometry, falling-pillar escape, spike trap, lower route, fake pillar holes, clipped translucent path, and level 5 completion.');

