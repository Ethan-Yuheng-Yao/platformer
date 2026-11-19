const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const elements=new Map();function el(id){if(!elements.has(id))elements.set(id,{children:[],replaceChildren(){this.children=[]},append(child){this.children.push(child)},get firstElementChild(){return this.children[0]},addEventListener(){},focus(){},getContext(){return {}}});return elements.get(id)}
const savedProgress=new Map();
const sandbox={localStorage:{getItem(key){return savedProgress.get(key)??null},setItem(key,value){savedProgress.set(key,value)}},document:{createElement(){return {focus(){}}},querySelector:el,getElementById:el,querySelectorAll(){return []},addEventListener(){}},window:{addEventListener(){}},requestAnimationFrame(){},Math,Set};
const source=fs.readFileSync(require('node:path').join(__dirname,'../aftermath.js'),'utf8')+'\n'+fs.readFileSync(require('node:path').join(__dirname,'../challenges.js'),'utf8')+'\n'+fs.readFileSync(require('node:path').join(__dirname,'../game.js'),'utf8').replace('  startLevel(0);showMenu();requestAnimationFrame(frame);',`globalThis.test={showMenu,completed,startLevel,update,setKey,platforms,orbPosition,get state(){return {player,level,challenge,trap,drop,spikeX,wallUsed,wallTime,phase,falls,faded,revealed}},place(x,y,vy=0,grounded=false){player.x=x;player.y=y;player.vy=vy;player.grounded=grounded;coyote=0;},clear(){keys.clear()}};startLevel(0);`);
vm.runInNewContext(source,sandbox);const t=sandbox.test;
function step(n){for(let i=0;i<Math.ceil(n*120);i++)t.update(1/120)}
function begin(i){t.clear();t.startLevel(i)}

function move(x){const boss=t.state.challenge?.boss;t.clear();t.setKey(x>t.state.player.x?'d':'a',true);for(let i=0;i<1000 && Math.abs(t.state.player.x-x)>3;i++){t.update(1/120);if(t.state.phase!=='playing' || t.state.challenge?.boss!==boss)break;}t.clear();}
function hop(x){t.setKey('w',true);t.update(1/120);t.setKey('w',false);move(x);for(let i=0;i<160 && !t.state.player.grounded && t.state.phase==='playing';i++)t.update(1/120);}
function alive(label){assert.equal(t.state.phase,'playing',label+': '+JSON.stringify(t.state.player));}

begin(5);move(190);hop(330);alive('6 shelf');hop(475);alive('6 tilt');hop(615);alive('6 pause');t.setKey('w',true);t.update(1/120);move(684);for(let i=0;i<160 && !t.state.player.grounded && t.state.phase==='playing';i++)t.update(1/120);alive('6 lower');assert.equal(t.state.player.y,454);move(780);hop(826);hop(862);alive('6 split');hop(925);assert.equal(t.state.phase,'next');console.log('Level 6 revised route passed');
begin(6);move(200);step(.35);hop(345);alive('7 gap1');move(460);step(.35);t.setKey('w',true);t.update(1/120);move(478);step(.15);move(600);for(let i=0;i<100 && !t.state.player.grounded && t.state.phase==='playing';i++)t.update(1/120);alive('7 gap2');move(720);hop(855);move(915);assert.equal(t.state.phase,'next');console.log('Level 7 revised route passed');
begin(7);move(172);step(1.6);hop(330);alive('8 first');step(1.4);move(360);hop(525);alive('8 second');step(1.4);move(553);hop(695);alive('8 third');move(720);hop(895);move(915);assert.equal(t.state.phase,'next');console.log('Level 8 revised route passed');
begin(8);move(145);for(const x of [275,435,595,755,915])hop(x);assert.equal(t.state.challenge.mode,1);alive('9 turn');for(const x of [755,595,435,275,100])hop(x);move(70);assert.equal(t.state.challenge.mode,2);move(145);for(const x of [265,445,585])hop(x);step(.5);move(610);hop(765);hop(915);if(t.state.phase==='playing')hop(920);assert.equal(t.state.phase,'next');console.log('Level 9 revised route passed');
begin(9);move(190);hop(330);alive('10 shelf');for(let i=0;i<300 && t.state.challenge.shelf<470 && t.state.phase==='playing';i++)step(.01);hop(625);alive('10 escape');step(.52);hop(738);alive('10 back');hop(808);alive('10 upper');t.setKey('w',true);t.update(1/120);move(890);for(let i=0;i<120 && !t.state.challenge.spent && t.state.phase==='playing';i++)t.update(1/120);alive('10 orb');move(828);for(let i=0;i<120 && !t.state.player.grounded && t.state.phase==='playing';i++)t.update(1/120);assert(t.state.challenge.stoneLanded);hop(770);assert(t.state.challenge.boss);assert.equal(t.state.phase,'playing');console.log('Level 10 gate opens boss arena');


// Survive all three boss attack cycles with ordinary movement and jumps.
function untilBoss(age){for(let i=0;i<1500 && t.state.challenge.boss.age<age && t.state.phase==='playing';i++)t.update(1/120);alive('boss wait '+age);}
for(let round=0;round<3;round++){
  if(round===0){
    move(480);untilBoss(2.5);move(270);untilBoss(4);move(380);untilBoss(5.7);
    t.setKey('w',true);t.update(1/120);t.clear();untilBoss(6.7);move(480);untilBoss(7.05);
  }else if(round===1){
    move(480);untilBoss(1.94);t.setKey('w',true);t.update(1/120);t.clear();untilBoss(4.05);move(720);untilBoss(6.4);move(480);
  }else{
    move(200);untilBoss(2.15);move(280);hop(480);move(520);hop(700);untilBoss(5.1);
    t.setKey('w',true);t.update(1/120);t.clear();untilBoss(6.8);move(480);
  }
  const hp=t.state.challenge.boss.hp;t.setKey('w',true);for(let i=0;i<60 && t.state.challenge.boss.hp===hp && t.state.phase==='playing';i++)t.update(1/120);t.clear();assert.equal(t.state.challenge.boss.hp,hp-1);alive('boss hit');
}
move(915);assert.equal(t.state.phase,'next');console.log('Full three-round boss battle and final orb passed.');
// Wall trap removes its launch platform; retreating kills instead of rescuing.
begin(5);t.place(615,364,0,true);step(.01);t.setKey('w',true);step(.02);t.clear();assert(t.state.challenge.dropRoute);assert(!t.platforms().some(p=>p.id==='pause'));assert(t.platforms().some(p=>p.id==='lower'));move(570);assert.equal(t.state.phase,'falling');
// Short floor spikes force the final takeoff in level 7; slowing down is fatal.
begin(6);t.place(650,394,0,true);step(.7);assert.equal(t.state.phase,'falling');
// Early jumps fall out of the level before a returning platform can catch them.
for(const [index,x,y] of [[0,175,394],[1,340,369],[2,535,344]]){
  begin(7);t.place(x,y,0,true);if(index>0){t.state.challenge.triggered=true;t.state.challenge.fall[index]=0;}
  const falls=t.state.falls;hop([330,525,695][index]);step(.1);assert(t.state.falls>falls,'early jump '+index);
}
// Warning zones are harmless first, then lethal. Boss death resets the whole level.
begin(9);t.state.challenge.enterBoss(t.state.player);step(1.2);alive('boss warning');assert.equal(t.state.challenge.bossHazards().length,0);step(.55);assert.equal(t.state.phase,'falling');step(.35);assert.equal(t.state.challenge.boss,null);assert.equal(t.state.player.x,78);
for(let i=5;i<10;i++){begin(i);t.state.challenge.triggered=true;t.state.challenge.contacts.test=1;t.place(500,600);step(.34);assert.equal(t.state.challenge.triggered,false);assert.equal(t.state.challenge.clock('test'),-1);}
console.log('Retreat penalty, fast-jump spikes, delayed rescue prevention, boss warning damage, and resets passed.');
// Later waves use different hazards, rather than reordered wave-1 spikes.
begin(9);t.state.challenge.enterBoss(t.state.player);let fight=t.state.challenge;
fight.boss.round=1;fight.boss.age=1.7;assert.equal(fight.bossZones().length,0);assert(fight.bossHazards().every(h=>h.projectile));fight.boss.age=4.75;fight.boss.target=480;assert(fight.bossHazards().some(h=>h.bolt));
fight.boss.round=2;fight.boss.age=2;assert(!fight.solids().some(p=>p.x===300));assert(fight.bossHazards().some(h=>h.laser));fight.boss.age=6.9;assert(fight.solids().some(p=>p.x===300));
// Render each wave's warnings and attack states without missing canvas operations.
const labels=[];const ctx=new Proxy({fillText(text){labels.push(text);}}, {get(target,key){return key in target?target[key]:(()=>{});}});
for(const round of [0,1,2])for(const age of [.9,1.4,2.7,4.4,5.3,7.1]){fight.boss.round=round;fight.boss.age=age;fight.drawBoss(ctx);}
assert(labels.some(s=>s.includes('CROSSFIRE')));assert(labels.some(s=>s.includes('COLLAPSE')));
// Falling through a collapsed section resets all boss progress.
fight.boss.round=2;fight.boss.age=2;t.place(350,449,0,true);step(.6);assert.equal(t.state.phase,'falling');step(.35);assert.equal(t.state.challenge.boss,null);
console.log('Distinct wave hazards, restored arena, warning rendering, and collapse death passed.');
