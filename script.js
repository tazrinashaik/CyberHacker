(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const inputs = [ $("d0"), $("d1"), $("d2"), $("d3") ];
  const game = {mode:"player", secret:"", attempts:0, level:1, over:false, log:[], best:Number(localStorage.getItem("cyberBest")||0), running:false, timer:null, current:[], tested:0, improvements:0};
  const randomCode = () => Array.from({length:4},()=>Math.floor(Math.random()*10)).join("");

  // Fitness is 36 minus the total distance between each candidate digit and target digit.
  // This creates a clear, observable Hill Climbing landscape: a digit closer to the target improves fitness.
  function fitness(candidate, target) {
    let distance=0;
    for(let i=0;i<4;i++) distance+=Math.abs(Number(candidate[i])-Number(target[i]));
    return 36-distance;
  }
  function feedback(message,type="") { $("feedback").className="feedback "+type; $("feedback").textContent=(type==="good"?"✓ ":type==="bad"?"! ":"ⓘ ")+message; }
  function readCode(){return inputs.map(x=>x.value).join("");}
  function clearInputs(){inputs.forEach(x=>{x.value="";}); if(game.mode==="player") inputs[0].focus();}
  function stats(){
    $("level").innerHTML=String(game.level).padStart(2,"0")+" <em>/ 05</em>";
    $("attempts").textContent=String(game.attempts).padStart(2,"0");
    $("best").textContent=game.best?game.best+" MOVES":"—";
    $("status").textContent=game.over?"BREACHED":"LOCKED";
  }
  function drawLog(code,score,result){
    game.log.unshift({code,score,result});
    $("entries").textContent=game.log.length+" "+(game.log.length===1?"ENTRY":"ENTRIES");
    $("history").innerHTML=game.log.map(e=>`<div class="entry"><code>${e.code}</code><span>CLOSENESS <b>${e.score}/36</b></span><em>${e.result}</em></div>`).join("");
  }
  function resetLog(){game.log=[];$("entries").textContent="0 ENTRIES";$("history").innerHTML='<div class="empty">No attempts recorded yet.<br>Every move brings you closer.</div>';}
  function resetGame(){
    stopAI(); game.secret=randomCode();game.attempts=0;game.over=false;game.current=[];game.tested=0;game.improvements=0;
    clearInputs();resetLog();$("modal").classList.add("hidden");$("lock").textContent="▣";
    $("aiState").textContent="IDLE";$("aiState").className="chip";$("aiCode").innerHTML="<span>?</span>".repeat(4);
    $("fitness").textContent="—";$("bar").style.width="0%";$("neighbors").textContent="0";$("improvements").textContent="0";
    $("runAI").disabled=false;$("runAI").textContent="▶ RUN HILL CLIMBING";
    feedback(game.mode==="player"?"Terminal ready. Enter your first four-digit guess.":"AI demo ready. Press Run Hill Climbing to start.");stats();
  }
  function setMode(mode){
    stopAI();game.mode=mode;$("playerMode").classList.toggle("selected",mode==="player");$("aiMode").classList.toggle("selected",mode==="ai");
    $("description").textContent=mode==="player"?"Enter a four-digit code. The system will report how close your guess is.":"Watch the AI improve its guess using Hill Climbing until it discovers the hidden code.";
    $("submit").classList.toggle("hidden",mode!=="player");$("clear").classList.toggle("hidden",mode!=="player");$("runAI").classList.toggle("hidden",mode!=="ai");
    $("hint").textContent=mode==="player"?"4 DIGITS REQUIRED":"SECRET CODE SET BELOW";resetGame();
  }
  function result(won,text){
    $("modalIcon").textContent=won?"✓":"×";$("modalIcon").style.color=won?"var(--green)":"var(--pink)";
    $("modalTitle").textContent=won?"ACCESS GRANTED":"SYSTEM LOCKED";$("modalText").textContent=text;$("modal").classList.remove("hidden");
  }
  function submitGuess(){
    if(game.over||game.mode!=="player")return;
    const guess=readCode();
    if(!/^\d{4}$/.test(guess)){feedback("Enter all four digits before testing access.","bad");inputs.find(x=>!x.value)?.focus();return;}
    game.attempts++;const score=fitness(guess,game.secret);
    drawLog(guess,score,guess===game.secret?"CRACKED":score>=30?"VERY CLOSE":score>=24?"CLOSER":"SCANNED");stats();
    if(guess===game.secret){
      game.over=true;$("lock").textContent="✓";
      if(!game.best||game.attempts<game.best){game.best=game.attempts;localStorage.setItem("cyberBest",String(game.best));}
      stats();feedback("Access granted! You found the hidden code.","good");result(true,`You cracked ${game.secret} in ${game.attempts} ${game.attempts===1?"attempt":"attempts"}.`);return;
    }
    feedback(`Signal received: closeness ${score}/36. ${score>=30?"You're extremely close.":score>=24?"Good progress—keep adjusting.":"Try changing digits to improve your score."}`,score>=30?"good":"");
    if(game.attempts>=10){game.over=true;stats();feedback(`Lockout triggered. The hidden code was ${game.secret}. Start a new mission to try again.`,"bad");result(false,`The system locked after 10 attempts. The code was ${game.secret}.`);}else clearInputs();
  }
  function updateAI(candidate,score){
    $("aiCode").innerHTML=candidate.map(n=>`<span>${n}</span>`).join("");
    $("fitness").textContent=score+"/36";$("bar").style.width=(score/36*100)+"%";
    $("neighbors").textContent=game.tested;$("improvements").textContent=game.improvements;
  }
  function getNeighbors(candidate){
    const list=[];
    for(let i=0;i<4;i++)for(const delta of [-1,1]){
      const value=candidate[i]+delta;
      if(value>=0&&value<=9){const next=candidate.slice();next[i]=value;list.push(next);}
    }
    return list;
  }
  function runAI(){
    if(game.running)return;
    game.running=true;game.current=Array.from({length:4},()=>Math.floor(Math.random()*10));game.tested=0;game.improvements=0;
    $("aiState").textContent="CLIMBING";$("aiState").className="chip running";$("runAI").disabled=true;$("runAI").textContent="⟳ SEARCHING...";$("lock").textContent="⌁";
    feedback("AI started. It evaluates neighboring candidates and keeps a better one.");
    updateAI(game.current,fitness(game.current.join(""),game.secret));
    function step(){
      if(!game.running)return;
      const currentScore=fitness(game.current.join(""),game.secret);
      if(currentScore===36){
        game.running=false;game.over=true;$("aiState").textContent="CRACKED";$("aiState").className="chip done";$("runAI").disabled=false;$("runAI").textContent="↻ RUN AGAIN";$("lock").textContent="✓";
        drawLog(game.current.join(""),36,"AI CRACKED");feedback(`AI cracked ${game.secret} after ${game.improvements} improving moves.`,"good");stats();
        result(true,`Hill Climbing found code ${game.secret} after ${game.tested} neighbor evaluations and ${game.improvements} improvements.`);
        game.level=Math.min(5,game.level+1);stats();return;
      }
      const near=getNeighbors(game.current);game.tested+=near.length;
      let best=game.current,bestScore=currentScore;
      for(const candidate of near){const score=fitness(candidate.join(""),game.secret);if(score>bestScore){best=candidate;bestScore=score;}}
      if(bestScore>currentScore){
        game.current=best;game.improvements++;updateAI(game.current,bestScore);
        feedback(`Better neighbor found. Fitness improved from ${currentScore}/36 to ${bestScore}/36.`);
        game.timer=setTimeout(step,420);
      }else{
        game.running=false;$("aiState").textContent="STOPPED";$("aiState").className="chip";$("runAI").disabled=false;$("runAI").textContent="↻ TRY AGAIN";feedback("No better neighbor found. Restart to try a new initial guess.","bad");
      }
    }
    game.timer=setTimeout(step,420);
  }
  function stopAI(){game.running=false;if(game.timer)clearTimeout(game.timer);game.timer=null;}
  inputs.forEach((input,index)=>{
    input.addEventListener("input",()=>{input.value=input.value.replace(/\D/g,"").slice(-1);if(input.value&&index<3)inputs[index+1].focus();});
    input.addEventListener("keydown",event=>{if(event.key==="Backspace"&&!input.value&&index>0)inputs[index-1].focus();if(event.key==="Enter")submitGuess();});
  });
  $("playerMode").addEventListener("click",()=>setMode("player"));$("aiMode").addEventListener("click",()=>setMode("ai"));
  $("submit").addEventListener("click",submitGuess);$("clear").addEventListener("click",clearInputs);$("runAI").addEventListener("click",runAI);
  $("again").addEventListener("click",resetGame);
  stats();resetGame();
})();