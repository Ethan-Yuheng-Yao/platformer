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



begin(10);move(305);hop(480);alive('11 first landing');assert.equal(t.state.challenge.stage,2);hop(300);assert.equal(t.state.challenge.stage,3);hop(480);assert.equal(t.state.challenge.stage,4);hop(300);step(1.4);assert.equal(t.state.challenge.stage,5);hop(480);move(825);hop(915);assert.equal(t.state.phase,'next');console.log('Level 11 full chain passed');
begin(11);move(305);hop(470);alive('12 catch');assert.equal(t.state.challenge.stage,2);hop(540);alive('12 return');assert.equal(t.state.challenge.stage,4);hop(560);move(915);assert.equal(t.state.phase,'next');console.log('Level 12 full chain passed');
begin(12);move(310);move(300);hop(480);alive('13 right');assert.equal(t.state.challenge.stage,3);hop(400);alive('13 step');hop(600);move(735);hop(870);move(915);assert.equal(t.state.phase,'next');console.log('Level 13 full chain passed');
begin(13);move(300);t.setKey('w',true);t.update(1/120);move(325);move(300);for(let i=0;i<130 && !t.state.player.grounded && t.state.phase==='playing';i++)t.update(1/120);assert.equal(t.state.challenge.stage,2);hop(480);alive('14 main');assert.equal(t.state.challenge.stage,3);move(550);hop(665);assert.equal(t.state.challenge.stage,4);hop(535);assert.equal(t.state.challenge.stage,5);move(815);t.setKey('w',true);t.update(1/120);move(833);move(780);for(let i=0;i<150 && !t.state.player.grounded && t.state.phase==='playing';i++)t.update(1/120);for(let i=0;i<600 && t.state.challenge.routeY>330 && t.state.phase==='playing';i++)t.update(1/120);hop(915);assert.equal(t.state.phase,'next');console.log('Level 14 full chain passed');

begin(14);move(245);hop(400);alive('15 catch');assert.equal(t.state.challenge.stage,2);hop(310);alive('15 reverse');assert.equal(t.state.challenge.stage,4);hop(435);assert.equal(t.state.challenge.stage,5);for(let i=0;i<150 && t.state.challenge.liftY>380 && t.state.phase==='playing';i++)t.update(1/120);move(455);hop(595);alive('15 upper');assert.equal(t.state.challenge.stage,6);move(615);hop(725);alive('15 low');assert.equal(t.state.challenge.stage,7);hop(785);t.setKey('w',true);t.update(1/120);move(905);for(let i=0;i<120 && t.state.challenge.stage<8 && t.state.phase==='playing';i++)t.update(1/120);alive('15 fake finish');assert.equal(t.state.challenge.stage,8);move(815);for(let i=0;i<150 && !t.state.player.grounded && t.state.phase==='playing';i++)t.update(1/120);hop(785);assert.equal(t.state.phase,'won');console.log('Level 15 eight-stage route passed');




