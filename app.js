(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $=function(s){return document.querySelector(s)},$$=function(s){return [].slice.call(document.querySelectorAll(s))};

  // Estimator: the licensing partner's published payout model, as shown on pewterdata.com.
  var T=[{e:20,l:163000,h:439000,ly:9000,hy:20300},{e:50,l:289000,h:611000,ly:9430,hy:28650},{e:100,l:383000,h:897000,ly:10030,hy:42570},{e:200,l:572000,h:1470000,ly:11220,hy:70400}];
  function model(emp,yrs){
    var a=Math.min(200,Math.max(20,emp)),s=Math.min(20,Math.max(3,yrs)),i=0;
    while(T[i].e<a)i++;
    var hi=T[i],lo=T[Math.max(0,i-1)],u=lo.e===hi.e?0:(a-lo.e)/(hi.e-lo.e);
    var d=function(k){return lo[k]+(hi[k]-lo[k])*u},r5=function(x){return 5000*Math.round(x/5000)};
    return{l:r5(Math.max(0,d('l')+(s-10)*d('ly'))),h:r5(d('h')+(s-10)*d('hy'))};
  }
  function fmt(n){return n>=1e6?'$'+Number((n/1e6).toFixed(3))+'M':'$'+Math.round(n/1e3)+'K'}
  var emp=$('#emp'),yrs=$('#yrs'),out=$('#range'),cur={l:385000,h:895000},raf;
  function paint(v){out.innerHTML=fmt(v.l)+' <small>to</small> '+fmt(v.h)}
  function fill(el){el.style.setProperty('--p',((el.value-el.min)/(el.max-el.min)*100)+'%')}
  function update(){
    var t=model(+emp.value,+yrs.value);
    $('#emp-out').textContent=emp.value+(+emp.value>=200?'+':'');
    $('#yrs-out').textContent=yrs.value+(+yrs.value>=20?'+':'');
    fill(emp);fill(yrs);cancelAnimationFrame(raf);
    if(reduce){cur=t;paint(t);return}
    var f=cur,start=performance.now();
    (function step(now){
      var p=Math.min(1,(now-start)/260),e=1-Math.pow(1-p,3);
      var v={l:5000*Math.round((f.l+(t.l-f.l)*e)/5000),h:5000*Math.round((f.h+(t.h-f.h)*e)/5000)};
      cur=v;paint(v);if(p<1)raf=requestAnimationFrame(step);
    })(start);
  }
  emp.addEventListener('input',update);yrs.addEventListener('input',update);fill(emp);fill(yrs);

  // Reveal on scroll, count-ups, steps.
  $$('.bento .reveal,.recs .reveal').forEach(function(el,i){el.style.setProperty('--d',(i%6*.06)+'s')});
  function count(el){
    var n=+el.dataset.count,pre=el.dataset.pre||'',suf=el.dataset.suf||'';
    if(reduce)return;
    var start=performance.now();
    (function step(now){var p=Math.min(1,(now-start)/1300),e=1-Math.pow(1-p,4);el.textContent=pre+Math.round(n*e)+suf;if(p<1)requestAnimationFrame(step)})(start);
  }
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');var c=x.target.querySelector('[data-count]');if(c)count(c);io.unobserve(x.target)}})},{threshold:.12,rootMargin:'0px 0px -40px'});
    $$('.reveal').forEach(function(el){io.observe(el)});
    var stepsEl=$('#steps'),st=new IntersectionObserver(function(es){if(es[0].isIntersecting){runSteps();st.disconnect()}},{threshold:.3});
    st.observe(stepsEl);
    var mailEl=$('#mail'),mo=new IntersectionObserver(function(es){if(es[0].isIntersecting){setMail(false,true);setTimeout(function(){setMail(true)},1100);mo.disconnect()}},{threshold:.45});
    mo.observe(mailEl);
  }else{$$('.reveal').forEach(function(el){el.classList.add('in')});setTimeout(runSteps,0)}
  function runSteps(){
    var el=$('#steps');el.style.setProperty('--f','100%');
    $$('#steps li').forEach(function(li,i){setTimeout(function(){li.classList.add('on')},reduce?0:i*340)});
  }

  // Card spotlight follows the pointer.
  $$('.spot').forEach(function(c){c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--x',(e.clientX-r.left)+'px');c.style.setProperty('--y',(e.clientY-r.top)+'px')})});

  // Qualification check.
  var qs=$$('.q'),C=213.6,msgs=['Start with your headcount.','Keep going.','Halfway there.','1 more to go.','Your firm looks like a likely fit. See your estimate.'];
  qs.forEach(function(b){b.addEventListener('click',function(){
    b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')==='true'?'false':'true');
    var n=qs.filter(function(x){return x.getAttribute('aria-pressed')==='true'}).length;
    $('#ring').style.strokeDashoffset=C*(1-n/4);$('#q-title').textContent=n===4?'Likely fit':n+' of 4';$('#q-text').textContent=msgs[n];
  })});

  // De-identification switch.
  var body=$('#mail-body'),mail=$('#mail'),bo=$('#m-orig'),bc=$('#m-clean');
  function setMail(clean,instant){
    bo.setAttribute('aria-pressed',String(!clean));bc.setAttribute('aria-pressed',String(clean));
    mail.classList.toggle('clean',clean);
    $$('.t').forEach(function(t){t.textContent=clean?t.dataset.c:t.dataset.o});
    if(clean&&!instant&&!reduce){body.classList.remove('scan');void body.offsetWidth;body.classList.add('scan')}
  }
  bo.addEventListener('click',function(){setMail(false)});bc.addEventListener('click',function(){setMail(true)});
  setMail(true,true);

  // Hero network: decorative moving routes that react to the pointer.
  var cv=$('#net'),ctx=cv.getContext('2d'),W=0,H=0,N=[],E=[],P=[],mx=0,my=0,tx=0,ty=0,vis=true;
  function build(){
    var r=cv.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    var cols=W<700?5:10,rows=W<700?7:6;N=[];E=[];P=[];
    for(var y=0;y<rows;y++)for(var x=0;x<cols;x++)N.push({x:(x+.5+(Math.random()-.5)*.65)/cols*W,y:(y+.5+(Math.random()-.5)*.65)/rows*H,d:.4+Math.random()*.9});
    N.forEach(function(a,i){N.map(function(b,j){return{j:j,q:Math.hypot(a.x-b.x,a.y-b.y)}}).filter(function(o){return o.j>i}).sort(function(p,q){return p.q-q.q}).slice(0,2).forEach(function(o){if(o.q<W/(cols-1)*1.7)E.push([i,o.j])})});
    var count=Math.min(E.length,W<700?10:26);
    for(var k=0;k<count;k++)P.push({e:Math.floor(Math.random()*E.length),t:Math.random(),s:.0022+Math.random()*.004,c:Math.random()<.55?'210,245,60':'63,216,255'});
  }
  function pos(n){return{x:n.x+mx*n.d,y:n.y+my*n.d}}
  function frame(){
    if(vis){
      mx+=(tx-mx)*.05;my+=(ty-my)*.05;ctx.clearRect(0,0,W,H);ctx.lineWidth=1;ctx.strokeStyle='rgba(255,255,255,.07)';ctx.beginPath();
      E.forEach(function(e){var a=pos(N[e[0]]),b=pos(N[e[1]]);ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y)});ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.3)';N.forEach(function(n){var p=pos(n);ctx.beginPath();ctx.arc(p.x,p.y,1.6,0,6.3);ctx.fill()});
      P.forEach(function(p){
        p.t+=p.s;if(p.t>1){p.t=0;p.e=Math.floor(Math.random()*E.length)}
        var a=pos(N[E[p.e][0]]),b=pos(N[E[p.e][1]]),x=a.x+(b.x-a.x)*p.t,y=a.y+(b.y-a.y)*p.t,bx=a.x+(b.x-a.x)*Math.max(0,p.t-.16),by=a.y+(b.y-a.y)*Math.max(0,p.t-.16);
        var g=ctx.createLinearGradient(bx,by,x,y);g.addColorStop(0,'rgba('+p.c+',0)');g.addColorStop(1,'rgba('+p.c+',.95)');ctx.strokeStyle=g;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(x,y);ctx.stroke();
        ctx.fillStyle='rgba('+p.c+',1)';ctx.beginPath();ctx.arc(x,y,2.2,0,6.3);ctx.fill();
      });
    }
    requestAnimationFrame(frame);
  }
  build();
  var rt;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){build();if(reduce)drawStill()},200)});
  function drawStill(){vis=true;ctx.clearRect(0,0,W,H);ctx.strokeStyle='rgba(255,255,255,.07)';ctx.beginPath();E.forEach(function(e){var a=N[e[0]],b=N[e[1]];ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y)});ctx.stroke()}
  if(reduce)drawStill();else{
    addEventListener('pointermove',function(e){tx=(e.clientX/innerWidth-.5)*-30;ty=(e.clientY/innerHeight-.5)*-24},{passive:true});
    new IntersectionObserver(function(es){vis=es[0].isIntersecting}).observe(cv);
    frame();
  }
})();
