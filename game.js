(() => {
  'use strict';
  const canvas = document.querySelector('#game'), ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const GROUND = 410, RADIUS = 16, SPEED = 265, GRAVITY = 1550, JUMP = -570;
  const levels = [
    { gaps: [[385, 485]], name: 'A WARM WELCOME', hint: 'A little leap of faith.' },
    { gaps: [[255, 350], [590, 685]], name: 'FAMILIAR TERRITORY', hint: 'You know the drill.' },
    { name: 'A STEP DOWN', hint: 'One step at a time.' },
    { name: 'LOWER EXPECTATIONS', hint: 'The finish is right there.' },
    { name: 'MIND THE GAPS', hint: 'Looks can be deceiving.' },
    { name: 'WRONG WAY BACK', hint: 'Commit to your mistakes.' },
    { name: 'DON’T JUMP YET', hint: 'Watch your head. Watch your feet.' },
    { name: 'BORROWED GROUND', hint: 'Your next step is on borrowed time.' },
    { name: 'THE RETURN TRIP', hint: 'Three crossings. One life.' },
    { name: 'ONE LAST MISTAKE', hint: 'Surely this is the end.' },
    { name: 'SQUEEZED OUT', hint: 'Room for one.' },
    { name: 'CATCH AND RELEASE', hint: 'A helping hand. Probably.' },
    { name: 'WRONG DIRECTION', hint: 'Make up your mind.' },
    { name: 'THE FLOOR IS LISTENING', hint: 'Every landing has consequences.' },
    { name: 'NOW YOU’RE SAFE', hint: 'You can relax now. Surely.' }
  ];
  const keys = new Set();
  const completed = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem('just-roll-completed') || '[]');
    if(Array.isArray(saved)) for(const n of saved) if(Number.isInteger(n) && n>=0 && n<levels.length) completed.add(n);
  } catch { /* Play normally when browser storage is unavailable. */ }
  function showMenu() {
    phase='menu'; keys.clear(); jumpBuffer=0;
    $('overlay').hidden=true; $('startScreen').hidden=false;
    $('levelChoices').replaceChildren();
    levels.forEach((entry,index)=>{
      const button=document.createElement('button');
      button.disabled=index!==0 && !completed.has(index);
      button.textContent=`${String(index+1).padStart(2,'0')} — ${entry.name}${button.disabled ? ' · Locked' : completed.has(index) ? ' · Beaten' : ''}`;
      button.onclick=()=>{
        if(index!==0 && !completed.has(index)) return;
        falls=0; $('deaths').textContent='FALLS 00'; startLevel(index); canvas.focus();
      };
      $('levelChoices').append(button);
    });
    $('levelChoices').firstElementChild.focus();
  }
  let level = 0, falls = 0, player, wallUsed, wallTime, phase, phaseTime, jumpBuffer = 0, coyote = 0, time = 0;
  const pillars = [[0,160],[250,310],[400,460],[550,610],[700,750],[840,900]];
  const pillarY = i => GROUND - i * 30;
  const lowerDrop = 470 - pillarY(pillars.length - 1);
  function hiddenPaths() {
    return pillars.map(([,b],i)=>({x:b+20,y:pillarY(i),w:(pillars[i+1]?.[0] ?? 980)-b-40,h:24,hidden:true}));
  }
  let challenge;
  let trap, drop, dropElapsed, spikeX, faded, revealed;
  function respawn() {
    player = { x: 78, y: GROUND - RADIUS, vx: 0, vy: 0, angle: 0, grounded: true };
    jumpBuffer = 0; coyote = 0.09;
  }
  function startLevel(index) {
    level = index; wallUsed = false; wallTime = 0; phase = 'playing'; phaseTime = 0; time = 0;
    trap = false; drop = 0; dropElapsed = 0; spikeX = 980; faded = pillars.map(() => 0); revealed = new Set();
    $('overlay').hidden = true;
    $('startScreen').hidden = true;
    $('levelTag').innerHTML = `${String(level+1).padStart(2,'0')} <span>/ 15</span>`;
    $('levelName').textContent = `LEVEL ${String(level+1).padStart(2,'0')} — ${levels[level].name}`;
    $('hint').textContent = levels[level].hint;
    challenge = level>=10 ? new AftermathChallenge(level) : level>=5 ? new Challenge(level) : null;
    respawn();
  }
  function setKey(key, down) {
    if(phase==='menu') return;
    if (down) {
      if (!keys.has(key) && ['w', 'ArrowUp', ' '].includes(key)) jumpBuffer = 0.13;
      keys.add(key);
    } else keys.delete(key);
  }
  window.addEventListener('keydown', e => {
    if(phase==='menu') return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (['a', 'd', 'w', 'ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'r'].includes(key)) {
      if (e.target.tagName === 'BUTTON' && key === ' ') return;
      e.preventDefault();
      if (key === 'r' && !e.repeat) startLevel(level);
      else setKey(key, true);
    }
  });
  window.addEventListener('keyup', e => setKey(e.key.length === 1 ? e.key.toLowerCase() : e.key, false));
  window.addEventListener('blur', () => { keys.clear(); jumpBuffer = 0; });
  document.addEventListener('visibilitychange', () => { keys.clear(); jumpBuffer = 0; });
  document.querySelectorAll('[data-key]').forEach(button => {
    button.addEventListener('pointerdown', e => { e.preventDefault(); button.setPointerCapture(e.pointerId); setKey(button.dataset.key, true); });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, () => setKey(button.dataset.key, false));
  });
  $('restart').onclick = () => { if(phase!=='menu') { startLevel(level); canvas.focus(); } };
  $('menu').onclick = showMenu;
  $('fullscreen').onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      canvas.focus();
    } catch {
      $('hint').textContent = 'Fullscreen is unavailable in this browser. The game still fills the window.';
    }
  };
  document.addEventListener('fullscreenchange', () => {
    $('fullscreen').textContent = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen ↗';
  });
  $('playAgain').onclick = showMenu;
  function platforms() {
    if(challenge) return challenge.solids();
    if (level < 2) {
      let left = 0; const result = [];
      for (const [a,b] of levels[level].gaps) { result.push({x:left,y:GROUND,w:a-left,h:540-GROUND}); left=b; }
      result.push({x:left,y:GROUND,w:960-left,h:540-GROUND});
      if(wallTime>0) result.push({x:685,y:210,w:22,h:200,wall:true});
      return result;
    }
    if(level === 4) return [{x:0,y:GROUND,w:160,h:540-GROUND},...hiddenPaths()];
    const result=pillars.map(([a,b],i)=>({x:a,y:pillarY(i)+((level===2 && i===4 || level===3 && i===5)?drop:0),w:b-a,h:level===3 && drop>=lowerDrop ? 24 : 540-pillarY(i)}));
    if(level===3 && drop>=lowerDrop) result.push({x:0,y:470,w:960,h:70,path:true});
    if(level===3 && trap) result.push({x:spikeX,y:pillarY(5),w:150,h:24,spikes:true});
    return result;
  }
  function die() {
    if(phase!=='playing') return;
    falls++; $('deaths').textContent = 'FALLS '+String(falls).padStart(2,'0');
    phase='falling';phaseTime=.3;
  }
  function update(dt) {
    time += dt;
    if (phase !== 'playing') {
      phaseTime -= dt;
      if (phase === 'falling' && phaseTime <= 0) startLevel(level);
      if (phase === 'next' && phaseTime <= 0) startLevel(level+1);
      return;
    }
    wallTime=Math.max(0,wallTime-dt);
    jumpBuffer=Math.max(0,jumpBuffer-dt);
    coyote=player.grounded ? .09 : Math.max(0,coyote-dt);
    const dir=Number(keys.has('d')||keys.has('ArrowRight'))-Number(keys.has('a')||keys.has('ArrowLeft'));
    player.vx=dir*SPEED;
    if(jumpBuffer>0 && coyote>0){player.vy=level>=2 ? -600 : JUMP;player.grounded=false;coyote=0;jumpBuffer=0;}
    const oldX=player.x;
    if(level===1 && !wallUsed && player.x<590 && player.x+player.vx*dt>=590){
      wallUsed=true;wallTime=1.35;$('hint').textContent='Trust issues. One wall per attempt. Falling resets it.';
    }
    if(level===2 && !trap && !player.grounded && dir>0 && player.x>=pillars[3][1]+10){
      trap=true;$('hint').textContent='That step had other plans.';
    }
    if(level===3 && !trap && !player.grounded && dir>0 && player.x>=pillars[4][1]){
      trap=true;$('hint').textContent='Maybe aim lower.';
    }
    if(trap && level===2) {
      const previousDrop = drop;
      dropElapsed += dt;
      // Start returning 1.5 seconds after activation; keep the trap spent.
      drop = dropElapsed <= 1.5 ? Math.min(340, dropElapsed * 850) : Math.max(0, 340 - (dropElapsed - 1.5) * 850);
      const top = pillarY(4) + drop;
      if(drop < previousDrop && player.vy>=0 && player.x + RADIUS > pillars[4][0] && player.x - RADIUS < pillars[4][1]
        && player.y + RADIUS >= top && player.y + RADIUS <= pillarY(4) + previousDrop + .01) {
        player.y = top - RADIUS; player.vy = 0; player.grounded = true;
      }
    }
    if(trap && level===3){drop=Math.min(lowerDrop,drop+700*dt);spikeX=Math.max(810,spikeX-1000*dt);}
    if(level===4){
      for(let i=1;i<pillars.length;i++){
        if(!player.grounded && player.x+RADIUS>=pillars[i][0]-35 && player.x-RADIUS<=pillars[i][1]+35) faded[i]=Math.min(1,faded[i]+dt*5);
      }
    }
    let displacedBySolid=false;
    if(challenge) {
      const previous=challenge.solids().map(body=>({...body}));
      const previousPlayer={x:player.x,y:player.y};
      challenge.before(dt,player,dir);
      let carried=false;
      for(const p of challenge.solids()) {
        const old=previous.find(s=>s.id && s.id===p.id);
        if(!old || p.h<=0 || p.w<=0) continue;
        const dx=p.x-old.x,dy=p.y-old.y;
        // Carry a rider once, even if the ball straddles two platform segments.
        if(!carried && (player.grounded || player.vy<0) && Math.abs(previousPlayer.y+RADIUS-old.y)<.1 && previousPlayer.x+RADIUS>old.x && previousPlayer.x-RADIUS<old.x+old.w){
          player.x+=player.grounded?dx:0;player.y+=player.grounded?dy:Math.min(0,dy);carried=true;
          displacedBySolid ||= dx!==0 || dy!==0;
        }
        // Test the side occupied before the solid moved, then push to its new face.
        if(player.y+RADIUS>p.y+(player.grounded?2:.01) && player.y-RADIUS<p.y+p.h-.01){
          if(previousPlayer.x+RADIUS<=old.x+.01 && player.x+RADIUS>p.x && player.x-RADIUS<p.x+p.w){player.x=p.x-RADIUS;displacedBySolid=true;}
          else if(previousPlayer.x-RADIUS>=old.x+old.w-.01 && player.x-RADIUS<p.x+p.w && player.x+RADIUS>p.x){player.x=p.x+p.w+RADIUS;displacedBySolid=true;}
        }
        if(player.x+RADIUS>p.x && player.x-RADIUS<p.x+p.w){
          if(player.vy>=0 && p.y<old.y && player.y+RADIUS>=p.y && player.y+RADIUS<=old.y+.01){player.y=p.y-RADIUS;player.vy=0;player.grounded=true;displacedBySolid=true;}
          else if(p.y+p.h>old.y+old.h && previousPlayer.y-RADIUS>=old.y+old.h-.01 && player.y-RADIUS<p.y+p.h){player.y=p.y+p.h+RADIUS;player.vy=Math.max(0,player.vy);displacedBySolid=true;}
        }
      }
    }
    const solids=platforms();
    // Player input starts from the position AFTER moving solids have displaced the ball.
    const moveStartX=player.x;
    // Resolve movement on each axis against the full platform rectangles.
    player.x=Math.max(RADIUS,Math.min(960-RADIUS,player.x+player.vx*dt));
    for(const p of solids){
      // Tiny height changes are the seams of the tilting platforms, not walls.
      if(player.grounded && player.x+RADIUS>p.x && player.x-RADIUS<p.x+p.w && player.y+RADIUS>p.y && player.y+RADIUS-p.y<=2)player.y=p.y-RADIUS;
      if(player.y+RADIUS>p.y+.01 && player.y-RADIUS<p.y+p.h-.01 && player.x+RADIUS>p.x && player.x-RADIUS<p.x+p.w){
        if(moveStartX+RADIUS<=p.x+.01) player.x=p.x-RADIUS;
        else if(moveStartX-RADIUS>=p.x+p.w-.01) player.x=p.x+p.w+RADIUS;
        else if(displacedBySolid) continue;
        else player.x=moveStartX<p.x+p.w/2?p.x-RADIUS:p.x+p.w+RADIUS;
        player.vx=0;
      }
    }
    const oldY=player.y;
    player.vy+=GRAVITY*dt;player.y+=player.vy*dt;player.grounded=false;
    for(const p of solids){
      if(player.x+RADIUS<=p.x || player.x-RADIUS>=p.x+p.w) continue;
      if(player.vy>=0 && oldY+RADIUS<=p.y+.01 && player.y+RADIUS>=p.y){
        player.y=p.y-RADIUS;player.vy=0;player.grounded=true;
      }else if(player.vy<0 && oldY-RADIUS>=p.y+p.h-.01 && player.y-RADIUS<=p.y+p.h){
        player.y=p.y+p.h+RADIUS;player.vy=0;
      }
    }
    // A solid cannot squeeze the ball through another solid or the screen boundary.
    if(displacedBySolid){
      player.x=Math.max(RADIUS,Math.min(960-RADIUS,player.x));
      for(const p of solids)if(p.h>0 && p.w>0 && player.x+RADIUS>p.x+.01 && player.x-RADIUS<p.x+p.w-.01 && player.y+RADIUS>p.y+.01 && player.y-RADIUS<p.y+p.h-.01){die();break;}
    }
    // Spikes occupy the triangular cap, including contact before platform landing.
    for(const p of solids) if(p.spikes && player.x+RADIUS>p.x+3 && player.x-RADIUS<p.x+p.w-3 && player.y+RADIUS>p.y-15 && player.y-RADIUS<p.y+3) die();
    if(level===4 && player.grounded){
      for(const p of hiddenPaths()) {
        if(Math.abs(player.y+RADIUS-p.y)>.1) continue;
        const left=Math.max(p.x,player.x-RADIUS),right=Math.min(p.x+p.w,player.x+RADIUS);
        for(let x=Math.floor(left);x<Math.ceil(right);x++) if(x>=p.x && x<p.x+p.w) revealed.add(x);
      }
    }
    if(challenge){
      challenge.after(player);
      if(challenge.message){$('hint').textContent=challenge.message;challenge.message=null;}
      for(const h of challenge.hazards()){
        const nx=Math.max(h.x,Math.min(player.x,h.x+h.w)),ny=Math.max(h.y,Math.min(player.y,h.y+h.h));
        if(Math.hypot(player.x-nx,player.y-ny)<RADIUS)die();
      }
      if(challenge.failed())die();
    }
    player.angle+=(player.x-oldX)/RADIUS;
    if(player.y>585) die();
    const orb=orbPosition();
    if(phase==='playing' && ((Math.hypot(player.x-orb.x,player.y-orb.y)<RADIUS+18 && (!challenge || challenge.contactOrb())) || (challenge && challenge.finished(player)))){
      completed.add(level);
      try { localStorage.setItem('just-roll-completed',JSON.stringify([...completed])); } catch { /* Completion still counts for this session. */ }
      if(level<levels.length-1){phase='next';phaseTime=.65;$('hint').textContent='On to the next one.';}
      else{phase='won';$('overlay').hidden=false;$('result').textContent='15 levels. '+falls+' falls. A slightly less trusting person.';}
    }
  }
  function orbPosition(){if(challenge)return challenge.orb();return {x:level<2?868:level===4?930:870,y:(level<2?367:pillarY(5)-43)+(level===3?drop:0)+Math.sin(time*2.4)*5};}
  function circle(x,y,r,color) { ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); }
  function draw() {
    ctx.clearRect(0,0,960,540); ctx.fillStyle = '#181f1c'; ctx.fillRect(0,0,960,540);
    ctx.fillStyle = '#2b352d';
    for(let x=24;x<960;x+=32) for(let y=26;y<540;y+=32) ctx.fillRect(x,y,1,1);
    ctx.font='10px monospace';ctx.fillStyle='#647563';ctx.fillText('START',59,453);
    function block(p,alpha=1){
      ctx.globalAlpha=alpha;ctx.fillStyle=p.path?'#285555':'#303e2e';ctx.fillRect(p.x,p.y,p.w,p.h);
      ctx.fillStyle=p.path?'#7ad8ce':'#a4bf81';ctx.fillRect(p.x,p.y,p.w,3);
      ctx.fillStyle='#405039';ctx.fillRect(p.x,p.y+3,p.w,9);
      ctx.strokeStyle='#3a4933';ctx.lineWidth=1;
      for(let x=p.x+18;x<p.x+p.w-10;x+=29){ctx.beginPath();ctx.moveTo(x,p.y+26);ctx.lineTo(Math.min(x+12,p.x+p.w),p.y+38);ctx.stroke();}
      ctx.globalAlpha=1;
    }
    for(const p of platforms()){
      if(p.hidden || p.wall) continue;
      block(p,p.alpha ?? 1);
      if(p.spikes){ctx.fillStyle='#ef9477';for(let x=p.x;x<p.x+p.w;x+=15){ctx.beginPath();ctx.moveTo(x,p.y);ctx.lineTo(x+7.5,p.y-15);ctx.lineTo(x+15,p.y);ctx.fill();}}
    }
    if(level===4){
      for(let i=1;i<pillars.length;i++){const [a,b]=pillars[i];block({x:a,y:pillarY(i),w:b-a,h:540-pillarY(i)},1-faded[i]);}
      for(const p of hiddenPaths()) {
        ctx.fillStyle='rgba(80,170,173,.38)';
        for(let x=p.x;x<p.x+p.w;x++) if(revealed.has(x)) ctx.fillRect(x,p.y,1,24);
        ctx.fillStyle='rgba(142,227,215,.55)';
        for(let x=p.x;x<p.x+p.w;x++) if(revealed.has(x)) ctx.fillRect(x,p.y,1,2);
      }
    }
    if(wallTime>0){
      ctx.shadowColor='#ef9477';ctx.shadowBlur=16;ctx.fillStyle='#dc866c';ctx.fillRect(685,210,22,200);ctx.shadowBlur=0;
      ctx.fillStyle='#ffb59a';ctx.fillRect(685,210,3,200);
      ctx.save();ctx.beginPath();ctx.rect(685,210,22,200);ctx.clip();ctx.strokeStyle='#a85443';ctx.lineWidth=5;
      for(let y=210;y<440;y+=22){ctx.beginPath();ctx.moveTo(685,y);ctx.lineTo(707,y-22);ctx.stroke();}ctx.restore();
      ctx.font='bold 18px monospace';ctx.fillStyle='#efaa90';ctx.fillText('!',692,194);
    }
    if(challenge)challenge.draw(ctx);
    const {x:ox,y:oy,active=true}=orbPosition();ctx.globalAlpha=active ? 1 : .2;const glow=ctx.createRadialGradient(ox,oy,0,ox,oy,57);glow.addColorStop(0,'#58c8ff44');glow.addColorStop(1,'#58c8ff00');ctx.fillStyle=glow;ctx.fillRect(ox-57,oy-57,114,114);
    ctx.strokeStyle='#67ceff40';ctx.lineWidth=1;ctx.beginPath();ctx.arc(ox,oy,26+Math.sin(time*2)*2,0,Math.PI*2);ctx.stroke();
    circle(ox,oy,16,'#69cfff');circle(ox-5,oy-5,5,'#bef0ff');ctx.globalAlpha=1;
    if(phase!=='falling'){
      ctx.save();ctx.translate(player.x,player.y);ctx.rotate(player.angle);ctx.shadowColor='#d6f68a33';ctx.shadowBlur=12;circle(0,0,RADIUS,'#d6f68a');ctx.shadowBlur=0;
      ctx.strokeStyle='#819951';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,10,-1.2,1.2);ctx.stroke();circle(-5,-6,3,'#f1ffd2');ctx.restore();
    }
    if(phase==='next'){ctx.fillStyle='#d6f68a';ctx.font='500 20px sans-serif';ctx.textAlign='center';ctx.fillText('Nice. Next level →',480,220);ctx.textAlign='left';}
  }
  let last = 0, accumulator = 0;
  function frame(now) {
    if(last) accumulator += Math.min((now-last)/1000,0.05);last=now;
    while(accumulator>=1/120){update(1/120);accumulator-=1/120;}
    draw();requestAnimationFrame(frame);
  }
  startLevel(0);showMenu();requestAnimationFrame(frame);
})();

