/* Deterministic challenge state. Recreated on every attempt. */
class Challenge {
  constructor(level) { this.level=level; this.t=0; this.triggered=false; this.retreat=false; this.age=0; this.timers=[-1,-1,-1]; this.mode=0; this.landed=new Set(); this.sink=[0,0,0]; this.fall=[-1,-1,-1]; this.shelf=300; this.riding=false; this.gateTime=0; this.spent=false; this.contacts={}; this.wallAge=-1; this.splitAge=-1; this.escapeAge=-1; this.lastSupport=null; this.finalDrop=-1; this.stoneLanded=false; this.dropRoute=false; this.wrongWay=false; this.boss=null; }
  clock(id) { return this.contacts[id] ?? -1; }
  spikeRows() {
    if(this.level===6) return [220,480].flatMap((edge,i)=>[
      {x:edge-44,w:38,t:this.timers[i],start:0,end:.48},
      ...(i>=1?[{x:edge+25,w:28,t:this.timers[i],start:.42,end:.72}]:[]),
      ...(i===2?[{x:edge+73,w:36,t:this.timers[i],start:.7,end:1.05}]:[])
    ]);
    if(this.level===8 && this.mode===2) return [{x:613,w:42,t:this.clock('return2'),start:0,end:.48}];
    if(this.level===9 && !this.boss) return [{x:698,w:38,t:this.clock('escape'),start:0,end:.62}];
    return [];
  }
  spikeDepth(row) {
    if(row.t<row.start+.12 || row.t>row.end+.12)return 0;
    return 110*Math.min(1,(row.t-row.start-.12)/.09,(row.end+.12-row.t)/.12);
  }
  rect(x,y,w,h=24,extra={}) { return {x,y,w,h,...extra}; }
  solids() {
    const r=(...a)=>this.rect(...a);
    if(this.boss){
      const b=this.boss;
      const floor=b.round===2 && b.hp>0 ? [[0,300],[300,420],[420,540],[540,660],[660,960]].flatMap(([x,end],i)=>{
        const collapse=this.bossGaps().find(g=>g.x===x);
        return collapse && b.age>=collapse.start && b.age<6 ? [] : [r(x,465,end-x,75,{id:'arena'+i})];
      }) : [r(0,465,960,75,{id:'arena'})];
      return [...floor,r(0,0,12,465),r(948,0,12,465)];
    }
    if(this.level===5) {
      const tilt=Math.max(0,this.clock('tilt')),split=Math.min(48,Math.max(0,this.splitAge)*55);
      return [r(0,410+(this.retreat?this.age*750:0),220,130,{id:'start'}),r(280+(this.triggered?Math.min(220,this.age*600):0),385,65,24,{id:'slide'}),...(this.triggered?[r(305,470,55,24,{path:true})]:[]),
        ...[0,1,2].map(i=>r(450+i*22-tilt*38,420+tilt*(18+i*10),22,24,{id:'tilt'+i,contact:'tilt'})),
        ...(!this.dropRoute?[r(585,380,65,24,{id:'pause'})]:[]),r(720,350,65),
        ...(this.wallAge>=0?[r(720,350-Math.min(190,this.wallAge*1900),18,Math.min(190,this.wallAge*1900))]:[]),
        ...(this.dropRoute?[r(648,470,150,24,{path:true,id:'lower'}),r(800,420,52,24,{path:true})]:[]),
        r(850,350,55-split),r(905+split,350,55-split)];
    }
    if(this.level===6) {
      const spans=[[0,220],[320,480],[580,740],[840,960]];
      return spans.map(([a,b],i)=>r(a,410+(i<3 && this.timers[i]>[1.25,1.35,1.5][i]?(this.timers[i]-[1.25,1.35,1.5][i])*800:0),b-a,130,{id:'floor'+i})).concat([r(120,215,720,30)]);
    }
    if(this.level===7) return [r(0,410,200,130),...[290,470,650].map((x,i)=>{
      const a=this.fall[i];const offset=a<0?0:a<.32?a*900:a<1.85?288:Math.max(0,288-(a-1.85)*900);
      const narrow=i===2?Math.min(26,Math.max(0,this.clock('borrow2'))*24):0;
      return r(x+(i===1 && a>=0?18*Math.min(1,a):0)+narrow,[385,360,315][i]+offset+this.sink[i],90-narrow*2,24,{id:'borrow'+i,index:i});
    }),r(830,285+Math.max(0,this.finalDrop)*800,45,255),r(875,285,85,255)];
    if(this.level===8) return [r(0,410,160,130),...[240,400,560,720].map((x,i)=>{
      const age=this.clock('return'+i);
      const dx=this.mode===0 && i===2?Math.sin(this.t*1.8)*12:this.mode===2?(i%2?15:-15)-(i===1?Math.max(0,age)*24:0):0;
      const dy=this.mode===1?Math.max(0,this.age-(1.2+(3-i)*.9))*850:this.mode===2?(i%2?-30:0)+Math.max(0,age-1.05)*700:this.mode===0 && i===1?Math.max(0,age-1.25)*500:0;
      return r(x+dx,410+dy,80,24,{id:'return'+i});
    }),r(880,410+(this.mode===2?Math.min(85,Math.max(0,this.finalDrop)*150):0),80,130),...(this.mode===2?[r(590,215,85,30)]:[])];
    const escape=Math.max(0,this.clock('escape')),back=Math.max(0,this.clock('back'));
    return [r(0,410,200,130),r(280,380+(this.triggered?Math.min(500,this.age*850):0),70),...(this.triggered?[r(this.shelf,465,55,24,{id:'shelf',path:true})]:[]),...(this.retreat?[r(205,240,18,300)]:[]),...(this.riding && this.shelf<465?[r(300,310,160,26)]:[]),r(530,465,45,75,{spikes:true}),
      r(600,410+escape*19,64,24,{id:'escape'}),r(718-Math.min(35,back*50),365,52,24,{id:'back'}),
      r(785,310+(this.spent?this.age*700:Math.max(0,this.clock('upper')-.95)*650),50,24,{id:'upper'}),
      r(860,300+(this.spent?this.age*650:0),100,180),r(680,190,90,26),
      ...(this.spent?[r(806,400,44,24,{id:'stone',path:true})]:[])];
  }

  hazards() {
    if(this.boss)return this.bossHazards();
    const hazards=this.spikeRows().filter(row=>this.spikeDepth(row)>0).map(row=>this.rect(row.x,this.level===9?216:245,row.w,this.spikeDepth(row),{danger:true}));
    if(this.level===6 && this.clock('floor2')>.65){const floor=this.solids().find(s=>s.id==='floor2');hazards.push(this.rect(590,floor.y-19,150,19,{groundSpikes:true}));}
    return hazards;
  }

  before(dt,p,dir) {
    this.t+=dt;
    if(this.boss){this.bossBefore(dt,p);return;}
    for(const id of Object.keys(this.contacts))this.contacts[id]+=dt;
    if(this.wallAge>=0)this.wallAge+=dt;
    if(this.splitAge>=0)this.splitAge+=dt;
    if(this.finalDrop>=0)this.finalDrop+=dt;
    if(this.level===5){
      if(this.wallAge<0 && this.lastSupport==='pause' && !p.grounded){this.wallAge=0;this.dropRoute=true;this.message='The way out is down.';}
      if(this.dropRoute && p.x<585)this.wrongWay=true;
      if(this.splitAge<0 && p.x>795)this.splitAge=0;
    }
    if(this.level===7 && this.finalDrop<0 && p.x>760)this.finalDrop=0;
    if(this.level===8 && this.mode===2 && this.finalDrop<0 && p.x>800)this.finalDrop=0;
    if(this.triggered || this.mode===1 || this.spent) this.age+=dt;
    if(this.level===5 || this.level===9){
      if(!this.triggered && p.x>185 && !p.grounded && dir>0){this.triggered=true;this.age=0;}
      if(this.triggered && dir<0 && !this.retreat){this.retreat=true;}
    }
    if(this.level===6) for(let i=0;i<3;i++) {
      if(this.timers[i]<0 && p.x>=[220,480,740][i]-85) this.timers[i]=0;
      if(this.timers[i]>=0)this.timers[i]+=dt;
    }
    if(this.level===7){
      if(!this.triggered && p.x>=170){this.triggered=true;this.fall[0]=0;}
      for(let i=0;i<3;i++){if(this.fall[i]>=0)this.fall[i]+=dt;if(this.landed.has(i))this.sink[i]+=(20+Math.max(0,this.clock('borrow'+i))*32)*dt;}
    }
    if(this.level===9){if(this.riding && !this.spent)this.shelf=Math.min(545,this.shelf+105*dt);if(this.spent)this.gateTime-=dt;}
  }
  after(p) {
    if(this.boss){this.bossAfter(p);return;}
    if(this.level===9 && this.spent && this.gateTime>0 && Math.hypot(p.x-770,p.y-300)<30){this.enterBoss(p);return;}
    if(p.grounded)for(const s of this.solids())if(s.id && Math.abs(p.y+16-s.y)<.1 && p.x+16>s.x && p.x-16<s.x+s.w){
      this.lastSupport=s.id;const id=s.contact || s.id;if(this.contacts[id]===undefined)this.contacts[id]=0;
      if(s.id==='stone')this.stoneLanded=true;
    }
    if(this.level===7 && p.grounded) for(const s of this.solids()) if(s.index!==undefined && Math.abs(p.y+16-s.y)<.1 && p.x+16>s.x && p.x-16<s.x+s.w && !this.landed.has(s.index)){
      this.landed.add(s.index);if(s.index<2)this.fall[s.index+1]=0;
    }
    if(this.level===8 && this.mode===1 && Math.hypot(p.x-70,p.y-378)<34){this.mode=2;this.age=0;this.contacts={};}
    if(this.level===9 && p.grounded && Math.abs(p.y+16-465)<.1 && p.x+16>this.shelf && p.x-16<this.shelf+55)this.riding=true;
  }
  orb() {
    if(this.boss)return {x:915,y:422,active:this.boss.hp===0};
    const positions={5:[915,307],6:[915,367],7:[915,242],8:[920,367],9:[890,244]};
    const [x,y]=positions[this.level];return {x,y,active:this.level!==8 || this.mode!==1};
  }
  contactOrb() {
    if(this.boss)return this.boss.hp===0;
    if(this.level===8){if(this.mode===0){this.mode=1;this.age=0;return false;}return this.mode===2;}
    if(this.level===9){if(!this.spent){this.spent=true;this.gateTime=2.8;this.age=0;}return false;}
    return true;
  }
  finished() { return false; }
  failed() { return this.wrongWay || (this.level===9 && !this.boss && this.spent && this.gateTime<=0); }
  enterBoss(p) {
    this.boss={age:0,hp:3,round:0,target:null};this.message='Dodge the lit floor. Jump the wave. Strike the exposed core.';
    p.x=90;p.y=449;p.vx=0;p.vy=0;p.grounded=true;
  }
  bossBefore(dt,p) {
    const b=this.boss;if(b.hp===0)return;
    b.age+=dt;
    if(b.age>=(b.round===1?4:3.9) && b.target===null)b.target=Math.max(70,Math.min(890,p.x));
    if(b.age>10.3){b.age=0;b.target=null;}
  }
  bossAfter(p) {
    const b=this.boss;
    if(b.hp>0 && b.age>=7 && Math.hypot(p.x-480,p.y-395)<45){
      b.hp--;b.round++;this.message=b.hp===2?'WAVE 2: jump the low shots, stay under the high shots, dodge the marked strikes.':b.hp===1?'WAVE 3: the floor is breaking. Cross the gaps and jump the low laser.':'The Gatekeeper is down. Reach the blue orb.';b.age=0;b.target=null;p.vy=-420;p.grounded=false;
    }
  }
  bossZones() {
    const b=this.boss;if(!b || b.hp===0 || b.round!==0)return [];
    const reverse=b.round%2===1;
    const edges=[{x:20,w:310},{x:630,w:310}],middle=[{x:345,w:270}];
    return [...(reverse?middle:edges).map(p=>({...p,start:1,end:2.4})),...(reverse?edges:middle).map(p=>({...p,start:2.5,end:3.9}))];
  }
  bossGaps() { return [{x:300,w:120,start:1.5},{x:540,w:120,start:2.5},{x:420,w:120,start:3.5}]; }
  bossMeteors() {
    const b=this.boss;if(b.round!==1 || b.target===null)return [];
    return [-120,0,120].map((offset,i)=>({x:Math.max(45,Math.min(915,b.target+offset)),start:4.7+i*.45}));
  }
  bossHazards() {
    const b=this.boss;if(b.hp===0)return [];
    if(b.round===1){
      const hazards=[];
      if(b.age>=1.3 && b.age<3.1)hazards.push(this.rect(-40+(b.age-1.3)*600,439,30,26,{projectile:true}));
      if(b.age>=3 && b.age<4.8)hazards.push(this.rect(980-(b.age-3)*600,363,30,26,{projectile:true}));
      for(const m of this.bossMeteors())if(b.age>=m.start && b.age<m.start+.65)hazards.push(this.rect(m.x-18,65+(b.age-m.start)*720,36,42,{bolt:true}));
      return hazards;
    }
    if(b.round===2){
      const hazards=[];
      if(b.age>=2 && b.age<4.6)hazards.push(this.rect(100+(b.age-2)*200,155,18,275,{laser:true}));
      if(b.age>=4.8 && b.age<6.8)hazards.push(this.rect(980-(b.age-4.8)*500,434,28,31,{laser:true}));
      return hazards;
    }
    const hazards=this.bossZones().filter(z=>b.age>=z.start+.65 && b.age<z.end).map(z=>this.rect(z.x,430,z.w,35,{groundSpikes:true}));
    if(b.target!==null && b.age>=4.6 && b.age<5.25)hazards.push(this.rect(b.target-17,65+(b.age-4.6)*720,34,42,{bolt:true}));
    if(b.age>=4.95 && b.age<6.65){const x=b.round%2? -40+(b.age-4.95)*610:980-(b.age-4.95)*610;hazards.push(this.rect(x,434,24,31,{wave:true}));}
    return hazards;
  }
  drawBoss(ctx) {
    const b=this.boss;
    ctx.fillStyle='#121724';ctx.fillRect(12,50,936,370);
    ctx.strokeStyle='#303954';ctx.lineWidth=1;
    for(let x=30;x<960;x+=45){ctx.beginPath();ctx.moveTo(x,60);ctx.lineTo(x,415);ctx.stroke();}
    ctx.font='bold 20px monospace';ctx.textAlign='center';ctx.fillStyle='#f4a38b';ctx.fillText(b.hp?['WAVE 1 — THE GATEKEEPER','WAVE 2 — CROSSFIRE','WAVE 3 — COLLAPSE'][b.round]:'GATEKEEPER DEFEATED',480,88);
    for(let i=0;i<3;i++){ctx.fillStyle=i<b.hp?'#ed8e82':'#364250';ctx.fillRect(414+i*46,102,38,7);}
    ctx.font='12px monospace';ctx.fillStyle='#ccd8dd';ctx.fillText(b.hp?(b.age>=7?'CORE EXPOSED — JUMP INTO IT':['DODGE THE WARNINGS. WAIT FOR THE CORE.','LOW SHOT: JUMP. HIGH SHOT: STAY DOWN.','WATCH THE CRACKS. CROSS BEFORE THE FLOOR GOES.'][b.round]):'REACH THE BLUE ORB →',480,132);
    const exposed=b.hp>0 && b.age>=7,cy=exposed?395:205;
    ctx.strokeStyle=exposed?'#d6f68a':'#ee876f';ctx.lineWidth=3;ctx.beginPath();ctx.arc(480,cy,29,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle=exposed?'#d6f68a':'#904b66';ctx.beginPath();ctx.arc(480,cy,20,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#121724';ctx.fillRect(468,cy-5,7,7);ctx.fillRect(485,cy-5,7,7);
    for(const z of this.bossZones())if(b.age>=z.start && b.age<z.start+.65){ctx.fillStyle='#ffd277';ctx.globalAlpha=.35+.4*Math.abs(Math.sin(b.age*22));ctx.fillRect(z.x,458,z.w,7);ctx.globalAlpha=1;}
    if(b.round===0 && b.target!==null && b.age>=3.9 && b.age<4.6){ctx.strokeStyle='#ffd277';ctx.setLineDash([5,7]);ctx.beginPath();ctx.moveTo(b.target,160);ctx.lineTo(b.target,465);ctx.stroke();ctx.setLineDash([]);}
    if(b.round===0 && b.hp>0 && b.age>=4.35 && b.age<4.95){ctx.fillStyle='#bf91ff';ctx.font='16px monospace';ctx.fillText(b.round%2?'WAVE →':'← WAVE',b.round%2?85:875,440);}
    if(b.hp>0 && b.round===1){
      ctx.fillStyle='#84e2f0';ctx.font='14px monospace';
      if(b.age>=.6 && b.age<1.3)ctx.fillText('LOW SHOT →',90,427);
      if(b.age>=2.3 && b.age<3)ctx.fillText('← HIGH SHOT',865,353);
      for(const m of this.bossMeteors())if(b.age>=m.start-.7 && b.age<m.start){ctx.strokeStyle='#ffd277';ctx.setLineDash([5,7]);ctx.beginPath();ctx.moveTo(m.x,150);ctx.lineTo(m.x,465);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#ffd277';ctx.fillRect(m.x-18,458,36,7);}
    }
    if(b.hp>0 && b.round===2){
      for(const gap of this.bossGaps())if(b.age>=gap.start-.7 && b.age<gap.start){ctx.fillStyle='#ffa575';ctx.fillRect(gap.x,460,gap.w,5);ctx.strokeStyle='#fbc694';ctx.beginPath();ctx.moveTo(gap.x+12,475);ctx.lineTo(gap.x+45,495);ctx.lineTo(gap.x+90,470);ctx.stroke();}
      ctx.fillStyle='#ff8dc6';ctx.font='14px monospace';
      if(b.age>=1.3 && b.age<2)ctx.fillText('SCANNER →',125,180);
      if(b.age>=4.1 && b.age<4.8)ctx.fillText('← LOW LASER',860,425);
    }
    for(const h of this.bossHazards()){
      if(h.groundSpikes)this.drawGroundSpikes(ctx,h);
      else{ctx.fillStyle=h.laser?'#ff8dc6':h.projectile?'#84e2f0':h.wave?'#bf91ff':'#ffba70';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=14;ctx.fillRect(h.x,h.y,h.w,h.h);ctx.shadowBlur=0;}
    }
    ctx.textAlign='left';
  }
  drawGroundSpikes(ctx,h) {
    ctx.fillStyle='#ee876f';for(let x=h.x;x<h.x+h.w;x+=12){ctx.beginPath();ctx.moveTo(x,h.y+h.h);ctx.lineTo(x+6,h.y);ctx.lineTo(Math.min(x+12,h.x+h.w),h.y+h.h);ctx.fill();}
  }
  draw(ctx) {
    if(this.boss){this.drawBoss(ctx);return;}
    if(this.level===5 && this.dropRoute){ctx.fillStyle='#ed8b76';for(let y=190;y<530;y+=18){ctx.beginPath();ctx.moveTo(574,y);ctx.lineTo(585,y+9);ctx.lineTo(574,y+18);ctx.fill();}}
    if(this.level===6){
      const age=this.clock('floor2');if(age>=0 && age<=.65){ctx.fillStyle='#ffd277';ctx.fillRect(590,405,150,5);}
      for(const h of this.hazards())if(h.groundSpikes)this.drawGroundSpikes(ctx,h);
    }
    for(const row of this.spikeRows()){
      const roof=this.level===9?216:245,depth=this.spikeDepth(row);
      ctx.fillStyle=row.t>=row.start && row.t<row.start+.12?'#f8cd76':'#66746a';ctx.fillRect(row.x,roof-5,row.w,5);
      ctx.fillStyle='#ee876f';
      for(let x=row.x;x<row.x+row.w;x+=10){ctx.beginPath();ctx.moveTo(x,roof);ctx.lineTo(x+5,roof+depth);ctx.lineTo(Math.min(x+10,row.x+row.w),roof);ctx.fill();}
    }
    ctx.font='11px monospace';ctx.textAlign='center';
    if(this.level===6) [220,480,740].forEach((x,i)=>{ctx.fillStyle=this.timers[i]<0?'#647563':'#ee876f';ctx.fillText(this.timers[i]<0?'…':Math.max(0,[1.25,1.35,1.5][i]-this.timers[i]).toFixed(1),x-45,440);});
    if(this.level===7) for(const p of this.solids())if(p.index!==undefined && this.landed.has(p.index)){ctx.strokeStyle='#ef9477';ctx.beginPath();ctx.moveTo(p.x+12,p.y+3);ctx.lineTo(p.x+35,p.y+16);ctx.lineTo(p.x+52,p.y+7);ctx.stroke();}
    if(this.level===8){ctx.fillStyle=this.mode===1?'#d6f68a':'#536255';ctx.fillRect(55,366,30,28);ctx.fillText(this.mode===1?'SWITCH ON':'SWITCH',70,350);ctx.fillStyle='#d6f68a';ctx.fillText(['OUTBOUND →','← RETURN TO SWITCH','FINAL CROSSING →'][this.mode],480,100);}
    if(this.level===9){ctx.strokeStyle=this.spent?'#d6f68a':'#536255';ctx.lineWidth=3;ctx.strokeRect(748,273,44,63);ctx.fillStyle='#d6f68a';ctx.fillText(this.spent?'GATE '+Math.max(0,this.gateTime).toFixed(1):'SEALED',770,260);}
    ctx.textAlign='left';
  }
}

