/* Levels 11–15. Each stage advances on an approach, reversal or landing. */
class AftermathChallenge {
  constructor(level){this.level=level;this.stage=0;this.age=0;this.t=0;this.lastSupport=null;this.dead=false;this.message=null;this.finishAge=-1;this.pusher=580;this.leftPusher=200;this.slide=450;this.catchX=440;this.liftY=450;this.ceilY=220;this.smallDrop=0;this.smallReturning=false;this.spikeLift=-1;this.wallSpikeAge=-1;this.redSpikeAge=-1;this.redGapOpen=false;this.sideSpikeAge=-1;this.orbRise=0;this.routeY=410;this.routeReturning=false;this.ferryX=365;this.crusherX=620;this.exitTime=-1;this.decoyAge=0;}
  go(stage,message){this.stage=stage;this.age=0;this.message=message||null;}
  rect(x,y,w,h=24,extra={}){return {x,y,w,h,...extra};}
  risingWall(x,base,height,age,id,extra={}){
    const h=height*Math.max(0,Math.min(1,age/.08));
    return this.rect(x,base-h,18,h,{id,...extra});
  }
  solids(){
    const r=(...a)=>this.rect(...a),s=this.stage,a=this.age;
    if(this.level===10){
      const drop=s===4?(a<1.4?Math.min(350,4200*a*a):Math.max(0,350-(a-1.4)*550)):0;
      return [r(0,410,320,130,{id:'left'}),r(440,410+drop,240,130,{id:'right'}),r(680,410,280,130),
        ...(s===1?[this.risingWall(302,410,190,a,'rearBlock'),...(a<.45?[this.risingWall(440,410,190*Math.min(1,(.45-a)/.05),a,'frontBlock')]:[])]:[]),
        ...(s===2 || s===3?[r(this.pusher,410-(s===3?165-90*Math.min(1,a/.08):165*Math.min(1,a/.08)),22,s===3?165-90*Math.min(1,a/.08):165*Math.min(1,a/.08),{id:'pushRight',shove:true})]:[]),
        ...(s===3?[r(this.leftPusher,410-165*Math.min(1,a/.08),22,165*Math.min(1,a/.08),{id:'pushLeft',shove:true})]:[])];
    }
    if(this.level===11){
      // The red spike lifts out of the approach and leaves a much wider hole behind it.
      // The opening only exists after the jump trigger, so the safe route is still visible
      // during the first crossing.
      const rightStart=570;
      return [r(0,410,320,130),r(this.slide,400,100,24,{id:'original'}),r(this.slide+100,400+(s>=4?Math.min(400,a*700):0),50,24,{id:'breakEdge'}),
      ...(s>=1?[r(this.catchX,480,70,24,{id:'catch'})]:[]),...(this.spikeLift>=0?[r(550,400,130,24,{path:true})]:[]),r(rightStart,400,190-(rightStart-570),140),r(680,400,280,140),
      ...(s>=3?[r(450,this.ceilY,70,20,{id:'ceiling'})]:[]),
      ...(this.redGapOpen?[r(530,500,170,18,{id:'redDrop',path:true})]:[]),
      ...(this.finishAge>=0?[r(805+Math.min(95,this.finishAge*85),270,20,130,{id:'finishPush',shove:true})]:[])];
    }
    if(this.level===12)return [r(0,410+(s===2?Math.max(0,a-.12)*450:0),335,130,{id:'left'}),r(450,410+(s===3?a*70:0),70,130,{id:'right'}),r(570,410,190,130),
      r(830-(this.finishAge>=0?Math.min(60,this.finishAge*70):0),410,130,130,{id:'finish'}),
      ...(s===1?[r(335,220,20,190)]:[]),...(s>=3?[r(335,350,95,24,{id:'step'}),r(500,410,30,24,{id:'safeLip'}),r(530,280,24,130)]:[])];
    if(this.level===13){
      const leftDrop=s===2?a*160:s>=3?350:0;
      const mainDrop=s===1?Math.min(300,a*700):s===2?Math.max(0,300-a*750):0;
      return [r(0,410+leftDrop,320,130,{id:'left'}),r(450,410+mainDrop,120,24,{id:'main'}),
        ...(s>=3?[r(360,410,90,24,{id:'spikeFloor'})]:[]),
        ...(s>=3?[r(640,370+this.smallDrop,60,24,{id:'small'})]:[]),
        ...(s>=5?[r(570,this.routeY,280,24,{id:'route'})]:[]),r(850,410-this.orbRise,110,130,{id:'finish'})];
    }
    return [r(0,410,260,130),r(260,410+(s>0?Math.min(500,(this.t-(this.chainStart??this.t))*650):0),80,130),r(440,410+(s>0?Math.min(500,(this.t-(this.chainStart??this.t))*800):0),100,24),
      ...(s>=1 && s<4?[r(this.ferryX,485,60,24,{id:'ferry'}),r(this.crusherX,300,22,185,{id:'crusher',shove:true})]:[]),
      ...(s>=3?[r(285,405,50,24,{id:'reverseLedge'})]:[]),
      ...(s>=4?[r(410,this.liftY,55,24,{id:'finalLift'})]:[]),r(570,330,55,24,{id:'upperLedge'}),
      ...(s>=6?[r(650,460+(s===7?a*30:0),120,24,{id:'lowBridge',path:true}),r(700+Math.min(120,this.decoyAge*180),355,55,24)]:[]),
      ...(s>=7?[r(765,390,40,24,{id:'lastStep'}),r(600+Math.min(28,a*100),325,22,135,{id:'lastCrusher',shove:true})]:[]),
      r(850,320+(s>=8?a*800:0),110,130,{id:'falseFinish'}),
      ...(s>=8?[r(790,430,60,24,{id:'returnCatch',path:true})]:[])];
  }

  hazards(){
    const r=(...a)=>this.rect(...a);
    if(this.level===10 && this.finishAge>=0)return [r(this.finishSpikeX,394,24,16,{spikes:true})];
    if(this.level===11)return [r(615,355-(this.spikeLift>=0?Math.min(230,this.spikeLift*1150):0),20,185,{sideSpikes:true}),...(this.redSpikeAge>=.42?[r(508,394-Math.min(72,(this.redSpikeAge-.42)*900),26,16,{spikes:true})]:[])];
    if(this.level===12)return [...(this.wallSpikeAge>=.7?[r(506,394,24,16,{spikes:true})]:[]),...(this.sideSpikeAge>=.62?[r(420,394,24,16,{spikes:true})]:[])];
    if(this.level===13 && (this.stage===3 || this.stage===4))return [r(450,this.ceilY,120,20,{ceilingSpikes:true})];
    if(this.level===14)return [...(this.stage>=5?[r(405,215,70,22,{ceilingSpikes:true})]:[]),...(this.stage===6?[r(565,170+this.age*95,75,20,{ceilingSpikes:true})]:[])];
    return [];
  }
  before(dt,p,dir){
    this.t+=dt;this.age+=dt;if(this.finishAge>=0)this.finishAge+=dt;
    const s=this.stage;
    if(this.spikeLift>=0)this.spikeLift+=dt;
    if(this.wallSpikeAge>=0)this.wallSpikeAge+=dt;
    if(this.redSpikeAge>=0)this.redSpikeAge+=dt;
    if(this.sideSpikeAge>=0)this.sideSpikeAge+=dt;
    if(this.level===10){
      if(s===0 && !p.grounded && p.x>=336 && dir>0)this.go(1);
      if(s===2 || s===3)this.pusher=Math.max(440,this.pusher-dt*245);
      if(s===3)this.leftPusher=Math.min(298,this.leftPusher+dt*260);
      if(s===4 && this.age>2.1)this.go(5);
    }
    if(this.level===11){
      if(s===0 && !p.grounded && p.x>295 && dir>0)this.go(1);
      if(s===1 || s===2)this.slide=Math.min(660,this.slide+dt*650);
      if(s===2)this.catchX=Math.min(600,this.catchX+dt*110);
      if(s===2 && !p.grounded && this.lastSupport==='catch')this.go(3);
      if(this.stage>=3){this.slide=Math.max(450,this.slide-dt*750);this.ceilY=Math.min(345,this.ceilY+dt*150);}
      if(s>=4 && this.spikeLift<0 && !p.grounded && dir>0 && p.x>=525)this.spikeLift=0;
      if(s>=4 && this.redSpikeAge<0 && !p.grounded && dir>0 && p.x>=525){this.redSpikeAge=0;this.redGapOpen=true;this.message='The red spike moved. The floor did too.';}
      if(p.x>840 && this.finishAge<0)this.finishAge=0;
    }
    if(this.level===12){
      if(s===0 && p.x>295)this.go(1);
      if(s===1 && dir<0)this.go(2);
      if(s===3 && this.lastSupport==='step' && !p.grounded && dir>0)this.go(4);
      if(s>=3 && this.sideSpikeAge<0 && !p.grounded && dir>0 && p.x>470){this.sideSpikeAge=0;this.message='The wall stayed put. Something beside it did not.';}
      if(p.x>795 && this.finishAge<0)this.finishAge=0;
    }
    if(this.level===13){
      if(s===0 && !p.grounded && p.x>290 && dir>0)this.go(1);
      if(s===3)this.ceilY=Math.min(400,this.ceilY+dt*80);
      if(s===4)this.ceilY=Math.max(180,this.ceilY-dt*450);
      if(s>=4){if(!this.smallReturning){this.smallDrop=Math.min(150,this.smallDrop+110*dt);if(this.smallDrop>=125)this.smallReturning=true;}else this.smallDrop=Math.max(0,this.smallDrop-120*dt);}
      if(s>=5 && p.x>790 && !p.grounded && dir>0 && this.finishAge<0)this.finishAge=0;
      if(this.finishAge>=0){this.orbRise=Math.min(190,this.orbRise+1100*dt);if(!this.routeReturning){this.routeY=Math.min(505,this.routeY+45*dt);if(this.routeY>=505)this.routeReturning=true;}else this.routeY=Math.max(330,this.routeY-110*dt);}
    }
    if(this.level===14){
      if(s===0 && p.x>250 && !p.grounded){this.chainStart=this.t;this.go(1);}
      if(s===2){this.ferryX+=95*dt;this.crusherX=Math.max(490,this.crusherX-130*dt);}
      if(s===2 && !p.grounded && dir<0 && this.lastSupport==='ferry')this.go(3);
      if(s===3)this.crusherX=Math.max(490,this.crusherX-130*dt);
      if(s===5)this.liftY=Math.max(190,this.liftY-120*dt);
      if(s>=6)this.decoyAge+=dt;
      if(s>=8)this.exitTime-=dt;
    }
  }

  after(p){
    // Check the actual landing/movement position so the spike appears underfoot this frame.
    if(this.level===10 && this.finishAge<0 && p.grounded && p.x>=850 && p.x<=882){
      this.finishSpikeX=p.x-12;
      this.finishAge=0;
    }
    let support=null;
    if(p.grounded)for(const body of this.solids())if(body.id && Math.abs(p.y+16-body.y)<.15 && p.x+16>body.x && p.x-16<body.x+body.w)support=body.id;
    const s=this.stage;
    if(this.level===10){
      if(s===1 && support==='right')this.go(2);
      else if(s===2 && support==='left')this.go(3);
      else if(s===3 && support==='right')this.go(4);
    }
    if(this.level===11){
      if(s===1 && support==='catch')this.go(2);
      else if(s===3 && (support==='original' || support==='breakEdge'))this.go(4);
    }
    if(this.level===12 && s===2 && support==='right'){this.go(3);this.wallSpikeAge=0;}
    if(this.level===13){
      if(s===1 && support==='left')this.go(2);
      else if(s===2 && support==='main')this.go(3);
      else if(s===3 && support==='small')this.go(4);
      else if(s===4 && support==='main')this.go(5);
    }
    if(this.level===14){
      if(s===1 && support==='ferry')this.go(2);
      else if(s===3 && support==='reverseLedge')this.go(4);
      else if(s===4 && support==='finalLift')this.go(5);
      else if(s===5 && support==='upperLedge')this.go(6);
      else if(s===6 && support==='lowBridge')this.go(7);
    }

    this.lastSupport=support || (p.grounded?null:this.lastSupport);
  }
  orb(){if(this.level===14)return this.stage>=8?{x:785,y:347,active:true}:{x:915,y:277,active:true};return {x:915,y:this.level===11?357:this.level===13?367-this.orbRise:367,active:true};}
  contactOrb(){if(this.level===14 && this.stage<8){this.go(8);this.exitTime=2.8;this.message='Wrong finish. Back to the gate!';return false;}return true;}
  finished(){return false;}
  failed(){return this.dead || (this.level===14 && this.stage>=8 && this.exitTime<=0); }
  draw(ctx){
    if(this.level===11 && this.redSpikeAge>=0 && this.redSpikeAge<.42){ctx.fillStyle='#ffd277';ctx.fillRect(508,406,26,4);}
    if(this.level===12 && this.wallSpikeAge>=.45 && this.wallSpikeAge<.7){ctx.fillStyle='#ffd277';ctx.fillRect(506,406,24,4);}
    if(this.level===12 && this.sideSpikeAge>=.2 && this.sideSpikeAge<.62){ctx.fillStyle='#ffd277';ctx.fillRect(420,406,24,4);}
    if(this.level===14 && this.stage>=8){ctx.strokeStyle='#d6f68a';ctx.lineWidth=2;ctx.strokeRect(765,315,40,75);ctx.font='12px monospace';ctx.fillStyle='#d6f68a';ctx.fillText('RETURN '+Math.max(0,this.exitTime).toFixed(1),745,302);}
    if(this.level===10 && this.stage===4 && this.age<.35){
      const drop=Math.min(350,4200*this.age*this.age);
      ctx.strokeStyle='#a4bf81';ctx.globalAlpha=.55*(1-this.age/.35);ctx.lineWidth=2;
      for(let x=455;x<680;x+=37){ctx.beginPath();ctx.moveTo(x,410);ctx.lineTo(x,410+Math.min(drop,100));ctx.stroke();}
      ctx.globalAlpha=1;
    }
    for(const h of this.hazards()){
      ctx.fillStyle='#ed8b76';
      if(h.spikes)for(let x=h.x;x<h.x+h.w;x+=8){ctx.beginPath();ctx.moveTo(x,h.y+h.h);ctx.lineTo(x+4,h.y);ctx.lineTo(x+8,h.y+h.h);ctx.fill();}
      else if(h.ceilingSpikes)for(let x=h.x;x<h.x+h.w;x+=12){ctx.beginPath();ctx.moveTo(x,h.y);ctx.lineTo(x+6,h.y+h.h);ctx.lineTo(x+12,h.y);ctx.fill();}
      else{ctx.fillRect(h.x,h.y,h.w,h.h);for(let y=h.y;y<h.y+h.h;y+=14){ctx.beginPath();ctx.moveTo(h.x,y);ctx.lineTo(h.x-8,y+7);ctx.lineTo(h.x,y+14);ctx.fill();}}
    }
    // Bright caps identify the moving walls without revealing their next trigger.
    for(const body of this.solids())if(body.shove){ctx.fillStyle='#df9476';ctx.fillRect(body.x,body.y,body.w,4);ctx.strokeStyle='#ba745f';ctx.lineWidth=2;for(let y=body.y+16;y<body.y+body.h;y+=22){ctx.beginPath();ctx.moveTo(body.x+4,y);ctx.lineTo(body.x+body.w-4,y+8);ctx.stroke();}}
  }
}
