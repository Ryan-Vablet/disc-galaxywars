(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const a of i)if(a.type==="childList")for(const s of a.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&n(s)}).observe(document,{childList:!0,subtree:!0});function t(i){const a={};return i.integrity&&(a.integrity=i.integrity),i.referrerPolicy&&(a.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?a.credentials="include":i.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function n(i){if(i.ep)return;i.ep=!0;const a=t(i);fetch(i.href,a)}})();const Bt={player:{main:"#00e5ff",glow:"rgba(0,229,255,0.4)",dark:"#006064",trail:"#00bcd4"},enemy:{main:"#ff1744",glow:"rgba(255,23,68,0.4)",dark:"#7f0000",trail:"#ff5252"},botPalettes:[{main:"#ff1744",glow:"rgba(255,23,68,0.4)",dark:"#7f0000",trail:"#ff5252"},{main:"#ff9100",glow:"rgba(255,145,0,0.4)",dark:"#6d3a00",trail:"#ffb74d"},{main:"#7c4dff",glow:"rgba(124,77,255,0.38)",dark:"#311b92",trail:"#b388ff"},{main:"#00c853",glow:"rgba(0,200,83,0.35)",dark:"#1b5e20",trail:"#69f0ae"},{main:"#f50057",glow:"rgba(245,0,87,0.35)",dark:"#880e4f",trail:"#ff80ab"},{main:"#00b8d4",glow:"rgba(0,184,212,0.35)",dark:"#006064",trail:"#84ffff"},{main:"#c6ff00",glow:"rgba(198,255,0,0.3)",dark:"#827717",trail:"#eeff41"}],teamColors:[{main:"#00e5ff",dark:"#006064"},{main:"#ff1744",dark:"#7f0000"},{main:"#ff9100",dark:"#6d3a00"},{main:"#7c4dff",dark:"#311b92"},{main:"#00c853",dark:"#1b5e20"},{main:"#f50057",dark:"#880e4f"},{main:"#00b8d4",dark:"#006064"},{main:"#c6ff00",dark:"#827717"}],neutral:{main:"#78909c",glow:"rgba(120,144,156,0.25)",dark:"#37474f",trail:"#90a4ae"},bg:"#05080f",stars:"#ffffff"},Xt={particleLimit:600,trailLimit:1200,starCount:180,nebulaCount:5,uiBarHeight:42,avatarScreenDiameterHomeworld:36,avatarScreenDiameterSun:48,avatarScreenDiameterNonHomeMin:18,avatarScreenDiameterNonHomeMax:26},It={planetMinRadius:28,planetMaxRadius:55,fleetSpeedPerFrame:2.2,sendRatio:.55,mapPadding:80,frameDurationMs:16,sunRadius:110},Kl={slowest:.5,slow:.75,normal:1,fast:1.35,fastest:1.75},Zl={small:{width:1200,height:1200},medium:{width:1800,height:1800},large:{width:2600,height:2600}},tl={passive:{name:"Passive",decisionIntervalMs:2500,aggression:.2,expansionism:.8,caution:.6,minimumSendThreshold:800,overpowerRatio:1.8,coordinatedAttacks:!1,staggerArrivals:!1,sunPriority:.3,homeDefenseRatio:.5},balanced:{name:"Balanced",decisionIntervalMs:1800,aggression:.5,expansionism:.5,caution:.4,minimumSendThreshold:400,overpowerRatio:1.3,coordinatedAttacks:!0,staggerArrivals:!1,sunPriority:.6,homeDefenseRatio:.3},aggressive:{name:"Aggressive",decisionIntervalMs:1200,aggression:.8,expansionism:.3,caution:.2,minimumSendThreshold:200,overpowerRatio:1,coordinatedAttacks:!0,staggerArrivals:!0,sunPriority:.9,homeDefenseRatio:.15}};function rn(r,e){return Math.hypot(r.x-e.x,r.y-e.y)}function ze(r,e){return Math.random()*(e-r)+r}function Wr(r,e,t){return Math.max(e,Math.min(t,r))}function Xr(){return Math.random()>.5}function Hs(r){const e=r.parentElement;if(!e)return{width:r.width,height:r.height};const t=window.devicePixelRatio||1,n=Math.floor(e.clientWidth*t),i=Math.floor(e.clientHeight*t);return r.width=n,r.height=i,{width:n,height:i}}class jl{getIncomingThreats(e,t,n){return t.fleets.filter(i=>i.toId===e&&i.owner!==n).reduce((i,a)=>i+a.units,0)}getVulnerablePlanets(e,t){return e.planets.filter(a=>a.owner===t).map(a=>{const s=this.getIncomingThreats(a.id,e,t),o=s/Math.max(a.units,1);return{planetId:a.id,incomingHostileUnits:s,currentUnits:a.units,threatRatio:o}}).sort((a,s)=>s.threatRatio-a.threatRatio)}}class Jl{personality;playerId;threatAnalyzer;timerMs=0;constructor(e,t){this.playerId=e,this.personality=t,this.threatAnalyzer=new jl}evaluate(e,t){if(this.timerMs+=t,this.timerMs<this.personality.decisionIntervalMs)return[];this.timerMs=0;const n=e.planets.filter(s=>s.owner===this.playerId),i=e.planets.filter(s=>s.owner!==this.playerId);if(n.length===0||i.length===0)return[];if(this.personality.coordinatedAttacks){const s=this.scoreTargets(e).slice(0,3).map(l=>this.buildAttackPlan(l.id,e)).filter(l=>l!==null).filter(l=>l.confidence>=this.personality.overpowerRatio),o=this.selectBestPlan(s);if(o){const l=this.personality.staggerArrivals?this.staggerSends(o):o;return l.sources.map(c=>({from:c.planetId,to:l.target,delayMs:c.delayMs}))}}const a=this.fallbackSingleSend(e);return a?[a]:[]}scoreTargets(e){const t=e.planets.filter(n=>n.owner===this.playerId);return e.planets.filter(n=>n.owner!==this.playerId).sort((n,i)=>this.scorePlanetValue(i,t)-this.scorePlanetValue(n,t))}scorePlanetValue(e,t){let n=0;n+={sun:100,homeworld:80,gasGiant:30,lavaWorld:60,terran:45,iceWorld:35,dryTerran:20,barren:10}[e.type]??20,e.owner!==null&&e.owner!==this.playerId&&(n+=15,e.type==="homeworld"&&(n+=30)),e.type==="sun"&&e.owner!==this.playerId&&(n+=25*this.personality.sunPriority),e.type==="gasGiant"&&t.reduce((l,c)=>l+c.productionRate,0)<150&&(n-=20);const a=t.reduce((o,l)=>Math.min(o,rn(l,e)),1/0);n-=a*.05;const s=e.units*(1/Math.max(1-e.shield,.01));return n-=s*.001,n}buildAttackPlan(e,t){const n=t.planets.find(u=>u.id===e);if(!n)return null;const i=n.units,a=1/Math.max(1-n.shield,.01),s=t.planets.filter(u=>u.owner===this.playerId).map(u=>{const h=rn(u,n),d=Math.floor(u.units*It.sendRatio);return{planet:u,distance:h,available:d}}).filter(u=>u.available>=this.personality.minimumSendThreshold).sort((u,h)=>u.distance-h.distance),o=[];let l=0;for(const u of s){if(u.planet.type==="homeworld"&&u.planet.units<u.planet.maxUnits*this.personality.homeDefenseRatio||this.threatAnalyzer.getIncomingThreats(u.planet.id,t,this.playerId)>u.planet.units*.5)continue;const d=u.distance/this.fleetSpeedPerSecond(),g=(n.owner!==null?i+n.productionRate*d:i)*a;if(o.push({planetId:u.planet.id,unitsToSend:u.available,estimatedArrivalTime:d}),l+=u.available,l>=g*this.personality.overpowerRatio)return{target:e,sources:o,totalUnits:l,estimatedDefense:g,confidence:l/Math.max(g,1)}}const c=i*a;return l<c?null:{target:e,sources:o,totalUnits:l,estimatedDefense:c,confidence:l/Math.max(c,1)}}selectBestPlan(e){return e.length===0?null:e.reduce((t,n)=>{const i=t.confidence*100-t.estimatedDefense*.001;return n.confidence*100-n.estimatedDefense*.001>i?n:t})}staggerSends(e){const t=Math.max(...e.sources.map(n=>n.estimatedArrivalTime));return{...e,sources:e.sources.map(n=>({...n,delayMs:Math.max(0,(t-n.estimatedArrivalTime)*1e3)}))}}fallbackSingleSend(e){const t=this.threatAnalyzer.getVulnerablePlanets(e,this.playerId),n=new Set(t.filter(o=>o.threatRatio>.6).map(o=>o.planetId));let i=-1/0,a=null,s=null;for(const o of e.planets.filter(l=>l.owner===this.playerId)){const l=Math.floor(o.units*It.sendRatio);if(!(l<this.personality.minimumSendThreshold))for(const c of e.planets.filter(u=>u.owner!==this.playerId)){const u=rn(o,c),h=u/this.fleetSpeedPerSecond(),g=(c.owner===null?c.units:c.units+c.productionRate*h)*(1/Math.max(1-c.shield,.01))*this.personality.overpowerRatio+2;if(l<g*.7)continue;let S=0;S+=(l-g)*3,S-=u*.15,S+=this.scorePlanetValue(c,e.planets.filter(f=>f.owner===this.playerId)),S+=c.owner===null?18*this.personality.expansionism:-6*this.personality.caution,c.owner===0&&(S+=14*this.personality.aggression),n.has(o.id)&&(S-=40),S>i&&(i=S,a=o,s=c)}}return a&&s&&i>-20?{from:a.id,to:s.id}:null}fleetSpeedPerSecond(){return It.fleetSpeedPerFrame*(1e3/It.frameDurationMs)}}class Ql{context;constructor(e){this.context=e}dispatch(e,t,n,i){const a=e.planets.find(h=>h.id===t),s=e.planets.find(h=>h.id===n);if(!a)return{ok:!1,error:"invalid_source"};if(!s)return{ok:!1,error:"invalid_target"};if(a.id===s.id)return{ok:!1,error:"same_planet"};if(a.owner!==i)return{ok:!1,error:"not_owner"};const o=Math.floor(a.units*It.sendRatio);if(o<1)return{ok:!1,error:"insufficient_units"};a.units-=o;const l=Math.atan2(s.y-a.y,s.x-a.x),c=rn(a,s),u={id:this.context.nextFleetId(),fromId:t,toId:n,owner:i,units:o,x:a.x,y:a.y,tx:s.x,ty:s.y,angle:l,totalDistance:c,traveled:0};return e.fleets.push(u),{ok:!0,fleet:u,sentUnits:o}}}const ec=4e3,tc=1.1,nc={sun:{id:"sun",maxUnits:2e4,productionPerSecond:350,neutralStartUnits:5e3,shield:.5,countPerMap:{min:1,max:1},special:"globalDividend",variance:{maxUnits:.15,productionPerSecond:.15,neutralStartUnits:.15}},homeworld:{id:"homeworld",maxUnits:3e4,productionPerSecond:180,neutralStartUnits:4e3,shield:0,countPerMap:{min:1,max:1},special:"homeworld",variance:{maxUnits:.15,productionPerSecond:.15,neutralStartUnits:.15}},gasGiant:{id:"gasGiant",maxUnits:5e4,productionPerSecond:60,neutralStartUnits:3e3,shield:0,countPerMap:{min:1,max:2},special:null,variance:{maxUnits:.15,productionPerSecond:.15,neutralStartUnits:.15}},lavaWorld:{id:"lavaWorld",maxUnits:15e3,productionPerSecond:220,neutralStartUnits:2500,shield:0,countPerMap:{min:1,max:2},special:null,variance:{maxUnits:.15,productionPerSecond:.15,neutralStartUnits:.15}},terran:{id:"terran",maxUnits:2e4,productionPerSecond:120,neutralStartUnits:2e3,shield:0,countPerMap:{min:2,max:3},special:null,variance:{maxUnits:.15,productionPerSecond:.15,neutralStartUnits:.15}},iceWorld:{id:"iceWorld",maxUnits:25e3,productionPerSecond:80,neutralStartUnits:2e3,shield:0,countPerMap:{min:1,max:2},special:null,variance:{maxUnits:.15,productionPerSecond:.15,neutralStartUnits:.15}},dryTerran:{id:"dryTerran",maxUnits:1e4,productionPerSecond:80,neutralStartUnits:1500,shield:0,countPerMap:{min:2,max:3},special:null,variance:{maxUnits:.15,productionPerSecond:.15,neutralStartUnits:.15}},barren:{id:"barren",maxUnits:5e3,productionPerSecond:40,neutralStartUnits:800,shield:0,countPerMap:{min:2,max:3},special:null,variance:{maxUnits:.15,productionPerSecond:.15,neutralStartUnits:.15}}};function ic(r){return nc[r]}const rc={small:{backfieldPerPlayer:2,gasGiants:1,extraMidPlanets:1},medium:{backfieldPerPlayer:2,gasGiants:2,extraMidPlanets:3},large:{backfieldPerPlayer:3,gasGiants:2,extraMidPlanets:5}},ac={sun:It.sunRadius,homeworld:It.planetMaxRadius,gasGiant:60,lavaWorld:46,terran:44,iceWorld:48,dryTerran:38,barren:30},ji=["terran","iceWorld","lavaWorld"],Ws=["dryTerran","barren"];class sc{lastRetryCount=0;generate(e){let t=[];for(let n=0;n<10;n+=1)if(t=this.generateCandidate(e),this.validateFairness(t,e.playerIds.length))return this.lastRetryCount=n,t;return this.lastRetryCount=9,t}getLastRetryCount(){return this.lastRetryCount}generateCandidate(e){const t=[],n=e.playerIds.length,i=Zl[e.mapSize],a=i.width,s=i.height,o=a/2,l=s/2,c=Math.min(a,s)/2,u=c*.6,h=rc[e.mapSize];let d=0;t.push(this.createPlanet(d++,"sun",o,l,null));const m=e.playerIds.map((g,S)=>{const f=Math.PI*2*S/n-Math.PI/2,p=o+Math.cos(f)*u,M=l+Math.sin(f)*u,T=this.createPlanet(d++,"homeworld",p,M,g);return t.push(T),{homeworld:T,angle:f}});for(const[g,{angle:S}]of m.entries()){const f=S+Math.PI/n;g<h.gasGiants&&this.placePolarPlanet(t,d++,"gasGiant",o,l,c*.22,f,a,s)}for(const[g,{homeworld:S,angle:f}]of m.entries()){const p=h.backfieldPerPlayer;for(let R=0;R<p;R+=1){const C=Ws[(R+g)%Ws.length],P=90+R*90,_=(R-(p-1)/2)*90,y=S.x+Math.cos(f)*P+Math.cos(f+Math.PI/2)*_,W=S.y+Math.sin(f)*P+Math.sin(f+Math.PI/2)*_;this.placeCartesianPlanet(t,d++,C,y,W,a,s)}const M=ji[g%ji.length],T=c*ze(.38,.5),E=f+ze(-.18,.18);this.placePolarPlanet(t,d++,M,o,l,T,E,a,s)}for(let g=0;g<h.extraMidPlanets;g+=1){const S=ji[g%ji.length],f=Math.PI*2*g/h.extraMidPlanets-Math.PI/2+Math.PI/Math.max(n,2),p=c*ze(.33,.48);this.placePolarPlanet(t,d++,S,o,l,p,f,a,s)}return t}createPlanet(e,t,n,i,a){const s=ic(t),o=t==="homeworld",l=t==="sun",c=o&&a!==null?ec:s.neutralStartUnits;return{id:e,x:n,y:i,radius:ac[t],type:t,isHomeworld:o,owner:a,units:c,maxUnits:s.maxUnits,productionRate:s.productionPerSecond,effectiveProductionRate:s.productionPerSecond,shield:s.shield,isSun:l}}placeCartesianPlanet(e,t,n,i,a,s,o){const l=this.createPlanet(t,n,i,a,null);this.isValidPosition(l,e,s,o)&&e.push(l)}placePolarPlanet(e,t,n,i,a,s,o,l,c){for(let h=0;h<16;h+=1){const d=o+ze(-.15,.15)*h,m=s+ze(-20,20)*h*.25,g=this.createPlanet(t,n,i+Math.cos(d)*m,a+Math.sin(d)*m,null);if(this.isValidPosition(g,e,l,c)){e.push(g);return}}}isValidPosition(e,t,n,i){const a=It.mapPadding;if(e.x-e.radius<a||e.x+e.radius>n-a||e.y-e.radius<a||e.y+e.radius>i-a)return!1;for(const s of t){const o=s.isSun||e.isSun?90:55;if(rn(s,e)<s.radius+e.radius+o)return!1}return!0}validateFairness(e,t){const n=e.find(o=>o.type==="sun"),i=e.filter(o=>o.type==="homeworld");if(!n||i.length!==t)return!1;for(const o of i)if(e.filter(c=>{if(c.owner!==null||c.type==="sun")return!1;const u=rn(c,o);return i.filter(h=>h.id!==o.id).every(h=>rn(c,h)>u)}).length<3)return!1;const a=i.map(o=>rn(o,n)),s=a.reduce((o,l)=>o+l,0)/a.length;return a.every(o=>Math.abs(o-s)/s<=.15)}}function oc(r,e,t=0){const n=r*(1-t),i=e-n;return i<0?{captured:!0,remainingUnits:Math.abs(i),damageDealt:e}:{captured:!1,remainingUnits:i,damageDealt:n}}class lc{tick(e,t){const n=[],i=t/It.frameDurationMs;for(let a=e.fleets.length-1;a>=0;a-=1){const s=e.fleets[a];if(!s)continue;const o=It.fleetSpeedPerFrame*i;s.x+=Math.cos(s.angle)*o,s.y+=Math.sin(s.angle)*o,s.traveled+=o;const l=e.planets.find(c=>c.id===s.toId);if(l&&rn(s,l)<l.radius+5){const c=l.units,u=l.owner;if(l.owner===s.owner)l.units+=s.units,n.push({type:"fleet_arrived",fleet:{...s},target:{...l},result:{captured:!1,remainingUnits:l.units,damageDealt:0},defenderUnitsBefore:c,defenderOwnerBefore:u});else{const h=oc(s.units,l.units,l.shield),d=l.owner;l.units=h.remainingUnits,h.captured&&(l.owner=s.owner,n.push({type:"planet_captured",planet:{...l},newOwner:s.owner,previousOwner:d})),n.push({type:"fleet_arrived",fleet:{...s},target:{...l},result:h,defenderUnitsBefore:c,defenderOwnerBefore:u})}e.fleets.splice(a,1);continue}s.traveled>s.totalDistance+100&&e.fleets.splice(a,1)}return n}}class cc{tick(e,t){const n=t/1e3,i=e.planets.find(a=>a.type==="sun")?.owner??null;for(const a of e.planets){let s=a.productionRate;a.owner!==null&&i!==null&&a.owner===i&&a.type!=="sun"&&(s*=tc),a.effectiveProductionRate=s,a.owner!==null&&(a.units=Math.min(a.maxUnits,a.units+s*n))}}}function Xs(){return{gameDuration:0,fleetsLaunched:0,fleetsSent:0,unitsProduced:0,unitsLost:0,unitsKilled:0,planetsCaptured:0,planetsLost:0,peakPlanets:0,peakUnits:0}}class uc{constructor(e){this.playerIds=e;for(const t of e)this.statsByPlayer.set(t,Xs())}statsByPlayer=new Map;updateFrame(e){for(const t of this.playerIds){const n=this.statsByPlayer.get(t);if(!n)continue;n.gameDuration=e.timeMs/1e3;const i=e.planets.filter(s=>s.owner===t).length,a=Math.floor(e.planets.filter(s=>s.owner===t).reduce((s,o)=>s+o.units,0));n.peakPlanets=Math.max(n.peakPlanets,i),n.peakUnits=Math.max(n.peakUnits,a)}}recordProduction(e,t){if(e===null||t<=0)return;const n=this.statsByPlayer.get(e);n&&(n.unitsProduced+=t)}recordEvent(e){if(e.type==="fleet_launched"){const t=this.statsByPlayer.get(e.fleet.owner);t&&(t.fleetsLaunched+=1,t.fleetsSent+=1);return}if(e.type==="fleet_arrived"&&e.defenderOwnerBefore!==null&&e.defenderOwnerBefore!==e.fleet.owner){const t=this.statsByPlayer.get(e.fleet.owner),n=this.statsByPlayer.get(e.defenderOwnerBefore),i=Math.min(e.result.damageDealt,e.defenderUnitsBefore),a=e.result.captured?0:Math.min(e.fleet.units,e.defenderUnitsBefore);t&&(t.unitsKilled+=i,t.unitsLost+=a),n&&(n.unitsKilled+=a,n.unitsLost+=i);return}if(e.type==="planet_captured"){const t=this.statsByPlayer.get(e.newOwner);if(t&&(t.planetsCaptured+=1),e.previousOwner!==null){const n=this.statsByPlayer.get(e.previousOwner);n&&(n.planetsLost+=1)}}}getStatsFor(e){return this.statsByPlayer.get(e)??Xs()}}class dc{state;nextFleetIdValue=0;fleetSystem;productionSystem;dispatcher;mapGenerator;listeners=new Set;aiControllers=new Map;pendingAIDispatches=[];playerId;botIds;stats;mapMetadata;constructor(e,t){this.playerId=e.playerId,this.botIds=Array.from({length:e.botCount},(n,i)=>i+1),this.mapGenerator=new sc,this.fleetSystem=new lc,this.productionSystem=new cc,this.dispatcher=new Ql({nextFleetId:()=>this.nextFleetId()});for(const n of this.botIds)this.aiControllers.set(n,new Jl(n,tl[t]));this.stats=new uc([this.playerId,...this.botIds]),this.state=this.createInitialState(e),this.mapMetadata={retryCount:this.mapGenerator.getLastRetryCount(),mapSize:e.mapSize,playerCount:1+e.botCount}}tick(e){if(this.state.status!=="playing")return;this.state.timeMs+=e;const t=this.state.planets.map(i=>({id:i.id,units:i.units,owner:i.owner}));this.productionSystem.tick(this.state,e);for(const i of t){const a=this.state.planets.find(s=>s.id===i.id);a&&this.stats.recordProduction(a.owner,Math.max(0,a.units-i.units))}const n=this.fleetSystem.tick(this.state,e);for(const i of n)this.emit(i);this.drainPendingAIDispatches();for(const[i,a]of this.aiControllers.entries()){const s=a.evaluate(this.state,e);for(const o of s)(o.delayMs??0)>0?this.pendingAIDispatches.push({action:{from:o.from,to:o.to,owner:i},executeAtTime:this.state.timeMs+(o.delayMs??0)}):this.dispatchFleet(o.from,o.to,i)}this.updateGameOverState(),this.stats.updateFrame(this.state)}getState(){return this.state}dispatchFleet(e,t,n){const i=this.dispatcher.dispatch(this.state,e,t,n);if(i.ok&&i.fleet){const a=this.state.planets.find(s=>s.id===e);a&&this.emit({type:"fleet_launched",fleet:i.fleet,from:{...a}})}return i}dispatchMultiFleet(e,t,n){const i=[];for(const a of e)i.push(this.dispatchFleet(a,t,n));return i}on(e){return this.listeners.add(e),()=>this.listeners.delete(e)}getStats(){const e={gameDuration:0,fleetsLaunched:0,fleetsSent:0,unitsProduced:0,unitsLost:0,unitsKilled:0,planetsCaptured:0,planetsLost:0,peakPlanets:0,peakUnits:0};for(const t of this.botIds){const n=this.stats.getStatsFor(t);e.gameDuration=Math.max(e.gameDuration,n.gameDuration),e.fleetsLaunched+=n.fleetsLaunched,e.fleetsSent+=n.fleetsSent,e.unitsProduced+=n.unitsProduced,e.unitsLost+=n.unitsLost,e.unitsKilled+=n.unitsKilled,e.planetsCaptured+=n.planetsCaptured,e.planetsLost+=n.planetsLost,e.peakPlanets+=n.peakPlanets,e.peakUnits+=n.peakUnits}return{player:this.stats.getStatsFor(this.playerId),enemy:e}}getMapMetadata(){return this.mapMetadata}emit(e){this.stats.recordEvent(e);for(const t of this.listeners)t(e)}nextFleetId(){return this.nextFleetIdValue+=1,this.nextFleetIdValue}drainPendingAIDispatches(){for(let e=this.pendingAIDispatches.length-1;e>=0;e-=1){const t=this.pendingAIDispatches[e];!t||t.executeAtTime>this.state.timeMs||(this.dispatchFleet(t.action.from,t.action.to,t.action.owner),this.pendingAIDispatches.splice(e,1))}}createInitialState(e){return{planets:this.mapGenerator.generate({playerIds:[this.playerId,...this.botIds],mapSize:e.mapSize,homeUnits:e.homeUnits}),fleets:[],players:[{id:this.playerId,name:"You",isBot:!1},...this.botIds.map((t,n)=>({id:t,name:`Bot ${n+1}`,isBot:!0}))],status:"playing",winner:null,timeMs:0}}updateGameOverState(){const e=this.state.planets.filter(a=>a.owner===this.playerId).length,t=this.state.fleets.filter(a=>a.owner===this.playerId).length,n=this.state.planets.filter(a=>a.owner!==null&&a.owner!==this.playerId).length,i=this.state.fleets.filter(a=>a.owner!==this.playerId).length;if(e===0&&t===0){this.state.status="defeat",this.state.winner=this.botIds[0]??1,this.emit({type:"game_over",winner:this.state.winner});return}n===0&&i===0&&(this.state.status="victory",this.state.winner=this.playerId,this.emit({type:"game_over",winner:this.playerId}))}}function On(r){if(r===null)return Bt.neutral;if(r===0)return Bt.player;const e=Math.max(0,Number(r)-1);return Bt.botPalettes[e%Bt.botPalettes.length]??Bt.enemy}const hc="assets/stars/stars.png",fc="assets/stars/stars-special.png",Ji=9,Qi=6,Ys=11,qs=16,pc=420;function $s(){return Math.random()>.5}function Tr(r,e){return Math.random()*(e-r)+r}function Ks(r,e){return Math.floor(Tr(r,e+1))}function Zs(r){return new Promise((e,t)=>{const n=new Image;n.onload=()=>e(n),n.onerror=()=>t(new Error(`Failed to load ${r}`)),n.src=r})}function js(r,e,t,n,i){const a=[];for(let s=0;s<n;s++){const o=document.createElement("canvas");o.width=i,o.height=i;const l=o.getContext("2d");l.drawImage(r,s*e,0,e,t,0,0,i,i),l.globalCompositeOperation="source-in",l.fillStyle="#ffef9e",l.fillRect(0,0,i,i),a.push(o)}return a}class mc{stars=[];normalAtlas=null;specialAtlas=null;constructor(e,t,n=pc){this.loadAtlases(),this.createStars(e,t,n)}async loadAtlases(){try{const[e,t]=await Promise.all([Zs(hc),Zs(fc)]),n=e.naturalWidth/Ji,i=e.naturalHeight,a=t.naturalWidth/Qi,s=t.naturalHeight;this.normalAtlas={image:e,frameWidth:n,frameHeight:i,frameCount:Ji,yellowCache:js(e,n,i,Ji,Ys)},this.specialAtlas={image:t,frameWidth:a,frameHeight:s,frameCount:Qi,yellowCache:js(t,a,s,Qi,qs)}}catch{this.normalAtlas=null,this.specialAtlas=null}}createStars(e,t,n){this.stars=[];for(let i=0;i<n;i++){const a=$s();this.stars.push({x:Tr(0,e),y:Tr(0,t),isSpecial:a,frameIndex:a?Ks(0,Qi-1):Ks(0,Ji-1),color:$s()?"#ffef9e":"#ffffff",opacity:Tr(.1,1)})}}update(e){}render(e){if(!this.normalAtlas||!this.specialAtlas)return;const t=e.globalAlpha;for(const n of this.stars){const i=n.isSpecial?this.specialAtlas:this.normalAtlas;if(!i)continue;const a=n.isSpecial?qs:Ys,s=n.x-a/2,o=n.y-a/2;if(e.globalAlpha=n.opacity,n.color==="#ffef9e"){const l=i.yellowCache[n.frameIndex];l&&e.drawImage(l,s,o,a,a)}else{const l=n.frameIndex*i.frameWidth;e.drawImage(i.image,l,0,i.frameWidth,i.frameHeight,s,o,a,a)}}e.globalAlpha=t}resize(e,t,n){this.createStars(e,t,n??this.stars.length)}dispose(){this.stars=[],this.normalAtlas=null,this.specialAtlas=null}}const er={nebula:.02,stars:.05},tr={nebula:.1,stars:.2};class gc{starSprites=null;ensureStarSprites(e,t){this.starSprites||(this.starSprites=new mc(e,t))}render(e,t){const n=t.canvasWidth,i=t.canvasHeight;this.ensureStarSprites(n,i),this.starSprites&&this.starSprites.update(t.timeMs/1e3);const a=t.camera.getState();t.starfieldCanvas?(e.save(),this.applyParallaxTransform(e,a,er.nebula,tr.nebula,n,i),e.drawImage(t.starfieldCanvas,-500,-500,n+500*2,i+500*2),e.restore(),this.starSprites&&(e.save(),this.applyParallaxTransform(e,a,er.stars,tr.stars,n,i),this.starSprites.render(e),e.restore())):this.renderFallback(e,t,a)}applyParallaxTransform(e,t,n,i,a,s){const o=-t.x*n,l=-t.y*n,c=1+(t.zoom-1)*n,u=t.rotation*i*Math.PI/180;e.translate(a/2,s/2),e.rotate(u),e.scale(c,c),e.translate(o-a/2,l-s/2)}renderFallback(e,t,n){const i=Math.sin(t.timeMs*5e-4)*2,a=Math.cos(t.timeMs*4e-4)*2;e.fillStyle=Bt.bg,e.fillRect(-10,-10,t.canvasWidth+20,t.canvasHeight+20),e.save(),this.applyParallaxTransform(e,n,er.nebula,tr.nebula,t.canvasWidth,t.canvasHeight);for(const s of t.visualState.nebulae){const o=s.x+i,l=s.y+a,c=e.createRadialGradient(o,l,0,o,l,s.radius),u=s.color==="cyan"?"0,180,220":"180,30,60";c.addColorStop(0,`rgba(${u},${s.alpha*1.5})`),c.addColorStop(.5,`rgba(${u},${s.alpha*.5})`),c.addColorStop(1,"rgba(0,0,0,0)"),e.fillStyle=c,e.fillRect(o-s.radius,l-s.radius,s.radius*2,s.radius*2)}e.restore(),this.drawStars(e,t,i,a,n)}drawStars(e,t,n,i,a){e.save(),this.applyParallaxTransform(e,a,er.stars,tr.stars,t.canvasWidth,t.canvasHeight);for(const s of t.visualState.stars){const o=.5+.5*Math.sin(t.timeMs*s.twinkleSpeed+s.twinklePhase);e.globalAlpha=s.brightness*o,e.fillStyle=Bt.stars,e.beginPath(),e.arc(s.x+n,s.y+i,s.size,0,Math.PI*2),e.fill()}e.globalAlpha=1,e.restore()}}class vc{render(e,t){const n=t.dragState;if(!n&&!t.lassoState)return;e.save();const i=On(0).main;if(e.strokeStyle="rgba(0,229,255,0.35)",e.lineWidth=2,e.setLineDash([8,6]),e.lineDashOffset=-t.timeMs*.03,n)for(const s of n.fromPlanetIds){const o=t.gameState.planets.find(l=>l.id===s);o&&(e.beginPath(),e.moveTo(o.x,o.y),e.lineTo(n.current.x,n.current.y),e.stroke())}let a=!1;if(t.lassoState){const s=t.lassoState;t.camera.resetTransform(e),e.setLineDash([]),e.setTransform(1,0,0,1,0,0);const o=Math.min(s.startScreen.x,s.currentScreen.x),l=Math.min(s.startScreen.y,s.currentScreen.y),c=Math.abs(s.currentScreen.x-s.startScreen.x),u=Math.abs(s.currentScreen.y-s.startScreen.y);e.strokeStyle=i,e.globalAlpha=.6,e.lineWidth=2,e.setLineDash([8,6]),e.strokeRect(o,l,c,u),e.fillStyle=i,e.globalAlpha=.15,e.fillRect(o,l,c,u),e.globalAlpha=1,t.camera.applyTransform(e),a=!0}a||e.restore()}}function Js(r,e,t,n){return r+t>=n.minX&&r-t<=n.maxX&&e+t>=n.minY&&e-t<=n.maxY}class Qs{renderTrails;constructor(e){this.renderTrails=e}render(e,t){const n=t.camera.getWorldBoundsVisible();if(this.renderTrails){for(const i of t.visualState.trails)Js(i.x,i.y,8,n)&&(e.globalAlpha=i.life*.6,e.fillStyle=i.color,e.beginPath(),e.arc(i.x,i.y,i.size*i.life,0,Math.PI*2),e.fill());e.globalAlpha=1;return}for(const i of t.visualState.particles)Js(i.x,i.y,6,n)&&(e.globalAlpha=i.life,e.fillStyle=i.color,e.beginPath(),e.arc(i.x,i.y,i.size*i.life,0,Math.PI*2),e.fill());e.globalAlpha=1}}let _c=class{state;targetState;viewportWidth;viewportHeight;pivotX=0;pivotY=0;minZoom;maxZoom;constructor(e,t){this.viewportWidth=e,this.viewportHeight=t,this.minZoom=.5,this.maxZoom=3,this.state={x:0,y:0,zoom:1,rotation:0},this.targetState={x:0,y:0,zoom:1,rotation:0}}worldToScreen(e,t){return this.worldToScreenWithState(this.state,e,t)}worldToScreenWithState(e,t,n){const i=yi(e.rotation),a=t-this.pivotX,s=n-this.pivotY,o=a*Math.cos(i)-s*Math.sin(i),l=a*Math.sin(i)+s*Math.cos(i);return{x:(o+(this.pivotX-e.x))*e.zoom+this.viewportWidth/2,y:(l+(this.pivotY-e.y))*e.zoom+this.viewportHeight/2}}screenToWorld(e,t){return this.screenToWorldWithState(this.state,e,t)}screenToWorldWithState(e,t,n){const i=yi(e.rotation),a=(t-this.viewportWidth/2)/e.zoom-(this.pivotX-e.x),s=(n-this.viewportHeight/2)/e.zoom-(this.pivotY-e.y);return{x:this.pivotX+a*Math.cos(i)+s*Math.sin(i),y:this.pivotY-a*Math.sin(i)+s*Math.cos(i)}}worldToScreenScale(e){return e*this.state.zoom}applyTransform(e){e.save(),e.translate(this.viewportWidth/2,this.viewportHeight/2),e.scale(this.state.zoom,this.state.zoom),e.translate(this.pivotX-this.state.x,this.pivotY-this.state.y),e.rotate(yi(this.state.rotation)),e.translate(-this.pivotX,-this.pivotY)}resetTransform(e){e.restore()}pan(e,t){const n=e/this.state.zoom,i=t/this.state.zoom;this.targetState.x-=n,this.targetState.y-=i}zoomAt(e,t,n){const i=this.screenToWorldWithState(this.targetState,e,t);this.targetState.zoom=Yr(this.targetState.zoom*(1+n),this.minZoom,this.maxZoom);const a=this.screenToWorldWithState(this.targetState,e,t);this.targetState.x+=i.x-a.x,this.targetState.y+=i.y-a.y}setZoom(e){const t=Yr(e,this.minZoom,this.maxZoom);this.state.zoom=t,this.targetState.zoom=t}setPosition(e,t){this.state.x=e,this.state.y=t,this.targetState.x=e,this.targetState.y=t}setRotation(e){const t=Mi(e);this.state.rotation=t,this.targetState.rotation=t}rotateBy(e){this.targetState.rotation=Mi(this.targetState.rotation+e)}setPivot(e,t){this.pivotX=e,this.pivotY=t}getPivot(){return{x:this.pivotX,y:this.pivotY}}fitBounds(e,t=100,n=this.targetState.rotation){const i=(e.minX+e.maxX)/2,a=(e.minY+e.maxY)/2,s={x:i,y:a,zoom:1,rotation:Mi(n)},o=[this.worldToScreenWithState(s,e.minX,e.minY),this.worldToScreenWithState(s,e.maxX,e.minY),this.worldToScreenWithState(s,e.maxX,e.maxY),this.worldToScreenWithState(s,e.minX,e.maxY)],l=Math.min(...o.map(p=>p.x)),c=Math.max(...o.map(p=>p.x)),u=Math.min(...o.map(p=>p.y)),h=Math.max(...o.map(p=>p.y)),d=c-l,m=h-u,g=(this.viewportWidth-t*2)/Math.max(d,1),S=(this.viewportHeight-t*2)/Math.max(m,1),f=Yr(Math.min(g,S),this.minZoom,this.maxZoom);this.state.zoom=f,this.state.x=i,this.state.y=a,this.state.rotation=s.rotation,this.targetState.zoom=f,this.targetState.x=i,this.targetState.y=a,this.targetState.rotation=s.rotation}setViewport(e,t){this.viewportWidth=e,this.viewportHeight=t}update(e){const t=1-Math.pow(.5,e/10);this.state.x=qr(this.state.x,this.targetState.x,t),this.state.y=qr(this.state.y,this.targetState.y,t),this.state.zoom=qr(this.state.zoom,this.targetState.zoom,t);const n=xc(this.state.rotation,this.targetState.rotation);this.state.rotation=Mi(this.state.rotation+n*t)}getState(){return this.state}getZoom(){return this.state.zoom}getMinZoom(){return this.minZoom}getMaxZoom(){return this.maxZoom}getWorldBoundsVisible(){const e=[this.screenToWorld(0,0),this.screenToWorld(this.viewportWidth,0),this.screenToWorld(this.viewportWidth,this.viewportHeight),this.screenToWorld(0,this.viewportHeight)],t=48/Math.max(this.state.zoom,.001);return{minX:Math.min(...e.map(n=>n.x))-t,maxX:Math.max(...e.map(n=>n.x))+t,minY:Math.min(...e.map(n=>n.y))-t,maxY:Math.max(...e.map(n=>n.y))+t}}getViewport(){return{width:this.viewportWidth,height:this.viewportHeight}}};function Yr(r,e,t){return Math.max(e,Math.min(t,r))}function qr(r,e,t){return r+(e-r)*t}function yi(r){return r*Math.PI/180}function Mi(r){let e=r%360;return e<=-180?e+=360:e>180&&(e-=360),e}function xc(r,e){return Mi(e-r)}const Sc=new Intl.NumberFormat("en-US");function Bn(r){return Math.abs(r)>=1e3?`${(r/1e3).toFixed(1)}k`:Math.floor(r).toString()}function si(r){return Sc.format(Math.floor(r))}function Mc(r,e,t,n){return r+t>=n.minX&&r-t<=n.maxX&&e+t>=n.minY&&e-t<=n.maxY}class yc{render(e,t){const n=-yi(t.camera.getState().rotation),i=t.camera.getWorldBoundsVisible(),a=new Set;for(const s of t.gameState.fleets){const o=Math.min(Math.sqrt(s.units)*1.5,30),l=Math.max(20,o+10);if(!Mc(s.x,s.y,l,i))continue;const c=On(s.owner),h=t.gameState.planets.find(f=>f.id===s.toId)?.owner===s.owner,m=(h?6:8)+Math.min(Math.sqrt(s.units)*3.5,35),g=e.createRadialGradient(s.x,s.y,0,s.x,s.y,m);g.addColorStop(0,c.main),g.addColorStop(.4,h?"rgba(0,0,0,0.2)":c.glow),g.addColorStop(1,"rgba(0,0,0,0)"),e.fillStyle=g,e.beginPath(),e.arc(s.x,s.y,m,0,Math.PI*2),e.fill();const S=1.5+Math.min(Math.sqrt(s.units)*.5,6);if(e.fillStyle=c.main,e.beginPath(),e.arc(s.x,s.y,S,0,Math.PI*2),e.fill(),!h){e.save(),e.translate(s.x,s.y),e.rotate(s.angle),e.fillStyle=c.main,e.beginPath();const f=7+Math.min(Math.sqrt(s.units)*.3,4);e.moveTo(f,0),e.lineTo(1,-3),e.lineTo(1,3),e.closePath(),e.fill(),e.restore()}}for(let s=0;s<t.gameState.fleets.length;s+=1){if(a.has(s))continue;const o=t.gameState.fleets[s];if(!o)continue;let l=o.units,c=o.x,u=o.y,h=1;a.add(s);for(let g=s+1;g<t.gameState.fleets.length;g+=1){const S=t.gameState.fleets[g];!S||a.has(g)||S.owner===o.owner&&S.toId===o.toId&&Math.hypot(o.x-S.x,o.y-S.y)<=40&&(a.add(g),l+=S.units,c+=S.x,u+=S.y,h+=1)}const d=c/h,m=u/h;e.save(),e.translate(d,m-10),e.rotate(n),e.fillStyle="#fff",e.font=`bold ${h>1?12:10}px 'Exo 2', sans-serif`,e.textAlign="center",e.fillText(Bn(l),0,0),e.restore()}}}function bc(r,e,t,n,i=50){return r+t+i>=n.minX&&r-t-i<=n.maxX&&e+t+i>=n.minY&&e-t-i<=n.maxY}function Ec(r){const e=r.camera.worldToScreen(0,0),t=r.camera.screenToWorld(e.x,e.y-1),n=t.x,i=t.y,a=Math.hypot(n,i)||1;return{x:n/a,y:i/a}}class Tc{render(e,t){const n=-yi(t.camera.getState().rotation),i=Ec(t),a=t.camera.getWorldBoundsVisible();for(const s of t.gameState.planets){if(!bc(s.x,s.y,s.radius,a,100))continue;const o=t.visualState.planetVisuals.get(s.id);if(!o)continue;const l=On(s.owner),c=1,u=t.selectedPlanetIds.has(s.id),h=t.hoverPlanetId===s.id,d=t.gameState.fleets.some(y=>y.toId===s.id&&y.owner!==s.owner&&s.owner===0),m=s.owner!==null&&s.type!=="sun"&&s.effectiveProductionRate>s.productionRate+.001,g=l.main,S=o.previousOwner===null?g:On(o.previousOwner).main,f=Wr(o.colorTransitionMs/300,0,1),p=f>0?this.mixHex(S,g,1-f):g,M=t.planetTextures?.get(s.id),T=M?`rgba(${Math.floor(M.dominantColor[0]*255)}, ${Math.floor(M.dominantColor[1]*255)}, ${Math.floor(M.dominantColor[2]*255)}, 0.5)`:l.glow,E=s.isSun?s.radius*(2.05+.08*Math.sin(t.timeMs*.002)):s.radius*1.8*c,R=e.createRadialGradient(s.x,s.y,s.radius*.6,s.x,s.y,E);if(R.addColorStop(0,T),R.addColorStop(1,"rgba(0,0,0,0)"),e.fillStyle=R,e.beginPath(),e.arc(s.x,s.y,E,0,Math.PI*2),e.fill(),o.captureFlash>0&&(e.globalAlpha=o.captureFlash*.5,e.fillStyle=l.main,e.beginPath(),e.arc(s.x,s.y,s.radius*2.5*(1-o.captureFlash*.5),0,Math.PI*2),e.fill(),e.globalAlpha=1),M){const y=s.isSun?2:1,W=s.radius*2*c*y;e.save(),e.beginPath(),e.arc(s.x,s.y,s.radius*c,0,Math.PI*2),e.clip(),e.drawImage(M.image,s.x-W/2,s.y-W/2,W,W),e.restore()}else e.fillStyle=s.owner===null?"#1a2333":l.dark,e.beginPath(),e.arc(s.x,s.y,s.radius*c,0,Math.PI*2),e.fill();if(e.strokeStyle=p,e.lineWidth=u?3.5:h?2.5:1.8,e.globalAlpha=u?1:.8,e.beginPath(),e.arc(s.x,s.y,s.radius*c,0,Math.PI*2),e.stroke(),e.globalAlpha=1,u&&(e.strokeStyle=p,e.lineWidth=1.5,e.globalAlpha=.5+.3*Math.sin(t.timeMs*.0065),e.beginPath(),e.arc(s.x,s.y,s.radius*1.35,0,Math.PI*2),e.stroke(),e.globalAlpha=1),s.owner!==null){const y=t.camera.getState().zoom,W=Xt.avatarScreenDiameterHomeworld/2,A=Xt.avatarScreenDiameterSun/2,B=Xt.avatarScreenDiameterNonHomeMin/2,V=Xt.avatarScreenDiameterNonHomeMax/2,X=(s.radius-It.planetMinRadius)/(It.planetMaxRadius-It.planetMinRadius),O=B+(V-B)*Wr(X,0,1),U=(s.isSun?A:s.isHomeworld?W:O)/y,Q=s.radius+U+16,Z=s.x+i.x*Q,ce=s.y+i.y*Q,pe=s.x+i.x*s.radius,ue=s.y+i.y*s.radius;e.save(),e.translate(Z,ce),e.rotate(n),e.strokeStyle=l.main,e.globalAlpha=.3,e.lineWidth=1,e.beginPath(),e.moveTo(pe-Z,ue-ce),e.lineTo(0,U),e.stroke(),e.globalAlpha=1,e.fillStyle=l.dark,e.beginPath(),e.arc(0,0,U,0,Math.PI*2),e.fill(),e.strokeStyle=l.main,e.lineWidth=1.5,e.beginPath(),e.arc(0,0,U,0,Math.PI*2),e.stroke(),e.fillStyle=l.main,e.globalAlpha=.4;const Ce=U*.55;e.beginPath(),e.arc(0,-Ce*.2,Ce*.4,0,Math.PI*2),e.fill(),e.beginPath(),e.arc(0,Ce*.45,Ce*.6,Math.PI,0),e.fill(),e.globalAlpha=1,e.restore()}if(s.owner!==null){const y=Wr(s.units/s.maxUnits,0,1),W=yi(t.camera.getState().rotation),A=-Math.PI/2-W,B=A+Math.PI*2*y;e.strokeStyle=l.main,e.lineWidth=2.5,e.globalAlpha=.5+o.productionFlash,e.beginPath(),e.arc(s.x,s.y,s.radius+6,A,B),e.stroke(),e.globalAlpha=1}if(s.isSun){const y=.55+.15*Math.sin(t.timeMs*.003);e.strokeStyle="rgba(255,215,64,0.85)",e.lineWidth=2.5,e.globalAlpha=y,e.beginPath(),e.arc(s.x,s.y,s.radius+8,0,Math.PI*2),e.stroke(),e.strokeStyle="rgba(255,244,200,0.5)",e.lineWidth=1.4,e.globalAlpha=y*.8,e.beginPath(),e.arc(s.x,s.y,s.radius+14,0,Math.PI*2),e.stroke(),e.globalAlpha=1}else m&&(e.fillStyle="rgba(255,215,64,0.9)",e.beginPath(),e.arc(s.x+s.radius*.7,s.y-s.radius*.72,3.2,0,Math.PI*2),e.fill());d&&(e.strokeStyle="rgba(255,23,68,0.35)",e.lineWidth=2,e.globalAlpha=.4+.2*Math.sin(t.timeMs*.01),e.beginPath(),e.arc(s.x,s.y,s.radius+12,0,Math.PI*2),e.stroke(),e.globalAlpha=1),s.isHomeworld&&(e.save(),e.translate(s.x,s.y),e.rotate(n),e.font="bold 56px 'Exo 2', sans-serif",e.textAlign="center",e.textBaseline="middle",e.shadowColor="rgba(0, 0, 0, 0.9)",e.shadowBlur=8,e.shadowOffsetX=0,e.shadowOffsetY=3,e.strokeStyle="rgba(0, 0, 0, 0.8)",e.lineWidth=3,e.lineJoin="round",e.strokeText("♛",0,0),e.fillStyle="rgba(255,215,64,0.95)",e.fillText("♛",0,0),e.shadowBlur=0,e.shadowOffsetX=0,e.shadowOffsetY=0,e.restore());const C=s.radius+28,P=s.x-i.x*C,_=s.y-i.y*C;e.save(),e.translate(P,_),e.rotate(n),e.fillStyle="#fff",e.font=`bold ${s.radius>35?40:32}px 'Exo 2', sans-serif`,e.textAlign="center",e.textBaseline="middle",e.shadowColor="rgba(0,0,0,0.9)",e.shadowBlur=10,e.shadowOffsetX=2,e.shadowOffsetY=2,e.fillText(Bn(s.units),0,0),e.shadowBlur=0,e.shadowOffsetX=0,e.shadowOffsetY=0,e.restore()}}mixHex(e,t,n){const i=this.hexToRgb(e),a=this.hexToRgb(t),s=Math.round(i.r+(a.r-i.r)*n),o=Math.round(i.g+(a.g-i.g)*n),l=Math.round(i.b+(a.b-i.b)*n);return`rgb(${s}, ${o}, ${l})`}hexToRgb(e){const t=e.replace("#",""),n=Number.parseInt(t,16);return{r:n>>16&255,g:n>>8&255,b:n&255}}}class Ac{render(e,t){const n=t.gameState.planets.filter(l=>l.owner===0).length,i=t.gameState.planets.filter(l=>l.owner!==null&&l.owner!==0).length,a=t.gameState.planets.filter(l=>l.owner===null).length,s=Math.floor(t.gameState.planets.filter(l=>l.owner===0).reduce((l,c)=>l+c.units,0)),o=Math.floor(t.gameState.planets.filter(l=>l.owner!==null&&l.owner!==0).reduce((l,c)=>l+c.units,0));e.fillStyle="rgba(5,8,15,0.7)",e.fillRect(0,0,t.canvasWidth,Xt.uiBarHeight),e.strokeStyle="rgba(0,229,255,0.15)",e.lineWidth=1,e.beginPath(),e.moveTo(0,Xt.uiBarHeight),e.lineTo(t.canvasWidth,Xt.uiBarHeight),e.stroke(),e.font="bold 13px 'Exo 2', sans-serif",e.textBaseline="middle",e.textAlign="left",e.fillStyle=Bt.player.main,e.fillText("⬡ YOU",16,21),e.fillStyle="#aaa",e.fillText(`${n} planets  ·  ${Bn(s)} units`,80,21),e.textAlign="right",e.fillStyle=Bt.enemy.main,e.fillText("BOTS ⬡",t.canvasWidth-16,21),e.fillStyle="#aaa",e.fillText(`${i} planets  ·  ${Bn(o)} units`,t.canvasWidth-80,21),e.textAlign="center",e.fillStyle="#546e7a",e.fillText(`${a} neutral`,t.canvasWidth/2,21)}}const pt=[{id:"noatmosphere",name:"Barren",minRadius:24,maxRadius:44,rarity:3},{id:"earth",name:"Earth",minRadius:36,maxRadius:54,rarity:3},{id:"ice",name:"Ice Planet",minRadius:28,maxRadius:46,rarity:2},{id:"lava",name:"Lava Planet",minRadius:36,maxRadius:54,rarity:2},{id:"gasgiant",name:"Gas Giant",minRadius:44,maxRadius:64,rarity:2},{id:"gasgiantring",name:"Gas Giant Ring",minRadius:48,maxRadius:64,rarity:1},{id:"dry",name:"Dry Planet",minRadius:30,maxRadius:52,rarity:3},{id:"asteroid",name:"Asteroid",minRadius:20,maxRadius:34,rarity:2},{id:"star",name:"Star",minRadius:24,maxRadius:36,rarity:1}],nl=pt.map(r=>r.id);function wc(r,e){const t=Number(r.id);switch(r.type){case"sun":return pt.find(n=>n.id==="star")??pt[0];case"homeworld":return r.owner===0?pt.find(n=>n.id==="earth")??pt[0]:pt.find(n=>n.id==="lava")??pt[0];case"gasGiant":return pt.find(n=>n.id===(t%2===0?"gasgiant":"gasgiantring"))??pt[0];case"lavaWorld":return pt.find(n=>n.id==="lava")??pt[0];case"terran":return pt.find(n=>n.id==="earth")??pt[0];case"iceWorld":return pt.find(n=>n.id==="ice")??pt[0];case"dryTerran":return pt.find(n=>n.id==="dry")??pt[0];case"barren":return pt.find(n=>n.id===(t%2===0?"noatmosphere":"asteroid"))??pt[0]}}const Ss="183",Cc=0,eo=1,Rc=2,Ar=1,Pc=2,Vi=3,Vn=0,Lt=1,_n=2,Sn=0,bi=1,to=2,no=3,io=4,Dc=5,jn=100,Ic=101,Lc=102,Uc=103,Nc=104,Fc=200,Oc=201,Bc=202,zc=203,Ca=204,Ra=205,Vc=206,kc=207,Gc=208,Hc=209,Wc=210,Xc=211,Yc=212,qc=213,$c=214,Pa=0,Da=1,Ia=2,Ti=3,La=4,Ua=5,Na=6,Fa=7,il=0,Kc=1,Zc=2,on=0,rl=1,al=2,sl=3,ol=4,ll=5,cl=6,ul=7,dl=300,ni=301,Ai=302,$r=303,Kr=304,Fr=306,Oa=1e3,xn=1001,Ba=1002,ut=1003,jc=1004,nr=1005,At=1006,Zr=1007,Qn=1008,Dt=1009,hl=1010,fl=1011,Hi=1012,Ms=1013,un=1014,an=1015,bn=1016,ys=1017,bs=1018,Wi=1020,pl=35902,ml=35899,gl=1021,vl=1022,zt=1023,En=1026,ei=1027,_l=1028,Es=1029,wi=1030,Ts=1031,As=1033,wr=33776,Cr=33777,Rr=33778,Pr=33779,za=35840,Va=35841,ka=35842,Ga=35843,Ha=36196,Wa=37492,Xa=37496,Ya=37488,qa=37489,$a=37490,Ka=37491,Za=37808,ja=37809,Ja=37810,Qa=37811,es=37812,ts=37813,ns=37814,is=37815,rs=37816,as=37817,ss=37818,os=37819,ls=37820,cs=37821,us=36492,ds=36494,hs=36495,fs=36283,ps=36284,ms=36285,gs=36286,Jc=3200,Qc=0,eu=1,Fn="",Wt="srgb",Ci="srgb-linear",Ir="linear",Ze="srgb",oi=7680,ro=519,tu=512,nu=513,iu=514,ws=515,ru=516,au=517,Cs=518,su=519,ao=35044,so="300 es",sn=2e3,Lr=2001;function ou(r){for(let e=r.length-1;e>=0;--e)if(r[e]>=65535)return!0;return!1}function Ur(r){return document.createElementNS("http://www.w3.org/1999/xhtml",r)}function lu(){const r=Ur("canvas");return r.style.display="block",r}const oo={};function lo(...r){const e="THREE."+r.shift();console.log(e,...r)}function xl(r){const e=r[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=r[1];t&&t.isStackTrace?r[0]+=" "+t.getLocation():r[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return r}function De(...r){r=xl(r);const e="THREE."+r.shift();{const t=r[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...r)}}function Ye(...r){r=xl(r);const e="THREE."+r.shift();{const t=r[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...r)}}function Nr(...r){const e=r.join(" ");e in oo||(oo[e]=!0,De(...r))}function cu(r,e,t){return new Promise(function(n,i){function a(){switch(r.clientWaitSync(e,r.SYNC_FLUSH_COMMANDS_BIT,0)){case r.WAIT_FAILED:i();break;case r.TIMEOUT_EXPIRED:setTimeout(a,t);break;default:n()}}setTimeout(a,t)})}const uu={[Pa]:Da,[Ia]:Na,[La]:Fa,[Ti]:Ua,[Da]:Pa,[Na]:Ia,[Fa]:La,[Ua]:Ti};class Pi{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){const n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){const n=this._listeners;if(n===void 0)return;const i=n[e];if(i!==void 0){const a=i.indexOf(t);a!==-1&&i.splice(a,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const n=t[e.type];if(n!==void 0){e.target=this;const i=n.slice(0);for(let a=0,s=i.length;a<s;a++)i[a].call(this,e);e.target=null}}}const Et=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],jr=Math.PI/180,vs=180/Math.PI;function Yi(){const r=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Et[r&255]+Et[r>>8&255]+Et[r>>16&255]+Et[r>>24&255]+"-"+Et[e&255]+Et[e>>8&255]+"-"+Et[e>>16&15|64]+Et[e>>24&255]+"-"+Et[t&63|128]+Et[t>>8&255]+"-"+Et[t>>16&255]+Et[t>>24&255]+Et[n&255]+Et[n>>8&255]+Et[n>>16&255]+Et[n>>24&255]).toLowerCase()}function Ge(r,e,t){return Math.max(e,Math.min(t,r))}function du(r,e){return(r%e+e)%e}function Jr(r,e,t){return(1-t)*r+t*e}function Li(r,e){switch(e.constructor){case Float32Array:return r;case Uint32Array:return r/4294967295;case Uint16Array:return r/65535;case Uint8Array:return r/255;case Int32Array:return Math.max(r/2147483647,-1);case Int16Array:return Math.max(r/32767,-1);case Int8Array:return Math.max(r/127,-1);default:throw new Error("Invalid component type.")}}function Rt(r,e){switch(e.constructor){case Float32Array:return r;case Uint32Array:return Math.round(r*4294967295);case Uint16Array:return Math.round(r*65535);case Uint8Array:return Math.round(r*255);case Int32Array:return Math.round(r*2147483647);case Int16Array:return Math.round(r*32767);case Int8Array:return Math.round(r*127);default:throw new Error("Invalid component type.")}}class ke{constructor(e=0,t=0){ke.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ge(this.x,e.x,t.x),this.y=Ge(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ge(this.x,e,t),this.y=Ge(this.y,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Ge(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Ge(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),i=Math.sin(t),a=this.x-e.x,s=this.y-e.y;return this.x=a*n-s*i+e.x,this.y=a*i+s*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Di{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,a,s,o){let l=n[i+0],c=n[i+1],u=n[i+2],h=n[i+3],d=a[s+0],m=a[s+1],g=a[s+2],S=a[s+3];if(h!==S||l!==d||c!==m||u!==g){let f=l*d+c*m+u*g+h*S;f<0&&(d=-d,m=-m,g=-g,S=-S,f=-f);let p=1-o;if(f<.9995){const M=Math.acos(f),T=Math.sin(M);p=Math.sin(p*M)/T,o=Math.sin(o*M)/T,l=l*p+d*o,c=c*p+m*o,u=u*p+g*o,h=h*p+S*o}else{l=l*p+d*o,c=c*p+m*o,u=u*p+g*o,h=h*p+S*o;const M=1/Math.sqrt(l*l+c*c+u*u+h*h);l*=M,c*=M,u*=M,h*=M}}e[t]=l,e[t+1]=c,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,n,i,a,s){const o=n[i],l=n[i+1],c=n[i+2],u=n[i+3],h=a[s],d=a[s+1],m=a[s+2],g=a[s+3];return e[t]=o*g+u*h+l*m-c*d,e[t+1]=l*g+u*d+c*h-o*m,e[t+2]=c*g+u*m+o*d-l*h,e[t+3]=u*g-o*h-l*d-c*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,i=e._y,a=e._z,s=e._order,o=Math.cos,l=Math.sin,c=o(n/2),u=o(i/2),h=o(a/2),d=l(n/2),m=l(i/2),g=l(a/2);switch(s){case"XYZ":this._x=d*u*h+c*m*g,this._y=c*m*h-d*u*g,this._z=c*u*g+d*m*h,this._w=c*u*h-d*m*g;break;case"YXZ":this._x=d*u*h+c*m*g,this._y=c*m*h-d*u*g,this._z=c*u*g-d*m*h,this._w=c*u*h+d*m*g;break;case"ZXY":this._x=d*u*h-c*m*g,this._y=c*m*h+d*u*g,this._z=c*u*g+d*m*h,this._w=c*u*h-d*m*g;break;case"ZYX":this._x=d*u*h-c*m*g,this._y=c*m*h+d*u*g,this._z=c*u*g-d*m*h,this._w=c*u*h+d*m*g;break;case"YZX":this._x=d*u*h+c*m*g,this._y=c*m*h+d*u*g,this._z=c*u*g-d*m*h,this._w=c*u*h-d*m*g;break;case"XZY":this._x=d*u*h-c*m*g,this._y=c*m*h-d*u*g,this._z=c*u*g+d*m*h,this._w=c*u*h+d*m*g;break;default:De("Quaternion: .setFromEuler() encountered an unknown order: "+s)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],i=t[4],a=t[8],s=t[1],o=t[5],l=t[9],c=t[2],u=t[6],h=t[10],d=n+o+h;if(d>0){const m=.5/Math.sqrt(d+1);this._w=.25/m,this._x=(u-l)*m,this._y=(a-c)*m,this._z=(s-i)*m}else if(n>o&&n>h){const m=2*Math.sqrt(1+n-o-h);this._w=(u-l)/m,this._x=.25*m,this._y=(i+s)/m,this._z=(a+c)/m}else if(o>h){const m=2*Math.sqrt(1+o-n-h);this._w=(a-c)/m,this._x=(i+s)/m,this._y=.25*m,this._z=(l+u)/m}else{const m=2*Math.sqrt(1+h-n-o);this._w=(s-i)/m,this._x=(a+c)/m,this._y=(l+u)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ge(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,i=e._y,a=e._z,s=e._w,o=t._x,l=t._y,c=t._z,u=t._w;return this._x=n*u+s*o+i*c-a*l,this._y=i*u+s*l+a*o-n*c,this._z=a*u+s*c+n*l-i*o,this._w=s*u-n*o-i*l-a*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,i=e._y,a=e._z,s=e._w,o=this.dot(e);o<0&&(n=-n,i=-i,a=-a,s=-s,o=-o);let l=1-t;if(o<.9995){const c=Math.acos(o),u=Math.sin(c);l=Math.sin(l*c)/u,t=Math.sin(t*c)/u,this._x=this._x*l+n*t,this._y=this._y*l+i*t,this._z=this._z*l+a*t,this._w=this._w*l+s*t,this._onChangeCallback()}else this._x=this._x*l+n*t,this._y=this._y*l+i*t,this._z=this._z*l+a*t,this._w=this._w*l+s*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),a=Math.sqrt(n);return this.set(i*Math.sin(e),i*Math.cos(e),a*Math.sin(t),a*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class z{constructor(e=0,t=0,n=0){z.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(co.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(co.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,i=this.z,a=e.elements;return this.x=a[0]*t+a[3]*n+a[6]*i,this.y=a[1]*t+a[4]*n+a[7]*i,this.z=a[2]*t+a[5]*n+a[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,a=e.elements,s=1/(a[3]*t+a[7]*n+a[11]*i+a[15]);return this.x=(a[0]*t+a[4]*n+a[8]*i+a[12])*s,this.y=(a[1]*t+a[5]*n+a[9]*i+a[13])*s,this.z=(a[2]*t+a[6]*n+a[10]*i+a[14])*s,this}applyQuaternion(e){const t=this.x,n=this.y,i=this.z,a=e.x,s=e.y,o=e.z,l=e.w,c=2*(s*i-o*n),u=2*(o*t-a*i),h=2*(a*n-s*t);return this.x=t+l*c+s*h-o*u,this.y=n+l*u+o*c-a*h,this.z=i+l*h+a*u-s*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,i=this.z,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*i,this.y=a[1]*t+a[5]*n+a[9]*i,this.z=a[2]*t+a[6]*n+a[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ge(this.x,e.x,t.x),this.y=Ge(this.y,e.y,t.y),this.z=Ge(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ge(this.x,e,t),this.y=Ge(this.y,e,t),this.z=Ge(this.z,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Ge(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,i=e.y,a=e.z,s=t.x,o=t.y,l=t.z;return this.x=i*l-a*o,this.y=a*s-n*l,this.z=n*o-i*s,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Qr.copy(this).projectOnVector(e),this.sub(Qr)}reflect(e){return this.sub(Qr.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Ge(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Qr=new z,co=new Di;class Ue{constructor(e,t,n,i,a,s,o,l,c){Ue.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,i,a,s,o,l,c)}set(e,t,n,i,a,s,o,l,c){const u=this.elements;return u[0]=e,u[1]=i,u[2]=o,u[3]=t,u[4]=a,u[5]=l,u[6]=n,u[7]=s,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,a=this.elements,s=n[0],o=n[3],l=n[6],c=n[1],u=n[4],h=n[7],d=n[2],m=n[5],g=n[8],S=i[0],f=i[3],p=i[6],M=i[1],T=i[4],E=i[7],R=i[2],C=i[5],P=i[8];return a[0]=s*S+o*M+l*R,a[3]=s*f+o*T+l*C,a[6]=s*p+o*E+l*P,a[1]=c*S+u*M+h*R,a[4]=c*f+u*T+h*C,a[7]=c*p+u*E+h*P,a[2]=d*S+m*M+g*R,a[5]=d*f+m*T+g*C,a[8]=d*p+m*E+g*P,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],i=e[2],a=e[3],s=e[4],o=e[5],l=e[6],c=e[7],u=e[8];return t*s*u-t*o*c-n*a*u+n*o*l+i*a*c-i*s*l}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],a=e[3],s=e[4],o=e[5],l=e[6],c=e[7],u=e[8],h=u*s-o*c,d=o*l-u*a,m=c*a-s*l,g=t*h+n*d+i*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const S=1/g;return e[0]=h*S,e[1]=(i*c-u*n)*S,e[2]=(o*n-i*s)*S,e[3]=d*S,e[4]=(u*t-i*l)*S,e[5]=(i*a-o*t)*S,e[6]=m*S,e[7]=(n*l-c*t)*S,e[8]=(s*t-n*a)*S,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,a,s,o){const l=Math.cos(a),c=Math.sin(a);return this.set(n*l,n*c,-n*(l*s+c*o)+s+e,-i*c,i*l,-i*(-c*s+l*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(ea.makeScale(e,t)),this}rotate(e){return this.premultiply(ea.makeRotation(-e)),this}translate(e,t){return this.premultiply(ea.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const ea=new Ue,uo=new Ue().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),ho=new Ue().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function hu(){const r={enabled:!0,workingColorSpace:Ci,spaces:{},convert:function(i,a,s){return this.enabled===!1||a===s||!a||!s||(this.spaces[a].transfer===Ze&&(i.r=Mn(i.r),i.g=Mn(i.g),i.b=Mn(i.b)),this.spaces[a].primaries!==this.spaces[s].primaries&&(i.applyMatrix3(this.spaces[a].toXYZ),i.applyMatrix3(this.spaces[s].fromXYZ)),this.spaces[s].transfer===Ze&&(i.r=Ei(i.r),i.g=Ei(i.g),i.b=Ei(i.b))),i},workingToColorSpace:function(i,a){return this.convert(i,this.workingColorSpace,a)},colorSpaceToWorking:function(i,a){return this.convert(i,a,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===Fn?Ir:this.spaces[i].transfer},getToneMappingMode:function(i){return this.spaces[i].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(i,a=this.workingColorSpace){return i.fromArray(this.spaces[a].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,a,s){return i.copy(this.spaces[a].toXYZ).multiply(this.spaces[s].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(i,a){return Nr("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),r.workingToColorSpace(i,a)},toWorkingColorSpace:function(i,a){return Nr("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),r.colorSpaceToWorking(i,a)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return r.define({[Ci]:{primaries:e,whitePoint:n,transfer:Ir,toXYZ:uo,fromXYZ:ho,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Wt},outputColorSpaceConfig:{drawingBufferColorSpace:Wt}},[Wt]:{primaries:e,whitePoint:n,transfer:Ze,toXYZ:uo,fromXYZ:ho,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Wt}}}),r}const We=hu();function Mn(r){return r<.04045?r*.0773993808:Math.pow(r*.9478672986+.0521327014,2.4)}function Ei(r){return r<.0031308?r*12.92:1.055*Math.pow(r,.41666)-.055}let li;class fu{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{li===void 0&&(li=Ur("canvas")),li.width=e.width,li.height=e.height;const i=li.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),n=li}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Ur("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const i=n.getImageData(0,0,e.width,e.height),a=i.data;for(let s=0;s<a.length;s++)a[s]=Mn(a[s]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Mn(t[n]/255)*255):t[n]=Mn(t[n]);return{data:t,width:e.width,height:e.height}}else return De("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let pu=0;class Rs{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:pu++}),this.uuid=Yi(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayHeight,t.displayWidth,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let a;if(Array.isArray(i)){a=[];for(let s=0,o=i.length;s<o;s++)i[s].isDataTexture?a.push(ta(i[s].image)):a.push(ta(i[s]))}else a=ta(i);n.url=a}return t||(e.images[this.uuid]=n),n}}function ta(r){return typeof HTMLImageElement<"u"&&r instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&r instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&r instanceof ImageBitmap?fu.getDataURL(r):r.data?{data:Array.from(r.data),width:r.width,height:r.height,type:r.data.constructor.name}:(De("Texture: Unable to serialize Texture."),{})}let mu=0;const na=new z;class Ct extends Pi{constructor(e=Ct.DEFAULT_IMAGE,t=Ct.DEFAULT_MAPPING,n=xn,i=xn,a=At,s=Qn,o=zt,l=Dt,c=Ct.DEFAULT_ANISOTROPY,u=Fn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:mu++}),this.uuid=Yi(),this.name="",this.source=new Rs(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=a,this.minFilter=s,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ke(0,0),this.repeat=new ke(1,1),this.center=new ke(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ue,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(na).x}get height(){return this.source.getSize(na).y}get depth(){return this.source.getSize(na).z}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const n=e[t];if(n===void 0){De(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const i=this[t];if(i===void 0){De(`Texture.setValues(): property '${t}' does not exist.`);continue}i&&n&&i.isVector2&&n.isVector2||i&&n&&i.isVector3&&n.isVector3||i&&n&&i.isMatrix3&&n.isMatrix3?i.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==dl)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Oa:e.x=e.x-Math.floor(e.x);break;case xn:e.x=e.x<0?0:1;break;case Ba:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Oa:e.y=e.y-Math.floor(e.y);break;case xn:e.y=e.y<0?0:1;break;case Ba:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Ct.DEFAULT_IMAGE=null;Ct.DEFAULT_MAPPING=dl;Ct.DEFAULT_ANISOTROPY=1;class ot{constructor(e=0,t=0,n=0,i=1){ot.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,a=this.w,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*i+s[12]*a,this.y=s[1]*t+s[5]*n+s[9]*i+s[13]*a,this.z=s[2]*t+s[6]*n+s[10]*i+s[14]*a,this.w=s[3]*t+s[7]*n+s[11]*i+s[15]*a,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,a;const l=e.elements,c=l[0],u=l[4],h=l[8],d=l[1],m=l[5],g=l[9],S=l[2],f=l[6],p=l[10];if(Math.abs(u-d)<.01&&Math.abs(h-S)<.01&&Math.abs(g-f)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+S)<.1&&Math.abs(g+f)<.1&&Math.abs(c+m+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const T=(c+1)/2,E=(m+1)/2,R=(p+1)/2,C=(u+d)/4,P=(h+S)/4,_=(g+f)/4;return T>E&&T>R?T<.01?(n=0,i=.707106781,a=.707106781):(n=Math.sqrt(T),i=C/n,a=P/n):E>R?E<.01?(n=.707106781,i=0,a=.707106781):(i=Math.sqrt(E),n=C/i,a=_/i):R<.01?(n=.707106781,i=.707106781,a=0):(a=Math.sqrt(R),n=P/a,i=_/a),this.set(n,i,a,t),this}let M=Math.sqrt((f-g)*(f-g)+(h-S)*(h-S)+(d-u)*(d-u));return Math.abs(M)<.001&&(M=1),this.x=(f-g)/M,this.y=(h-S)/M,this.z=(d-u)/M,this.w=Math.acos((c+m+p-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ge(this.x,e.x,t.x),this.y=Ge(this.y,e.y,t.y),this.z=Ge(this.z,e.z,t.z),this.w=Ge(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ge(this.x,e,t),this.y=Ge(this.y,e,t),this.z=Ge(this.z,e,t),this.w=Ge(this.w,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Ge(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class gu extends Pi{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:At,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new ot(0,0,e,t),this.scissorTest=!1,this.viewport=new ot(0,0,e,t),this.textures=[];const i={width:e,height:t,depth:n.depth},a=new Ct(i),s=n.count;for(let o=0;o<s;o++)this.textures[o]=a.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(e={}){const t={minFilter:At,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let i=0,a=this.textures.length;i<a;i++)this.textures[i].image.width=e,this.textures[i].image.height=t,this.textures[i].image.depth=n,this.textures[i].isData3DTexture!==!0&&(this.textures[i].isArrayTexture=this.textures[i].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const i=Object.assign({},e.textures[t].image);this.textures[t].source=new Rs(i)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class ln extends gu{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class Sl extends Ct{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=ut,this.minFilter=ut,this.wrapR=xn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class vu extends Ct{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=ut,this.minFilter=ut,this.wrapR=xn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class mt{constructor(e,t,n,i,a,s,o,l,c,u,h,d,m,g,S,f){mt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,i,a,s,o,l,c,u,h,d,m,g,S,f)}set(e,t,n,i,a,s,o,l,c,u,h,d,m,g,S,f){const p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=i,p[1]=a,p[5]=s,p[9]=o,p[13]=l,p[2]=c,p[6]=u,p[10]=h,p[14]=d,p[3]=m,p[7]=g,p[11]=S,p[15]=f,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new mt().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinant()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinant()===0)return this.identity();const t=this.elements,n=e.elements,i=1/ci.setFromMatrixColumn(e,0).length(),a=1/ci.setFromMatrixColumn(e,1).length(),s=1/ci.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*a,t[5]=n[5]*a,t[6]=n[6]*a,t[7]=0,t[8]=n[8]*s,t[9]=n[9]*s,t[10]=n[10]*s,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,i=e.y,a=e.z,s=Math.cos(n),o=Math.sin(n),l=Math.cos(i),c=Math.sin(i),u=Math.cos(a),h=Math.sin(a);if(e.order==="XYZ"){const d=s*u,m=s*h,g=o*u,S=o*h;t[0]=l*u,t[4]=-l*h,t[8]=c,t[1]=m+g*c,t[5]=d-S*c,t[9]=-o*l,t[2]=S-d*c,t[6]=g+m*c,t[10]=s*l}else if(e.order==="YXZ"){const d=l*u,m=l*h,g=c*u,S=c*h;t[0]=d+S*o,t[4]=g*o-m,t[8]=s*c,t[1]=s*h,t[5]=s*u,t[9]=-o,t[2]=m*o-g,t[6]=S+d*o,t[10]=s*l}else if(e.order==="ZXY"){const d=l*u,m=l*h,g=c*u,S=c*h;t[0]=d-S*o,t[4]=-s*h,t[8]=g+m*o,t[1]=m+g*o,t[5]=s*u,t[9]=S-d*o,t[2]=-s*c,t[6]=o,t[10]=s*l}else if(e.order==="ZYX"){const d=s*u,m=s*h,g=o*u,S=o*h;t[0]=l*u,t[4]=g*c-m,t[8]=d*c+S,t[1]=l*h,t[5]=S*c+d,t[9]=m*c-g,t[2]=-c,t[6]=o*l,t[10]=s*l}else if(e.order==="YZX"){const d=s*l,m=s*c,g=o*l,S=o*c;t[0]=l*u,t[4]=S-d*h,t[8]=g*h+m,t[1]=h,t[5]=s*u,t[9]=-o*u,t[2]=-c*u,t[6]=m*h+g,t[10]=d-S*h}else if(e.order==="XZY"){const d=s*l,m=s*c,g=o*l,S=o*c;t[0]=l*u,t[4]=-h,t[8]=c*u,t[1]=d*h+S,t[5]=s*u,t[9]=m*h-g,t[2]=g*h-m,t[6]=o*u,t[10]=S*h+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(_u,e,xu)}lookAt(e,t,n){const i=this.elements;return Ft.subVectors(e,t),Ft.lengthSq()===0&&(Ft.z=1),Ft.normalize(),Pn.crossVectors(n,Ft),Pn.lengthSq()===0&&(Math.abs(n.z)===1?Ft.x+=1e-4:Ft.z+=1e-4,Ft.normalize(),Pn.crossVectors(n,Ft)),Pn.normalize(),ir.crossVectors(Ft,Pn),i[0]=Pn.x,i[4]=ir.x,i[8]=Ft.x,i[1]=Pn.y,i[5]=ir.y,i[9]=Ft.y,i[2]=Pn.z,i[6]=ir.z,i[10]=Ft.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,a=this.elements,s=n[0],o=n[4],l=n[8],c=n[12],u=n[1],h=n[5],d=n[9],m=n[13],g=n[2],S=n[6],f=n[10],p=n[14],M=n[3],T=n[7],E=n[11],R=n[15],C=i[0],P=i[4],_=i[8],y=i[12],W=i[1],A=i[5],B=i[9],V=i[13],X=i[2],O=i[6],G=i[10],U=i[14],Q=i[3],Z=i[7],ce=i[11],pe=i[15];return a[0]=s*C+o*W+l*X+c*Q,a[4]=s*P+o*A+l*O+c*Z,a[8]=s*_+o*B+l*G+c*ce,a[12]=s*y+o*V+l*U+c*pe,a[1]=u*C+h*W+d*X+m*Q,a[5]=u*P+h*A+d*O+m*Z,a[9]=u*_+h*B+d*G+m*ce,a[13]=u*y+h*V+d*U+m*pe,a[2]=g*C+S*W+f*X+p*Q,a[6]=g*P+S*A+f*O+p*Z,a[10]=g*_+S*B+f*G+p*ce,a[14]=g*y+S*V+f*U+p*pe,a[3]=M*C+T*W+E*X+R*Q,a[7]=M*P+T*A+E*O+R*Z,a[11]=M*_+T*B+E*G+R*ce,a[15]=M*y+T*V+E*U+R*pe,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],i=e[8],a=e[12],s=e[1],o=e[5],l=e[9],c=e[13],u=e[2],h=e[6],d=e[10],m=e[14],g=e[3],S=e[7],f=e[11],p=e[15],M=l*m-c*d,T=o*m-c*h,E=o*d-l*h,R=s*m-c*u,C=s*d-l*u,P=s*h-o*u;return t*(S*M-f*T+p*E)-n*(g*M-f*R+p*C)+i*(g*T-S*R+p*P)-a*(g*E-S*C+f*P)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],a=e[3],s=e[4],o=e[5],l=e[6],c=e[7],u=e[8],h=e[9],d=e[10],m=e[11],g=e[12],S=e[13],f=e[14],p=e[15],M=t*o-n*s,T=t*l-i*s,E=t*c-a*s,R=n*l-i*o,C=n*c-a*o,P=i*c-a*l,_=u*S-h*g,y=u*f-d*g,W=u*p-m*g,A=h*f-d*S,B=h*p-m*S,V=d*p-m*f,X=M*V-T*B+E*A+R*W-C*y+P*_;if(X===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const O=1/X;return e[0]=(o*V-l*B+c*A)*O,e[1]=(i*B-n*V-a*A)*O,e[2]=(S*P-f*C+p*R)*O,e[3]=(d*C-h*P-m*R)*O,e[4]=(l*W-s*V-c*y)*O,e[5]=(t*V-i*W+a*y)*O,e[6]=(f*E-g*P-p*T)*O,e[7]=(u*P-d*E+m*T)*O,e[8]=(s*B-o*W+c*_)*O,e[9]=(n*W-t*B-a*_)*O,e[10]=(g*C-S*E+p*M)*O,e[11]=(h*E-u*C-m*M)*O,e[12]=(o*y-s*A-l*_)*O,e[13]=(t*A-n*y+i*_)*O,e[14]=(S*T-g*R-f*M)*O,e[15]=(u*R-h*T+d*M)*O,this}scale(e){const t=this.elements,n=e.x,i=e.y,a=e.z;return t[0]*=n,t[4]*=i,t[8]*=a,t[1]*=n,t[5]*=i,t[9]*=a,t[2]*=n,t[6]*=i,t[10]*=a,t[3]*=n,t[7]*=i,t[11]*=a,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),i=Math.sin(t),a=1-n,s=e.x,o=e.y,l=e.z,c=a*s,u=a*o;return this.set(c*s+n,c*o-i*l,c*l+i*o,0,c*o+i*l,u*o+n,u*l-i*s,0,c*l-i*o,u*l+i*s,a*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,a,s){return this.set(1,n,a,0,e,1,s,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){const i=this.elements,a=t._x,s=t._y,o=t._z,l=t._w,c=a+a,u=s+s,h=o+o,d=a*c,m=a*u,g=a*h,S=s*u,f=s*h,p=o*h,M=l*c,T=l*u,E=l*h,R=n.x,C=n.y,P=n.z;return i[0]=(1-(S+p))*R,i[1]=(m+E)*R,i[2]=(g-T)*R,i[3]=0,i[4]=(m-E)*C,i[5]=(1-(d+p))*C,i[6]=(f+M)*C,i[7]=0,i[8]=(g+T)*P,i[9]=(f-M)*P,i[10]=(1-(d+S))*P,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){const i=this.elements;e.x=i[12],e.y=i[13],e.z=i[14];const a=this.determinant();if(a===0)return n.set(1,1,1),t.identity(),this;let s=ci.set(i[0],i[1],i[2]).length();const o=ci.set(i[4],i[5],i[6]).length(),l=ci.set(i[8],i[9],i[10]).length();a<0&&(s=-s),$t.copy(this);const c=1/s,u=1/o,h=1/l;return $t.elements[0]*=c,$t.elements[1]*=c,$t.elements[2]*=c,$t.elements[4]*=u,$t.elements[5]*=u,$t.elements[6]*=u,$t.elements[8]*=h,$t.elements[9]*=h,$t.elements[10]*=h,t.setFromRotationMatrix($t),n.x=s,n.y=o,n.z=l,this}makePerspective(e,t,n,i,a,s,o=sn,l=!1){const c=this.elements,u=2*a/(t-e),h=2*a/(n-i),d=(t+e)/(t-e),m=(n+i)/(n-i);let g,S;if(l)g=a/(s-a),S=s*a/(s-a);else if(o===sn)g=-(s+a)/(s-a),S=-2*s*a/(s-a);else if(o===Lr)g=-s/(s-a),S=-s*a/(s-a);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=h,c[9]=m,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=S,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,i,a,s,o=sn,l=!1){const c=this.elements,u=2/(t-e),h=2/(n-i),d=-(t+e)/(t-e),m=-(n+i)/(n-i);let g,S;if(l)g=1/(s-a),S=s/(s-a);else if(o===sn)g=-2/(s-a),S=-(s+a)/(s-a);else if(o===Lr)g=-1/(s-a),S=-a/(s-a);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=h,c[9]=0,c[13]=m,c[2]=0,c[6]=0,c[10]=g,c[14]=S,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}const ci=new z,$t=new mt,_u=new z(0,0,0),xu=new z(1,1,1),Pn=new z,ir=new z,Ft=new z,fo=new mt,po=new Di;class Tn{constructor(e=0,t=0,n=0,i=Tn.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const i=e.elements,a=i[0],s=i[4],o=i[8],l=i[1],c=i[5],u=i[9],h=i[2],d=i[6],m=i[10];switch(t){case"XYZ":this._y=Math.asin(Ge(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,m),this._z=Math.atan2(-s,a)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ge(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,a),this._z=0);break;case"ZXY":this._x=Math.asin(Ge(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,m),this._z=Math.atan2(-s,c)):(this._y=0,this._z=Math.atan2(l,a));break;case"ZYX":this._y=Math.asin(-Ge(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,m),this._z=Math.atan2(l,a)):(this._x=0,this._z=Math.atan2(-s,c));break;case"YZX":this._z=Math.asin(Ge(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,a)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-Ge(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,a)):(this._x=Math.atan2(-u,m),this._y=0);break;default:De("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return fo.makeRotationFromQuaternion(e),this.setFromRotationMatrix(fo,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return po.setFromEuler(this),this.setFromQuaternion(po,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Tn.DEFAULT_ORDER="XYZ";class Ml{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Su=0;const mo=new z,ui=new Di,fn=new mt,rr=new z,Ui=new z,Mu=new z,yu=new Di,go=new z(1,0,0),vo=new z(0,1,0),_o=new z(0,0,1),xo={type:"added"},bu={type:"removed"},di={type:"childadded",child:null},ia={type:"childremoved",child:null};class kt extends Pi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Su++}),this.uuid=Yi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=kt.DEFAULT_UP.clone();const e=new z,t=new Tn,n=new Di,i=new z(1,1,1);function a(){n.setFromEuler(t,!1)}function s(){t.setFromQuaternion(n,void 0,!1)}t._onChange(a),n._onChange(s),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new mt},normalMatrix:{value:new Ue}}),this.matrix=new mt,this.matrixWorld=new mt,this.matrixAutoUpdate=kt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=kt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ml,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return ui.setFromAxisAngle(e,t),this.quaternion.multiply(ui),this}rotateOnWorldAxis(e,t){return ui.setFromAxisAngle(e,t),this.quaternion.premultiply(ui),this}rotateX(e){return this.rotateOnAxis(go,e)}rotateY(e){return this.rotateOnAxis(vo,e)}rotateZ(e){return this.rotateOnAxis(_o,e)}translateOnAxis(e,t){return mo.copy(e).applyQuaternion(this.quaternion),this.position.add(mo.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(go,e)}translateY(e){return this.translateOnAxis(vo,e)}translateZ(e){return this.translateOnAxis(_o,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(fn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?rr.copy(e):rr.set(e,t,n);const i=this.parent;this.updateWorldMatrix(!0,!1),Ui.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?fn.lookAt(Ui,rr,this.up):fn.lookAt(rr,Ui,this.up),this.quaternion.setFromRotationMatrix(fn),i&&(fn.extractRotation(i.matrixWorld),ui.setFromRotationMatrix(fn),this.quaternion.premultiply(ui.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Ye("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(xo),di.child=e,this.dispatchEvent(di),di.child=null):Ye("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(bu),ia.child=e,this.dispatchEvent(ia),ia.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),fn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),fn.multiply(e.parent.matrixWorld)),e.applyMatrix4(fn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(xo),di.child=e,this.dispatchEvent(di),di.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){const s=this.children[n].getObjectByProperty(e,t);if(s!==void 0)return s}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const i=this.children;for(let a=0,s=i.length;a<s;a++)i[a].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ui,e,Mu),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ui,yu,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,n=e.y,i=e.z,a=this.matrix.elements;a[12]+=t-a[0]*t-a[4]*n-a[8]*i,a[13]+=n-a[1]*t-a[5]*n-a[9]*i,a[14]+=i-a[2]*t-a[6]*n-a[10]*i}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){const i=this.children;for(let a=0,s=i.length;a<s;a++)i[a].updateWorldMatrix(!1,!0)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),this.static!==!1&&(i.static=this.static),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.pivot!==null&&(i.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(i.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(i.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map(o=>({...o})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(e),i.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(i.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(i.boundingBox=this.boundingBox.toJSON()));function a(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=a(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const h=l[c];a(e.shapes,h)}else a(e.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(a(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(a(e.materials,this.material[l]));i.material=o}else i.material=a(e.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];i.animations.push(a(e.animations,l))}}if(t){const o=s(e.geometries),l=s(e.materials),c=s(e.textures),u=s(e.images),h=s(e.shapes),d=s(e.skeletons),m=s(e.animations),g=s(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),h.length>0&&(n.shapes=h),d.length>0&&(n.skeletons=d),m.length>0&&(n.animations=m),g.length>0&&(n.nodes=g)}return n.object=i,n;function s(o){const l=[];for(const c in o){const u=o[c];delete u.metadata,l.push(u)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),e.pivot!==null&&(this.pivot=e.pivot.clone()),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const i=e.children[n];this.add(i.clone())}return this}}kt.DEFAULT_UP=new z(0,1,0);kt.DEFAULT_MATRIX_AUTO_UPDATE=!0;kt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class Vt extends kt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Eu={type:"move"};class ra{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Vt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Vt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new z,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new z),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Vt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new z,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new z),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,a=null,s=null;const o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){s=!0;for(const S of e.hand.values()){const f=t.getJointPose(S,n),p=this._getHandJoint(c,S);f!==null&&(p.matrix.fromArray(f.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=f.radius),p.visible=f!==null}const u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],d=u.position.distanceTo(h.position),m=.02,g=.005;c.inputState.pinching&&d>m+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=m-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(a=t.getPose(e.gripSpace,n),a!==null&&(l.matrix.fromArray(a.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,a.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(a.linearVelocity)):l.hasLinearVelocity=!1,a.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(a.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&a!==null&&(i=a),i!==null&&(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity)):o.hasLinearVelocity=!1,i.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Eu)))}return o!==null&&(o.visible=i!==null),l!==null&&(l.visible=a!==null),c!==null&&(c.visible=s!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new Vt;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}const yl={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Dn={h:0,s:0,l:0},ar={h:0,s:0,l:0};function aa(r,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?r+(e-r)*6*t:t<1/2?e:t<2/3?r+(e-r)*6*(2/3-t):r}class Qe{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const i=e;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Wt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,We.colorSpaceToWorking(this,t),this}setRGB(e,t,n,i=We.workingColorSpace){return this.r=e,this.g=t,this.b=n,We.colorSpaceToWorking(this,i),this}setHSL(e,t,n,i=We.workingColorSpace){if(e=du(e,1),t=Ge(t,0,1),n=Ge(n,0,1),t===0)this.r=this.g=this.b=n;else{const a=n<=.5?n*(1+t):n+t-n*t,s=2*n-a;this.r=aa(s,a,e+1/3),this.g=aa(s,a,e),this.b=aa(s,a,e-1/3)}return We.colorSpaceToWorking(this,i),this}setStyle(e,t=Wt){function n(a){a!==void 0&&parseFloat(a)<1&&De("Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let a;const s=i[1],o=i[2];switch(s){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,t);if(a=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(a[4]),this.setRGB(Math.min(100,parseInt(a[1],10))/100,Math.min(100,parseInt(a[2],10))/100,Math.min(100,parseInt(a[3],10))/100,t);break;case"hsl":case"hsla":if(a=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,t);break;default:De("Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){const a=i[1],s=a.length;if(s===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,t);if(s===6)return this.setHex(parseInt(a,16),t);De("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Wt){const n=yl[e.toLowerCase()];return n!==void 0?this.setHex(n,t):De("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Mn(e.r),this.g=Mn(e.g),this.b=Mn(e.b),this}copyLinearToSRGB(e){return this.r=Ei(e.r),this.g=Ei(e.g),this.b=Ei(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Wt){return We.workingToColorSpace(Tt.copy(this),e),Math.round(Ge(Tt.r*255,0,255))*65536+Math.round(Ge(Tt.g*255,0,255))*256+Math.round(Ge(Tt.b*255,0,255))}getHexString(e=Wt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=We.workingColorSpace){We.workingToColorSpace(Tt.copy(this),t);const n=Tt.r,i=Tt.g,a=Tt.b,s=Math.max(n,i,a),o=Math.min(n,i,a);let l,c;const u=(o+s)/2;if(o===s)l=0,c=0;else{const h=s-o;switch(c=u<=.5?h/(s+o):h/(2-s-o),s){case n:l=(i-a)/h+(i<a?6:0);break;case i:l=(a-n)/h+2;break;case a:l=(n-i)/h+4;break}l/=6}return e.h=l,e.s=c,e.l=u,e}getRGB(e,t=We.workingColorSpace){return We.workingToColorSpace(Tt.copy(this),t),e.r=Tt.r,e.g=Tt.g,e.b=Tt.b,e}getStyle(e=Wt){We.workingToColorSpace(Tt.copy(this),e);const t=Tt.r,n=Tt.g,i=Tt.b;return e!==Wt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(e,t,n){return this.getHSL(Dn),this.setHSL(Dn.h+e,Dn.s+t,Dn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Dn),e.getHSL(ar);const n=Jr(Dn.h,ar.h,t),i=Jr(Dn.s,ar.s,t),a=Jr(Dn.l,ar.l,t);return this.setHSL(n,i,a),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,i=this.b,a=e.elements;return this.r=a[0]*t+a[3]*n+a[6]*i,this.g=a[1]*t+a[4]*n+a[7]*i,this.b=a[2]*t+a[5]*n+a[8]*i,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Tt=new Qe;Qe.NAMES=yl;class bl extends kt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Tn,this.environmentIntensity=1,this.environmentRotation=new Tn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}const Kt=new z,pn=new z,sa=new z,mn=new z,hi=new z,fi=new z,So=new z,oa=new z,la=new z,ca=new z,ua=new ot,da=new ot,ha=new ot;class Jt{constructor(e=new z,t=new z,n=new z){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),Kt.subVectors(e,t),i.cross(Kt);const a=i.lengthSq();return a>0?i.multiplyScalar(1/Math.sqrt(a)):i.set(0,0,0)}static getBarycoord(e,t,n,i,a){Kt.subVectors(i,t),pn.subVectors(n,t),sa.subVectors(e,t);const s=Kt.dot(Kt),o=Kt.dot(pn),l=Kt.dot(sa),c=pn.dot(pn),u=pn.dot(sa),h=s*c-o*o;if(h===0)return a.set(0,0,0),null;const d=1/h,m=(c*l-o*u)*d,g=(s*u-o*l)*d;return a.set(1-m-g,g,m)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,mn)===null?!1:mn.x>=0&&mn.y>=0&&mn.x+mn.y<=1}static getInterpolation(e,t,n,i,a,s,o,l){return this.getBarycoord(e,t,n,i,mn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(a,mn.x),l.addScaledVector(s,mn.y),l.addScaledVector(o,mn.z),l)}static getInterpolatedAttribute(e,t,n,i,a,s){return ua.setScalar(0),da.setScalar(0),ha.setScalar(0),ua.fromBufferAttribute(e,t),da.fromBufferAttribute(e,n),ha.fromBufferAttribute(e,i),s.setScalar(0),s.addScaledVector(ua,a.x),s.addScaledVector(da,a.y),s.addScaledVector(ha,a.z),s}static isFrontFacing(e,t,n,i){return Kt.subVectors(n,t),pn.subVectors(e,t),Kt.cross(pn).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Kt.subVectors(this.c,this.b),pn.subVectors(this.a,this.b),Kt.cross(pn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return Jt.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return Jt.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,i,a){return Jt.getInterpolation(e,this.a,this.b,this.c,t,n,i,a)}containsPoint(e){return Jt.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return Jt.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,i=this.b,a=this.c;let s,o;hi.subVectors(i,n),fi.subVectors(a,n),oa.subVectors(e,n);const l=hi.dot(oa),c=fi.dot(oa);if(l<=0&&c<=0)return t.copy(n);la.subVectors(e,i);const u=hi.dot(la),h=fi.dot(la);if(u>=0&&h<=u)return t.copy(i);const d=l*h-u*c;if(d<=0&&l>=0&&u<=0)return s=l/(l-u),t.copy(n).addScaledVector(hi,s);ca.subVectors(e,a);const m=hi.dot(ca),g=fi.dot(ca);if(g>=0&&m<=g)return t.copy(a);const S=m*c-l*g;if(S<=0&&c>=0&&g<=0)return o=c/(c-g),t.copy(n).addScaledVector(fi,o);const f=u*g-m*h;if(f<=0&&h-u>=0&&m-g>=0)return So.subVectors(a,i),o=(h-u)/(h-u+(m-g)),t.copy(i).addScaledVector(So,o);const p=1/(f+S+d);return s=S*p,o=d*p,t.copy(n).addScaledVector(hi,s).addScaledVector(fi,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class qi{constructor(e=new z(1/0,1/0,1/0),t=new z(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Zt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Zt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=Zt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const a=n.getAttribute("position");if(t===!0&&a!==void 0&&e.isInstancedMesh!==!0)for(let s=0,o=a.count;s<o;s++)e.isMesh===!0?e.getVertexPosition(s,Zt):Zt.fromBufferAttribute(a,s),Zt.applyMatrix4(e.matrixWorld),this.expandByPoint(Zt);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),sr.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),sr.copy(n.boundingBox)),sr.applyMatrix4(e.matrixWorld),this.union(sr)}const i=e.children;for(let a=0,s=i.length;a<s;a++)this.expandByObject(i[a],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Zt),Zt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ni),or.subVectors(this.max,Ni),pi.subVectors(e.a,Ni),mi.subVectors(e.b,Ni),gi.subVectors(e.c,Ni),In.subVectors(mi,pi),Ln.subVectors(gi,mi),Hn.subVectors(pi,gi);let t=[0,-In.z,In.y,0,-Ln.z,Ln.y,0,-Hn.z,Hn.y,In.z,0,-In.x,Ln.z,0,-Ln.x,Hn.z,0,-Hn.x,-In.y,In.x,0,-Ln.y,Ln.x,0,-Hn.y,Hn.x,0];return!fa(t,pi,mi,gi,or)||(t=[1,0,0,0,1,0,0,0,1],!fa(t,pi,mi,gi,or))?!1:(lr.crossVectors(In,Ln),t=[lr.x,lr.y,lr.z],fa(t,pi,mi,gi,or))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Zt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Zt).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(gn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),gn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),gn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),gn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),gn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),gn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),gn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),gn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(gn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const gn=[new z,new z,new z,new z,new z,new z,new z,new z],Zt=new z,sr=new qi,pi=new z,mi=new z,gi=new z,In=new z,Ln=new z,Hn=new z,Ni=new z,or=new z,lr=new z,Wn=new z;function fa(r,e,t,n,i){for(let a=0,s=r.length-3;a<=s;a+=3){Wn.fromArray(r,a);const o=i.x*Math.abs(Wn.x)+i.y*Math.abs(Wn.y)+i.z*Math.abs(Wn.z),l=e.dot(Wn),c=t.dot(Wn),u=n.dot(Wn);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>o)return!1}return!0}const ft=new z,cr=new ke;let Tu=0;class cn{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Tu++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=ao,this.updateRanges=[],this.gpuType=an,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,a=this.itemSize;i<a;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)cr.fromBufferAttribute(this,t),cr.applyMatrix3(e),this.setXY(t,cr.x,cr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)ft.fromBufferAttribute(this,t),ft.applyMatrix3(e),this.setXYZ(t,ft.x,ft.y,ft.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)ft.fromBufferAttribute(this,t),ft.applyMatrix4(e),this.setXYZ(t,ft.x,ft.y,ft.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)ft.fromBufferAttribute(this,t),ft.applyNormalMatrix(e),this.setXYZ(t,ft.x,ft.y,ft.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)ft.fromBufferAttribute(this,t),ft.transformDirection(e),this.setXYZ(t,ft.x,ft.y,ft.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Li(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Rt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Li(t,this.array)),t}setX(e,t){return this.normalized&&(t=Rt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Li(t,this.array)),t}setY(e,t){return this.normalized&&(t=Rt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Li(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Rt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Li(t,this.array)),t}setW(e,t){return this.normalized&&(t=Rt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Rt(t,this.array),n=Rt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=Rt(t,this.array),n=Rt(n,this.array),i=Rt(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,a){return e*=this.itemSize,this.normalized&&(t=Rt(t,this.array),n=Rt(n,this.array),i=Rt(i,this.array),a=Rt(a,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=a,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==ao&&(e.usage=this.usage),e}}class El extends cn{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class Tl extends cn{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class yn extends cn{constructor(e,t,n){super(new Float32Array(e),t,n)}}const Au=new qi,Fi=new z,pa=new z;class Ps{constructor(e=new z,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):Au.setFromPoints(e).getCenter(n);let i=0;for(let a=0,s=e.length;a<s;a++)i=Math.max(i,n.distanceToSquared(e[a]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Fi.subVectors(e,this.center);const t=Fi.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),i=(n-this.radius)*.5;this.center.addScaledVector(Fi,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(pa.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Fi.copy(e.center).add(pa)),this.expandByPoint(Fi.copy(e.center).sub(pa))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let wu=0;const Ht=new mt,ma=new kt,vi=new z,Ot=new qi,Oi=new qi,Mt=new z;class An extends Pi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:wu++}),this.uuid=Yi(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(ou(e)?Tl:El)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const a=new Ue().getNormalMatrix(e);n.applyNormalMatrix(a),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Ht.makeRotationFromQuaternion(e),this.applyMatrix4(Ht),this}rotateX(e){return Ht.makeRotationX(e),this.applyMatrix4(Ht),this}rotateY(e){return Ht.makeRotationY(e),this.applyMatrix4(Ht),this}rotateZ(e){return Ht.makeRotationZ(e),this.applyMatrix4(Ht),this}translate(e,t,n){return Ht.makeTranslation(e,t,n),this.applyMatrix4(Ht),this}scale(e,t,n){return Ht.makeScale(e,t,n),this.applyMatrix4(Ht),this}lookAt(e){return ma.lookAt(e),ma.updateMatrix(),this.applyMatrix4(ma.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(vi).negate(),this.translate(vi.x,vi.y,vi.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let i=0,a=e.length;i<a;i++){const s=e[i];n.push(s.x,s.y,s.z||0)}this.setAttribute("position",new yn(n,3))}else{const n=Math.min(e.length,t.count);for(let i=0;i<n;i++){const a=e[i];t.setXYZ(i,a.x,a.y,a.z||0)}e.length>t.count&&De("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new qi);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Ye("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new z(-1/0,-1/0,-1/0),new z(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){const a=t[n];Ot.setFromBufferAttribute(a),this.morphTargetsRelative?(Mt.addVectors(this.boundingBox.min,Ot.min),this.boundingBox.expandByPoint(Mt),Mt.addVectors(this.boundingBox.max,Ot.max),this.boundingBox.expandByPoint(Mt)):(this.boundingBox.expandByPoint(Ot.min),this.boundingBox.expandByPoint(Ot.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Ye('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ps);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Ye("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new z,1/0);return}if(e){const n=this.boundingSphere.center;if(Ot.setFromBufferAttribute(e),t)for(let a=0,s=t.length;a<s;a++){const o=t[a];Oi.setFromBufferAttribute(o),this.morphTargetsRelative?(Mt.addVectors(Ot.min,Oi.min),Ot.expandByPoint(Mt),Mt.addVectors(Ot.max,Oi.max),Ot.expandByPoint(Mt)):(Ot.expandByPoint(Oi.min),Ot.expandByPoint(Oi.max))}Ot.getCenter(n);let i=0;for(let a=0,s=e.count;a<s;a++)Mt.fromBufferAttribute(e,a),i=Math.max(i,n.distanceToSquared(Mt));if(t)for(let a=0,s=t.length;a<s;a++){const o=t[a],l=this.morphTargetsRelative;for(let c=0,u=o.count;c<u;c++)Mt.fromBufferAttribute(o,c),l&&(vi.fromBufferAttribute(e,c),Mt.add(vi)),i=Math.max(i,n.distanceToSquared(Mt))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&Ye('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Ye("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=t.position,i=t.normal,a=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new cn(new Float32Array(4*n.count),4));const s=this.getAttribute("tangent"),o=[],l=[];for(let _=0;_<n.count;_++)o[_]=new z,l[_]=new z;const c=new z,u=new z,h=new z,d=new ke,m=new ke,g=new ke,S=new z,f=new z;function p(_,y,W){c.fromBufferAttribute(n,_),u.fromBufferAttribute(n,y),h.fromBufferAttribute(n,W),d.fromBufferAttribute(a,_),m.fromBufferAttribute(a,y),g.fromBufferAttribute(a,W),u.sub(c),h.sub(c),m.sub(d),g.sub(d);const A=1/(m.x*g.y-g.x*m.y);isFinite(A)&&(S.copy(u).multiplyScalar(g.y).addScaledVector(h,-m.y).multiplyScalar(A),f.copy(h).multiplyScalar(m.x).addScaledVector(u,-g.x).multiplyScalar(A),o[_].add(S),o[y].add(S),o[W].add(S),l[_].add(f),l[y].add(f),l[W].add(f))}let M=this.groups;M.length===0&&(M=[{start:0,count:e.count}]);for(let _=0,y=M.length;_<y;++_){const W=M[_],A=W.start,B=W.count;for(let V=A,X=A+B;V<X;V+=3)p(e.getX(V+0),e.getX(V+1),e.getX(V+2))}const T=new z,E=new z,R=new z,C=new z;function P(_){R.fromBufferAttribute(i,_),C.copy(R);const y=o[_];T.copy(y),T.sub(R.multiplyScalar(R.dot(y))).normalize(),E.crossVectors(C,y);const A=E.dot(l[_])<0?-1:1;s.setXYZW(_,T.x,T.y,T.z,A)}for(let _=0,y=M.length;_<y;++_){const W=M[_],A=W.start,B=W.count;for(let V=A,X=A+B;V<X;V+=3)P(e.getX(V+0)),P(e.getX(V+1)),P(e.getX(V+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new cn(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,m=n.count;d<m;d++)n.setXYZ(d,0,0,0);const i=new z,a=new z,s=new z,o=new z,l=new z,c=new z,u=new z,h=new z;if(e)for(let d=0,m=e.count;d<m;d+=3){const g=e.getX(d+0),S=e.getX(d+1),f=e.getX(d+2);i.fromBufferAttribute(t,g),a.fromBufferAttribute(t,S),s.fromBufferAttribute(t,f),u.subVectors(s,a),h.subVectors(i,a),u.cross(h),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,S),c.fromBufferAttribute(n,f),o.add(u),l.add(u),c.add(u),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(S,l.x,l.y,l.z),n.setXYZ(f,c.x,c.y,c.z)}else for(let d=0,m=t.count;d<m;d+=3)i.fromBufferAttribute(t,d+0),a.fromBufferAttribute(t,d+1),s.fromBufferAttribute(t,d+2),u.subVectors(s,a),h.subVectors(i,a),u.cross(h),n.setXYZ(d+0,u.x,u.y,u.z),n.setXYZ(d+1,u.x,u.y,u.z),n.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Mt.fromBufferAttribute(e,t),Mt.normalize(),e.setXYZ(t,Mt.x,Mt.y,Mt.z)}toNonIndexed(){function e(o,l){const c=o.array,u=o.itemSize,h=o.normalized,d=new c.constructor(l.length*u);let m=0,g=0;for(let S=0,f=l.length;S<f;S++){o.isInterleavedBufferAttribute?m=l[S]*o.data.stride+o.offset:m=l[S]*u;for(let p=0;p<u;p++)d[g++]=c[m++]}return new cn(d,u,h)}if(this.index===null)return De("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new An,n=this.index.array,i=this.attributes;for(const o in i){const l=i[o],c=e(l,n);t.setAttribute(o,c)}const a=this.morphAttributes;for(const o in a){const l=[],c=a[o];for(let u=0,h=c.length;u<h;u++){const d=c[u],m=e(d,n);l.push(m)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;const s=this.groups;for(let o=0,l=s.length;o<l;o++){const c=s[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const l in n){const c=n[l];e.data.attributes[l]=c.toJSON(e.data)}const i={};let a=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let h=0,d=c.length;h<d;h++){const m=c[h];u.push(m.toJSON(e.data))}u.length>0&&(i[l]=u,a=!0)}a&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);const s=this.groups;s.length>0&&(e.data.groups=JSON.parse(JSON.stringify(s)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone());const i=e.attributes;for(const c in i){const u=i[c];this.setAttribute(c,u.clone(t))}const a=e.morphAttributes;for(const c in a){const u=[],h=a[c];for(let d=0,m=h.length;d<m;d++)u.push(h[d].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;const s=e.groups;for(let c=0,u=s.length;c<u;c++){const h=s[c];this.addGroup(h.start,h.count,h.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}let Cu=0;class Or extends Pi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Cu++}),this.uuid=Yi(),this.name="",this.type="Material",this.blending=bi,this.side=Vn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Ca,this.blendDst=Ra,this.blendEquation=jn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Qe(0,0,0),this.blendAlpha=0,this.depthFunc=Ti,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=ro,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=oi,this.stencilZFail=oi,this.stencilZPass=oi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){De(`Material: parameter '${t}' has value of undefined.`);continue}const i=this[t];if(i===void 0){De(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==bi&&(n.blending=this.blending),this.side!==Vn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Ca&&(n.blendSrc=this.blendSrc),this.blendDst!==Ra&&(n.blendDst=this.blendDst),this.blendEquation!==jn&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Ti&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==ro&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==oi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==oi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==oi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.allowOverride===!1&&(n.allowOverride=!1),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(a){const s=[];for(const o in a){const l=a[o];delete l.metadata,s.push(l)}return s}if(t){const a=i(e.textures),s=i(e.images);a.length>0&&(n.textures=a),s.length>0&&(n.images=s)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const i=t.length;n=new Array(i);for(let a=0;a!==i;++a)n[a]=t[a].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const vn=new z,ga=new z,ur=new z,Un=new z,va=new z,dr=new z,_a=new z;class Ru{constructor(e=new z,t=new z(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,vn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=vn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(vn.copy(this.origin).addScaledVector(this.direction,t),vn.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){ga.copy(e).add(t).multiplyScalar(.5),ur.copy(t).sub(e).normalize(),Un.copy(this.origin).sub(ga);const a=e.distanceTo(t)*.5,s=-this.direction.dot(ur),o=Un.dot(this.direction),l=-Un.dot(ur),c=Un.lengthSq(),u=Math.abs(1-s*s);let h,d,m,g;if(u>0)if(h=s*l-o,d=s*o-l,g=a*u,h>=0)if(d>=-g)if(d<=g){const S=1/u;h*=S,d*=S,m=h*(h+s*d+2*o)+d*(s*h+d+2*l)+c}else d=a,h=Math.max(0,-(s*d+o)),m=-h*h+d*(d+2*l)+c;else d=-a,h=Math.max(0,-(s*d+o)),m=-h*h+d*(d+2*l)+c;else d<=-g?(h=Math.max(0,-(-s*a+o)),d=h>0?-a:Math.min(Math.max(-a,-l),a),m=-h*h+d*(d+2*l)+c):d<=g?(h=0,d=Math.min(Math.max(-a,-l),a),m=d*(d+2*l)+c):(h=Math.max(0,-(s*a+o)),d=h>0?a:Math.min(Math.max(-a,-l),a),m=-h*h+d*(d+2*l)+c);else d=s>0?-a:a,h=Math.max(0,-(s*d+o)),m=-h*h+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,h),i&&i.copy(ga).addScaledVector(ur,d),m}intersectSphere(e,t){vn.subVectors(e.center,this.origin);const n=vn.dot(this.direction),i=vn.dot(vn)-n*n,a=e.radius*e.radius;if(i>a)return null;const s=Math.sqrt(a-i),o=n-s,l=n+s;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,a,s,o,l;const c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,i=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,i=(e.min.x-d.x)*c),u>=0?(a=(e.min.y-d.y)*u,s=(e.max.y-d.y)*u):(a=(e.max.y-d.y)*u,s=(e.min.y-d.y)*u),n>s||a>i||((a>n||isNaN(n))&&(n=a),(s<i||isNaN(i))&&(i=s),h>=0?(o=(e.min.z-d.z)*h,l=(e.max.z-d.z)*h):(o=(e.max.z-d.z)*h,l=(e.min.z-d.z)*h),n>l||o>i)||((o>n||n!==n)&&(n=o),(l<i||i!==i)&&(i=l),i<0)?null:this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,vn)!==null}intersectTriangle(e,t,n,i,a){va.subVectors(t,e),dr.subVectors(n,e),_a.crossVectors(va,dr);let s=this.direction.dot(_a),o;if(s>0){if(i)return null;o=1}else if(s<0)o=-1,s=-s;else return null;Un.subVectors(this.origin,e);const l=o*this.direction.dot(dr.crossVectors(Un,dr));if(l<0)return null;const c=o*this.direction.dot(va.cross(Un));if(c<0||l+c>s)return null;const u=-o*Un.dot(_a);return u<0?null:this.at(u/s,a)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Al extends Or{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Qe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Tn,this.combine=il,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const Mo=new mt,Xn=new Ru,hr=new Ps,yo=new z,fr=new z,pr=new z,mr=new z,xa=new z,gr=new z,bo=new z,vr=new z;class Yt extends kt{constructor(e=new An,t=new Al){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,s=i.length;a<s;a++){const o=i[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}getVertexPosition(e,t){const n=this.geometry,i=n.attributes.position,a=n.morphAttributes.position,s=n.morphTargetsRelative;t.fromBufferAttribute(i,e);const o=this.morphTargetInfluences;if(a&&o){gr.set(0,0,0);for(let l=0,c=a.length;l<c;l++){const u=o[l],h=a[l];u!==0&&(xa.fromBufferAttribute(h,e),s?gr.addScaledVector(xa,u):gr.addScaledVector(xa.sub(t),u))}t.add(gr)}return t}raycast(e,t){const n=this.geometry,i=this.material,a=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),hr.copy(n.boundingSphere),hr.applyMatrix4(a),Xn.copy(e.ray).recast(e.near),!(hr.containsPoint(Xn.origin)===!1&&(Xn.intersectSphere(hr,yo)===null||Xn.origin.distanceToSquared(yo)>(e.far-e.near)**2))&&(Mo.copy(a).invert(),Xn.copy(e.ray).applyMatrix4(Mo),!(n.boundingBox!==null&&Xn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Xn)))}_computeIntersections(e,t,n){let i;const a=this.geometry,s=this.material,o=a.index,l=a.attributes.position,c=a.attributes.uv,u=a.attributes.uv1,h=a.attributes.normal,d=a.groups,m=a.drawRange;if(o!==null)if(Array.isArray(s))for(let g=0,S=d.length;g<S;g++){const f=d[g],p=s[f.materialIndex],M=Math.max(f.start,m.start),T=Math.min(o.count,Math.min(f.start+f.count,m.start+m.count));for(let E=M,R=T;E<R;E+=3){const C=o.getX(E),P=o.getX(E+1),_=o.getX(E+2);i=_r(this,p,e,n,c,u,h,C,P,_),i&&(i.faceIndex=Math.floor(E/3),i.face.materialIndex=f.materialIndex,t.push(i))}}else{const g=Math.max(0,m.start),S=Math.min(o.count,m.start+m.count);for(let f=g,p=S;f<p;f+=3){const M=o.getX(f),T=o.getX(f+1),E=o.getX(f+2);i=_r(this,s,e,n,c,u,h,M,T,E),i&&(i.faceIndex=Math.floor(f/3),t.push(i))}}else if(l!==void 0)if(Array.isArray(s))for(let g=0,S=d.length;g<S;g++){const f=d[g],p=s[f.materialIndex],M=Math.max(f.start,m.start),T=Math.min(l.count,Math.min(f.start+f.count,m.start+m.count));for(let E=M,R=T;E<R;E+=3){const C=E,P=E+1,_=E+2;i=_r(this,p,e,n,c,u,h,C,P,_),i&&(i.faceIndex=Math.floor(E/3),i.face.materialIndex=f.materialIndex,t.push(i))}}else{const g=Math.max(0,m.start),S=Math.min(l.count,m.start+m.count);for(let f=g,p=S;f<p;f+=3){const M=f,T=f+1,E=f+2;i=_r(this,s,e,n,c,u,h,M,T,E),i&&(i.faceIndex=Math.floor(f/3),t.push(i))}}}}function Pu(r,e,t,n,i,a,s,o){let l;if(e.side===Lt?l=n.intersectTriangle(s,a,i,!0,o):l=n.intersectTriangle(i,a,s,e.side===Vn,o),l===null)return null;vr.copy(o),vr.applyMatrix4(r.matrixWorld);const c=t.ray.origin.distanceTo(vr);return c<t.near||c>t.far?null:{distance:c,point:vr.clone(),object:r}}function _r(r,e,t,n,i,a,s,o,l,c){r.getVertexPosition(o,fr),r.getVertexPosition(l,pr),r.getVertexPosition(c,mr);const u=Pu(r,e,t,n,fr,pr,mr,bo);if(u){const h=new z;Jt.getBarycoord(bo,fr,pr,mr,h),i&&(u.uv=Jt.getInterpolatedAttribute(i,o,l,c,h,new ke)),a&&(u.uv1=Jt.getInterpolatedAttribute(a,o,l,c,h,new ke)),s&&(u.normal=Jt.getInterpolatedAttribute(s,o,l,c,h,new z),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const d={a:o,b:l,c,normal:new z,materialIndex:0};Jt.getNormal(fr,pr,mr,d.normal),u.face=d,u.barycoord=h}return u}class Ds extends Ct{constructor(e=null,t=1,n=1,i,a,s,o,l,c=ut,u=ut,h,d){super(null,s,o,l,c,u,i,a,h,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Sa=new z,Du=new z,Iu=new Ue;class Zn{constructor(e=new z(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const i=Sa.subVectors(n,t).cross(Du.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const n=e.delta(Sa),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/i;return a<0||a>1?null:t.copy(e.start).addScaledVector(n,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||Iu.getNormalMatrix(e),i=this.coplanarPoint(Sa).applyMatrix4(e),a=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(a),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Yn=new Ps,Lu=new ke(.5,.5),xr=new z;class wl{constructor(e=new Zn,t=new Zn,n=new Zn,i=new Zn,a=new Zn,s=new Zn){this.planes=[e,t,n,i,a,s]}set(e,t,n,i,a,s){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(i),o[4].copy(a),o[5].copy(s),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=sn,n=!1){const i=this.planes,a=e.elements,s=a[0],o=a[1],l=a[2],c=a[3],u=a[4],h=a[5],d=a[6],m=a[7],g=a[8],S=a[9],f=a[10],p=a[11],M=a[12],T=a[13],E=a[14],R=a[15];if(i[0].setComponents(c-s,m-u,p-g,R-M).normalize(),i[1].setComponents(c+s,m+u,p+g,R+M).normalize(),i[2].setComponents(c+o,m+h,p+S,R+T).normalize(),i[3].setComponents(c-o,m-h,p-S,R-T).normalize(),n)i[4].setComponents(l,d,f,E).normalize(),i[5].setComponents(c-l,m-d,p-f,R-E).normalize();else if(i[4].setComponents(c-l,m-d,p-f,R-E).normalize(),t===sn)i[5].setComponents(c+l,m+d,p+f,R+E).normalize();else if(t===Lr)i[5].setComponents(l,d,f,E).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Yn.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Yn.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Yn)}intersectsSprite(e){Yn.center.set(0,0,0);const t=Lu.distanceTo(e.center);return Yn.radius=.7071067811865476+t,Yn.applyMatrix4(e.matrixWorld),this.intersectsSphere(Yn)}intersectsSphere(e){const t=this.planes,n=e.center,i=-e.radius;for(let a=0;a<6;a++)if(t[a].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const i=t[n];if(xr.x=i.normal.x>0?e.max.x:e.min.x,xr.y=i.normal.y>0?e.max.y:e.min.y,xr.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(xr)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class Cl extends Ct{constructor(e=[],t=ni,n,i,a,s,o,l,c,u){super(e,t,n,i,a,s,o,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Xi extends Ct{constructor(e,t,n=un,i,a,s,o=ut,l=ut,c,u=En,h=1){if(u!==En&&u!==ei)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const d={width:e,height:t,depth:h};super(d,i,a,s,o,l,u,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Rs(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}class Uu extends Xi{constructor(e,t=un,n=ni,i,a,s=ut,o=ut,l,c=En){const u={width:e,height:e,depth:1},h=[u,u,u,u,u,u];super(e,e,t,n,i,a,s,o,l,c),this.image=h,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class Rl extends Ct{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class $i extends An{constructor(e=1,t=1,n=1,i=1,a=1,s=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:a,depthSegments:s};const o=this;i=Math.floor(i),a=Math.floor(a),s=Math.floor(s);const l=[],c=[],u=[],h=[];let d=0,m=0;g("z","y","x",-1,-1,n,t,e,s,a,0),g("z","y","x",1,-1,n,t,-e,s,a,1),g("x","z","y",1,1,e,n,t,i,s,2),g("x","z","y",1,-1,e,n,-t,i,s,3),g("x","y","z",1,-1,e,t,n,i,a,4),g("x","y","z",-1,-1,e,t,-n,i,a,5),this.setIndex(l),this.setAttribute("position",new yn(c,3)),this.setAttribute("normal",new yn(u,3)),this.setAttribute("uv",new yn(h,2));function g(S,f,p,M,T,E,R,C,P,_,y){const W=E/P,A=R/_,B=E/2,V=R/2,X=C/2,O=P+1,G=_+1;let U=0,Q=0;const Z=new z;for(let ce=0;ce<G;ce++){const pe=ce*A-V;for(let ue=0;ue<O;ue++){const Ce=ue*W-B;Z[S]=Ce*M,Z[f]=pe*T,Z[p]=X,c.push(Z.x,Z.y,Z.z),Z[S]=0,Z[f]=0,Z[p]=C>0?1:-1,u.push(Z.x,Z.y,Z.z),h.push(ue/P),h.push(1-ce/_),U+=1}}for(let ce=0;ce<_;ce++)for(let pe=0;pe<P;pe++){const ue=d+pe+O*ce,Ce=d+pe+O*(ce+1),at=d+(pe+1)+O*(ce+1),rt=d+(pe+1)+O*ce;l.push(ue,Ce,rt),l.push(Ce,at,rt),Q+=6}o.addGroup(m,Q,y),m+=Q,d+=U}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new $i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class ii extends An{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};const a=e/2,s=t/2,o=Math.floor(n),l=Math.floor(i),c=o+1,u=l+1,h=e/o,d=t/l,m=[],g=[],S=[],f=[];for(let p=0;p<u;p++){const M=p*d-s;for(let T=0;T<c;T++){const E=T*h-a;g.push(E,-M,0),S.push(0,0,1),f.push(T/o),f.push(1-p/l)}}for(let p=0;p<l;p++)for(let M=0;M<o;M++){const T=M+c*p,E=M+c*(p+1),R=M+1+c*(p+1),C=M+1+c*p;m.push(T,E,C),m.push(E,R,C)}this.setIndex(m),this.setAttribute("position",new yn(g,3)),this.setAttribute("normal",new yn(S,3)),this.setAttribute("uv",new yn(f,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ii(e.width,e.height,e.widthSegments,e.heightSegments)}}function Ri(r){const e={};for(const t in r){e[t]={};for(const n in r[t]){const i=r[t][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(De("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=i.clone():Array.isArray(i)?e[t][n]=i.slice():e[t][n]=i}}return e}function wt(r){const e={};for(let t=0;t<r.length;t++){const n=Ri(r[t]);for(const i in n)e[i]=n[i]}return e}function Nu(r){const e=[];for(let t=0;t<r.length;t++)e.push(r[t].clone());return e}function Pl(r){const e=r.getRenderTarget();return e===null?r.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:We.workingColorSpace}const Fu={clone:Ri,merge:wt};var Ou=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Bu=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Gt extends Or{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Ou,this.fragmentShader=Bu,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Ri(e.uniforms),this.uniformsGroups=Nu(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const i in this.uniforms){const s=this.uniforms[i].value;s&&s.isTexture?t.uniforms[i]={type:"t",value:s.toJSON(e).uuid}:s&&s.isColor?t.uniforms[i]={type:"c",value:s.getHex()}:s&&s.isVector2?t.uniforms[i]={type:"v2",value:s.toArray()}:s&&s.isVector3?t.uniforms[i]={type:"v3",value:s.toArray()}:s&&s.isVector4?t.uniforms[i]={type:"v4",value:s.toArray()}:s&&s.isMatrix3?t.uniforms[i]={type:"m3",value:s.toArray()}:s&&s.isMatrix4?t.uniforms[i]={type:"m4",value:s.toArray()}:t.uniforms[i]={value:s}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class zu extends Gt{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class Vu extends Or{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Jc,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class ku extends Or{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const Sr=new z,Mr=new Di,en=new z;class Dl extends kt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new mt,this.projectionMatrix=new mt,this.projectionMatrixInverse=new mt,this.coordinateSystem=sn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Sr,Mr,en),en.x===1&&en.y===1&&en.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Sr,Mr,en.set(1,1,1)).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorld.decompose(Sr,Mr,en),en.x===1&&en.y===1&&en.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Sr,Mr,en.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const Nn=new z,Eo=new ke,To=new ke;class jt extends Dl{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=vs*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(jr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return vs*2*Math.atan(Math.tan(jr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Nn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Nn.x,Nn.y).multiplyScalar(-e/Nn.z),Nn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Nn.x,Nn.y).multiplyScalar(-e/Nn.z)}getViewSize(e,t){return this.getViewBounds(e,Eo,To),t.subVectors(To,Eo)}setViewOffset(e,t,n,i,a,s){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=a,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(jr*.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,a=-.5*i;const s=this.view;if(this.view!==null&&this.view.enabled){const l=s.fullWidth,c=s.fullHeight;a+=s.offsetX*i/l,t-=s.offsetY*n/c,i*=s.width/l,n*=s.height/c}const o=this.filmOffset;o!==0&&(a+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+i,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class Br extends Dl{constructor(e=-1,t=1,n=1,i=-1,a=.1,s=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=a,this.far=s,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,a,s){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=a,this.view.height=s,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let a=n-e,s=n+e,o=i+t,l=i-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=c*this.view.offsetX,s=a+c*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(a,s,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const _i=-90,xi=1;class Gu extends kt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const i=new jt(_i,xi,e,t);i.layers=this.layers,this.add(i);const a=new jt(_i,xi,e,t);a.layers=this.layers,this.add(a);const s=new jt(_i,xi,e,t);s.layers=this.layers,this.add(s);const o=new jt(_i,xi,e,t);o.layers=this.layers,this.add(o);const l=new jt(_i,xi,e,t);l.layers=this.layers,this.add(l);const c=new jt(_i,xi,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,i,a,s,o,l]=t;for(const c of t)this.remove(c);if(e===sn)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),s.up.set(0,0,1),s.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Lr)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),s.up.set(0,0,-1),s.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[a,s,o,l,c,u]=this.children,h=e.getRenderTarget(),d=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const S=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let f=!1;e.isWebGLRenderer===!0?f=e.state.buffers.depth.getReversed():f=e.reversedDepthBuffer,e.setRenderTarget(n,0,i),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,1,i),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,2,i),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,i),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(n,4,i),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=S,e.setRenderTarget(n,5,i),f&&e.autoClear===!1&&e.clearDepth(),e.render(t,u),e.setRenderTarget(h,d,m),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class Hu extends jt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}function Ao(r,e,t,n){const i=Wu(n);switch(t){case gl:return r*e;case _l:return r*e/i.components*i.byteLength;case Es:return r*e/i.components*i.byteLength;case wi:return r*e*2/i.components*i.byteLength;case Ts:return r*e*2/i.components*i.byteLength;case vl:return r*e*3/i.components*i.byteLength;case zt:return r*e*4/i.components*i.byteLength;case As:return r*e*4/i.components*i.byteLength;case wr:case Cr:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*8;case Rr:case Pr:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*16;case Va:case Ga:return Math.max(r,16)*Math.max(e,8)/4;case za:case ka:return Math.max(r,8)*Math.max(e,8)/2;case Ha:case Wa:case Ya:case qa:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*8;case Xa:case $a:case Ka:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*16;case Za:return Math.floor((r+3)/4)*Math.floor((e+3)/4)*16;case ja:return Math.floor((r+4)/5)*Math.floor((e+3)/4)*16;case Ja:return Math.floor((r+4)/5)*Math.floor((e+4)/5)*16;case Qa:return Math.floor((r+5)/6)*Math.floor((e+4)/5)*16;case es:return Math.floor((r+5)/6)*Math.floor((e+5)/6)*16;case ts:return Math.floor((r+7)/8)*Math.floor((e+4)/5)*16;case ns:return Math.floor((r+7)/8)*Math.floor((e+5)/6)*16;case is:return Math.floor((r+7)/8)*Math.floor((e+7)/8)*16;case rs:return Math.floor((r+9)/10)*Math.floor((e+4)/5)*16;case as:return Math.floor((r+9)/10)*Math.floor((e+5)/6)*16;case ss:return Math.floor((r+9)/10)*Math.floor((e+7)/8)*16;case os:return Math.floor((r+9)/10)*Math.floor((e+9)/10)*16;case ls:return Math.floor((r+11)/12)*Math.floor((e+9)/10)*16;case cs:return Math.floor((r+11)/12)*Math.floor((e+11)/12)*16;case us:case ds:case hs:return Math.ceil(r/4)*Math.ceil(e/4)*16;case fs:case ps:return Math.ceil(r/4)*Math.ceil(e/4)*8;case ms:case gs:return Math.ceil(r/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Wu(r){switch(r){case Dt:case hl:return{byteLength:1,components:1};case Hi:case fl:case bn:return{byteLength:2,components:1};case ys:case bs:return{byteLength:2,components:4};case un:case Ms:case an:return{byteLength:4,components:1};case pl:case ml:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${r}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ss}}));typeof window<"u"&&(window.__THREE__?De("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ss);function Il(){let r=null,e=!1,t=null,n=null;function i(a,s){t(a,s),n=r.requestAnimationFrame(i)}return{start:function(){e!==!0&&t!==null&&(n=r.requestAnimationFrame(i),e=!0)},stop:function(){r.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(a){t=a},setContext:function(a){r=a}}}function Xu(r){const e=new WeakMap;function t(o,l){const c=o.array,u=o.usage,h=c.byteLength,d=r.createBuffer();r.bindBuffer(l,d),r.bufferData(l,c,u),o.onUploadCallback();let m;if(c instanceof Float32Array)m=r.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)m=r.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?m=r.HALF_FLOAT:m=r.UNSIGNED_SHORT;else if(c instanceof Int16Array)m=r.SHORT;else if(c instanceof Uint32Array)m=r.UNSIGNED_INT;else if(c instanceof Int32Array)m=r.INT;else if(c instanceof Int8Array)m=r.BYTE;else if(c instanceof Uint8Array)m=r.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)m=r.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:m,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:h}}function n(o,l,c){const u=l.array,h=l.updateRanges;if(r.bindBuffer(c,o),h.length===0)r.bufferSubData(c,0,u);else{h.sort((m,g)=>m.start-g.start);let d=0;for(let m=1;m<h.length;m++){const g=h[d],S=h[m];S.start<=g.start+g.count+1?g.count=Math.max(g.count,S.start+S.count-g.start):(++d,h[d]=S)}h.length=d+1;for(let m=0,g=h.length;m<g;m++){const S=h[m];r.bufferSubData(c,S.start*u.BYTES_PER_ELEMENT,u,S.start,S.count)}l.clearUpdateRanges()}l.onUploadCallback()}function i(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function a(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=e.get(o);l&&(r.deleteBuffer(l.buffer),e.delete(o))}function s(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const u=e.get(o);(!u||u.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:i,remove:a,update:s}}var Yu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,qu=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,$u=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Ku=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Zu=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,ju=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Ju=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Qu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,ed=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,td=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,nd=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,id=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,rd=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,ad=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,sd=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,od=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,ld=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,cd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,ud=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,dd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,hd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,fd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,pd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,md=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,gd=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,vd=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,_d=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,xd=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Sd=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Md=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,yd="gl_FragColor = linearToOutputTexel( gl_FragColor );",bd=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Ed=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,Td=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Ad=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,wd=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Cd=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Rd=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Pd=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Dd=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Id=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Ld=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Ud=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Nd=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Fd=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Od=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Bd=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,zd=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Vd=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,kd=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Gd=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Hd=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Wd=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return v;
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Xd=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Yd=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,qd=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,$d=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Kd=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Zd=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,jd=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Jd=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Qd=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,eh=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,th=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,nh=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,ih=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,rh=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,ah=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,sh=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,oh=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,lh=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,ch=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,uh=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,dh=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,hh=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,fh=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,ph=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,mh=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,gh=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,vh=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,_h=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,xh=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Sh=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Mh=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,yh=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,bh=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Eh=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Th=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Ah=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,wh=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,Ch=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Rh=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Ph=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Dh=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Ih=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Lh=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Uh=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Nh=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Fh=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Oh=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Bh=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,zh=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Vh=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,kh=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Gh=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Hh=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Wh=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Xh=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Yh=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,qh=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,$h=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Kh=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Zh=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,jh=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Jh=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Qh=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,ef=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,tf=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,nf=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,rf=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,af=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sf=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,of=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,lf=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,cf=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,uf=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,df=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,hf=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,ff=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,pf=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,mf=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,gf=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,vf=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_f=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,xf=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Sf=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Mf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,yf=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,bf=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Ef=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Tf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ne={alphahash_fragment:Yu,alphahash_pars_fragment:qu,alphamap_fragment:$u,alphamap_pars_fragment:Ku,alphatest_fragment:Zu,alphatest_pars_fragment:ju,aomap_fragment:Ju,aomap_pars_fragment:Qu,batching_pars_vertex:ed,batching_vertex:td,begin_vertex:nd,beginnormal_vertex:id,bsdfs:rd,iridescence_fragment:ad,bumpmap_pars_fragment:sd,clipping_planes_fragment:od,clipping_planes_pars_fragment:ld,clipping_planes_pars_vertex:cd,clipping_planes_vertex:ud,color_fragment:dd,color_pars_fragment:hd,color_pars_vertex:fd,color_vertex:pd,common:md,cube_uv_reflection_fragment:gd,defaultnormal_vertex:vd,displacementmap_pars_vertex:_d,displacementmap_vertex:xd,emissivemap_fragment:Sd,emissivemap_pars_fragment:Md,colorspace_fragment:yd,colorspace_pars_fragment:bd,envmap_fragment:Ed,envmap_common_pars_fragment:Td,envmap_pars_fragment:Ad,envmap_pars_vertex:wd,envmap_physical_pars_fragment:Bd,envmap_vertex:Cd,fog_vertex:Rd,fog_pars_vertex:Pd,fog_fragment:Dd,fog_pars_fragment:Id,gradientmap_pars_fragment:Ld,lightmap_pars_fragment:Ud,lights_lambert_fragment:Nd,lights_lambert_pars_fragment:Fd,lights_pars_begin:Od,lights_toon_fragment:zd,lights_toon_pars_fragment:Vd,lights_phong_fragment:kd,lights_phong_pars_fragment:Gd,lights_physical_fragment:Hd,lights_physical_pars_fragment:Wd,lights_fragment_begin:Xd,lights_fragment_maps:Yd,lights_fragment_end:qd,logdepthbuf_fragment:$d,logdepthbuf_pars_fragment:Kd,logdepthbuf_pars_vertex:Zd,logdepthbuf_vertex:jd,map_fragment:Jd,map_pars_fragment:Qd,map_particle_fragment:eh,map_particle_pars_fragment:th,metalnessmap_fragment:nh,metalnessmap_pars_fragment:ih,morphinstance_vertex:rh,morphcolor_vertex:ah,morphnormal_vertex:sh,morphtarget_pars_vertex:oh,morphtarget_vertex:lh,normal_fragment_begin:ch,normal_fragment_maps:uh,normal_pars_fragment:dh,normal_pars_vertex:hh,normal_vertex:fh,normalmap_pars_fragment:ph,clearcoat_normal_fragment_begin:mh,clearcoat_normal_fragment_maps:gh,clearcoat_pars_fragment:vh,iridescence_pars_fragment:_h,opaque_fragment:xh,packing:Sh,premultiplied_alpha_fragment:Mh,project_vertex:yh,dithering_fragment:bh,dithering_pars_fragment:Eh,roughnessmap_fragment:Th,roughnessmap_pars_fragment:Ah,shadowmap_pars_fragment:wh,shadowmap_pars_vertex:Ch,shadowmap_vertex:Rh,shadowmask_pars_fragment:Ph,skinbase_vertex:Dh,skinning_pars_vertex:Ih,skinning_vertex:Lh,skinnormal_vertex:Uh,specularmap_fragment:Nh,specularmap_pars_fragment:Fh,tonemapping_fragment:Oh,tonemapping_pars_fragment:Bh,transmission_fragment:zh,transmission_pars_fragment:Vh,uv_pars_fragment:kh,uv_pars_vertex:Gh,uv_vertex:Hh,worldpos_vertex:Wh,background_vert:Xh,background_frag:Yh,backgroundCube_vert:qh,backgroundCube_frag:$h,cube_vert:Kh,cube_frag:Zh,depth_vert:jh,depth_frag:Jh,distance_vert:Qh,distance_frag:ef,equirect_vert:tf,equirect_frag:nf,linedashed_vert:rf,linedashed_frag:af,meshbasic_vert:sf,meshbasic_frag:of,meshlambert_vert:lf,meshlambert_frag:cf,meshmatcap_vert:uf,meshmatcap_frag:df,meshnormal_vert:hf,meshnormal_frag:ff,meshphong_vert:pf,meshphong_frag:mf,meshphysical_vert:gf,meshphysical_frag:vf,meshtoon_vert:_f,meshtoon_frag:xf,points_vert:Sf,points_frag:Mf,shadow_vert:yf,shadow_frag:bf,sprite_vert:Ef,sprite_frag:Tf},se={common:{diffuse:{value:new Qe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ue},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ue}},envmap:{envMap:{value:null},envMapRotation:{value:new Ue},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ue}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ue}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ue},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ue},normalScale:{value:new ke(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ue},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ue}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ue}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ue}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Qe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Qe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0},uvTransform:{value:new Ue}},sprite:{diffuse:{value:new Qe(16777215)},opacity:{value:1},center:{value:new ke(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ue},alphaMap:{value:null},alphaMapTransform:{value:new Ue},alphaTest:{value:0}}},nn={basic:{uniforms:wt([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.fog]),vertexShader:Ne.meshbasic_vert,fragmentShader:Ne.meshbasic_frag},lambert:{uniforms:wt([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.fog,se.lights,{emissive:{value:new Qe(0)},envMapIntensity:{value:1}}]),vertexShader:Ne.meshlambert_vert,fragmentShader:Ne.meshlambert_frag},phong:{uniforms:wt([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.fog,se.lights,{emissive:{value:new Qe(0)},specular:{value:new Qe(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Ne.meshphong_vert,fragmentShader:Ne.meshphong_frag},standard:{uniforms:wt([se.common,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.roughnessmap,se.metalnessmap,se.fog,se.lights,{emissive:{value:new Qe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ne.meshphysical_vert,fragmentShader:Ne.meshphysical_frag},toon:{uniforms:wt([se.common,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.gradientmap,se.fog,se.lights,{emissive:{value:new Qe(0)}}]),vertexShader:Ne.meshtoon_vert,fragmentShader:Ne.meshtoon_frag},matcap:{uniforms:wt([se.common,se.bumpmap,se.normalmap,se.displacementmap,se.fog,{matcap:{value:null}}]),vertexShader:Ne.meshmatcap_vert,fragmentShader:Ne.meshmatcap_frag},points:{uniforms:wt([se.points,se.fog]),vertexShader:Ne.points_vert,fragmentShader:Ne.points_frag},dashed:{uniforms:wt([se.common,se.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ne.linedashed_vert,fragmentShader:Ne.linedashed_frag},depth:{uniforms:wt([se.common,se.displacementmap]),vertexShader:Ne.depth_vert,fragmentShader:Ne.depth_frag},normal:{uniforms:wt([se.common,se.bumpmap,se.normalmap,se.displacementmap,{opacity:{value:1}}]),vertexShader:Ne.meshnormal_vert,fragmentShader:Ne.meshnormal_frag},sprite:{uniforms:wt([se.sprite,se.fog]),vertexShader:Ne.sprite_vert,fragmentShader:Ne.sprite_frag},background:{uniforms:{uvTransform:{value:new Ue},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ne.background_vert,fragmentShader:Ne.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ue}},vertexShader:Ne.backgroundCube_vert,fragmentShader:Ne.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ne.cube_vert,fragmentShader:Ne.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ne.equirect_vert,fragmentShader:Ne.equirect_frag},distance:{uniforms:wt([se.common,se.displacementmap,{referencePosition:{value:new z},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ne.distance_vert,fragmentShader:Ne.distance_frag},shadow:{uniforms:wt([se.lights,se.fog,{color:{value:new Qe(0)},opacity:{value:1}}]),vertexShader:Ne.shadow_vert,fragmentShader:Ne.shadow_frag}};nn.physical={uniforms:wt([nn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ue},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ue},clearcoatNormalScale:{value:new ke(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ue},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ue},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ue},sheen:{value:0},sheenColor:{value:new Qe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ue},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ue},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ue},transmissionSamplerSize:{value:new ke},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ue},attenuationDistance:{value:0},attenuationColor:{value:new Qe(0)},specularColor:{value:new Qe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ue},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ue},anisotropyVector:{value:new ke},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ue}}]),vertexShader:Ne.meshphysical_vert,fragmentShader:Ne.meshphysical_frag};const yr={r:0,b:0,g:0},qn=new Tn,Af=new mt;function wf(r,e,t,n,i,a){const s=new Qe(0);let o=i===!0?0:1,l,c,u=null,h=0,d=null;function m(M){let T=M.isScene===!0?M.background:null;if(T&&T.isTexture){const E=M.backgroundBlurriness>0;T=e.get(T,E)}return T}function g(M){let T=!1;const E=m(M);E===null?f(s,o):E&&E.isColor&&(f(E,1),T=!0);const R=r.xr.getEnvironmentBlendMode();R==="additive"?t.buffers.color.setClear(0,0,0,1,a):R==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,a),(r.autoClear||T)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),r.clear(r.autoClearColor,r.autoClearDepth,r.autoClearStencil))}function S(M,T){const E=m(T);E&&(E.isCubeTexture||E.mapping===Fr)?(c===void 0&&(c=new Yt(new $i(1,1,1),new Gt({name:"BackgroundCubeMaterial",uniforms:Ri(nn.backgroundCube.uniforms),vertexShader:nn.backgroundCube.vertexShader,fragmentShader:nn.backgroundCube.fragmentShader,side:Lt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(R,C,P){this.matrixWorld.copyPosition(P.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),qn.copy(T.backgroundRotation),qn.x*=-1,qn.y*=-1,qn.z*=-1,E.isCubeTexture&&E.isRenderTargetTexture===!1&&(qn.y*=-1,qn.z*=-1),c.material.uniforms.envMap.value=E,c.material.uniforms.flipEnvMap.value=E.isCubeTexture&&E.isRenderTargetTexture===!1?-1:1,c.material.uniforms.backgroundBlurriness.value=T.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(Af.makeRotationFromEuler(qn)),c.material.toneMapped=We.getTransfer(E.colorSpace)!==Ze,(u!==E||h!==E.version||d!==r.toneMapping)&&(c.material.needsUpdate=!0,u=E,h=E.version,d=r.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null)):E&&E.isTexture&&(l===void 0&&(l=new Yt(new ii(2,2),new Gt({name:"BackgroundMaterial",uniforms:Ri(nn.background.uniforms),vertexShader:nn.background.vertexShader,fragmentShader:nn.background.fragmentShader,side:Vn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=E,l.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,l.material.toneMapped=We.getTransfer(E.colorSpace)!==Ze,E.matrixAutoUpdate===!0&&E.updateMatrix(),l.material.uniforms.uvTransform.value.copy(E.matrix),(u!==E||h!==E.version||d!==r.toneMapping)&&(l.material.needsUpdate=!0,u=E,h=E.version,d=r.toneMapping),l.layers.enableAll(),M.unshift(l,l.geometry,l.material,0,0,null))}function f(M,T){M.getRGB(yr,Pl(r)),t.buffers.color.setClear(yr.r,yr.g,yr.b,T,a)}function p(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return s},setClearColor:function(M,T=1){s.set(M),o=T,f(s,o)},getClearAlpha:function(){return o},setClearAlpha:function(M){o=M,f(s,o)},render:g,addToRenderList:S,dispose:p}}function Cf(r,e){const t=r.getParameter(r.MAX_VERTEX_ATTRIBS),n={},i=d(null);let a=i,s=!1;function o(A,B,V,X,O){let G=!1;const U=h(A,X,V,B);a!==U&&(a=U,c(a.object)),G=m(A,X,V,O),G&&g(A,X,V,O),O!==null&&e.update(O,r.ELEMENT_ARRAY_BUFFER),(G||s)&&(s=!1,E(A,B,V,X),O!==null&&r.bindBuffer(r.ELEMENT_ARRAY_BUFFER,e.get(O).buffer))}function l(){return r.createVertexArray()}function c(A){return r.bindVertexArray(A)}function u(A){return r.deleteVertexArray(A)}function h(A,B,V,X){const O=X.wireframe===!0;let G=n[B.id];G===void 0&&(G={},n[B.id]=G);const U=A.isInstancedMesh===!0?A.id:0;let Q=G[U];Q===void 0&&(Q={},G[U]=Q);let Z=Q[V.id];Z===void 0&&(Z={},Q[V.id]=Z);let ce=Z[O];return ce===void 0&&(ce=d(l()),Z[O]=ce),ce}function d(A){const B=[],V=[],X=[];for(let O=0;O<t;O++)B[O]=0,V[O]=0,X[O]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:B,enabledAttributes:V,attributeDivisors:X,object:A,attributes:{},index:null}}function m(A,B,V,X){const O=a.attributes,G=B.attributes;let U=0;const Q=V.getAttributes();for(const Z in Q)if(Q[Z].location>=0){const pe=O[Z];let ue=G[Z];if(ue===void 0&&(Z==="instanceMatrix"&&A.instanceMatrix&&(ue=A.instanceMatrix),Z==="instanceColor"&&A.instanceColor&&(ue=A.instanceColor)),pe===void 0||pe.attribute!==ue||ue&&pe.data!==ue.data)return!0;U++}return a.attributesNum!==U||a.index!==X}function g(A,B,V,X){const O={},G=B.attributes;let U=0;const Q=V.getAttributes();for(const Z in Q)if(Q[Z].location>=0){let pe=G[Z];pe===void 0&&(Z==="instanceMatrix"&&A.instanceMatrix&&(pe=A.instanceMatrix),Z==="instanceColor"&&A.instanceColor&&(pe=A.instanceColor));const ue={};ue.attribute=pe,pe&&pe.data&&(ue.data=pe.data),O[Z]=ue,U++}a.attributes=O,a.attributesNum=U,a.index=X}function S(){const A=a.newAttributes;for(let B=0,V=A.length;B<V;B++)A[B]=0}function f(A){p(A,0)}function p(A,B){const V=a.newAttributes,X=a.enabledAttributes,O=a.attributeDivisors;V[A]=1,X[A]===0&&(r.enableVertexAttribArray(A),X[A]=1),O[A]!==B&&(r.vertexAttribDivisor(A,B),O[A]=B)}function M(){const A=a.newAttributes,B=a.enabledAttributes;for(let V=0,X=B.length;V<X;V++)B[V]!==A[V]&&(r.disableVertexAttribArray(V),B[V]=0)}function T(A,B,V,X,O,G,U){U===!0?r.vertexAttribIPointer(A,B,V,O,G):r.vertexAttribPointer(A,B,V,X,O,G)}function E(A,B,V,X){S();const O=X.attributes,G=V.getAttributes(),U=B.defaultAttributeValues;for(const Q in G){const Z=G[Q];if(Z.location>=0){let ce=O[Q];if(ce===void 0&&(Q==="instanceMatrix"&&A.instanceMatrix&&(ce=A.instanceMatrix),Q==="instanceColor"&&A.instanceColor&&(ce=A.instanceColor)),ce!==void 0){const pe=ce.normalized,ue=ce.itemSize,Ce=e.get(ce);if(Ce===void 0)continue;const at=Ce.buffer,rt=Ce.type,$=Ce.bytesPerElement,ne=rt===r.INT||rt===r.UNSIGNED_INT||ce.gpuType===Ms;if(ce.isInterleavedBufferAttribute){const ae=ce.data,Le=ae.stride,Ae=ce.offset;if(ae.isInstancedInterleavedBuffer){for(let Re=0;Re<Z.locationSize;Re++)p(Z.location+Re,ae.meshPerAttribute);A.isInstancedMesh!==!0&&X._maxInstanceCount===void 0&&(X._maxInstanceCount=ae.meshPerAttribute*ae.count)}else for(let Re=0;Re<Z.locationSize;Re++)f(Z.location+Re);r.bindBuffer(r.ARRAY_BUFFER,at);for(let Re=0;Re<Z.locationSize;Re++)T(Z.location+Re,ue/Z.locationSize,rt,pe,Le*$,(Ae+ue/Z.locationSize*Re)*$,ne)}else{if(ce.isInstancedBufferAttribute){for(let ae=0;ae<Z.locationSize;ae++)p(Z.location+ae,ce.meshPerAttribute);A.isInstancedMesh!==!0&&X._maxInstanceCount===void 0&&(X._maxInstanceCount=ce.meshPerAttribute*ce.count)}else for(let ae=0;ae<Z.locationSize;ae++)f(Z.location+ae);r.bindBuffer(r.ARRAY_BUFFER,at);for(let ae=0;ae<Z.locationSize;ae++)T(Z.location+ae,ue/Z.locationSize,rt,pe,ue*$,ue/Z.locationSize*ae*$,ne)}}else if(U!==void 0){const pe=U[Q];if(pe!==void 0)switch(pe.length){case 2:r.vertexAttrib2fv(Z.location,pe);break;case 3:r.vertexAttrib3fv(Z.location,pe);break;case 4:r.vertexAttrib4fv(Z.location,pe);break;default:r.vertexAttrib1fv(Z.location,pe)}}}}M()}function R(){y();for(const A in n){const B=n[A];for(const V in B){const X=B[V];for(const O in X){const G=X[O];for(const U in G)u(G[U].object),delete G[U];delete X[O]}}delete n[A]}}function C(A){if(n[A.id]===void 0)return;const B=n[A.id];for(const V in B){const X=B[V];for(const O in X){const G=X[O];for(const U in G)u(G[U].object),delete G[U];delete X[O]}}delete n[A.id]}function P(A){for(const B in n){const V=n[B];for(const X in V){const O=V[X];if(O[A.id]===void 0)continue;const G=O[A.id];for(const U in G)u(G[U].object),delete G[U];delete O[A.id]}}}function _(A){for(const B in n){const V=n[B],X=A.isInstancedMesh===!0?A.id:0,O=V[X];if(O!==void 0){for(const G in O){const U=O[G];for(const Q in U)u(U[Q].object),delete U[Q];delete O[G]}delete V[X],Object.keys(V).length===0&&delete n[B]}}}function y(){W(),s=!0,a!==i&&(a=i,c(a.object))}function W(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:o,reset:y,resetDefaultState:W,dispose:R,releaseStatesOfGeometry:C,releaseStatesOfObject:_,releaseStatesOfProgram:P,initAttributes:S,enableAttribute:f,disableUnusedAttributes:M}}function Rf(r,e,t){let n;function i(c){n=c}function a(c,u){r.drawArrays(n,c,u),t.update(u,n,1)}function s(c,u,h){h!==0&&(r.drawArraysInstanced(n,c,u,h),t.update(u,n,h))}function o(c,u,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,u,0,h);let m=0;for(let g=0;g<h;g++)m+=u[g];t.update(m,n,1)}function l(c,u,h,d){if(h===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let g=0;g<c.length;g++)s(c[g],u[g],d[g]);else{m.multiDrawArraysInstancedWEBGL(n,c,0,u,0,d,0,h);let g=0;for(let S=0;S<h;S++)g+=u[S]*d[S];t.update(g,n,1)}}this.setMode=i,this.render=a,this.renderInstances=s,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function Pf(r,e,t,n){let i;function a(){if(i!==void 0)return i;if(e.has("EXT_texture_filter_anisotropic")===!0){const P=e.get("EXT_texture_filter_anisotropic");i=r.getParameter(P.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function s(P){return!(P!==zt&&n.convert(P)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(P){const _=P===bn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(P!==Dt&&n.convert(P)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_TYPE)&&P!==an&&!_)}function l(P){if(P==="highp"){if(r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.HIGH_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.HIGH_FLOAT).precision>0)return"highp";P="mediump"}return P==="mediump"&&r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.MEDIUM_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp";const u=l(c);u!==c&&(De("WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);const h=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),m=r.getParameter(r.MAX_TEXTURE_IMAGE_UNITS),g=r.getParameter(r.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=r.getParameter(r.MAX_TEXTURE_SIZE),f=r.getParameter(r.MAX_CUBE_MAP_TEXTURE_SIZE),p=r.getParameter(r.MAX_VERTEX_ATTRIBS),M=r.getParameter(r.MAX_VERTEX_UNIFORM_VECTORS),T=r.getParameter(r.MAX_VARYING_VECTORS),E=r.getParameter(r.MAX_FRAGMENT_UNIFORM_VECTORS),R=r.getParameter(r.MAX_SAMPLES),C=r.getParameter(r.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:l,textureFormatReadable:s,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:h,reversedDepthBuffer:d,maxTextures:m,maxVertexTextures:g,maxTextureSize:S,maxCubemapSize:f,maxAttributes:p,maxVertexUniforms:M,maxVaryings:T,maxFragmentUniforms:E,maxSamples:R,samples:C}}function Df(r){const e=this;let t=null,n=0,i=!1,a=!1;const s=new Zn,o=new Ue,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){const m=h.length!==0||d||n!==0||i;return i=d,n=h.length,m},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(h,d){t=u(h,d,0)},this.setState=function(h,d,m){const g=h.clippingPlanes,S=h.clipIntersection,f=h.clipShadows,p=r.get(h);if(!i||g===null||g.length===0||a&&!f)a?u(null):c();else{const M=a?0:n,T=M*4;let E=p.clippingState||null;l.value=E,E=u(g,d,T,m);for(let R=0;R!==T;++R)E[R]=t[R];p.clippingState=E,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=M}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function u(h,d,m,g){const S=h!==null?h.length:0;let f=null;if(S!==0){if(f=l.value,g!==!0||f===null){const p=m+S*4,M=d.matrixWorldInverse;o.getNormalMatrix(M),(f===null||f.length<p)&&(f=new Float32Array(p));for(let T=0,E=m;T!==S;++T,E+=4)s.copy(h[T]).applyMatrix4(M,o),s.normal.toArray(f,E),f[E+3]=s.constant}l.value=f,l.needsUpdate=!0}return e.numPlanes=S,e.numIntersection=0,f}}const zn=4,wo=[.125,.215,.35,.446,.526,.582],Jn=20,If=256,Bi=new Br,Co=new Qe;let Ma=null,ya=0,ba=0,Ea=!1;const Lf=new z;class Ro{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,i=100,a={}){const{size:s=256,position:o=Lf}=a;Ma=this._renderer.getRenderTarget(),ya=this._renderer.getActiveCubeFace(),ba=this._renderer.getActiveMipmapLevel(),Ea=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(s);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,n,i,l,o),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Io(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Do(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Ma,ya,ba),this._renderer.xr.enabled=Ea,e.scissorTest=!1,Si(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===ni||e.mapping===Ai?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Ma=this._renderer.getRenderTarget(),ya=this._renderer.getActiveCubeFace(),ba=this._renderer.getActiveMipmapLevel(),Ea=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:At,minFilter:At,generateMipmaps:!1,type:bn,format:zt,colorSpace:Ci,depthBuffer:!1},i=Po(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Po(e,t,n);const{_lodMax:a}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=Uf(a)),this._blurMaterial=Ff(a,e,t),this._ggxMaterial=Nf(a,e,t)}return i}_compileMaterial(e){const t=new Yt(new An,e);this._renderer.compile(t,Bi)}_sceneToCubeUV(e,t,n,i,a){const l=new jt(90,1,t,n),c=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],h=this._renderer,d=h.autoClear,m=h.toneMapping;h.getClearColor(Co),h.toneMapping=on,h.autoClear=!1,h.state.buffers.depth.getReversed()&&(h.setRenderTarget(i),h.clearDepth(),h.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Yt(new $i,new Al({name:"PMREM.Background",side:Lt,depthWrite:!1,depthTest:!1})));const S=this._backgroundBox,f=S.material;let p=!1;const M=e.background;M?M.isColor&&(f.color.copy(M),e.background=null,p=!0):(f.color.copy(Co),p=!0);for(let T=0;T<6;T++){const E=T%3;E===0?(l.up.set(0,c[T],0),l.position.set(a.x,a.y,a.z),l.lookAt(a.x+u[T],a.y,a.z)):E===1?(l.up.set(0,0,c[T]),l.position.set(a.x,a.y,a.z),l.lookAt(a.x,a.y+u[T],a.z)):(l.up.set(0,c[T],0),l.position.set(a.x,a.y,a.z),l.lookAt(a.x,a.y,a.z+u[T]));const R=this._cubeSize;Si(i,E*R,T>2?R:0,R,R),h.setRenderTarget(i),p&&h.render(S,l),h.render(e,l)}h.toneMapping=m,h.autoClear=d,e.background=M}_textureToCubeUV(e,t){const n=this._renderer,i=e.mapping===ni||e.mapping===Ai;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=Io()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Do());const a=i?this._cubemapMaterial:this._equirectMaterial,s=this._lodMeshes[0];s.material=a;const o=a.uniforms;o.envMap.value=e;const l=this._cubeSize;Si(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(s,Bi)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;const i=this._lodMeshes.length;for(let a=1;a<i;a++)this._applyGGXFilter(e,a-1,a);t.autoClear=n}_applyGGXFilter(e,t,n){const i=this._renderer,a=this._pingPongRenderTarget,s=this._ggxMaterial,o=this._lodMeshes[n];o.material=s;const l=s.uniforms,c=n/(this._lodMeshes.length-1),u=t/(this._lodMeshes.length-1),h=Math.sqrt(c*c-u*u),d=0+c*1.25,m=h*d,{_lodMax:g}=this,S=this._sizeLods[n],f=3*S*(n>g-zn?n-g+zn:0),p=4*(this._cubeSize-S);l.envMap.value=e.texture,l.roughness.value=m,l.mipInt.value=g-t,Si(a,f,p,3*S,2*S),i.setRenderTarget(a),i.render(o,Bi),l.envMap.value=a.texture,l.roughness.value=0,l.mipInt.value=g-n,Si(e,f,p,3*S,2*S),i.setRenderTarget(e),i.render(o,Bi)}_blur(e,t,n,i,a){const s=this._pingPongRenderTarget;this._halfBlur(e,s,t,n,i,"latitudinal",a),this._halfBlur(s,e,n,n,i,"longitudinal",a)}_halfBlur(e,t,n,i,a,s,o){const l=this._renderer,c=this._blurMaterial;s!=="latitudinal"&&s!=="longitudinal"&&Ye("blur direction must be either latitudinal or longitudinal!");const u=3,h=this._lodMeshes[i];h.material=c;const d=c.uniforms,m=this._sizeLods[n]-1,g=isFinite(a)?Math.PI/(2*m):2*Math.PI/(2*Jn-1),S=a/g,f=isFinite(a)?1+Math.floor(u*S):Jn;f>Jn&&De(`sigmaRadians, ${a}, is too large and will clip, as it requested ${f} samples when the maximum is set to ${Jn}`);const p=[];let M=0;for(let P=0;P<Jn;++P){const _=P/S,y=Math.exp(-_*_/2);p.push(y),P===0?M+=y:P<f&&(M+=2*y)}for(let P=0;P<p.length;P++)p[P]=p[P]/M;d.envMap.value=e.texture,d.samples.value=f,d.weights.value=p,d.latitudinal.value=s==="latitudinal",o&&(d.poleAxis.value=o);const{_lodMax:T}=this;d.dTheta.value=g,d.mipInt.value=T-n;const E=this._sizeLods[i],R=3*E*(i>T-zn?i-T+zn:0),C=4*(this._cubeSize-E);Si(t,R,C,3*E,2*E),l.setRenderTarget(t),l.render(h,Bi)}}function Uf(r){const e=[],t=[],n=[];let i=r;const a=r-zn+1+wo.length;for(let s=0;s<a;s++){const o=Math.pow(2,i);e.push(o);let l=1/o;s>r-zn?l=wo[s-r+zn-1]:s===0&&(l=0),t.push(l);const c=1/(o-2),u=-c,h=1+c,d=[u,u,h,u,h,h,u,u,h,h,u,h],m=6,g=6,S=3,f=2,p=1,M=new Float32Array(S*g*m),T=new Float32Array(f*g*m),E=new Float32Array(p*g*m);for(let C=0;C<m;C++){const P=C%3*2/3-1,_=C>2?0:-1,y=[P,_,0,P+2/3,_,0,P+2/3,_+1,0,P,_,0,P+2/3,_+1,0,P,_+1,0];M.set(y,S*g*C),T.set(d,f*g*C);const W=[C,C,C,C,C,C];E.set(W,p*g*C)}const R=new An;R.setAttribute("position",new cn(M,S)),R.setAttribute("uv",new cn(T,f)),R.setAttribute("faceIndex",new cn(E,p)),n.push(new Yt(R,null)),i>zn&&i--}return{lodMeshes:n,sizeLods:e,sigmas:t}}function Po(r,e,t){const n=new ln(r,e,t);return n.texture.mapping=Fr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Si(r,e,t,n,i){r.viewport.set(e,t,n,i),r.scissor.set(e,t,n,i)}function Nf(r,e,t){return new Gt({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:If,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${r}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:zr(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:Sn,depthTest:!1,depthWrite:!1})}function Ff(r,e,t){const n=new Float32Array(Jn),i=new z(0,1,0);return new Gt({name:"SphericalGaussianBlur",defines:{n:Jn,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${r}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:zr(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Sn,depthTest:!1,depthWrite:!1})}function Do(){return new Gt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:zr(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Sn,depthTest:!1,depthWrite:!1})}function Io(){return new Gt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:zr(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Sn,depthTest:!1,depthWrite:!1})}function zr(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}class Ll extends ln{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];this.texture=new Cl(i),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new $i(5,5,5),a=new Gt({name:"CubemapFromEquirect",uniforms:Ri(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Lt,blending:Sn});a.uniforms.tEquirect.value=t;const s=new Yt(i,a),o=t.minFilter;return t.minFilter===Qn&&(t.minFilter=At),new Gu(1,10,this).update(e,s),t.minFilter=o,s.geometry.dispose(),s.material.dispose(),this}clear(e,t=!0,n=!0,i=!0){const a=e.getRenderTarget();for(let s=0;s<6;s++)e.setRenderTarget(this,s),e.clear(t,n,i);e.setRenderTarget(a)}}function Of(r){let e=new WeakMap,t=new WeakMap,n=null;function i(d,m=!1){return d==null?null:m?s(d):a(d)}function a(d){if(d&&d.isTexture){const m=d.mapping;if(m===$r||m===Kr)if(e.has(d)){const g=e.get(d).texture;return o(g,d.mapping)}else{const g=d.image;if(g&&g.height>0){const S=new Ll(g.height);return S.fromEquirectangularTexture(r,d),e.set(d,S),d.addEventListener("dispose",c),o(S.texture,d.mapping)}else return null}}return d}function s(d){if(d&&d.isTexture){const m=d.mapping,g=m===$r||m===Kr,S=m===ni||m===Ai;if(g||S){let f=t.get(d);const p=f!==void 0?f.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==p)return n===null&&(n=new Ro(r)),f=g?n.fromEquirectangular(d,f):n.fromCubemap(d,f),f.texture.pmremVersion=d.pmremVersion,t.set(d,f),f.texture;if(f!==void 0)return f.texture;{const M=d.image;return g&&M&&M.height>0||S&&M&&l(M)?(n===null&&(n=new Ro(r)),f=g?n.fromEquirectangular(d):n.fromCubemap(d),f.texture.pmremVersion=d.pmremVersion,t.set(d,f),d.addEventListener("dispose",u),f.texture):null}}}return d}function o(d,m){return m===$r?d.mapping=ni:m===Kr&&(d.mapping=Ai),d}function l(d){let m=0;const g=6;for(let S=0;S<g;S++)d[S]!==void 0&&m++;return m===g}function c(d){const m=d.target;m.removeEventListener("dispose",c);const g=e.get(m);g!==void 0&&(e.delete(m),g.dispose())}function u(d){const m=d.target;m.removeEventListener("dispose",u);const g=t.get(m);g!==void 0&&(t.delete(m),g.dispose())}function h(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:i,dispose:h}}function Bf(r){const e={};function t(n){if(e[n]!==void 0)return e[n];const i=r.getExtension(n);return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const i=t(n);return i===null&&Nr("WebGLRenderer: "+n+" extension not supported."),i}}}function zf(r,e,t,n){const i={},a=new WeakMap;function s(h){const d=h.target;d.index!==null&&e.remove(d.index);for(const g in d.attributes)e.remove(d.attributes[g]);d.removeEventListener("dispose",s),delete i[d.id];const m=a.get(d);m&&(e.remove(m),a.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function o(h,d){return i[d.id]===!0||(d.addEventListener("dispose",s),i[d.id]=!0,t.memory.geometries++),d}function l(h){const d=h.attributes;for(const m in d)e.update(d[m],r.ARRAY_BUFFER)}function c(h){const d=[],m=h.index,g=h.attributes.position;let S=0;if(g===void 0)return;if(m!==null){const M=m.array;S=m.version;for(let T=0,E=M.length;T<E;T+=3){const R=M[T+0],C=M[T+1],P=M[T+2];d.push(R,C,C,P,P,R)}}else{const M=g.array;S=g.version;for(let T=0,E=M.length/3-1;T<E;T+=3){const R=T+0,C=T+1,P=T+2;d.push(R,C,C,P,P,R)}}const f=new(g.count>=65535?Tl:El)(d,1);f.version=S;const p=a.get(h);p&&e.remove(p),a.set(h,f)}function u(h){const d=a.get(h);if(d){const m=h.index;m!==null&&d.version<m.version&&c(h)}else c(h);return a.get(h)}return{get:o,update:l,getWireframeAttribute:u}}function Vf(r,e,t){let n;function i(d){n=d}let a,s;function o(d){a=d.type,s=d.bytesPerElement}function l(d,m){r.drawElements(n,m,a,d*s),t.update(m,n,1)}function c(d,m,g){g!==0&&(r.drawElementsInstanced(n,m,a,d*s,g),t.update(m,n,g))}function u(d,m,g){if(g===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,m,0,a,d,0,g);let f=0;for(let p=0;p<g;p++)f+=m[p];t.update(f,n,1)}function h(d,m,g,S){if(g===0)return;const f=e.get("WEBGL_multi_draw");if(f===null)for(let p=0;p<d.length;p++)c(d[p]/s,m[p],S[p]);else{f.multiDrawElementsInstancedWEBGL(n,m,0,a,d,0,S,0,g);let p=0;for(let M=0;M<g;M++)p+=m[M]*S[M];t.update(p,n,1)}}this.setMode=i,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=h}function kf(r){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(a,s,o){switch(t.calls++,s){case r.TRIANGLES:t.triangles+=o*(a/3);break;case r.LINES:t.lines+=o*(a/2);break;case r.LINE_STRIP:t.lines+=o*(a-1);break;case r.LINE_LOOP:t.lines+=o*a;break;case r.POINTS:t.points+=o*a;break;default:Ye("WebGLInfo: Unknown draw mode:",s);break}}function i(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:i,update:n}}function Gf(r,e,t){const n=new WeakMap,i=new ot;function a(s,o,l){const c=s.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,h=u!==void 0?u.length:0;let d=n.get(o);if(d===void 0||d.count!==h){let W=function(){_.dispose(),n.delete(o),o.removeEventListener("dispose",W)};var m=W;d!==void 0&&d.texture.dispose();const g=o.morphAttributes.position!==void 0,S=o.morphAttributes.normal!==void 0,f=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],M=o.morphAttributes.normal||[],T=o.morphAttributes.color||[];let E=0;g===!0&&(E=1),S===!0&&(E=2),f===!0&&(E=3);let R=o.attributes.position.count*E,C=1;R>e.maxTextureSize&&(C=Math.ceil(R/e.maxTextureSize),R=e.maxTextureSize);const P=new Float32Array(R*C*4*h),_=new Sl(P,R,C,h);_.type=an,_.needsUpdate=!0;const y=E*4;for(let A=0;A<h;A++){const B=p[A],V=M[A],X=T[A],O=R*C*4*A;for(let G=0;G<B.count;G++){const U=G*y;g===!0&&(i.fromBufferAttribute(B,G),P[O+U+0]=i.x,P[O+U+1]=i.y,P[O+U+2]=i.z,P[O+U+3]=0),S===!0&&(i.fromBufferAttribute(V,G),P[O+U+4]=i.x,P[O+U+5]=i.y,P[O+U+6]=i.z,P[O+U+7]=0),f===!0&&(i.fromBufferAttribute(X,G),P[O+U+8]=i.x,P[O+U+9]=i.y,P[O+U+10]=i.z,P[O+U+11]=X.itemSize===4?i.w:1)}}d={count:h,texture:_,size:new ke(R,C)},n.set(o,d),o.addEventListener("dispose",W)}if(s.isInstancedMesh===!0&&s.morphTexture!==null)l.getUniforms().setValue(r,"morphTexture",s.morphTexture,t);else{let g=0;for(let f=0;f<c.length;f++)g+=c[f];const S=o.morphTargetsRelative?1:1-g;l.getUniforms().setValue(r,"morphTargetBaseInfluence",S),l.getUniforms().setValue(r,"morphTargetInfluences",c)}l.getUniforms().setValue(r,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(r,"morphTargetsTextureSize",d.size)}return{update:a}}function Hf(r,e,t,n,i){let a=new WeakMap;function s(c){const u=i.render.frame,h=c.geometry,d=e.get(c,h);if(a.get(d)!==u&&(e.update(d),a.set(d,u)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),a.get(c)!==u&&(t.update(c.instanceMatrix,r.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,r.ARRAY_BUFFER),a.set(c,u))),c.isSkinnedMesh){const m=c.skeleton;a.get(m)!==u&&(m.update(),a.set(m,u))}return d}function o(){a=new WeakMap}function l(c){const u=c.target;u.removeEventListener("dispose",l),n.releaseStatesOfObject(u),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:s,dispose:o}}const Wf={[rl]:"LINEAR_TONE_MAPPING",[al]:"REINHARD_TONE_MAPPING",[sl]:"CINEON_TONE_MAPPING",[ol]:"ACES_FILMIC_TONE_MAPPING",[cl]:"AGX_TONE_MAPPING",[ul]:"NEUTRAL_TONE_MAPPING",[ll]:"CUSTOM_TONE_MAPPING"};function Xf(r,e,t,n,i){const a=new ln(e,t,{type:r,depthBuffer:n,stencilBuffer:i}),s=new ln(e,t,{type:bn,depthBuffer:!1,stencilBuffer:!1}),o=new An;o.setAttribute("position",new yn([-1,3,0,-1,-1,0,3,-1,0],3)),o.setAttribute("uv",new yn([0,2,0,0,2,0],2));const l=new zu({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),c=new Yt(o,l),u=new Br(-1,1,1,-1,0,1);let h=null,d=null,m=!1,g,S=null,f=[],p=!1;this.setSize=function(M,T){a.setSize(M,T),s.setSize(M,T);for(let E=0;E<f.length;E++){const R=f[E];R.setSize&&R.setSize(M,T)}},this.setEffects=function(M){f=M,p=f.length>0&&f[0].isRenderPass===!0;const T=a.width,E=a.height;for(let R=0;R<f.length;R++){const C=f[R];C.setSize&&C.setSize(T,E)}},this.begin=function(M,T){if(m||M.toneMapping===on&&f.length===0)return!1;if(S=T,T!==null){const E=T.width,R=T.height;(a.width!==E||a.height!==R)&&this.setSize(E,R)}return p===!1&&M.setRenderTarget(a),g=M.toneMapping,M.toneMapping=on,!0},this.hasRenderPass=function(){return p},this.end=function(M,T){M.toneMapping=g,m=!0;let E=a,R=s;for(let C=0;C<f.length;C++){const P=f[C];if(P.enabled!==!1&&(P.render(M,R,E,T),P.needsSwap!==!1)){const _=E;E=R,R=_}}if(h!==M.outputColorSpace||d!==M.toneMapping){h=M.outputColorSpace,d=M.toneMapping,l.defines={},We.getTransfer(h)===Ze&&(l.defines.SRGB_TRANSFER="");const C=Wf[d];C&&(l.defines[C]=""),l.needsUpdate=!0}l.uniforms.tDiffuse.value=E.texture,M.setRenderTarget(S),M.render(c,u),S=null,m=!1},this.isCompositing=function(){return m},this.dispose=function(){a.dispose(),s.dispose(),o.dispose(),l.dispose()}}const Ul=new Ct,_s=new Xi(1,1),Nl=new Sl,Fl=new vu,Ol=new Cl,Lo=[],Uo=[],No=new Float32Array(16),Fo=new Float32Array(9),Oo=new Float32Array(4);function Ii(r,e,t){const n=r[0];if(n<=0||n>0)return r;const i=e*t;let a=Lo[i];if(a===void 0&&(a=new Float32Array(i),Lo[i]=a),e!==0){n.toArray(a,0);for(let s=1,o=0;s!==e;++s)o+=t,r[s].toArray(a,o)}return a}function vt(r,e){if(r.length!==e.length)return!1;for(let t=0,n=r.length;t<n;t++)if(r[t]!==e[t])return!1;return!0}function _t(r,e){for(let t=0,n=e.length;t<n;t++)r[t]=e[t]}function Vr(r,e){let t=Uo[e];t===void 0&&(t=new Int32Array(e),Uo[e]=t);for(let n=0;n!==e;++n)t[n]=r.allocateTextureUnit();return t}function Yf(r,e){const t=this.cache;t[0]!==e&&(r.uniform1f(this.addr,e),t[0]=e)}function qf(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(vt(t,e))return;r.uniform2fv(this.addr,e),_t(t,e)}}function $f(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(r.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(vt(t,e))return;r.uniform3fv(this.addr,e),_t(t,e)}}function Kf(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(vt(t,e))return;r.uniform4fv(this.addr,e),_t(t,e)}}function Zf(r,e){const t=this.cache,n=e.elements;if(n===void 0){if(vt(t,e))return;r.uniformMatrix2fv(this.addr,!1,e),_t(t,e)}else{if(vt(t,n))return;Oo.set(n),r.uniformMatrix2fv(this.addr,!1,Oo),_t(t,n)}}function jf(r,e){const t=this.cache,n=e.elements;if(n===void 0){if(vt(t,e))return;r.uniformMatrix3fv(this.addr,!1,e),_t(t,e)}else{if(vt(t,n))return;Fo.set(n),r.uniformMatrix3fv(this.addr,!1,Fo),_t(t,n)}}function Jf(r,e){const t=this.cache,n=e.elements;if(n===void 0){if(vt(t,e))return;r.uniformMatrix4fv(this.addr,!1,e),_t(t,e)}else{if(vt(t,n))return;No.set(n),r.uniformMatrix4fv(this.addr,!1,No),_t(t,n)}}function Qf(r,e){const t=this.cache;t[0]!==e&&(r.uniform1i(this.addr,e),t[0]=e)}function ep(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(vt(t,e))return;r.uniform2iv(this.addr,e),_t(t,e)}}function tp(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(vt(t,e))return;r.uniform3iv(this.addr,e),_t(t,e)}}function np(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(vt(t,e))return;r.uniform4iv(this.addr,e),_t(t,e)}}function ip(r,e){const t=this.cache;t[0]!==e&&(r.uniform1ui(this.addr,e),t[0]=e)}function rp(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(vt(t,e))return;r.uniform2uiv(this.addr,e),_t(t,e)}}function ap(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(vt(t,e))return;r.uniform3uiv(this.addr,e),_t(t,e)}}function sp(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(vt(t,e))return;r.uniform4uiv(this.addr,e),_t(t,e)}}function op(r,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i);let a;this.type===r.SAMPLER_2D_SHADOW?(_s.compareFunction=t.isReversedDepthBuffer()?Cs:ws,a=_s):a=Ul,t.setTexture2D(e||a,i)}function lp(r,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||Fl,i)}function cp(r,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),t.setTextureCube(e||Ol,i)}function up(r,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||Nl,i)}function dp(r){switch(r){case 5126:return Yf;case 35664:return qf;case 35665:return $f;case 35666:return Kf;case 35674:return Zf;case 35675:return jf;case 35676:return Jf;case 5124:case 35670:return Qf;case 35667:case 35671:return ep;case 35668:case 35672:return tp;case 35669:case 35673:return np;case 5125:return ip;case 36294:return rp;case 36295:return ap;case 36296:return sp;case 35678:case 36198:case 36298:case 36306:case 35682:return op;case 35679:case 36299:case 36307:return lp;case 35680:case 36300:case 36308:case 36293:return cp;case 36289:case 36303:case 36311:case 36292:return up}}function hp(r,e){r.uniform1fv(this.addr,e)}function fp(r,e){const t=Ii(e,this.size,2);r.uniform2fv(this.addr,t)}function pp(r,e){const t=Ii(e,this.size,3);r.uniform3fv(this.addr,t)}function mp(r,e){const t=Ii(e,this.size,4);r.uniform4fv(this.addr,t)}function gp(r,e){const t=Ii(e,this.size,4);r.uniformMatrix2fv(this.addr,!1,t)}function vp(r,e){const t=Ii(e,this.size,9);r.uniformMatrix3fv(this.addr,!1,t)}function _p(r,e){const t=Ii(e,this.size,16);r.uniformMatrix4fv(this.addr,!1,t)}function xp(r,e){r.uniform1iv(this.addr,e)}function Sp(r,e){r.uniform2iv(this.addr,e)}function Mp(r,e){r.uniform3iv(this.addr,e)}function yp(r,e){r.uniform4iv(this.addr,e)}function bp(r,e){r.uniform1uiv(this.addr,e)}function Ep(r,e){r.uniform2uiv(this.addr,e)}function Tp(r,e){r.uniform3uiv(this.addr,e)}function Ap(r,e){r.uniform4uiv(this.addr,e)}function wp(r,e,t){const n=this.cache,i=e.length,a=Vr(t,i);vt(n,a)||(r.uniform1iv(this.addr,a),_t(n,a));let s;this.type===r.SAMPLER_2D_SHADOW?s=_s:s=Ul;for(let o=0;o!==i;++o)t.setTexture2D(e[o]||s,a[o])}function Cp(r,e,t){const n=this.cache,i=e.length,a=Vr(t,i);vt(n,a)||(r.uniform1iv(this.addr,a),_t(n,a));for(let s=0;s!==i;++s)t.setTexture3D(e[s]||Fl,a[s])}function Rp(r,e,t){const n=this.cache,i=e.length,a=Vr(t,i);vt(n,a)||(r.uniform1iv(this.addr,a),_t(n,a));for(let s=0;s!==i;++s)t.setTextureCube(e[s]||Ol,a[s])}function Pp(r,e,t){const n=this.cache,i=e.length,a=Vr(t,i);vt(n,a)||(r.uniform1iv(this.addr,a),_t(n,a));for(let s=0;s!==i;++s)t.setTexture2DArray(e[s]||Nl,a[s])}function Dp(r){switch(r){case 5126:return hp;case 35664:return fp;case 35665:return pp;case 35666:return mp;case 35674:return gp;case 35675:return vp;case 35676:return _p;case 5124:case 35670:return xp;case 35667:case 35671:return Sp;case 35668:case 35672:return Mp;case 35669:case 35673:return yp;case 5125:return bp;case 36294:return Ep;case 36295:return Tp;case 36296:return Ap;case 35678:case 36198:case 36298:case 36306:case 35682:return wp;case 35679:case 36299:case 36307:return Cp;case 35680:case 36300:case 36308:case 36293:return Rp;case 36289:case 36303:case 36311:case 36292:return Pp}}class Ip{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=dp(t.type)}}class Lp{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Dp(t.type)}}class Up{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const i=this.seq;for(let a=0,s=i.length;a!==s;++a){const o=i[a];o.setValue(e,t[o.id],n)}}}const Ta=/(\w+)(\])?(\[|\.)?/g;function Bo(r,e){r.seq.push(e),r.map[e.id]=e}function Np(r,e,t){const n=r.name,i=n.length;for(Ta.lastIndex=0;;){const a=Ta.exec(n),s=Ta.lastIndex;let o=a[1];const l=a[2]==="]",c=a[3];if(l&&(o=o|0),c===void 0||c==="["&&s+2===i){Bo(t,c===void 0?new Ip(o,r,e):new Lp(o,r,e));break}else{let h=t.map[o];h===void 0&&(h=new Up(o),Bo(t,h)),t=h}}}class Dr{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const o=e.getActiveUniform(t,s),l=e.getUniformLocation(t,o.name);Np(o,l,this)}const i=[],a=[];for(const s of this.seq)s.type===e.SAMPLER_2D_SHADOW||s.type===e.SAMPLER_CUBE_SHADOW||s.type===e.SAMPLER_2D_ARRAY_SHADOW?i.push(s):a.push(s);i.length>0&&(this.seq=i.concat(a))}setValue(e,t,n,i){const a=this.map[t];a!==void 0&&a.setValue(e,n,i)}setOptional(e,t,n){const i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let a=0,s=t.length;a!==s;++a){const o=t[a],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,i)}}static seqWithValue(e,t){const n=[];for(let i=0,a=e.length;i!==a;++i){const s=e[i];s.id in t&&n.push(s)}return n}}function zo(r,e,t){const n=r.createShader(e);return r.shaderSource(n,t),r.compileShader(n),n}const Fp=37297;let Op=0;function Bp(r,e){const t=r.split(`
`),n=[],i=Math.max(e-6,0),a=Math.min(e+6,t.length);for(let s=i;s<a;s++){const o=s+1;n.push(`${o===e?">":" "} ${o}: ${t[s]}`)}return n.join(`
`)}const Vo=new Ue;function zp(r){We._getMatrix(Vo,We.workingColorSpace,r);const e=`mat3( ${Vo.elements.map(t=>t.toFixed(4))} )`;switch(We.getTransfer(r)){case Ir:return[e,"LinearTransferOETF"];case Ze:return[e,"sRGBTransferOETF"];default:return De("WebGLProgram: Unsupported color space: ",r),[e,"LinearTransferOETF"]}}function ko(r,e,t){const n=r.getShaderParameter(e,r.COMPILE_STATUS),a=(r.getShaderInfoLog(e)||"").trim();if(n&&a==="")return"";const s=/ERROR: 0:(\d+)/.exec(a);if(s){const o=parseInt(s[1]);return t.toUpperCase()+`

`+a+`

`+Bp(r.getShaderSource(e),o)}else return a}function Vp(r,e){const t=zp(e);return[`vec4 ${r}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}const kp={[rl]:"Linear",[al]:"Reinhard",[sl]:"Cineon",[ol]:"ACESFilmic",[cl]:"AgX",[ul]:"Neutral",[ll]:"Custom"};function Gp(r,e){const t=kp[e];return t===void 0?(De("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+r+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+r+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const br=new z;function Hp(){We.getLuminanceCoefficients(br);const r=br.x.toFixed(4),e=br.y.toFixed(4),t=br.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${r}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Wp(r){return[r.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",r.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ki).join(`
`)}function Xp(r){const e=[];for(const t in r){const n=r[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function Yp(r,e){const t={},n=r.getProgramParameter(e,r.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){const a=r.getActiveAttrib(e,i),s=a.name;let o=1;a.type===r.FLOAT_MAT2&&(o=2),a.type===r.FLOAT_MAT3&&(o=3),a.type===r.FLOAT_MAT4&&(o=4),t[s]={type:a.type,location:r.getAttribLocation(e,s),locationSize:o}}return t}function ki(r){return r!==""}function Go(r,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return r.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Ho(r,e){return r.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const qp=/^[ \t]*#include +<([\w\d./]+)>/gm;function xs(r){return r.replace(qp,Kp)}const $p=new Map;function Kp(r,e){let t=Ne[e];if(t===void 0){const n=$p.get(e);if(n!==void 0)t=Ne[n],De('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return xs(t)}const Zp=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Wo(r){return r.replace(Zp,jp)}function jp(r,e,t,n){let i="";for(let a=parseInt(e);a<parseInt(t);a++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return i}function Xo(r){let e=`precision ${r.precision} float;
	precision ${r.precision} int;
	precision ${r.precision} sampler2D;
	precision ${r.precision} samplerCube;
	precision ${r.precision} sampler3D;
	precision ${r.precision} sampler2DArray;
	precision ${r.precision} sampler2DShadow;
	precision ${r.precision} samplerCubeShadow;
	precision ${r.precision} sampler2DArrayShadow;
	precision ${r.precision} isampler2D;
	precision ${r.precision} isampler3D;
	precision ${r.precision} isamplerCube;
	precision ${r.precision} isampler2DArray;
	precision ${r.precision} usampler2D;
	precision ${r.precision} usampler3D;
	precision ${r.precision} usamplerCube;
	precision ${r.precision} usampler2DArray;
	`;return r.precision==="highp"?e+=`
#define HIGH_PRECISION`:r.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:r.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}const Jp={[Ar]:"SHADOWMAP_TYPE_PCF",[Vi]:"SHADOWMAP_TYPE_VSM"};function Qp(r){return Jp[r.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const em={[ni]:"ENVMAP_TYPE_CUBE",[Ai]:"ENVMAP_TYPE_CUBE",[Fr]:"ENVMAP_TYPE_CUBE_UV"};function tm(r){return r.envMap===!1?"ENVMAP_TYPE_CUBE":em[r.envMapMode]||"ENVMAP_TYPE_CUBE"}const nm={[Ai]:"ENVMAP_MODE_REFRACTION"};function im(r){return r.envMap===!1?"ENVMAP_MODE_REFLECTION":nm[r.envMapMode]||"ENVMAP_MODE_REFLECTION"}const rm={[il]:"ENVMAP_BLENDING_MULTIPLY",[Kc]:"ENVMAP_BLENDING_MIX",[Zc]:"ENVMAP_BLENDING_ADD"};function am(r){return r.envMap===!1?"ENVMAP_BLENDING_NONE":rm[r.combine]||"ENVMAP_BLENDING_NONE"}function sm(r){const e=r.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function om(r,e,t,n){const i=r.getContext(),a=t.defines;let s=t.vertexShader,o=t.fragmentShader;const l=Qp(t),c=tm(t),u=im(t),h=am(t),d=sm(t),m=Wp(t),g=Xp(a),S=i.createProgram();let f,p,M=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(f=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ki).join(`
`),f.length>0&&(f+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(ki).join(`
`),p.length>0&&(p+=`
`)):(f=[Xo(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ki).join(`
`),p=[Xo(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==on?"#define TONE_MAPPING":"",t.toneMapping!==on?Ne.tonemapping_pars_fragment:"",t.toneMapping!==on?Gp("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ne.colorspace_pars_fragment,Vp("linearToOutputTexel",t.outputColorSpace),Hp(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(ki).join(`
`)),s=xs(s),s=Go(s,t),s=Ho(s,t),o=xs(o),o=Go(o,t),o=Ho(o,t),s=Wo(s),o=Wo(o),t.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,f=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,p=["#define varying in",t.glslVersion===so?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===so?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const T=M+f+s,E=M+p+o,R=zo(i,i.VERTEX_SHADER,T),C=zo(i,i.FRAGMENT_SHADER,E);i.attachShader(S,R),i.attachShader(S,C),t.index0AttributeName!==void 0?i.bindAttribLocation(S,0,t.index0AttributeName):t.morphTargets===!0&&i.bindAttribLocation(S,0,"position"),i.linkProgram(S);function P(A){if(r.debug.checkShaderErrors){const B=i.getProgramInfoLog(S)||"",V=i.getShaderInfoLog(R)||"",X=i.getShaderInfoLog(C)||"",O=B.trim(),G=V.trim(),U=X.trim();let Q=!0,Z=!0;if(i.getProgramParameter(S,i.LINK_STATUS)===!1)if(Q=!1,typeof r.debug.onShaderError=="function")r.debug.onShaderError(i,S,R,C);else{const ce=ko(i,R,"vertex"),pe=ko(i,C,"fragment");Ye("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(S,i.VALIDATE_STATUS)+`

Material Name: `+A.name+`
Material Type: `+A.type+`

Program Info Log: `+O+`
`+ce+`
`+pe)}else O!==""?De("WebGLProgram: Program Info Log:",O):(G===""||U==="")&&(Z=!1);Z&&(A.diagnostics={runnable:Q,programLog:O,vertexShader:{log:G,prefix:f},fragmentShader:{log:U,prefix:p}})}i.deleteShader(R),i.deleteShader(C),_=new Dr(i,S),y=Yp(i,S)}let _;this.getUniforms=function(){return _===void 0&&P(this),_};let y;this.getAttributes=function(){return y===void 0&&P(this),y};let W=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return W===!1&&(W=i.getProgramParameter(S,Fp)),W},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(S),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Op++,this.cacheKey=e,this.usedTimes=1,this.program=S,this.vertexShader=R,this.fragmentShader=C,this}let lm=0;class cm{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,i=this._getShaderStage(t),a=this._getShaderStage(n),s=this._getShaderCacheForMaterial(e);return s.has(i)===!1&&(s.add(i),i.usedTimes++),s.has(a)===!1&&(s.add(a),a.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new um(e),t.set(e,n)),n}}class um{constructor(e){this.id=lm++,this.code=e,this.usedTimes=0}}function dm(r,e,t,n,i,a){const s=new Ml,o=new cm,l=new Set,c=[],u=new Map,h=n.logarithmicDepthBuffer;let d=n.precision;const m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(_){return l.add(_),_===0?"uv":`uv${_}`}function S(_,y,W,A,B){const V=A.fog,X=B.geometry,O=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?A.environment:null,G=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap,U=e.get(_.envMap||O,G),Q=U&&U.mapping===Fr?U.image.height:null,Z=m[_.type];_.precision!==null&&(d=n.getMaxPrecision(_.precision),d!==_.precision&&De("WebGLProgram.getParameters:",_.precision,"not supported, using",d,"instead."));const ce=X.morphAttributes.position||X.morphAttributes.normal||X.morphAttributes.color,pe=ce!==void 0?ce.length:0;let ue=0;X.morphAttributes.position!==void 0&&(ue=1),X.morphAttributes.normal!==void 0&&(ue=2),X.morphAttributes.color!==void 0&&(ue=3);let Ce,at,rt,$;if(Z){const Ke=nn[Z];Ce=Ke.vertexShader,at=Ke.fragmentShader}else Ce=_.vertexShader,at=_.fragmentShader,o.update(_),rt=o.getVertexShaderID(_),$=o.getFragmentShaderID(_);const ne=r.getRenderTarget(),ae=r.state.buffers.depth.getReversed(),Le=B.isInstancedMesh===!0,Ae=B.isBatchedMesh===!0,Re=!!_.map,xt=!!_.matcap,He=!!U,$e=!!_.aoMap,et=!!_.lightMap,Fe=!!_.bumpMap,lt=!!_.normalMap,w=!!_.displacementMap,ht=!!_.emissiveMap,qe=!!_.metalnessMap,nt=!!_.roughnessMap,Se=_.anisotropy>0,b=_.clearcoat>0,v=_.dispersion>0,I=_.iridescence>0,q=_.sheen>0,K=_.transmission>0,Y=Se&&!!_.anisotropyMap,me=b&&!!_.clearcoatMap,ie=b&&!!_.clearcoatNormalMap,Ee=b&&!!_.clearcoatRoughnessMap,we=I&&!!_.iridescenceMap,j=I&&!!_.iridescenceThicknessMap,ee=q&&!!_.sheenColorMap,ge=q&&!!_.sheenRoughnessMap,_e=!!_.specularMap,de=!!_.specularColorMap,Oe=!!_.specularIntensityMap,D=K&&!!_.transmissionMap,re=K&&!!_.thicknessMap,te=!!_.gradientMap,fe=!!_.alphaMap,J=_.alphaTest>0,H=!!_.alphaHash,ve=!!_.extensions;let Pe=on;_.toneMapped&&(ne===null||ne.isXRRenderTarget===!0)&&(Pe=r.toneMapping);const it={shaderID:Z,shaderType:_.type,shaderName:_.name,vertexShader:Ce,fragmentShader:at,defines:_.defines,customVertexShaderID:rt,customFragmentShaderID:$,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:d,batching:Ae,batchingColor:Ae&&B._colorsTexture!==null,instancing:Le,instancingColor:Le&&B.instanceColor!==null,instancingMorph:Le&&B.morphTexture!==null,outputColorSpace:ne===null?r.outputColorSpace:ne.isXRRenderTarget===!0?ne.texture.colorSpace:Ci,alphaToCoverage:!!_.alphaToCoverage,map:Re,matcap:xt,envMap:He,envMapMode:He&&U.mapping,envMapCubeUVHeight:Q,aoMap:$e,lightMap:et,bumpMap:Fe,normalMap:lt,displacementMap:w,emissiveMap:ht,normalMapObjectSpace:lt&&_.normalMapType===eu,normalMapTangentSpace:lt&&_.normalMapType===Qc,metalnessMap:qe,roughnessMap:nt,anisotropy:Se,anisotropyMap:Y,clearcoat:b,clearcoatMap:me,clearcoatNormalMap:ie,clearcoatRoughnessMap:Ee,dispersion:v,iridescence:I,iridescenceMap:we,iridescenceThicknessMap:j,sheen:q,sheenColorMap:ee,sheenRoughnessMap:ge,specularMap:_e,specularColorMap:de,specularIntensityMap:Oe,transmission:K,transmissionMap:D,thicknessMap:re,gradientMap:te,opaque:_.transparent===!1&&_.blending===bi&&_.alphaToCoverage===!1,alphaMap:fe,alphaTest:J,alphaHash:H,combine:_.combine,mapUv:Re&&g(_.map.channel),aoMapUv:$e&&g(_.aoMap.channel),lightMapUv:et&&g(_.lightMap.channel),bumpMapUv:Fe&&g(_.bumpMap.channel),normalMapUv:lt&&g(_.normalMap.channel),displacementMapUv:w&&g(_.displacementMap.channel),emissiveMapUv:ht&&g(_.emissiveMap.channel),metalnessMapUv:qe&&g(_.metalnessMap.channel),roughnessMapUv:nt&&g(_.roughnessMap.channel),anisotropyMapUv:Y&&g(_.anisotropyMap.channel),clearcoatMapUv:me&&g(_.clearcoatMap.channel),clearcoatNormalMapUv:ie&&g(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:Ee&&g(_.clearcoatRoughnessMap.channel),iridescenceMapUv:we&&g(_.iridescenceMap.channel),iridescenceThicknessMapUv:j&&g(_.iridescenceThicknessMap.channel),sheenColorMapUv:ee&&g(_.sheenColorMap.channel),sheenRoughnessMapUv:ge&&g(_.sheenRoughnessMap.channel),specularMapUv:_e&&g(_.specularMap.channel),specularColorMapUv:de&&g(_.specularColorMap.channel),specularIntensityMapUv:Oe&&g(_.specularIntensityMap.channel),transmissionMapUv:D&&g(_.transmissionMap.channel),thicknessMapUv:re&&g(_.thicknessMap.channel),alphaMapUv:fe&&g(_.alphaMap.channel),vertexTangents:!!X.attributes.tangent&&(lt||Se),vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!X.attributes.color&&X.attributes.color.itemSize===4,pointsUvs:B.isPoints===!0&&!!X.attributes.uv&&(Re||fe),fog:!!V,useFog:_.fog===!0,fogExp2:!!V&&V.isFogExp2,flatShading:_.wireframe===!1&&(_.flatShading===!0||X.attributes.normal===void 0&&lt===!1&&(_.isMeshLambertMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isMeshPhysicalMaterial)),sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:h,reversedDepthBuffer:ae,skinning:B.isSkinnedMesh===!0,morphTargets:X.morphAttributes.position!==void 0,morphNormals:X.morphAttributes.normal!==void 0,morphColors:X.morphAttributes.color!==void 0,morphTargetsCount:pe,morphTextureStride:ue,numDirLights:y.directional.length,numPointLights:y.point.length,numSpotLights:y.spot.length,numSpotLightMaps:y.spotLightMap.length,numRectAreaLights:y.rectArea.length,numHemiLights:y.hemi.length,numDirLightShadows:y.directionalShadowMap.length,numPointLightShadows:y.pointShadowMap.length,numSpotLightShadows:y.spotShadowMap.length,numSpotLightShadowsWithMaps:y.numSpotLightShadowsWithMaps,numLightProbes:y.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:_.dithering,shadowMapEnabled:r.shadowMap.enabled&&W.length>0,shadowMapType:r.shadowMap.type,toneMapping:Pe,decodeVideoTexture:Re&&_.map.isVideoTexture===!0&&We.getTransfer(_.map.colorSpace)===Ze,decodeVideoTextureEmissive:ht&&_.emissiveMap.isVideoTexture===!0&&We.getTransfer(_.emissiveMap.colorSpace)===Ze,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===_n,flipSided:_.side===Lt,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:ve&&_.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ve&&_.extensions.multiDraw===!0||Ae)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return it.vertexUv1s=l.has(1),it.vertexUv2s=l.has(2),it.vertexUv3s=l.has(3),l.clear(),it}function f(_){const y=[];if(_.shaderID?y.push(_.shaderID):(y.push(_.customVertexShaderID),y.push(_.customFragmentShaderID)),_.defines!==void 0)for(const W in _.defines)y.push(W),y.push(_.defines[W]);return _.isRawShaderMaterial===!1&&(p(y,_),M(y,_),y.push(r.outputColorSpace)),y.push(_.customProgramCacheKey),y.join()}function p(_,y){_.push(y.precision),_.push(y.outputColorSpace),_.push(y.envMapMode),_.push(y.envMapCubeUVHeight),_.push(y.mapUv),_.push(y.alphaMapUv),_.push(y.lightMapUv),_.push(y.aoMapUv),_.push(y.bumpMapUv),_.push(y.normalMapUv),_.push(y.displacementMapUv),_.push(y.emissiveMapUv),_.push(y.metalnessMapUv),_.push(y.roughnessMapUv),_.push(y.anisotropyMapUv),_.push(y.clearcoatMapUv),_.push(y.clearcoatNormalMapUv),_.push(y.clearcoatRoughnessMapUv),_.push(y.iridescenceMapUv),_.push(y.iridescenceThicknessMapUv),_.push(y.sheenColorMapUv),_.push(y.sheenRoughnessMapUv),_.push(y.specularMapUv),_.push(y.specularColorMapUv),_.push(y.specularIntensityMapUv),_.push(y.transmissionMapUv),_.push(y.thicknessMapUv),_.push(y.combine),_.push(y.fogExp2),_.push(y.sizeAttenuation),_.push(y.morphTargetsCount),_.push(y.morphAttributeCount),_.push(y.numDirLights),_.push(y.numPointLights),_.push(y.numSpotLights),_.push(y.numSpotLightMaps),_.push(y.numHemiLights),_.push(y.numRectAreaLights),_.push(y.numDirLightShadows),_.push(y.numPointLightShadows),_.push(y.numSpotLightShadows),_.push(y.numSpotLightShadowsWithMaps),_.push(y.numLightProbes),_.push(y.shadowMapType),_.push(y.toneMapping),_.push(y.numClippingPlanes),_.push(y.numClipIntersection),_.push(y.depthPacking)}function M(_,y){s.disableAll(),y.instancing&&s.enable(0),y.instancingColor&&s.enable(1),y.instancingMorph&&s.enable(2),y.matcap&&s.enable(3),y.envMap&&s.enable(4),y.normalMapObjectSpace&&s.enable(5),y.normalMapTangentSpace&&s.enable(6),y.clearcoat&&s.enable(7),y.iridescence&&s.enable(8),y.alphaTest&&s.enable(9),y.vertexColors&&s.enable(10),y.vertexAlphas&&s.enable(11),y.vertexUv1s&&s.enable(12),y.vertexUv2s&&s.enable(13),y.vertexUv3s&&s.enable(14),y.vertexTangents&&s.enable(15),y.anisotropy&&s.enable(16),y.alphaHash&&s.enable(17),y.batching&&s.enable(18),y.dispersion&&s.enable(19),y.batchingColor&&s.enable(20),y.gradientMap&&s.enable(21),_.push(s.mask),s.disableAll(),y.fog&&s.enable(0),y.useFog&&s.enable(1),y.flatShading&&s.enable(2),y.logarithmicDepthBuffer&&s.enable(3),y.reversedDepthBuffer&&s.enable(4),y.skinning&&s.enable(5),y.morphTargets&&s.enable(6),y.morphNormals&&s.enable(7),y.morphColors&&s.enable(8),y.premultipliedAlpha&&s.enable(9),y.shadowMapEnabled&&s.enable(10),y.doubleSided&&s.enable(11),y.flipSided&&s.enable(12),y.useDepthPacking&&s.enable(13),y.dithering&&s.enable(14),y.transmission&&s.enable(15),y.sheen&&s.enable(16),y.opaque&&s.enable(17),y.pointsUvs&&s.enable(18),y.decodeVideoTexture&&s.enable(19),y.decodeVideoTextureEmissive&&s.enable(20),y.alphaToCoverage&&s.enable(21),_.push(s.mask)}function T(_){const y=m[_.type];let W;if(y){const A=nn[y];W=Fu.clone(A.uniforms)}else W=_.uniforms;return W}function E(_,y){let W=u.get(y);return W!==void 0?++W.usedTimes:(W=new om(r,y,_,i),c.push(W),u.set(y,W)),W}function R(_){if(--_.usedTimes===0){const y=c.indexOf(_);c[y]=c[c.length-1],c.pop(),u.delete(_.cacheKey),_.destroy()}}function C(_){o.remove(_)}function P(){o.dispose()}return{getParameters:S,getProgramCacheKey:f,getUniforms:T,acquireProgram:E,releaseProgram:R,releaseShaderCache:C,programs:c,dispose:P}}function hm(){let r=new WeakMap;function e(s){return r.has(s)}function t(s){let o=r.get(s);return o===void 0&&(o={},r.set(s,o)),o}function n(s){r.delete(s)}function i(s,o,l){r.get(s)[o]=l}function a(){r=new WeakMap}return{has:e,get:t,remove:n,update:i,dispose:a}}function fm(r,e){return r.groupOrder!==e.groupOrder?r.groupOrder-e.groupOrder:r.renderOrder!==e.renderOrder?r.renderOrder-e.renderOrder:r.material.id!==e.material.id?r.material.id-e.material.id:r.materialVariant!==e.materialVariant?r.materialVariant-e.materialVariant:r.z!==e.z?r.z-e.z:r.id-e.id}function Yo(r,e){return r.groupOrder!==e.groupOrder?r.groupOrder-e.groupOrder:r.renderOrder!==e.renderOrder?r.renderOrder-e.renderOrder:r.z!==e.z?e.z-r.z:r.id-e.id}function qo(){const r=[];let e=0;const t=[],n=[],i=[];function a(){e=0,t.length=0,n.length=0,i.length=0}function s(d){let m=0;return d.isInstancedMesh&&(m+=2),d.isSkinnedMesh&&(m+=1),m}function o(d,m,g,S,f,p){let M=r[e];return M===void 0?(M={id:d.id,object:d,geometry:m,material:g,materialVariant:s(d),groupOrder:S,renderOrder:d.renderOrder,z:f,group:p},r[e]=M):(M.id=d.id,M.object=d,M.geometry=m,M.material=g,M.materialVariant=s(d),M.groupOrder=S,M.renderOrder=d.renderOrder,M.z=f,M.group=p),e++,M}function l(d,m,g,S,f,p){const M=o(d,m,g,S,f,p);g.transmission>0?n.push(M):g.transparent===!0?i.push(M):t.push(M)}function c(d,m,g,S,f,p){const M=o(d,m,g,S,f,p);g.transmission>0?n.unshift(M):g.transparent===!0?i.unshift(M):t.unshift(M)}function u(d,m){t.length>1&&t.sort(d||fm),n.length>1&&n.sort(m||Yo),i.length>1&&i.sort(m||Yo)}function h(){for(let d=e,m=r.length;d<m;d++){const g=r[d];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:n,transparent:i,init:a,push:l,unshift:c,finish:h,sort:u}}function pm(){let r=new WeakMap;function e(n,i){const a=r.get(n);let s;return a===void 0?(s=new qo,r.set(n,[s])):i>=a.length?(s=new qo,a.push(s)):s=a[i],s}function t(){r=new WeakMap}return{get:e,dispose:t}}function mm(){const r={};return{get:function(e){if(r[e.id]!==void 0)return r[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new z,color:new Qe};break;case"SpotLight":t={position:new z,direction:new z,color:new Qe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new z,color:new Qe,distance:0,decay:0};break;case"HemisphereLight":t={direction:new z,skyColor:new Qe,groundColor:new Qe};break;case"RectAreaLight":t={color:new Qe,position:new z,halfWidth:new z,halfHeight:new z};break}return r[e.id]=t,t}}}function gm(){const r={};return{get:function(e){if(r[e.id]!==void 0)return r[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ke};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ke};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ke,shadowCameraNear:1,shadowCameraFar:1e3};break}return r[e.id]=t,t}}}let vm=0;function _m(r,e){return(e.castShadow?2:0)-(r.castShadow?2:0)+(e.map?1:0)-(r.map?1:0)}function xm(r){const e=new mm,t=gm(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new z);const i=new z,a=new mt,s=new mt;function o(c){let u=0,h=0,d=0;for(let y=0;y<9;y++)n.probe[y].set(0,0,0);let m=0,g=0,S=0,f=0,p=0,M=0,T=0,E=0,R=0,C=0,P=0;c.sort(_m);for(let y=0,W=c.length;y<W;y++){const A=c[y],B=A.color,V=A.intensity,X=A.distance;let O=null;if(A.shadow&&A.shadow.map&&(A.shadow.map.texture.format===wi?O=A.shadow.map.texture:O=A.shadow.map.depthTexture||A.shadow.map.texture),A.isAmbientLight)u+=B.r*V,h+=B.g*V,d+=B.b*V;else if(A.isLightProbe){for(let G=0;G<9;G++)n.probe[G].addScaledVector(A.sh.coefficients[G],V);P++}else if(A.isDirectionalLight){const G=e.get(A);if(G.color.copy(A.color).multiplyScalar(A.intensity),A.castShadow){const U=A.shadow,Q=t.get(A);Q.shadowIntensity=U.intensity,Q.shadowBias=U.bias,Q.shadowNormalBias=U.normalBias,Q.shadowRadius=U.radius,Q.shadowMapSize=U.mapSize,n.directionalShadow[m]=Q,n.directionalShadowMap[m]=O,n.directionalShadowMatrix[m]=A.shadow.matrix,M++}n.directional[m]=G,m++}else if(A.isSpotLight){const G=e.get(A);G.position.setFromMatrixPosition(A.matrixWorld),G.color.copy(B).multiplyScalar(V),G.distance=X,G.coneCos=Math.cos(A.angle),G.penumbraCos=Math.cos(A.angle*(1-A.penumbra)),G.decay=A.decay,n.spot[S]=G;const U=A.shadow;if(A.map&&(n.spotLightMap[R]=A.map,R++,U.updateMatrices(A),A.castShadow&&C++),n.spotLightMatrix[S]=U.matrix,A.castShadow){const Q=t.get(A);Q.shadowIntensity=U.intensity,Q.shadowBias=U.bias,Q.shadowNormalBias=U.normalBias,Q.shadowRadius=U.radius,Q.shadowMapSize=U.mapSize,n.spotShadow[S]=Q,n.spotShadowMap[S]=O,E++}S++}else if(A.isRectAreaLight){const G=e.get(A);G.color.copy(B).multiplyScalar(V),G.halfWidth.set(A.width*.5,0,0),G.halfHeight.set(0,A.height*.5,0),n.rectArea[f]=G,f++}else if(A.isPointLight){const G=e.get(A);if(G.color.copy(A.color).multiplyScalar(A.intensity),G.distance=A.distance,G.decay=A.decay,A.castShadow){const U=A.shadow,Q=t.get(A);Q.shadowIntensity=U.intensity,Q.shadowBias=U.bias,Q.shadowNormalBias=U.normalBias,Q.shadowRadius=U.radius,Q.shadowMapSize=U.mapSize,Q.shadowCameraNear=U.camera.near,Q.shadowCameraFar=U.camera.far,n.pointShadow[g]=Q,n.pointShadowMap[g]=O,n.pointShadowMatrix[g]=A.shadow.matrix,T++}n.point[g]=G,g++}else if(A.isHemisphereLight){const G=e.get(A);G.skyColor.copy(A.color).multiplyScalar(V),G.groundColor.copy(A.groundColor).multiplyScalar(V),n.hemi[p]=G,p++}}f>0&&(r.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=se.LTC_FLOAT_1,n.rectAreaLTC2=se.LTC_FLOAT_2):(n.rectAreaLTC1=se.LTC_HALF_1,n.rectAreaLTC2=se.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=h,n.ambient[2]=d;const _=n.hash;(_.directionalLength!==m||_.pointLength!==g||_.spotLength!==S||_.rectAreaLength!==f||_.hemiLength!==p||_.numDirectionalShadows!==M||_.numPointShadows!==T||_.numSpotShadows!==E||_.numSpotMaps!==R||_.numLightProbes!==P)&&(n.directional.length=m,n.spot.length=S,n.rectArea.length=f,n.point.length=g,n.hemi.length=p,n.directionalShadow.length=M,n.directionalShadowMap.length=M,n.pointShadow.length=T,n.pointShadowMap.length=T,n.spotShadow.length=E,n.spotShadowMap.length=E,n.directionalShadowMatrix.length=M,n.pointShadowMatrix.length=T,n.spotLightMatrix.length=E+R-C,n.spotLightMap.length=R,n.numSpotLightShadowsWithMaps=C,n.numLightProbes=P,_.directionalLength=m,_.pointLength=g,_.spotLength=S,_.rectAreaLength=f,_.hemiLength=p,_.numDirectionalShadows=M,_.numPointShadows=T,_.numSpotShadows=E,_.numSpotMaps=R,_.numLightProbes=P,n.version=vm++)}function l(c,u){let h=0,d=0,m=0,g=0,S=0;const f=u.matrixWorldInverse;for(let p=0,M=c.length;p<M;p++){const T=c[p];if(T.isDirectionalLight){const E=n.directional[h];E.direction.setFromMatrixPosition(T.matrixWorld),i.setFromMatrixPosition(T.target.matrixWorld),E.direction.sub(i),E.direction.transformDirection(f),h++}else if(T.isSpotLight){const E=n.spot[m];E.position.setFromMatrixPosition(T.matrixWorld),E.position.applyMatrix4(f),E.direction.setFromMatrixPosition(T.matrixWorld),i.setFromMatrixPosition(T.target.matrixWorld),E.direction.sub(i),E.direction.transformDirection(f),m++}else if(T.isRectAreaLight){const E=n.rectArea[g];E.position.setFromMatrixPosition(T.matrixWorld),E.position.applyMatrix4(f),s.identity(),a.copy(T.matrixWorld),a.premultiply(f),s.extractRotation(a),E.halfWidth.set(T.width*.5,0,0),E.halfHeight.set(0,T.height*.5,0),E.halfWidth.applyMatrix4(s),E.halfHeight.applyMatrix4(s),g++}else if(T.isPointLight){const E=n.point[d];E.position.setFromMatrixPosition(T.matrixWorld),E.position.applyMatrix4(f),d++}else if(T.isHemisphereLight){const E=n.hemi[S];E.direction.setFromMatrixPosition(T.matrixWorld),E.direction.transformDirection(f),S++}}}return{setup:o,setupView:l,state:n}}function $o(r){const e=new xm(r),t=[],n=[];function i(u){c.camera=u,t.length=0,n.length=0}function a(u){t.push(u)}function s(u){n.push(u)}function o(){e.setup(t)}function l(u){e.setupView(t,u)}const c={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:i,state:c,setupLights:o,setupLightsView:l,pushLight:a,pushShadow:s}}function Sm(r){let e=new WeakMap;function t(i,a=0){const s=e.get(i);let o;return s===void 0?(o=new $o(r),e.set(i,[o])):a>=s.length?(o=new $o(r),s.push(o)):o=s[a],o}function n(){e=new WeakMap}return{get:t,dispose:n}}const Mm=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,ym=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,bm=[new z(1,0,0),new z(-1,0,0),new z(0,1,0),new z(0,-1,0),new z(0,0,1),new z(0,0,-1)],Em=[new z(0,-1,0),new z(0,-1,0),new z(0,0,1),new z(0,0,-1),new z(0,-1,0),new z(0,-1,0)],Ko=new mt,zi=new z,Aa=new z;function Tm(r,e,t){let n=new wl;const i=new ke,a=new ke,s=new ot,o=new Vu,l=new ku,c={},u=t.maxTextureSize,h={[Vn]:Lt,[Lt]:Vn,[_n]:_n},d=new Gt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ke},radius:{value:4}},vertexShader:Mm,fragmentShader:ym}),m=d.clone();m.defines.HORIZONTAL_PASS=1;const g=new An;g.setAttribute("position",new cn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const S=new Yt(g,d),f=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ar;let p=this.type;this.render=function(C,P,_){if(f.enabled===!1||f.autoUpdate===!1&&f.needsUpdate===!1||C.length===0)return;this.type===Pc&&(De("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=Ar);const y=r.getRenderTarget(),W=r.getActiveCubeFace(),A=r.getActiveMipmapLevel(),B=r.state;B.setBlending(Sn),B.buffers.depth.getReversed()===!0?B.buffers.color.setClear(0,0,0,0):B.buffers.color.setClear(1,1,1,1),B.buffers.depth.setTest(!0),B.setScissorTest(!1);const V=p!==this.type;V&&P.traverse(function(X){X.material&&(Array.isArray(X.material)?X.material.forEach(O=>O.needsUpdate=!0):X.material.needsUpdate=!0)});for(let X=0,O=C.length;X<O;X++){const G=C[X],U=G.shadow;if(U===void 0){De("WebGLShadowMap:",G,"has no shadow.");continue}if(U.autoUpdate===!1&&U.needsUpdate===!1)continue;i.copy(U.mapSize);const Q=U.getFrameExtents();i.multiply(Q),a.copy(U.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(a.x=Math.floor(u/Q.x),i.x=a.x*Q.x,U.mapSize.x=a.x),i.y>u&&(a.y=Math.floor(u/Q.y),i.y=a.y*Q.y,U.mapSize.y=a.y));const Z=r.state.buffers.depth.getReversed();if(U.camera._reversedDepth=Z,U.map===null||V===!0){if(U.map!==null&&(U.map.depthTexture!==null&&(U.map.depthTexture.dispose(),U.map.depthTexture=null),U.map.dispose()),this.type===Vi){if(G.isPointLight){De("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}U.map=new ln(i.x,i.y,{format:wi,type:bn,minFilter:At,magFilter:At,generateMipmaps:!1}),U.map.texture.name=G.name+".shadowMap",U.map.depthTexture=new Xi(i.x,i.y,an),U.map.depthTexture.name=G.name+".shadowMapDepth",U.map.depthTexture.format=En,U.map.depthTexture.compareFunction=null,U.map.depthTexture.minFilter=ut,U.map.depthTexture.magFilter=ut}else G.isPointLight?(U.map=new Ll(i.x),U.map.depthTexture=new Uu(i.x,un)):(U.map=new ln(i.x,i.y),U.map.depthTexture=new Xi(i.x,i.y,un)),U.map.depthTexture.name=G.name+".shadowMap",U.map.depthTexture.format=En,this.type===Ar?(U.map.depthTexture.compareFunction=Z?Cs:ws,U.map.depthTexture.minFilter=At,U.map.depthTexture.magFilter=At):(U.map.depthTexture.compareFunction=null,U.map.depthTexture.minFilter=ut,U.map.depthTexture.magFilter=ut);U.camera.updateProjectionMatrix()}const ce=U.map.isWebGLCubeRenderTarget?6:1;for(let pe=0;pe<ce;pe++){if(U.map.isWebGLCubeRenderTarget)r.setRenderTarget(U.map,pe),r.clear();else{pe===0&&(r.setRenderTarget(U.map),r.clear());const ue=U.getViewport(pe);s.set(a.x*ue.x,a.y*ue.y,a.x*ue.z,a.y*ue.w),B.viewport(s)}if(G.isPointLight){const ue=U.camera,Ce=U.matrix,at=G.distance||ue.far;at!==ue.far&&(ue.far=at,ue.updateProjectionMatrix()),zi.setFromMatrixPosition(G.matrixWorld),ue.position.copy(zi),Aa.copy(ue.position),Aa.add(bm[pe]),ue.up.copy(Em[pe]),ue.lookAt(Aa),ue.updateMatrixWorld(),Ce.makeTranslation(-zi.x,-zi.y,-zi.z),Ko.multiplyMatrices(ue.projectionMatrix,ue.matrixWorldInverse),U._frustum.setFromProjectionMatrix(Ko,ue.coordinateSystem,ue.reversedDepth)}else U.updateMatrices(G);n=U.getFrustum(),E(P,_,U.camera,G,this.type)}U.isPointLightShadow!==!0&&this.type===Vi&&M(U,_),U.needsUpdate=!1}p=this.type,f.needsUpdate=!1,r.setRenderTarget(y,W,A)};function M(C,P){const _=e.update(S);d.defines.VSM_SAMPLES!==C.blurSamples&&(d.defines.VSM_SAMPLES=C.blurSamples,m.defines.VSM_SAMPLES=C.blurSamples,d.needsUpdate=!0,m.needsUpdate=!0),C.mapPass===null&&(C.mapPass=new ln(i.x,i.y,{format:wi,type:bn})),d.uniforms.shadow_pass.value=C.map.depthTexture,d.uniforms.resolution.value=C.mapSize,d.uniforms.radius.value=C.radius,r.setRenderTarget(C.mapPass),r.clear(),r.renderBufferDirect(P,null,_,d,S,null),m.uniforms.shadow_pass.value=C.mapPass.texture,m.uniforms.resolution.value=C.mapSize,m.uniforms.radius.value=C.radius,r.setRenderTarget(C.map),r.clear(),r.renderBufferDirect(P,null,_,m,S,null)}function T(C,P,_,y){let W=null;const A=_.isPointLight===!0?C.customDistanceMaterial:C.customDepthMaterial;if(A!==void 0)W=A;else if(W=_.isPointLight===!0?l:o,r.localClippingEnabled&&P.clipShadows===!0&&Array.isArray(P.clippingPlanes)&&P.clippingPlanes.length!==0||P.displacementMap&&P.displacementScale!==0||P.alphaMap&&P.alphaTest>0||P.map&&P.alphaTest>0||P.alphaToCoverage===!0){const B=W.uuid,V=P.uuid;let X=c[B];X===void 0&&(X={},c[B]=X);let O=X[V];O===void 0&&(O=W.clone(),X[V]=O,P.addEventListener("dispose",R)),W=O}if(W.visible=P.visible,W.wireframe=P.wireframe,y===Vi?W.side=P.shadowSide!==null?P.shadowSide:P.side:W.side=P.shadowSide!==null?P.shadowSide:h[P.side],W.alphaMap=P.alphaMap,W.alphaTest=P.alphaToCoverage===!0?.5:P.alphaTest,W.map=P.map,W.clipShadows=P.clipShadows,W.clippingPlanes=P.clippingPlanes,W.clipIntersection=P.clipIntersection,W.displacementMap=P.displacementMap,W.displacementScale=P.displacementScale,W.displacementBias=P.displacementBias,W.wireframeLinewidth=P.wireframeLinewidth,W.linewidth=P.linewidth,_.isPointLight===!0&&W.isMeshDistanceMaterial===!0){const B=r.properties.get(W);B.light=_}return W}function E(C,P,_,y,W){if(C.visible===!1)return;if(C.layers.test(P.layers)&&(C.isMesh||C.isLine||C.isPoints)&&(C.castShadow||C.receiveShadow&&W===Vi)&&(!C.frustumCulled||n.intersectsObject(C))){C.modelViewMatrix.multiplyMatrices(_.matrixWorldInverse,C.matrixWorld);const V=e.update(C),X=C.material;if(Array.isArray(X)){const O=V.groups;for(let G=0,U=O.length;G<U;G++){const Q=O[G],Z=X[Q.materialIndex];if(Z&&Z.visible){const ce=T(C,Z,y,W);C.onBeforeShadow(r,C,P,_,V,ce,Q),r.renderBufferDirect(_,null,V,ce,C,Q),C.onAfterShadow(r,C,P,_,V,ce,Q)}}}else if(X.visible){const O=T(C,X,y,W);C.onBeforeShadow(r,C,P,_,V,O,null),r.renderBufferDirect(_,null,V,O,C,null),C.onAfterShadow(r,C,P,_,V,O,null)}}const B=C.children;for(let V=0,X=B.length;V<X;V++)E(B[V],P,_,y,W)}function R(C){C.target.removeEventListener("dispose",R);for(const _ in c){const y=c[_],W=C.target.uuid;W in y&&(y[W].dispose(),delete y[W])}}}function Am(r,e){function t(){let D=!1;const re=new ot;let te=null;const fe=new ot(0,0,0,0);return{setMask:function(J){te!==J&&!D&&(r.colorMask(J,J,J,J),te=J)},setLocked:function(J){D=J},setClear:function(J,H,ve,Pe,it){it===!0&&(J*=Pe,H*=Pe,ve*=Pe),re.set(J,H,ve,Pe),fe.equals(re)===!1&&(r.clearColor(J,H,ve,Pe),fe.copy(re))},reset:function(){D=!1,te=null,fe.set(-1,0,0,0)}}}function n(){let D=!1,re=!1,te=null,fe=null,J=null;return{setReversed:function(H){if(re!==H){const ve=e.get("EXT_clip_control");H?ve.clipControlEXT(ve.LOWER_LEFT_EXT,ve.ZERO_TO_ONE_EXT):ve.clipControlEXT(ve.LOWER_LEFT_EXT,ve.NEGATIVE_ONE_TO_ONE_EXT),re=H;const Pe=J;J=null,this.setClear(Pe)}},getReversed:function(){return re},setTest:function(H){H?ne(r.DEPTH_TEST):ae(r.DEPTH_TEST)},setMask:function(H){te!==H&&!D&&(r.depthMask(H),te=H)},setFunc:function(H){if(re&&(H=uu[H]),fe!==H){switch(H){case Pa:r.depthFunc(r.NEVER);break;case Da:r.depthFunc(r.ALWAYS);break;case Ia:r.depthFunc(r.LESS);break;case Ti:r.depthFunc(r.LEQUAL);break;case La:r.depthFunc(r.EQUAL);break;case Ua:r.depthFunc(r.GEQUAL);break;case Na:r.depthFunc(r.GREATER);break;case Fa:r.depthFunc(r.NOTEQUAL);break;default:r.depthFunc(r.LEQUAL)}fe=H}},setLocked:function(H){D=H},setClear:function(H){J!==H&&(J=H,re&&(H=1-H),r.clearDepth(H))},reset:function(){D=!1,te=null,fe=null,J=null,re=!1}}}function i(){let D=!1,re=null,te=null,fe=null,J=null,H=null,ve=null,Pe=null,it=null;return{setTest:function(Ke){D||(Ke?ne(r.STENCIL_TEST):ae(r.STENCIL_TEST))},setMask:function(Ke){re!==Ke&&!D&&(r.stencilMask(Ke),re=Ke)},setFunc:function(Ke,dn,hn){(te!==Ke||fe!==dn||J!==hn)&&(r.stencilFunc(Ke,dn,hn),te=Ke,fe=dn,J=hn)},setOp:function(Ke,dn,hn){(H!==Ke||ve!==dn||Pe!==hn)&&(r.stencilOp(Ke,dn,hn),H=Ke,ve=dn,Pe=hn)},setLocked:function(Ke){D=Ke},setClear:function(Ke){it!==Ke&&(r.clearStencil(Ke),it=Ke)},reset:function(){D=!1,re=null,te=null,fe=null,J=null,H=null,ve=null,Pe=null,it=null}}}const a=new t,s=new n,o=new i,l=new WeakMap,c=new WeakMap;let u={},h={},d=new WeakMap,m=[],g=null,S=!1,f=null,p=null,M=null,T=null,E=null,R=null,C=null,P=new Qe(0,0,0),_=0,y=!1,W=null,A=null,B=null,V=null,X=null;const O=r.getParameter(r.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let G=!1,U=0;const Q=r.getParameter(r.VERSION);Q.indexOf("WebGL")!==-1?(U=parseFloat(/^WebGL (\d)/.exec(Q)[1]),G=U>=1):Q.indexOf("OpenGL ES")!==-1&&(U=parseFloat(/^OpenGL ES (\d)/.exec(Q)[1]),G=U>=2);let Z=null,ce={};const pe=r.getParameter(r.SCISSOR_BOX),ue=r.getParameter(r.VIEWPORT),Ce=new ot().fromArray(pe),at=new ot().fromArray(ue);function rt(D,re,te,fe){const J=new Uint8Array(4),H=r.createTexture();r.bindTexture(D,H),r.texParameteri(D,r.TEXTURE_MIN_FILTER,r.NEAREST),r.texParameteri(D,r.TEXTURE_MAG_FILTER,r.NEAREST);for(let ve=0;ve<te;ve++)D===r.TEXTURE_3D||D===r.TEXTURE_2D_ARRAY?r.texImage3D(re,0,r.RGBA,1,1,fe,0,r.RGBA,r.UNSIGNED_BYTE,J):r.texImage2D(re+ve,0,r.RGBA,1,1,0,r.RGBA,r.UNSIGNED_BYTE,J);return H}const $={};$[r.TEXTURE_2D]=rt(r.TEXTURE_2D,r.TEXTURE_2D,1),$[r.TEXTURE_CUBE_MAP]=rt(r.TEXTURE_CUBE_MAP,r.TEXTURE_CUBE_MAP_POSITIVE_X,6),$[r.TEXTURE_2D_ARRAY]=rt(r.TEXTURE_2D_ARRAY,r.TEXTURE_2D_ARRAY,1,1),$[r.TEXTURE_3D]=rt(r.TEXTURE_3D,r.TEXTURE_3D,1,1),a.setClear(0,0,0,1),s.setClear(1),o.setClear(0),ne(r.DEPTH_TEST),s.setFunc(Ti),Fe(!1),lt(eo),ne(r.CULL_FACE),$e(Sn);function ne(D){u[D]!==!0&&(r.enable(D),u[D]=!0)}function ae(D){u[D]!==!1&&(r.disable(D),u[D]=!1)}function Le(D,re){return h[D]!==re?(r.bindFramebuffer(D,re),h[D]=re,D===r.DRAW_FRAMEBUFFER&&(h[r.FRAMEBUFFER]=re),D===r.FRAMEBUFFER&&(h[r.DRAW_FRAMEBUFFER]=re),!0):!1}function Ae(D,re){let te=m,fe=!1;if(D){te=d.get(re),te===void 0&&(te=[],d.set(re,te));const J=D.textures;if(te.length!==J.length||te[0]!==r.COLOR_ATTACHMENT0){for(let H=0,ve=J.length;H<ve;H++)te[H]=r.COLOR_ATTACHMENT0+H;te.length=J.length,fe=!0}}else te[0]!==r.BACK&&(te[0]=r.BACK,fe=!0);fe&&r.drawBuffers(te)}function Re(D){return g!==D?(r.useProgram(D),g=D,!0):!1}const xt={[jn]:r.FUNC_ADD,[Ic]:r.FUNC_SUBTRACT,[Lc]:r.FUNC_REVERSE_SUBTRACT};xt[Uc]=r.MIN,xt[Nc]=r.MAX;const He={[Fc]:r.ZERO,[Oc]:r.ONE,[Bc]:r.SRC_COLOR,[Ca]:r.SRC_ALPHA,[Wc]:r.SRC_ALPHA_SATURATE,[Gc]:r.DST_COLOR,[Vc]:r.DST_ALPHA,[zc]:r.ONE_MINUS_SRC_COLOR,[Ra]:r.ONE_MINUS_SRC_ALPHA,[Hc]:r.ONE_MINUS_DST_COLOR,[kc]:r.ONE_MINUS_DST_ALPHA,[Xc]:r.CONSTANT_COLOR,[Yc]:r.ONE_MINUS_CONSTANT_COLOR,[qc]:r.CONSTANT_ALPHA,[$c]:r.ONE_MINUS_CONSTANT_ALPHA};function $e(D,re,te,fe,J,H,ve,Pe,it,Ke){if(D===Sn){S===!0&&(ae(r.BLEND),S=!1);return}if(S===!1&&(ne(r.BLEND),S=!0),D!==Dc){if(D!==f||Ke!==y){if((p!==jn||E!==jn)&&(r.blendEquation(r.FUNC_ADD),p=jn,E=jn),Ke)switch(D){case bi:r.blendFuncSeparate(r.ONE,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case to:r.blendFunc(r.ONE,r.ONE);break;case no:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case io:r.blendFuncSeparate(r.DST_COLOR,r.ONE_MINUS_SRC_ALPHA,r.ZERO,r.ONE);break;default:Ye("WebGLState: Invalid blending: ",D);break}else switch(D){case bi:r.blendFuncSeparate(r.SRC_ALPHA,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case to:r.blendFuncSeparate(r.SRC_ALPHA,r.ONE,r.ONE,r.ONE);break;case no:Ye("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case io:Ye("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Ye("WebGLState: Invalid blending: ",D);break}M=null,T=null,R=null,C=null,P.set(0,0,0),_=0,f=D,y=Ke}return}J=J||re,H=H||te,ve=ve||fe,(re!==p||J!==E)&&(r.blendEquationSeparate(xt[re],xt[J]),p=re,E=J),(te!==M||fe!==T||H!==R||ve!==C)&&(r.blendFuncSeparate(He[te],He[fe],He[H],He[ve]),M=te,T=fe,R=H,C=ve),(Pe.equals(P)===!1||it!==_)&&(r.blendColor(Pe.r,Pe.g,Pe.b,it),P.copy(Pe),_=it),f=D,y=!1}function et(D,re){D.side===_n?ae(r.CULL_FACE):ne(r.CULL_FACE);let te=D.side===Lt;re&&(te=!te),Fe(te),D.blending===bi&&D.transparent===!1?$e(Sn):$e(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),s.setFunc(D.depthFunc),s.setTest(D.depthTest),s.setMask(D.depthWrite),a.setMask(D.colorWrite);const fe=D.stencilWrite;o.setTest(fe),fe&&(o.setMask(D.stencilWriteMask),o.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),o.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass)),ht(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?ne(r.SAMPLE_ALPHA_TO_COVERAGE):ae(r.SAMPLE_ALPHA_TO_COVERAGE)}function Fe(D){W!==D&&(D?r.frontFace(r.CW):r.frontFace(r.CCW),W=D)}function lt(D){D!==Cc?(ne(r.CULL_FACE),D!==A&&(D===eo?r.cullFace(r.BACK):D===Rc?r.cullFace(r.FRONT):r.cullFace(r.FRONT_AND_BACK))):ae(r.CULL_FACE),A=D}function w(D){D!==B&&(G&&r.lineWidth(D),B=D)}function ht(D,re,te){D?(ne(r.POLYGON_OFFSET_FILL),(V!==re||X!==te)&&(V=re,X=te,s.getReversed()&&(re=-re),r.polygonOffset(re,te))):ae(r.POLYGON_OFFSET_FILL)}function qe(D){D?ne(r.SCISSOR_TEST):ae(r.SCISSOR_TEST)}function nt(D){D===void 0&&(D=r.TEXTURE0+O-1),Z!==D&&(r.activeTexture(D),Z=D)}function Se(D,re,te){te===void 0&&(Z===null?te=r.TEXTURE0+O-1:te=Z);let fe=ce[te];fe===void 0&&(fe={type:void 0,texture:void 0},ce[te]=fe),(fe.type!==D||fe.texture!==re)&&(Z!==te&&(r.activeTexture(te),Z=te),r.bindTexture(D,re||$[D]),fe.type=D,fe.texture=re)}function b(){const D=ce[Z];D!==void 0&&D.type!==void 0&&(r.bindTexture(D.type,null),D.type=void 0,D.texture=void 0)}function v(){try{r.compressedTexImage2D(...arguments)}catch(D){Ye("WebGLState:",D)}}function I(){try{r.compressedTexImage3D(...arguments)}catch(D){Ye("WebGLState:",D)}}function q(){try{r.texSubImage2D(...arguments)}catch(D){Ye("WebGLState:",D)}}function K(){try{r.texSubImage3D(...arguments)}catch(D){Ye("WebGLState:",D)}}function Y(){try{r.compressedTexSubImage2D(...arguments)}catch(D){Ye("WebGLState:",D)}}function me(){try{r.compressedTexSubImage3D(...arguments)}catch(D){Ye("WebGLState:",D)}}function ie(){try{r.texStorage2D(...arguments)}catch(D){Ye("WebGLState:",D)}}function Ee(){try{r.texStorage3D(...arguments)}catch(D){Ye("WebGLState:",D)}}function we(){try{r.texImage2D(...arguments)}catch(D){Ye("WebGLState:",D)}}function j(){try{r.texImage3D(...arguments)}catch(D){Ye("WebGLState:",D)}}function ee(D){Ce.equals(D)===!1&&(r.scissor(D.x,D.y,D.z,D.w),Ce.copy(D))}function ge(D){at.equals(D)===!1&&(r.viewport(D.x,D.y,D.z,D.w),at.copy(D))}function _e(D,re){let te=c.get(re);te===void 0&&(te=new WeakMap,c.set(re,te));let fe=te.get(D);fe===void 0&&(fe=r.getUniformBlockIndex(re,D.name),te.set(D,fe))}function de(D,re){const fe=c.get(re).get(D);l.get(re)!==fe&&(r.uniformBlockBinding(re,fe,D.__bindingPointIndex),l.set(re,fe))}function Oe(){r.disable(r.BLEND),r.disable(r.CULL_FACE),r.disable(r.DEPTH_TEST),r.disable(r.POLYGON_OFFSET_FILL),r.disable(r.SCISSOR_TEST),r.disable(r.STENCIL_TEST),r.disable(r.SAMPLE_ALPHA_TO_COVERAGE),r.blendEquation(r.FUNC_ADD),r.blendFunc(r.ONE,r.ZERO),r.blendFuncSeparate(r.ONE,r.ZERO,r.ONE,r.ZERO),r.blendColor(0,0,0,0),r.colorMask(!0,!0,!0,!0),r.clearColor(0,0,0,0),r.depthMask(!0),r.depthFunc(r.LESS),s.setReversed(!1),r.clearDepth(1),r.stencilMask(4294967295),r.stencilFunc(r.ALWAYS,0,4294967295),r.stencilOp(r.KEEP,r.KEEP,r.KEEP),r.clearStencil(0),r.cullFace(r.BACK),r.frontFace(r.CCW),r.polygonOffset(0,0),r.activeTexture(r.TEXTURE0),r.bindFramebuffer(r.FRAMEBUFFER,null),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.bindFramebuffer(r.READ_FRAMEBUFFER,null),r.useProgram(null),r.lineWidth(1),r.scissor(0,0,r.canvas.width,r.canvas.height),r.viewport(0,0,r.canvas.width,r.canvas.height),u={},Z=null,ce={},h={},d=new WeakMap,m=[],g=null,S=!1,f=null,p=null,M=null,T=null,E=null,R=null,C=null,P=new Qe(0,0,0),_=0,y=!1,W=null,A=null,B=null,V=null,X=null,Ce.set(0,0,r.canvas.width,r.canvas.height),at.set(0,0,r.canvas.width,r.canvas.height),a.reset(),s.reset(),o.reset()}return{buffers:{color:a,depth:s,stencil:o},enable:ne,disable:ae,bindFramebuffer:Le,drawBuffers:Ae,useProgram:Re,setBlending:$e,setMaterial:et,setFlipSided:Fe,setCullFace:lt,setLineWidth:w,setPolygonOffset:ht,setScissorTest:qe,activeTexture:nt,bindTexture:Se,unbindTexture:b,compressedTexImage2D:v,compressedTexImage3D:I,texImage2D:we,texImage3D:j,updateUBOMapping:_e,uniformBlockBinding:de,texStorage2D:ie,texStorage3D:Ee,texSubImage2D:q,texSubImage3D:K,compressedTexSubImage2D:Y,compressedTexSubImage3D:me,scissor:ee,viewport:ge,reset:Oe}}function wm(r,e,t,n,i,a,s){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ke,u=new WeakMap;let h;const d=new WeakMap;let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(b,v){return m?new OffscreenCanvas(b,v):Ur("canvas")}function S(b,v,I){let q=1;const K=Se(b);if((K.width>I||K.height>I)&&(q=I/Math.max(K.width,K.height)),q<1)if(typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&b instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&b instanceof ImageBitmap||typeof VideoFrame<"u"&&b instanceof VideoFrame){const Y=Math.floor(q*K.width),me=Math.floor(q*K.height);h===void 0&&(h=g(Y,me));const ie=v?g(Y,me):h;return ie.width=Y,ie.height=me,ie.getContext("2d").drawImage(b,0,0,Y,me),De("WebGLRenderer: Texture has been resized from ("+K.width+"x"+K.height+") to ("+Y+"x"+me+")."),ie}else return"data"in b&&De("WebGLRenderer: Image in DataTexture is too big ("+K.width+"x"+K.height+")."),b;return b}function f(b){return b.generateMipmaps}function p(b){r.generateMipmap(b)}function M(b){return b.isWebGLCubeRenderTarget?r.TEXTURE_CUBE_MAP:b.isWebGL3DRenderTarget?r.TEXTURE_3D:b.isWebGLArrayRenderTarget||b.isCompressedArrayTexture?r.TEXTURE_2D_ARRAY:r.TEXTURE_2D}function T(b,v,I,q,K=!1){if(b!==null){if(r[b]!==void 0)return r[b];De("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+b+"'")}let Y=v;if(v===r.RED&&(I===r.FLOAT&&(Y=r.R32F),I===r.HALF_FLOAT&&(Y=r.R16F),I===r.UNSIGNED_BYTE&&(Y=r.R8)),v===r.RED_INTEGER&&(I===r.UNSIGNED_BYTE&&(Y=r.R8UI),I===r.UNSIGNED_SHORT&&(Y=r.R16UI),I===r.UNSIGNED_INT&&(Y=r.R32UI),I===r.BYTE&&(Y=r.R8I),I===r.SHORT&&(Y=r.R16I),I===r.INT&&(Y=r.R32I)),v===r.RG&&(I===r.FLOAT&&(Y=r.RG32F),I===r.HALF_FLOAT&&(Y=r.RG16F),I===r.UNSIGNED_BYTE&&(Y=r.RG8)),v===r.RG_INTEGER&&(I===r.UNSIGNED_BYTE&&(Y=r.RG8UI),I===r.UNSIGNED_SHORT&&(Y=r.RG16UI),I===r.UNSIGNED_INT&&(Y=r.RG32UI),I===r.BYTE&&(Y=r.RG8I),I===r.SHORT&&(Y=r.RG16I),I===r.INT&&(Y=r.RG32I)),v===r.RGB_INTEGER&&(I===r.UNSIGNED_BYTE&&(Y=r.RGB8UI),I===r.UNSIGNED_SHORT&&(Y=r.RGB16UI),I===r.UNSIGNED_INT&&(Y=r.RGB32UI),I===r.BYTE&&(Y=r.RGB8I),I===r.SHORT&&(Y=r.RGB16I),I===r.INT&&(Y=r.RGB32I)),v===r.RGBA_INTEGER&&(I===r.UNSIGNED_BYTE&&(Y=r.RGBA8UI),I===r.UNSIGNED_SHORT&&(Y=r.RGBA16UI),I===r.UNSIGNED_INT&&(Y=r.RGBA32UI),I===r.BYTE&&(Y=r.RGBA8I),I===r.SHORT&&(Y=r.RGBA16I),I===r.INT&&(Y=r.RGBA32I)),v===r.RGB&&(I===r.UNSIGNED_INT_5_9_9_9_REV&&(Y=r.RGB9_E5),I===r.UNSIGNED_INT_10F_11F_11F_REV&&(Y=r.R11F_G11F_B10F)),v===r.RGBA){const me=K?Ir:We.getTransfer(q);I===r.FLOAT&&(Y=r.RGBA32F),I===r.HALF_FLOAT&&(Y=r.RGBA16F),I===r.UNSIGNED_BYTE&&(Y=me===Ze?r.SRGB8_ALPHA8:r.RGBA8),I===r.UNSIGNED_SHORT_4_4_4_4&&(Y=r.RGBA4),I===r.UNSIGNED_SHORT_5_5_5_1&&(Y=r.RGB5_A1)}return(Y===r.R16F||Y===r.R32F||Y===r.RG16F||Y===r.RG32F||Y===r.RGBA16F||Y===r.RGBA32F)&&e.get("EXT_color_buffer_float"),Y}function E(b,v){let I;return b?v===null||v===un||v===Wi?I=r.DEPTH24_STENCIL8:v===an?I=r.DEPTH32F_STENCIL8:v===Hi&&(I=r.DEPTH24_STENCIL8,De("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):v===null||v===un||v===Wi?I=r.DEPTH_COMPONENT24:v===an?I=r.DEPTH_COMPONENT32F:v===Hi&&(I=r.DEPTH_COMPONENT16),I}function R(b,v){return f(b)===!0||b.isFramebufferTexture&&b.minFilter!==ut&&b.minFilter!==At?Math.log2(Math.max(v.width,v.height))+1:b.mipmaps!==void 0&&b.mipmaps.length>0?b.mipmaps.length:b.isCompressedTexture&&Array.isArray(b.image)?v.mipmaps.length:1}function C(b){const v=b.target;v.removeEventListener("dispose",C),_(v),v.isVideoTexture&&u.delete(v)}function P(b){const v=b.target;v.removeEventListener("dispose",P),W(v)}function _(b){const v=n.get(b);if(v.__webglInit===void 0)return;const I=b.source,q=d.get(I);if(q){const K=q[v.__cacheKey];K.usedTimes--,K.usedTimes===0&&y(b),Object.keys(q).length===0&&d.delete(I)}n.remove(b)}function y(b){const v=n.get(b);r.deleteTexture(v.__webglTexture);const I=b.source,q=d.get(I);delete q[v.__cacheKey],s.memory.textures--}function W(b){const v=n.get(b);if(b.depthTexture&&(b.depthTexture.dispose(),n.remove(b.depthTexture)),b.isWebGLCubeRenderTarget)for(let q=0;q<6;q++){if(Array.isArray(v.__webglFramebuffer[q]))for(let K=0;K<v.__webglFramebuffer[q].length;K++)r.deleteFramebuffer(v.__webglFramebuffer[q][K]);else r.deleteFramebuffer(v.__webglFramebuffer[q]);v.__webglDepthbuffer&&r.deleteRenderbuffer(v.__webglDepthbuffer[q])}else{if(Array.isArray(v.__webglFramebuffer))for(let q=0;q<v.__webglFramebuffer.length;q++)r.deleteFramebuffer(v.__webglFramebuffer[q]);else r.deleteFramebuffer(v.__webglFramebuffer);if(v.__webglDepthbuffer&&r.deleteRenderbuffer(v.__webglDepthbuffer),v.__webglMultisampledFramebuffer&&r.deleteFramebuffer(v.__webglMultisampledFramebuffer),v.__webglColorRenderbuffer)for(let q=0;q<v.__webglColorRenderbuffer.length;q++)v.__webglColorRenderbuffer[q]&&r.deleteRenderbuffer(v.__webglColorRenderbuffer[q]);v.__webglDepthRenderbuffer&&r.deleteRenderbuffer(v.__webglDepthRenderbuffer)}const I=b.textures;for(let q=0,K=I.length;q<K;q++){const Y=n.get(I[q]);Y.__webglTexture&&(r.deleteTexture(Y.__webglTexture),s.memory.textures--),n.remove(I[q])}n.remove(b)}let A=0;function B(){A=0}function V(){const b=A;return b>=i.maxTextures&&De("WebGLTextures: Trying to use "+b+" texture units while this GPU supports only "+i.maxTextures),A+=1,b}function X(b){const v=[];return v.push(b.wrapS),v.push(b.wrapT),v.push(b.wrapR||0),v.push(b.magFilter),v.push(b.minFilter),v.push(b.anisotropy),v.push(b.internalFormat),v.push(b.format),v.push(b.type),v.push(b.generateMipmaps),v.push(b.premultiplyAlpha),v.push(b.flipY),v.push(b.unpackAlignment),v.push(b.colorSpace),v.join()}function O(b,v){const I=n.get(b);if(b.isVideoTexture&&qe(b),b.isRenderTargetTexture===!1&&b.isExternalTexture!==!0&&b.version>0&&I.__version!==b.version){const q=b.image;if(q===null)De("WebGLRenderer: Texture marked for update but no image data found.");else if(q.complete===!1)De("WebGLRenderer: Texture marked for update but image is incomplete");else{$(I,b,v);return}}else b.isExternalTexture&&(I.__webglTexture=b.sourceTexture?b.sourceTexture:null);t.bindTexture(r.TEXTURE_2D,I.__webglTexture,r.TEXTURE0+v)}function G(b,v){const I=n.get(b);if(b.isRenderTargetTexture===!1&&b.version>0&&I.__version!==b.version){$(I,b,v);return}else b.isExternalTexture&&(I.__webglTexture=b.sourceTexture?b.sourceTexture:null);t.bindTexture(r.TEXTURE_2D_ARRAY,I.__webglTexture,r.TEXTURE0+v)}function U(b,v){const I=n.get(b);if(b.isRenderTargetTexture===!1&&b.version>0&&I.__version!==b.version){$(I,b,v);return}t.bindTexture(r.TEXTURE_3D,I.__webglTexture,r.TEXTURE0+v)}function Q(b,v){const I=n.get(b);if(b.isCubeDepthTexture!==!0&&b.version>0&&I.__version!==b.version){ne(I,b,v);return}t.bindTexture(r.TEXTURE_CUBE_MAP,I.__webglTexture,r.TEXTURE0+v)}const Z={[Oa]:r.REPEAT,[xn]:r.CLAMP_TO_EDGE,[Ba]:r.MIRRORED_REPEAT},ce={[ut]:r.NEAREST,[jc]:r.NEAREST_MIPMAP_NEAREST,[nr]:r.NEAREST_MIPMAP_LINEAR,[At]:r.LINEAR,[Zr]:r.LINEAR_MIPMAP_NEAREST,[Qn]:r.LINEAR_MIPMAP_LINEAR},pe={[tu]:r.NEVER,[su]:r.ALWAYS,[nu]:r.LESS,[ws]:r.LEQUAL,[iu]:r.EQUAL,[Cs]:r.GEQUAL,[ru]:r.GREATER,[au]:r.NOTEQUAL};function ue(b,v){if(v.type===an&&e.has("OES_texture_float_linear")===!1&&(v.magFilter===At||v.magFilter===Zr||v.magFilter===nr||v.magFilter===Qn||v.minFilter===At||v.minFilter===Zr||v.minFilter===nr||v.minFilter===Qn)&&De("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),r.texParameteri(b,r.TEXTURE_WRAP_S,Z[v.wrapS]),r.texParameteri(b,r.TEXTURE_WRAP_T,Z[v.wrapT]),(b===r.TEXTURE_3D||b===r.TEXTURE_2D_ARRAY)&&r.texParameteri(b,r.TEXTURE_WRAP_R,Z[v.wrapR]),r.texParameteri(b,r.TEXTURE_MAG_FILTER,ce[v.magFilter]),r.texParameteri(b,r.TEXTURE_MIN_FILTER,ce[v.minFilter]),v.compareFunction&&(r.texParameteri(b,r.TEXTURE_COMPARE_MODE,r.COMPARE_REF_TO_TEXTURE),r.texParameteri(b,r.TEXTURE_COMPARE_FUNC,pe[v.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(v.magFilter===ut||v.minFilter!==nr&&v.minFilter!==Qn||v.type===an&&e.has("OES_texture_float_linear")===!1)return;if(v.anisotropy>1||n.get(v).__currentAnisotropy){const I=e.get("EXT_texture_filter_anisotropic");r.texParameterf(b,I.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,i.getMaxAnisotropy())),n.get(v).__currentAnisotropy=v.anisotropy}}}function Ce(b,v){let I=!1;b.__webglInit===void 0&&(b.__webglInit=!0,v.addEventListener("dispose",C));const q=v.source;let K=d.get(q);K===void 0&&(K={},d.set(q,K));const Y=X(v);if(Y!==b.__cacheKey){K[Y]===void 0&&(K[Y]={texture:r.createTexture(),usedTimes:0},s.memory.textures++,I=!0),K[Y].usedTimes++;const me=K[b.__cacheKey];me!==void 0&&(K[b.__cacheKey].usedTimes--,me.usedTimes===0&&y(v)),b.__cacheKey=Y,b.__webglTexture=K[Y].texture}return I}function at(b,v,I){return Math.floor(Math.floor(b/I)/v)}function rt(b,v,I,q){const Y=b.updateRanges;if(Y.length===0)t.texSubImage2D(r.TEXTURE_2D,0,0,0,v.width,v.height,I,q,v.data);else{Y.sort((j,ee)=>j.start-ee.start);let me=0;for(let j=1;j<Y.length;j++){const ee=Y[me],ge=Y[j],_e=ee.start+ee.count,de=at(ge.start,v.width,4),Oe=at(ee.start,v.width,4);ge.start<=_e+1&&de===Oe&&at(ge.start+ge.count-1,v.width,4)===de?ee.count=Math.max(ee.count,ge.start+ge.count-ee.start):(++me,Y[me]=ge)}Y.length=me+1;const ie=r.getParameter(r.UNPACK_ROW_LENGTH),Ee=r.getParameter(r.UNPACK_SKIP_PIXELS),we=r.getParameter(r.UNPACK_SKIP_ROWS);r.pixelStorei(r.UNPACK_ROW_LENGTH,v.width);for(let j=0,ee=Y.length;j<ee;j++){const ge=Y[j],_e=Math.floor(ge.start/4),de=Math.ceil(ge.count/4),Oe=_e%v.width,D=Math.floor(_e/v.width),re=de,te=1;r.pixelStorei(r.UNPACK_SKIP_PIXELS,Oe),r.pixelStorei(r.UNPACK_SKIP_ROWS,D),t.texSubImage2D(r.TEXTURE_2D,0,Oe,D,re,te,I,q,v.data)}b.clearUpdateRanges(),r.pixelStorei(r.UNPACK_ROW_LENGTH,ie),r.pixelStorei(r.UNPACK_SKIP_PIXELS,Ee),r.pixelStorei(r.UNPACK_SKIP_ROWS,we)}}function $(b,v,I){let q=r.TEXTURE_2D;(v.isDataArrayTexture||v.isCompressedArrayTexture)&&(q=r.TEXTURE_2D_ARRAY),v.isData3DTexture&&(q=r.TEXTURE_3D);const K=Ce(b,v),Y=v.source;t.bindTexture(q,b.__webglTexture,r.TEXTURE0+I);const me=n.get(Y);if(Y.version!==me.__version||K===!0){t.activeTexture(r.TEXTURE0+I);const ie=We.getPrimaries(We.workingColorSpace),Ee=v.colorSpace===Fn?null:We.getPrimaries(v.colorSpace),we=v.colorSpace===Fn||ie===Ee?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,v.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,v.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,we);let j=S(v.image,!1,i.maxTextureSize);j=nt(v,j);const ee=a.convert(v.format,v.colorSpace),ge=a.convert(v.type);let _e=T(v.internalFormat,ee,ge,v.colorSpace,v.isVideoTexture);ue(q,v);let de;const Oe=v.mipmaps,D=v.isVideoTexture!==!0,re=me.__version===void 0||K===!0,te=Y.dataReady,fe=R(v,j);if(v.isDepthTexture)_e=E(v.format===ei,v.type),re&&(D?t.texStorage2D(r.TEXTURE_2D,1,_e,j.width,j.height):t.texImage2D(r.TEXTURE_2D,0,_e,j.width,j.height,0,ee,ge,null));else if(v.isDataTexture)if(Oe.length>0){D&&re&&t.texStorage2D(r.TEXTURE_2D,fe,_e,Oe[0].width,Oe[0].height);for(let J=0,H=Oe.length;J<H;J++)de=Oe[J],D?te&&t.texSubImage2D(r.TEXTURE_2D,J,0,0,de.width,de.height,ee,ge,de.data):t.texImage2D(r.TEXTURE_2D,J,_e,de.width,de.height,0,ee,ge,de.data);v.generateMipmaps=!1}else D?(re&&t.texStorage2D(r.TEXTURE_2D,fe,_e,j.width,j.height),te&&rt(v,j,ee,ge)):t.texImage2D(r.TEXTURE_2D,0,_e,j.width,j.height,0,ee,ge,j.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){D&&re&&t.texStorage3D(r.TEXTURE_2D_ARRAY,fe,_e,Oe[0].width,Oe[0].height,j.depth);for(let J=0,H=Oe.length;J<H;J++)if(de=Oe[J],v.format!==zt)if(ee!==null)if(D){if(te)if(v.layerUpdates.size>0){const ve=Ao(de.width,de.height,v.format,v.type);for(const Pe of v.layerUpdates){const it=de.data.subarray(Pe*ve/de.data.BYTES_PER_ELEMENT,(Pe+1)*ve/de.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,J,0,0,Pe,de.width,de.height,1,ee,it)}v.clearLayerUpdates()}else t.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,J,0,0,0,de.width,de.height,j.depth,ee,de.data)}else t.compressedTexImage3D(r.TEXTURE_2D_ARRAY,J,_e,de.width,de.height,j.depth,0,de.data,0,0);else De("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else D?te&&t.texSubImage3D(r.TEXTURE_2D_ARRAY,J,0,0,0,de.width,de.height,j.depth,ee,ge,de.data):t.texImage3D(r.TEXTURE_2D_ARRAY,J,_e,de.width,de.height,j.depth,0,ee,ge,de.data)}else{D&&re&&t.texStorage2D(r.TEXTURE_2D,fe,_e,Oe[0].width,Oe[0].height);for(let J=0,H=Oe.length;J<H;J++)de=Oe[J],v.format!==zt?ee!==null?D?te&&t.compressedTexSubImage2D(r.TEXTURE_2D,J,0,0,de.width,de.height,ee,de.data):t.compressedTexImage2D(r.TEXTURE_2D,J,_e,de.width,de.height,0,de.data):De("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):D?te&&t.texSubImage2D(r.TEXTURE_2D,J,0,0,de.width,de.height,ee,ge,de.data):t.texImage2D(r.TEXTURE_2D,J,_e,de.width,de.height,0,ee,ge,de.data)}else if(v.isDataArrayTexture)if(D){if(re&&t.texStorage3D(r.TEXTURE_2D_ARRAY,fe,_e,j.width,j.height,j.depth),te)if(v.layerUpdates.size>0){const J=Ao(j.width,j.height,v.format,v.type);for(const H of v.layerUpdates){const ve=j.data.subarray(H*J/j.data.BYTES_PER_ELEMENT,(H+1)*J/j.data.BYTES_PER_ELEMENT);t.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,H,j.width,j.height,1,ee,ge,ve)}v.clearLayerUpdates()}else t.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,0,j.width,j.height,j.depth,ee,ge,j.data)}else t.texImage3D(r.TEXTURE_2D_ARRAY,0,_e,j.width,j.height,j.depth,0,ee,ge,j.data);else if(v.isData3DTexture)D?(re&&t.texStorage3D(r.TEXTURE_3D,fe,_e,j.width,j.height,j.depth),te&&t.texSubImage3D(r.TEXTURE_3D,0,0,0,0,j.width,j.height,j.depth,ee,ge,j.data)):t.texImage3D(r.TEXTURE_3D,0,_e,j.width,j.height,j.depth,0,ee,ge,j.data);else if(v.isFramebufferTexture){if(re)if(D)t.texStorage2D(r.TEXTURE_2D,fe,_e,j.width,j.height);else{let J=j.width,H=j.height;for(let ve=0;ve<fe;ve++)t.texImage2D(r.TEXTURE_2D,ve,_e,J,H,0,ee,ge,null),J>>=1,H>>=1}}else if(Oe.length>0){if(D&&re){const J=Se(Oe[0]);t.texStorage2D(r.TEXTURE_2D,fe,_e,J.width,J.height)}for(let J=0,H=Oe.length;J<H;J++)de=Oe[J],D?te&&t.texSubImage2D(r.TEXTURE_2D,J,0,0,ee,ge,de):t.texImage2D(r.TEXTURE_2D,J,_e,ee,ge,de);v.generateMipmaps=!1}else if(D){if(re){const J=Se(j);t.texStorage2D(r.TEXTURE_2D,fe,_e,J.width,J.height)}te&&t.texSubImage2D(r.TEXTURE_2D,0,0,0,ee,ge,j)}else t.texImage2D(r.TEXTURE_2D,0,_e,ee,ge,j);f(v)&&p(q),me.__version=Y.version,v.onUpdate&&v.onUpdate(v)}b.__version=v.version}function ne(b,v,I){if(v.image.length!==6)return;const q=Ce(b,v),K=v.source;t.bindTexture(r.TEXTURE_CUBE_MAP,b.__webglTexture,r.TEXTURE0+I);const Y=n.get(K);if(K.version!==Y.__version||q===!0){t.activeTexture(r.TEXTURE0+I);const me=We.getPrimaries(We.workingColorSpace),ie=v.colorSpace===Fn?null:We.getPrimaries(v.colorSpace),Ee=v.colorSpace===Fn||me===ie?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,v.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,v.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ee);const we=v.isCompressedTexture||v.image[0].isCompressedTexture,j=v.image[0]&&v.image[0].isDataTexture,ee=[];for(let H=0;H<6;H++)!we&&!j?ee[H]=S(v.image[H],!0,i.maxCubemapSize):ee[H]=j?v.image[H].image:v.image[H],ee[H]=nt(v,ee[H]);const ge=ee[0],_e=a.convert(v.format,v.colorSpace),de=a.convert(v.type),Oe=T(v.internalFormat,_e,de,v.colorSpace),D=v.isVideoTexture!==!0,re=Y.__version===void 0||q===!0,te=K.dataReady;let fe=R(v,ge);ue(r.TEXTURE_CUBE_MAP,v);let J;if(we){D&&re&&t.texStorage2D(r.TEXTURE_CUBE_MAP,fe,Oe,ge.width,ge.height);for(let H=0;H<6;H++){J=ee[H].mipmaps;for(let ve=0;ve<J.length;ve++){const Pe=J[ve];v.format!==zt?_e!==null?D?te&&t.compressedTexSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+H,ve,0,0,Pe.width,Pe.height,_e,Pe.data):t.compressedTexImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+H,ve,Oe,Pe.width,Pe.height,0,Pe.data):De("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):D?te&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+H,ve,0,0,Pe.width,Pe.height,_e,de,Pe.data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+H,ve,Oe,Pe.width,Pe.height,0,_e,de,Pe.data)}}}else{if(J=v.mipmaps,D&&re){J.length>0&&fe++;const H=Se(ee[0]);t.texStorage2D(r.TEXTURE_CUBE_MAP,fe,Oe,H.width,H.height)}for(let H=0;H<6;H++)if(j){D?te&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+H,0,0,0,ee[H].width,ee[H].height,_e,de,ee[H].data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+H,0,Oe,ee[H].width,ee[H].height,0,_e,de,ee[H].data);for(let ve=0;ve<J.length;ve++){const it=J[ve].image[H].image;D?te&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+H,ve+1,0,0,it.width,it.height,_e,de,it.data):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+H,ve+1,Oe,it.width,it.height,0,_e,de,it.data)}}else{D?te&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+H,0,0,0,_e,de,ee[H]):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+H,0,Oe,_e,de,ee[H]);for(let ve=0;ve<J.length;ve++){const Pe=J[ve];D?te&&t.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+H,ve+1,0,0,_e,de,Pe.image[H]):t.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+H,ve+1,Oe,_e,de,Pe.image[H])}}}f(v)&&p(r.TEXTURE_CUBE_MAP),Y.__version=K.version,v.onUpdate&&v.onUpdate(v)}b.__version=v.version}function ae(b,v,I,q,K,Y){const me=a.convert(I.format,I.colorSpace),ie=a.convert(I.type),Ee=T(I.internalFormat,me,ie,I.colorSpace),we=n.get(v),j=n.get(I);if(j.__renderTarget=v,!we.__hasExternalTextures){const ee=Math.max(1,v.width>>Y),ge=Math.max(1,v.height>>Y);K===r.TEXTURE_3D||K===r.TEXTURE_2D_ARRAY?t.texImage3D(K,Y,Ee,ee,ge,v.depth,0,me,ie,null):t.texImage2D(K,Y,Ee,ee,ge,0,me,ie,null)}t.bindFramebuffer(r.FRAMEBUFFER,b),ht(v)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,q,K,j.__webglTexture,0,w(v)):(K===r.TEXTURE_2D||K>=r.TEXTURE_CUBE_MAP_POSITIVE_X&&K<=r.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&r.framebufferTexture2D(r.FRAMEBUFFER,q,K,j.__webglTexture,Y),t.bindFramebuffer(r.FRAMEBUFFER,null)}function Le(b,v,I){if(r.bindRenderbuffer(r.RENDERBUFFER,b),v.depthBuffer){const q=v.depthTexture,K=q&&q.isDepthTexture?q.type:null,Y=E(v.stencilBuffer,K),me=v.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT;ht(v)?o.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,w(v),Y,v.width,v.height):I?r.renderbufferStorageMultisample(r.RENDERBUFFER,w(v),Y,v.width,v.height):r.renderbufferStorage(r.RENDERBUFFER,Y,v.width,v.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,me,r.RENDERBUFFER,b)}else{const q=v.textures;for(let K=0;K<q.length;K++){const Y=q[K],me=a.convert(Y.format,Y.colorSpace),ie=a.convert(Y.type),Ee=T(Y.internalFormat,me,ie,Y.colorSpace);ht(v)?o.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,w(v),Ee,v.width,v.height):I?r.renderbufferStorageMultisample(r.RENDERBUFFER,w(v),Ee,v.width,v.height):r.renderbufferStorage(r.RENDERBUFFER,Ee,v.width,v.height)}}r.bindRenderbuffer(r.RENDERBUFFER,null)}function Ae(b,v,I){const q=v.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(r.FRAMEBUFFER,b),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const K=n.get(v.depthTexture);if(K.__renderTarget=v,(!K.__webglTexture||v.depthTexture.image.width!==v.width||v.depthTexture.image.height!==v.height)&&(v.depthTexture.image.width=v.width,v.depthTexture.image.height=v.height,v.depthTexture.needsUpdate=!0),q){if(K.__webglInit===void 0&&(K.__webglInit=!0,v.depthTexture.addEventListener("dispose",C)),K.__webglTexture===void 0){K.__webglTexture=r.createTexture(),t.bindTexture(r.TEXTURE_CUBE_MAP,K.__webglTexture),ue(r.TEXTURE_CUBE_MAP,v.depthTexture);const we=a.convert(v.depthTexture.format),j=a.convert(v.depthTexture.type);let ee;v.depthTexture.format===En?ee=r.DEPTH_COMPONENT24:v.depthTexture.format===ei&&(ee=r.DEPTH24_STENCIL8);for(let ge=0;ge<6;ge++)r.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+ge,0,ee,v.width,v.height,0,we,j,null)}}else O(v.depthTexture,0);const Y=K.__webglTexture,me=w(v),ie=q?r.TEXTURE_CUBE_MAP_POSITIVE_X+I:r.TEXTURE_2D,Ee=v.depthTexture.format===ei?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT;if(v.depthTexture.format===En)ht(v)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,Ee,ie,Y,0,me):r.framebufferTexture2D(r.FRAMEBUFFER,Ee,ie,Y,0);else if(v.depthTexture.format===ei)ht(v)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,Ee,ie,Y,0,me):r.framebufferTexture2D(r.FRAMEBUFFER,Ee,ie,Y,0);else throw new Error("Unknown depthTexture format")}function Re(b){const v=n.get(b),I=b.isWebGLCubeRenderTarget===!0;if(v.__boundDepthTexture!==b.depthTexture){const q=b.depthTexture;if(v.__depthDisposeCallback&&v.__depthDisposeCallback(),q){const K=()=>{delete v.__boundDepthTexture,delete v.__depthDisposeCallback,q.removeEventListener("dispose",K)};q.addEventListener("dispose",K),v.__depthDisposeCallback=K}v.__boundDepthTexture=q}if(b.depthTexture&&!v.__autoAllocateDepthBuffer)if(I)for(let q=0;q<6;q++)Ae(v.__webglFramebuffer[q],b,q);else{const q=b.texture.mipmaps;q&&q.length>0?Ae(v.__webglFramebuffer[0],b,0):Ae(v.__webglFramebuffer,b,0)}else if(I){v.__webglDepthbuffer=[];for(let q=0;q<6;q++)if(t.bindFramebuffer(r.FRAMEBUFFER,v.__webglFramebuffer[q]),v.__webglDepthbuffer[q]===void 0)v.__webglDepthbuffer[q]=r.createRenderbuffer(),Le(v.__webglDepthbuffer[q],b,!1);else{const K=b.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,Y=v.__webglDepthbuffer[q];r.bindRenderbuffer(r.RENDERBUFFER,Y),r.framebufferRenderbuffer(r.FRAMEBUFFER,K,r.RENDERBUFFER,Y)}}else{const q=b.texture.mipmaps;if(q&&q.length>0?t.bindFramebuffer(r.FRAMEBUFFER,v.__webglFramebuffer[0]):t.bindFramebuffer(r.FRAMEBUFFER,v.__webglFramebuffer),v.__webglDepthbuffer===void 0)v.__webglDepthbuffer=r.createRenderbuffer(),Le(v.__webglDepthbuffer,b,!1);else{const K=b.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,Y=v.__webglDepthbuffer;r.bindRenderbuffer(r.RENDERBUFFER,Y),r.framebufferRenderbuffer(r.FRAMEBUFFER,K,r.RENDERBUFFER,Y)}}t.bindFramebuffer(r.FRAMEBUFFER,null)}function xt(b,v,I){const q=n.get(b);v!==void 0&&ae(q.__webglFramebuffer,b,b.texture,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,0),I!==void 0&&Re(b)}function He(b){const v=b.texture,I=n.get(b),q=n.get(v);b.addEventListener("dispose",P);const K=b.textures,Y=b.isWebGLCubeRenderTarget===!0,me=K.length>1;if(me||(q.__webglTexture===void 0&&(q.__webglTexture=r.createTexture()),q.__version=v.version,s.memory.textures++),Y){I.__webglFramebuffer=[];for(let ie=0;ie<6;ie++)if(v.mipmaps&&v.mipmaps.length>0){I.__webglFramebuffer[ie]=[];for(let Ee=0;Ee<v.mipmaps.length;Ee++)I.__webglFramebuffer[ie][Ee]=r.createFramebuffer()}else I.__webglFramebuffer[ie]=r.createFramebuffer()}else{if(v.mipmaps&&v.mipmaps.length>0){I.__webglFramebuffer=[];for(let ie=0;ie<v.mipmaps.length;ie++)I.__webglFramebuffer[ie]=r.createFramebuffer()}else I.__webglFramebuffer=r.createFramebuffer();if(me)for(let ie=0,Ee=K.length;ie<Ee;ie++){const we=n.get(K[ie]);we.__webglTexture===void 0&&(we.__webglTexture=r.createTexture(),s.memory.textures++)}if(b.samples>0&&ht(b)===!1){I.__webglMultisampledFramebuffer=r.createFramebuffer(),I.__webglColorRenderbuffer=[],t.bindFramebuffer(r.FRAMEBUFFER,I.__webglMultisampledFramebuffer);for(let ie=0;ie<K.length;ie++){const Ee=K[ie];I.__webglColorRenderbuffer[ie]=r.createRenderbuffer(),r.bindRenderbuffer(r.RENDERBUFFER,I.__webglColorRenderbuffer[ie]);const we=a.convert(Ee.format,Ee.colorSpace),j=a.convert(Ee.type),ee=T(Ee.internalFormat,we,j,Ee.colorSpace,b.isXRRenderTarget===!0),ge=w(b);r.renderbufferStorageMultisample(r.RENDERBUFFER,ge,ee,b.width,b.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+ie,r.RENDERBUFFER,I.__webglColorRenderbuffer[ie])}r.bindRenderbuffer(r.RENDERBUFFER,null),b.depthBuffer&&(I.__webglDepthRenderbuffer=r.createRenderbuffer(),Le(I.__webglDepthRenderbuffer,b,!0)),t.bindFramebuffer(r.FRAMEBUFFER,null)}}if(Y){t.bindTexture(r.TEXTURE_CUBE_MAP,q.__webglTexture),ue(r.TEXTURE_CUBE_MAP,v);for(let ie=0;ie<6;ie++)if(v.mipmaps&&v.mipmaps.length>0)for(let Ee=0;Ee<v.mipmaps.length;Ee++)ae(I.__webglFramebuffer[ie][Ee],b,v,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+ie,Ee);else ae(I.__webglFramebuffer[ie],b,v,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+ie,0);f(v)&&p(r.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(me){for(let ie=0,Ee=K.length;ie<Ee;ie++){const we=K[ie],j=n.get(we);let ee=r.TEXTURE_2D;(b.isWebGL3DRenderTarget||b.isWebGLArrayRenderTarget)&&(ee=b.isWebGL3DRenderTarget?r.TEXTURE_3D:r.TEXTURE_2D_ARRAY),t.bindTexture(ee,j.__webglTexture),ue(ee,we),ae(I.__webglFramebuffer,b,we,r.COLOR_ATTACHMENT0+ie,ee,0),f(we)&&p(ee)}t.unbindTexture()}else{let ie=r.TEXTURE_2D;if((b.isWebGL3DRenderTarget||b.isWebGLArrayRenderTarget)&&(ie=b.isWebGL3DRenderTarget?r.TEXTURE_3D:r.TEXTURE_2D_ARRAY),t.bindTexture(ie,q.__webglTexture),ue(ie,v),v.mipmaps&&v.mipmaps.length>0)for(let Ee=0;Ee<v.mipmaps.length;Ee++)ae(I.__webglFramebuffer[Ee],b,v,r.COLOR_ATTACHMENT0,ie,Ee);else ae(I.__webglFramebuffer,b,v,r.COLOR_ATTACHMENT0,ie,0);f(v)&&p(ie),t.unbindTexture()}b.depthBuffer&&Re(b)}function $e(b){const v=b.textures;for(let I=0,q=v.length;I<q;I++){const K=v[I];if(f(K)){const Y=M(b),me=n.get(K).__webglTexture;t.bindTexture(Y,me),p(Y),t.unbindTexture()}}}const et=[],Fe=[];function lt(b){if(b.samples>0){if(ht(b)===!1){const v=b.textures,I=b.width,q=b.height;let K=r.COLOR_BUFFER_BIT;const Y=b.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,me=n.get(b),ie=v.length>1;if(ie)for(let we=0;we<v.length;we++)t.bindFramebuffer(r.FRAMEBUFFER,me.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+we,r.RENDERBUFFER,null),t.bindFramebuffer(r.FRAMEBUFFER,me.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+we,r.TEXTURE_2D,null,0);t.bindFramebuffer(r.READ_FRAMEBUFFER,me.__webglMultisampledFramebuffer);const Ee=b.texture.mipmaps;Ee&&Ee.length>0?t.bindFramebuffer(r.DRAW_FRAMEBUFFER,me.__webglFramebuffer[0]):t.bindFramebuffer(r.DRAW_FRAMEBUFFER,me.__webglFramebuffer);for(let we=0;we<v.length;we++){if(b.resolveDepthBuffer&&(b.depthBuffer&&(K|=r.DEPTH_BUFFER_BIT),b.stencilBuffer&&b.resolveStencilBuffer&&(K|=r.STENCIL_BUFFER_BIT)),ie){r.framebufferRenderbuffer(r.READ_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.RENDERBUFFER,me.__webglColorRenderbuffer[we]);const j=n.get(v[we]).__webglTexture;r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,j,0)}r.blitFramebuffer(0,0,I,q,0,0,I,q,K,r.NEAREST),l===!0&&(et.length=0,Fe.length=0,et.push(r.COLOR_ATTACHMENT0+we),b.depthBuffer&&b.resolveDepthBuffer===!1&&(et.push(Y),Fe.push(Y),r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,Fe)),r.invalidateFramebuffer(r.READ_FRAMEBUFFER,et))}if(t.bindFramebuffer(r.READ_FRAMEBUFFER,null),t.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),ie)for(let we=0;we<v.length;we++){t.bindFramebuffer(r.FRAMEBUFFER,me.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+we,r.RENDERBUFFER,me.__webglColorRenderbuffer[we]);const j=n.get(v[we]).__webglTexture;t.bindFramebuffer(r.FRAMEBUFFER,me.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+we,r.TEXTURE_2D,j,0)}t.bindFramebuffer(r.DRAW_FRAMEBUFFER,me.__webglMultisampledFramebuffer)}else if(b.depthBuffer&&b.resolveDepthBuffer===!1&&l){const v=b.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT;r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,[v])}}}function w(b){return Math.min(i.maxSamples,b.samples)}function ht(b){const v=n.get(b);return b.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function qe(b){const v=s.render.frame;u.get(b)!==v&&(u.set(b,v),b.update())}function nt(b,v){const I=b.colorSpace,q=b.format,K=b.type;return b.isCompressedTexture===!0||b.isVideoTexture===!0||I!==Ci&&I!==Fn&&(We.getTransfer(I)===Ze?(q!==zt||K!==Dt)&&De("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Ye("WebGLTextures: Unsupported texture color space:",I)),v}function Se(b){return typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement?(c.width=b.naturalWidth||b.width,c.height=b.naturalHeight||b.height):typeof VideoFrame<"u"&&b instanceof VideoFrame?(c.width=b.displayWidth,c.height=b.displayHeight):(c.width=b.width,c.height=b.height),c}this.allocateTextureUnit=V,this.resetTextureUnits=B,this.setTexture2D=O,this.setTexture2DArray=G,this.setTexture3D=U,this.setTextureCube=Q,this.rebindTextures=xt,this.setupRenderTarget=He,this.updateRenderTargetMipmap=$e,this.updateMultisampleRenderTarget=lt,this.setupDepthRenderbuffer=Re,this.setupFrameBufferTexture=ae,this.useMultisampledRTT=ht,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function Cm(r,e){function t(n,i=Fn){let a;const s=We.getTransfer(i);if(n===Dt)return r.UNSIGNED_BYTE;if(n===ys)return r.UNSIGNED_SHORT_4_4_4_4;if(n===bs)return r.UNSIGNED_SHORT_5_5_5_1;if(n===pl)return r.UNSIGNED_INT_5_9_9_9_REV;if(n===ml)return r.UNSIGNED_INT_10F_11F_11F_REV;if(n===hl)return r.BYTE;if(n===fl)return r.SHORT;if(n===Hi)return r.UNSIGNED_SHORT;if(n===Ms)return r.INT;if(n===un)return r.UNSIGNED_INT;if(n===an)return r.FLOAT;if(n===bn)return r.HALF_FLOAT;if(n===gl)return r.ALPHA;if(n===vl)return r.RGB;if(n===zt)return r.RGBA;if(n===En)return r.DEPTH_COMPONENT;if(n===ei)return r.DEPTH_STENCIL;if(n===_l)return r.RED;if(n===Es)return r.RED_INTEGER;if(n===wi)return r.RG;if(n===Ts)return r.RG_INTEGER;if(n===As)return r.RGBA_INTEGER;if(n===wr||n===Cr||n===Rr||n===Pr)if(s===Ze)if(a=e.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(n===wr)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Cr)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Rr)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Pr)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=e.get("WEBGL_compressed_texture_s3tc"),a!==null){if(n===wr)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Cr)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Rr)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Pr)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===za||n===Va||n===ka||n===Ga)if(a=e.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(n===za)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Va)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===ka)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Ga)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Ha||n===Wa||n===Xa||n===Ya||n===qa||n===$a||n===Ka)if(a=e.get("WEBGL_compressed_texture_etc"),a!==null){if(n===Ha||n===Wa)return s===Ze?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(n===Xa)return s===Ze?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC;if(n===Ya)return a.COMPRESSED_R11_EAC;if(n===qa)return a.COMPRESSED_SIGNED_R11_EAC;if(n===$a)return a.COMPRESSED_RG11_EAC;if(n===Ka)return a.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Za||n===ja||n===Ja||n===Qa||n===es||n===ts||n===ns||n===is||n===rs||n===as||n===ss||n===os||n===ls||n===cs)if(a=e.get("WEBGL_compressed_texture_astc"),a!==null){if(n===Za)return s===Ze?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===ja)return s===Ze?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Ja)return s===Ze?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Qa)return s===Ze?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===es)return s===Ze?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===ts)return s===Ze?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===ns)return s===Ze?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===is)return s===Ze?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===rs)return s===Ze?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===as)return s===Ze?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===ss)return s===Ze?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===os)return s===Ze?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ls)return s===Ze?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===cs)return s===Ze?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===us||n===ds||n===hs)if(a=e.get("EXT_texture_compression_bptc"),a!==null){if(n===us)return s===Ze?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===ds)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===hs)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===fs||n===ps||n===ms||n===gs)if(a=e.get("EXT_texture_compression_rgtc"),a!==null){if(n===fs)return a.COMPRESSED_RED_RGTC1_EXT;if(n===ps)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===ms)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===gs)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Wi?r.UNSIGNED_INT_24_8:r[n]!==void 0?r[n]:null}return{convert:t}}const Rm=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Pm=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Dm{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const n=new Rl(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new Gt({vertexShader:Rm,fragmentShader:Pm,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Yt(new ii(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Im extends Pi{constructor(e,t){super();const n=this;let i=null,a=1,s=null,o="local-floor",l=1,c=null,u=null,h=null,d=null,m=null,g=null;const S=typeof XRWebGLBinding<"u",f=new Dm,p={},M=t.getContextAttributes();let T=null,E=null;const R=[],C=[],P=new ke;let _=null;const y=new jt;y.viewport=new ot;const W=new jt;W.viewport=new ot;const A=[y,W],B=new Hu;let V=null,X=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let ne=R[$];return ne===void 0&&(ne=new ra,R[$]=ne),ne.getTargetRaySpace()},this.getControllerGrip=function($){let ne=R[$];return ne===void 0&&(ne=new ra,R[$]=ne),ne.getGripSpace()},this.getHand=function($){let ne=R[$];return ne===void 0&&(ne=new ra,R[$]=ne),ne.getHandSpace()};function O($){const ne=C.indexOf($.inputSource);if(ne===-1)return;const ae=R[ne];ae!==void 0&&(ae.update($.inputSource,$.frame,c||s),ae.dispatchEvent({type:$.type,data:$.inputSource}))}function G(){i.removeEventListener("select",O),i.removeEventListener("selectstart",O),i.removeEventListener("selectend",O),i.removeEventListener("squeeze",O),i.removeEventListener("squeezestart",O),i.removeEventListener("squeezeend",O),i.removeEventListener("end",G),i.removeEventListener("inputsourceschange",U);for(let $=0;$<R.length;$++){const ne=C[$];ne!==null&&(C[$]=null,R[$].disconnect(ne))}V=null,X=null,f.reset();for(const $ in p)delete p[$];e.setRenderTarget(T),m=null,d=null,h=null,i=null,E=null,rt.stop(),n.isPresenting=!1,e.setPixelRatio(_),e.setSize(P.width,P.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function($){a=$,n.isPresenting===!0&&De("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){o=$,n.isPresenting===!0&&De("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||s},this.setReferenceSpace=function($){c=$},this.getBaseLayer=function(){return d!==null?d:m},this.getBinding=function(){return h===null&&S&&(h=new XRWebGLBinding(i,t)),h},this.getFrame=function(){return g},this.getSession=function(){return i},this.setSession=async function($){if(i=$,i!==null){if(T=e.getRenderTarget(),i.addEventListener("select",O),i.addEventListener("selectstart",O),i.addEventListener("selectend",O),i.addEventListener("squeeze",O),i.addEventListener("squeezestart",O),i.addEventListener("squeezeend",O),i.addEventListener("end",G),i.addEventListener("inputsourceschange",U),M.xrCompatible!==!0&&await t.makeXRCompatible(),_=e.getPixelRatio(),e.getSize(P),S&&"createProjectionLayer"in XRWebGLBinding.prototype){let ae=null,Le=null,Ae=null;M.depth&&(Ae=M.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ae=M.stencil?ei:En,Le=M.stencil?Wi:un);const Re={colorFormat:t.RGBA8,depthFormat:Ae,scaleFactor:a};h=this.getBinding(),d=h.createProjectionLayer(Re),i.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),E=new ln(d.textureWidth,d.textureHeight,{format:zt,type:Dt,depthTexture:new Xi(d.textureWidth,d.textureHeight,Le,void 0,void 0,void 0,void 0,void 0,void 0,ae),stencilBuffer:M.stencil,colorSpace:e.outputColorSpace,samples:M.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}else{const ae={antialias:M.antialias,alpha:!0,depth:M.depth,stencil:M.stencil,framebufferScaleFactor:a};m=new XRWebGLLayer(i,t,ae),i.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),E=new ln(m.framebufferWidth,m.framebufferHeight,{format:zt,type:Dt,colorSpace:e.outputColorSpace,stencilBuffer:M.stencil,resolveDepthBuffer:m.ignoreDepthValues===!1,resolveStencilBuffer:m.ignoreDepthValues===!1})}E.isXRRenderTarget=!0,this.setFoveation(l),c=null,s=await i.requestReferenceSpace(o),rt.setContext(i),rt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return f.getDepthTexture()};function U($){for(let ne=0;ne<$.removed.length;ne++){const ae=$.removed[ne],Le=C.indexOf(ae);Le>=0&&(C[Le]=null,R[Le].disconnect(ae))}for(let ne=0;ne<$.added.length;ne++){const ae=$.added[ne];let Le=C.indexOf(ae);if(Le===-1){for(let Re=0;Re<R.length;Re++)if(Re>=C.length){C.push(ae),Le=Re;break}else if(C[Re]===null){C[Re]=ae,Le=Re;break}if(Le===-1)break}const Ae=R[Le];Ae&&Ae.connect(ae)}}const Q=new z,Z=new z;function ce($,ne,ae){Q.setFromMatrixPosition(ne.matrixWorld),Z.setFromMatrixPosition(ae.matrixWorld);const Le=Q.distanceTo(Z),Ae=ne.projectionMatrix.elements,Re=ae.projectionMatrix.elements,xt=Ae[14]/(Ae[10]-1),He=Ae[14]/(Ae[10]+1),$e=(Ae[9]+1)/Ae[5],et=(Ae[9]-1)/Ae[5],Fe=(Ae[8]-1)/Ae[0],lt=(Re[8]+1)/Re[0],w=xt*Fe,ht=xt*lt,qe=Le/(-Fe+lt),nt=qe*-Fe;if(ne.matrixWorld.decompose($.position,$.quaternion,$.scale),$.translateX(nt),$.translateZ(qe),$.matrixWorld.compose($.position,$.quaternion,$.scale),$.matrixWorldInverse.copy($.matrixWorld).invert(),Ae[10]===-1)$.projectionMatrix.copy(ne.projectionMatrix),$.projectionMatrixInverse.copy(ne.projectionMatrixInverse);else{const Se=xt+qe,b=He+qe,v=w-nt,I=ht+(Le-nt),q=$e*He/b*Se,K=et*He/b*Se;$.projectionMatrix.makePerspective(v,I,q,K,Se,b),$.projectionMatrixInverse.copy($.projectionMatrix).invert()}}function pe($,ne){ne===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(ne.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(i===null)return;let ne=$.near,ae=$.far;f.texture!==null&&(f.depthNear>0&&(ne=f.depthNear),f.depthFar>0&&(ae=f.depthFar)),B.near=W.near=y.near=ne,B.far=W.far=y.far=ae,(V!==B.near||X!==B.far)&&(i.updateRenderState({depthNear:B.near,depthFar:B.far}),V=B.near,X=B.far),B.layers.mask=$.layers.mask|6,y.layers.mask=B.layers.mask&-5,W.layers.mask=B.layers.mask&-3;const Le=$.parent,Ae=B.cameras;pe(B,Le);for(let Re=0;Re<Ae.length;Re++)pe(Ae[Re],Le);Ae.length===2?ce(B,y,W):B.projectionMatrix.copy(y.projectionMatrix),ue($,B,Le)};function ue($,ne,ae){ae===null?$.matrix.copy(ne.matrixWorld):($.matrix.copy(ae.matrixWorld),$.matrix.invert(),$.matrix.multiply(ne.matrixWorld)),$.matrix.decompose($.position,$.quaternion,$.scale),$.updateMatrixWorld(!0),$.projectionMatrix.copy(ne.projectionMatrix),$.projectionMatrixInverse.copy(ne.projectionMatrixInverse),$.isPerspectiveCamera&&($.fov=vs*2*Math.atan(1/$.projectionMatrix.elements[5]),$.zoom=1)}this.getCamera=function(){return B},this.getFoveation=function(){if(!(d===null&&m===null))return l},this.setFoveation=function($){l=$,d!==null&&(d.fixedFoveation=$),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=$)},this.hasDepthSensing=function(){return f.texture!==null},this.getDepthSensingMesh=function(){return f.getMesh(B)},this.getCameraTexture=function($){return p[$]};let Ce=null;function at($,ne){if(u=ne.getViewerPose(c||s),g=ne,u!==null){const ae=u.views;m!==null&&(e.setRenderTargetFramebuffer(E,m.framebuffer),e.setRenderTarget(E));let Le=!1;ae.length!==B.cameras.length&&(B.cameras.length=0,Le=!0);for(let He=0;He<ae.length;He++){const $e=ae[He];let et=null;if(m!==null)et=m.getViewport($e);else{const lt=h.getViewSubImage(d,$e);et=lt.viewport,He===0&&(e.setRenderTargetTextures(E,lt.colorTexture,lt.depthStencilTexture),e.setRenderTarget(E))}let Fe=A[He];Fe===void 0&&(Fe=new jt,Fe.layers.enable(He),Fe.viewport=new ot,A[He]=Fe),Fe.matrix.fromArray($e.transform.matrix),Fe.matrix.decompose(Fe.position,Fe.quaternion,Fe.scale),Fe.projectionMatrix.fromArray($e.projectionMatrix),Fe.projectionMatrixInverse.copy(Fe.projectionMatrix).invert(),Fe.viewport.set(et.x,et.y,et.width,et.height),He===0&&(B.matrix.copy(Fe.matrix),B.matrix.decompose(B.position,B.quaternion,B.scale)),Le===!0&&B.cameras.push(Fe)}const Ae=i.enabledFeatures;if(Ae&&Ae.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&S){h=n.getBinding();const He=h.getDepthInformation(ae[0]);He&&He.isValid&&He.texture&&f.init(He,i.renderState)}if(Ae&&Ae.includes("camera-access")&&S){e.state.unbindTexture(),h=n.getBinding();for(let He=0;He<ae.length;He++){const $e=ae[He].camera;if($e){let et=p[$e];et||(et=new Rl,p[$e]=et);const Fe=h.getCameraImage($e);et.sourceTexture=Fe}}}}for(let ae=0;ae<R.length;ae++){const Le=C[ae],Ae=R[ae];Le!==null&&Ae!==void 0&&Ae.update(Le,ne,c||s)}Ce&&Ce($,ne),ne.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ne}),g=null}const rt=new Il;rt.setAnimationLoop(at),this.setAnimationLoop=function($){Ce=$},this.dispose=function(){}}}const $n=new Tn,Lm=new mt;function Um(r,e){function t(f,p){f.matrixAutoUpdate===!0&&f.updateMatrix(),p.value.copy(f.matrix)}function n(f,p){p.color.getRGB(f.fogColor.value,Pl(r)),p.isFog?(f.fogNear.value=p.near,f.fogFar.value=p.far):p.isFogExp2&&(f.fogDensity.value=p.density)}function i(f,p,M,T,E){p.isMeshBasicMaterial?a(f,p):p.isMeshLambertMaterial?(a(f,p),p.envMap&&(f.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(a(f,p),h(f,p)):p.isMeshPhongMaterial?(a(f,p),u(f,p),p.envMap&&(f.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(a(f,p),d(f,p),p.isMeshPhysicalMaterial&&m(f,p,E)):p.isMeshMatcapMaterial?(a(f,p),g(f,p)):p.isMeshDepthMaterial?a(f,p):p.isMeshDistanceMaterial?(a(f,p),S(f,p)):p.isMeshNormalMaterial?a(f,p):p.isLineBasicMaterial?(s(f,p),p.isLineDashedMaterial&&o(f,p)):p.isPointsMaterial?l(f,p,M,T):p.isSpriteMaterial?c(f,p):p.isShadowMaterial?(f.color.value.copy(p.color),f.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function a(f,p){f.opacity.value=p.opacity,p.color&&f.diffuse.value.copy(p.color),p.emissive&&f.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(f.map.value=p.map,t(p.map,f.mapTransform)),p.alphaMap&&(f.alphaMap.value=p.alphaMap,t(p.alphaMap,f.alphaMapTransform)),p.bumpMap&&(f.bumpMap.value=p.bumpMap,t(p.bumpMap,f.bumpMapTransform),f.bumpScale.value=p.bumpScale,p.side===Lt&&(f.bumpScale.value*=-1)),p.normalMap&&(f.normalMap.value=p.normalMap,t(p.normalMap,f.normalMapTransform),f.normalScale.value.copy(p.normalScale),p.side===Lt&&f.normalScale.value.negate()),p.displacementMap&&(f.displacementMap.value=p.displacementMap,t(p.displacementMap,f.displacementMapTransform),f.displacementScale.value=p.displacementScale,f.displacementBias.value=p.displacementBias),p.emissiveMap&&(f.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,f.emissiveMapTransform)),p.specularMap&&(f.specularMap.value=p.specularMap,t(p.specularMap,f.specularMapTransform)),p.alphaTest>0&&(f.alphaTest.value=p.alphaTest);const M=e.get(p),T=M.envMap,E=M.envMapRotation;T&&(f.envMap.value=T,$n.copy(E),$n.x*=-1,$n.y*=-1,$n.z*=-1,T.isCubeTexture&&T.isRenderTargetTexture===!1&&($n.y*=-1,$n.z*=-1),f.envMapRotation.value.setFromMatrix4(Lm.makeRotationFromEuler($n)),f.flipEnvMap.value=T.isCubeTexture&&T.isRenderTargetTexture===!1?-1:1,f.reflectivity.value=p.reflectivity,f.ior.value=p.ior,f.refractionRatio.value=p.refractionRatio),p.lightMap&&(f.lightMap.value=p.lightMap,f.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,f.lightMapTransform)),p.aoMap&&(f.aoMap.value=p.aoMap,f.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,f.aoMapTransform))}function s(f,p){f.diffuse.value.copy(p.color),f.opacity.value=p.opacity,p.map&&(f.map.value=p.map,t(p.map,f.mapTransform))}function o(f,p){f.dashSize.value=p.dashSize,f.totalSize.value=p.dashSize+p.gapSize,f.scale.value=p.scale}function l(f,p,M,T){f.diffuse.value.copy(p.color),f.opacity.value=p.opacity,f.size.value=p.size*M,f.scale.value=T*.5,p.map&&(f.map.value=p.map,t(p.map,f.uvTransform)),p.alphaMap&&(f.alphaMap.value=p.alphaMap,t(p.alphaMap,f.alphaMapTransform)),p.alphaTest>0&&(f.alphaTest.value=p.alphaTest)}function c(f,p){f.diffuse.value.copy(p.color),f.opacity.value=p.opacity,f.rotation.value=p.rotation,p.map&&(f.map.value=p.map,t(p.map,f.mapTransform)),p.alphaMap&&(f.alphaMap.value=p.alphaMap,t(p.alphaMap,f.alphaMapTransform)),p.alphaTest>0&&(f.alphaTest.value=p.alphaTest)}function u(f,p){f.specular.value.copy(p.specular),f.shininess.value=Math.max(p.shininess,1e-4)}function h(f,p){p.gradientMap&&(f.gradientMap.value=p.gradientMap)}function d(f,p){f.metalness.value=p.metalness,p.metalnessMap&&(f.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,f.metalnessMapTransform)),f.roughness.value=p.roughness,p.roughnessMap&&(f.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,f.roughnessMapTransform)),p.envMap&&(f.envMapIntensity.value=p.envMapIntensity)}function m(f,p,M){f.ior.value=p.ior,p.sheen>0&&(f.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),f.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(f.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,f.sheenColorMapTransform)),p.sheenRoughnessMap&&(f.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,f.sheenRoughnessMapTransform))),p.clearcoat>0&&(f.clearcoat.value=p.clearcoat,f.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(f.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,f.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(f.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,f.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(f.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,f.clearcoatNormalMapTransform),f.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Lt&&f.clearcoatNormalScale.value.negate())),p.dispersion>0&&(f.dispersion.value=p.dispersion),p.iridescence>0&&(f.iridescence.value=p.iridescence,f.iridescenceIOR.value=p.iridescenceIOR,f.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],f.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(f.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,f.iridescenceMapTransform)),p.iridescenceThicknessMap&&(f.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,f.iridescenceThicknessMapTransform))),p.transmission>0&&(f.transmission.value=p.transmission,f.transmissionSamplerMap.value=M.texture,f.transmissionSamplerSize.value.set(M.width,M.height),p.transmissionMap&&(f.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,f.transmissionMapTransform)),f.thickness.value=p.thickness,p.thicknessMap&&(f.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,f.thicknessMapTransform)),f.attenuationDistance.value=p.attenuationDistance,f.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(f.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(f.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,f.anisotropyMapTransform))),f.specularIntensity.value=p.specularIntensity,f.specularColor.value.copy(p.specularColor),p.specularColorMap&&(f.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,f.specularColorMapTransform)),p.specularIntensityMap&&(f.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,f.specularIntensityMapTransform))}function g(f,p){p.matcap&&(f.matcap.value=p.matcap)}function S(f,p){const M=e.get(p).light;f.referencePosition.value.setFromMatrixPosition(M.matrixWorld),f.nearDistance.value=M.shadow.camera.near,f.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function Nm(r,e,t,n){let i={},a={},s=[];const o=r.getParameter(r.MAX_UNIFORM_BUFFER_BINDINGS);function l(M,T){const E=T.program;n.uniformBlockBinding(M,E)}function c(M,T){let E=i[M.id];E===void 0&&(g(M),E=u(M),i[M.id]=E,M.addEventListener("dispose",f));const R=T.program;n.updateUBOMapping(M,R);const C=e.render.frame;a[M.id]!==C&&(d(M),a[M.id]=C)}function u(M){const T=h();M.__bindingPointIndex=T;const E=r.createBuffer(),R=M.__size,C=M.usage;return r.bindBuffer(r.UNIFORM_BUFFER,E),r.bufferData(r.UNIFORM_BUFFER,R,C),r.bindBuffer(r.UNIFORM_BUFFER,null),r.bindBufferBase(r.UNIFORM_BUFFER,T,E),E}function h(){for(let M=0;M<o;M++)if(s.indexOf(M)===-1)return s.push(M),M;return Ye("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(M){const T=i[M.id],E=M.uniforms,R=M.__cache;r.bindBuffer(r.UNIFORM_BUFFER,T);for(let C=0,P=E.length;C<P;C++){const _=Array.isArray(E[C])?E[C]:[E[C]];for(let y=0,W=_.length;y<W;y++){const A=_[y];if(m(A,C,y,R)===!0){const B=A.__offset,V=Array.isArray(A.value)?A.value:[A.value];let X=0;for(let O=0;O<V.length;O++){const G=V[O],U=S(G);typeof G=="number"||typeof G=="boolean"?(A.__data[0]=G,r.bufferSubData(r.UNIFORM_BUFFER,B+X,A.__data)):G.isMatrix3?(A.__data[0]=G.elements[0],A.__data[1]=G.elements[1],A.__data[2]=G.elements[2],A.__data[3]=0,A.__data[4]=G.elements[3],A.__data[5]=G.elements[4],A.__data[6]=G.elements[5],A.__data[7]=0,A.__data[8]=G.elements[6],A.__data[9]=G.elements[7],A.__data[10]=G.elements[8],A.__data[11]=0):(G.toArray(A.__data,X),X+=U.storage/Float32Array.BYTES_PER_ELEMENT)}r.bufferSubData(r.UNIFORM_BUFFER,B,A.__data)}}}r.bindBuffer(r.UNIFORM_BUFFER,null)}function m(M,T,E,R){const C=M.value,P=T+"_"+E;if(R[P]===void 0)return typeof C=="number"||typeof C=="boolean"?R[P]=C:R[P]=C.clone(),!0;{const _=R[P];if(typeof C=="number"||typeof C=="boolean"){if(_!==C)return R[P]=C,!0}else if(_.equals(C)===!1)return _.copy(C),!0}return!1}function g(M){const T=M.uniforms;let E=0;const R=16;for(let P=0,_=T.length;P<_;P++){const y=Array.isArray(T[P])?T[P]:[T[P]];for(let W=0,A=y.length;W<A;W++){const B=y[W],V=Array.isArray(B.value)?B.value:[B.value];for(let X=0,O=V.length;X<O;X++){const G=V[X],U=S(G),Q=E%R,Z=Q%U.boundary,ce=Q+Z;E+=Z,ce!==0&&R-ce<U.storage&&(E+=R-ce),B.__data=new Float32Array(U.storage/Float32Array.BYTES_PER_ELEMENT),B.__offset=E,E+=U.storage}}}const C=E%R;return C>0&&(E+=R-C),M.__size=E,M.__cache={},this}function S(M){const T={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(T.boundary=4,T.storage=4):M.isVector2?(T.boundary=8,T.storage=8):M.isVector3||M.isColor?(T.boundary=16,T.storage=12):M.isVector4?(T.boundary=16,T.storage=16):M.isMatrix3?(T.boundary=48,T.storage=48):M.isMatrix4?(T.boundary=64,T.storage=64):M.isTexture?De("WebGLRenderer: Texture samplers can not be part of an uniforms group."):De("WebGLRenderer: Unsupported uniform value type.",M),T}function f(M){const T=M.target;T.removeEventListener("dispose",f);const E=s.indexOf(T.__bindingPointIndex);s.splice(E,1),r.deleteBuffer(i[T.id]),delete i[T.id],delete a[T.id]}function p(){for(const M in i)r.deleteBuffer(i[M]);s=[],i={},a={}}return{bind:l,update:c,dispose:p}}const Fm=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let tn=null;function Om(){return tn===null&&(tn=new Ds(Fm,16,16,wi,bn),tn.name="DFG_LUT",tn.minFilter=At,tn.magFilter=At,tn.wrapS=xn,tn.wrapT=xn,tn.generateMipmaps=!1,tn.needsUpdate=!0),tn}class Bl{constructor(e={}){const{canvas:t=lu(),context:n=null,depth:i=!0,stencil:a=!1,alpha:s=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1,reversedDepthBuffer:d=!1,outputBufferType:m=Dt}=e;this.isWebGLRenderer=!0;let g;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=n.getContextAttributes().alpha}else g=s;const S=m,f=new Set([As,Ts,Es]),p=new Set([Dt,un,Hi,Wi,ys,bs]),M=new Uint32Array(4),T=new Int32Array(4);let E=null,R=null;const C=[],P=[];let _=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=on,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const y=this;let W=!1;this._outputColorSpace=Wt;let A=0,B=0,V=null,X=-1,O=null;const G=new ot,U=new ot;let Q=null;const Z=new Qe(0);let ce=0,pe=t.width,ue=t.height,Ce=1,at=null,rt=null;const $=new ot(0,0,pe,ue),ne=new ot(0,0,pe,ue);let ae=!1;const Le=new wl;let Ae=!1,Re=!1;const xt=new mt,He=new z,$e=new ot,et={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Fe=!1;function lt(){return V===null?Ce:1}let w=n;function ht(x,L){return t.getContext(x,L)}try{const x={alpha:!0,depth:i,stencil:a,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Ss}`),t.addEventListener("webglcontextlost",ve,!1),t.addEventListener("webglcontextrestored",Pe,!1),t.addEventListener("webglcontextcreationerror",it,!1),w===null){const L="webgl2";if(w=ht(L,x),w===null)throw ht(L)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(x){throw Ye("WebGLRenderer: "+x.message),x}let qe,nt,Se,b,v,I,q,K,Y,me,ie,Ee,we,j,ee,ge,_e,de,Oe,D,re,te,fe;function J(){qe=new Bf(w),qe.init(),re=new Cm(w,qe),nt=new Pf(w,qe,e,re),Se=new Am(w,qe),nt.reversedDepthBuffer&&d&&Se.buffers.depth.setReversed(!0),b=new kf(w),v=new hm,I=new wm(w,qe,Se,v,nt,re,b),q=new Of(y),K=new Xu(w),te=new Cf(w,K),Y=new zf(w,K,b,te),me=new Hf(w,Y,K,te,b),de=new Gf(w,nt,I),ee=new Df(v),ie=new dm(y,q,qe,nt,te,ee),Ee=new Um(y,v),we=new pm,j=new Sm(qe),_e=new wf(y,q,Se,me,g,l),ge=new Tm(y,me,nt),fe=new Nm(w,b,nt,Se),Oe=new Rf(w,qe,b),D=new Vf(w,qe,b),b.programs=ie.programs,y.capabilities=nt,y.extensions=qe,y.properties=v,y.renderLists=we,y.shadowMap=ge,y.state=Se,y.info=b}J(),S!==Dt&&(_=new Xf(S,t.width,t.height,i,a));const H=new Im(y,w);this.xr=H,this.getContext=function(){return w},this.getContextAttributes=function(){return w.getContextAttributes()},this.forceContextLoss=function(){const x=qe.get("WEBGL_lose_context");x&&x.loseContext()},this.forceContextRestore=function(){const x=qe.get("WEBGL_lose_context");x&&x.restoreContext()},this.getPixelRatio=function(){return Ce},this.setPixelRatio=function(x){x!==void 0&&(Ce=x,this.setSize(pe,ue,!1))},this.getSize=function(x){return x.set(pe,ue)},this.setSize=function(x,L,k=!0){if(H.isPresenting){De("WebGLRenderer: Can't change size while VR device is presenting.");return}pe=x,ue=L,t.width=Math.floor(x*Ce),t.height=Math.floor(L*Ce),k===!0&&(t.style.width=x+"px",t.style.height=L+"px"),_!==null&&_.setSize(t.width,t.height),this.setViewport(0,0,x,L)},this.getDrawingBufferSize=function(x){return x.set(pe*Ce,ue*Ce).floor()},this.setDrawingBufferSize=function(x,L,k){pe=x,ue=L,Ce=k,t.width=Math.floor(x*k),t.height=Math.floor(L*k),this.setViewport(0,0,x,L)},this.setEffects=function(x){if(S===Dt){console.error("THREE.WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(x){for(let L=0;L<x.length;L++)if(x[L].isOutputPass===!0){console.warn("THREE.WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}_.setEffects(x||[])},this.getCurrentViewport=function(x){return x.copy(G)},this.getViewport=function(x){return x.copy($)},this.setViewport=function(x,L,k,F){x.isVector4?$.set(x.x,x.y,x.z,x.w):$.set(x,L,k,F),Se.viewport(G.copy($).multiplyScalar(Ce).round())},this.getScissor=function(x){return x.copy(ne)},this.setScissor=function(x,L,k,F){x.isVector4?ne.set(x.x,x.y,x.z,x.w):ne.set(x,L,k,F),Se.scissor(U.copy(ne).multiplyScalar(Ce).round())},this.getScissorTest=function(){return ae},this.setScissorTest=function(x){Se.setScissorTest(ae=x)},this.setOpaqueSort=function(x){at=x},this.setTransparentSort=function(x){rt=x},this.getClearColor=function(x){return x.copy(_e.getClearColor())},this.setClearColor=function(){_e.setClearColor(...arguments)},this.getClearAlpha=function(){return _e.getClearAlpha()},this.setClearAlpha=function(){_e.setClearAlpha(...arguments)},this.clear=function(x=!0,L=!0,k=!0){let F=0;if(x){let N=!1;if(V!==null){const oe=V.texture.format;N=f.has(oe)}if(N){const oe=V.texture.type,he=p.has(oe),le=_e.getClearColor(),xe=_e.getClearAlpha(),ye=le.r,Ie=le.g,Be=le.b;he?(M[0]=ye,M[1]=Ie,M[2]=Be,M[3]=xe,w.clearBufferuiv(w.COLOR,0,M)):(T[0]=ye,T[1]=Ie,T[2]=Be,T[3]=xe,w.clearBufferiv(w.COLOR,0,T))}else F|=w.COLOR_BUFFER_BIT}L&&(F|=w.DEPTH_BUFFER_BIT),k&&(F|=w.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),F!==0&&w.clear(F)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",ve,!1),t.removeEventListener("webglcontextrestored",Pe,!1),t.removeEventListener("webglcontextcreationerror",it,!1),_e.dispose(),we.dispose(),j.dispose(),v.dispose(),q.dispose(),me.dispose(),te.dispose(),fe.dispose(),ie.dispose(),H.dispose(),H.removeEventListener("sessionstart",Ns),H.removeEventListener("sessionend",Fs),kn.stop()};function ve(x){x.preventDefault(),lo("WebGLRenderer: Context Lost."),W=!0}function Pe(){lo("WebGLRenderer: Context Restored."),W=!1;const x=b.autoReset,L=ge.enabled,k=ge.autoUpdate,F=ge.needsUpdate,N=ge.type;J(),b.autoReset=x,ge.enabled=L,ge.autoUpdate=k,ge.needsUpdate=F,ge.type=N}function it(x){Ye("WebGLRenderer: A WebGL context could not be created. Reason: ",x.statusMessage)}function Ke(x){const L=x.target;L.removeEventListener("dispose",Ke),dn(L)}function dn(x){hn(x),v.remove(x)}function hn(x){const L=v.get(x).programs;L!==void 0&&(L.forEach(function(k){ie.releaseProgram(k)}),x.isShaderMaterial&&ie.releaseShaderCache(x))}this.renderBufferDirect=function(x,L,k,F,N,oe){L===null&&(L=et);const he=N.isMesh&&N.matrixWorld.determinant()<0,le=Hl(x,L,k,F,N);Se.setMaterial(F,he);let xe=k.index,ye=1;if(F.wireframe===!0){if(xe=Y.getWireframeAttribute(k),xe===void 0)return;ye=2}const Ie=k.drawRange,Be=k.attributes.position;let be=Ie.start*ye,je=(Ie.start+Ie.count)*ye;oe!==null&&(be=Math.max(be,oe.start*ye),je=Math.min(je,(oe.start+oe.count)*ye)),xe!==null?(be=Math.max(be,0),je=Math.min(je,xe.count)):Be!=null&&(be=Math.max(be,0),je=Math.min(je,Be.count));const ct=je-be;if(ct<0||ct===1/0)return;te.setup(N,F,le,k,xe);let st,Je=Oe;if(xe!==null&&(st=K.get(xe),Je=D,Je.setIndex(st)),N.isMesh)F.wireframe===!0?(Se.setLineWidth(F.wireframeLinewidth*lt()),Je.setMode(w.LINES)):Je.setMode(w.TRIANGLES);else if(N.isLine){let bt=F.linewidth;bt===void 0&&(bt=1),Se.setLineWidth(bt*lt()),N.isLineSegments?Je.setMode(w.LINES):N.isLineLoop?Je.setMode(w.LINE_LOOP):Je.setMode(w.LINE_STRIP)}else N.isPoints?Je.setMode(w.POINTS):N.isSprite&&Je.setMode(w.TRIANGLES);if(N.isBatchedMesh)if(N._multiDrawInstances!==null)Nr("WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),Je.renderMultiDrawInstances(N._multiDrawStarts,N._multiDrawCounts,N._multiDrawCount,N._multiDrawInstances);else if(qe.get("WEBGL_multi_draw"))Je.renderMultiDraw(N._multiDrawStarts,N._multiDrawCounts,N._multiDrawCount);else{const bt=N._multiDrawStarts,Me=N._multiDrawCounts,Nt=N._multiDrawCount,Xe=xe?K.get(xe).bytesPerElement:1,qt=v.get(F).currentProgram.getUniforms();for(let Qt=0;Qt<Nt;Qt++)qt.setValue(w,"_gl_DrawID",Qt),Je.render(bt[Qt]/Xe,Me[Qt])}else if(N.isInstancedMesh)Je.renderInstances(be,ct,N.count);else if(k.isInstancedBufferGeometry){const bt=k._maxInstanceCount!==void 0?k._maxInstanceCount:1/0,Me=Math.min(k.instanceCount,bt);Je.renderInstances(be,ct,Me)}else Je.render(be,ct)};function Us(x,L,k){x.transparent===!0&&x.side===_n&&x.forceSinglePass===!1?(x.side=Lt,x.needsUpdate=!0,Zi(x,L,k),x.side=Vn,x.needsUpdate=!0,Zi(x,L,k),x.side=_n):Zi(x,L,k)}this.compile=function(x,L,k=null){k===null&&(k=x),R=j.get(k),R.init(L),P.push(R),k.traverseVisible(function(N){N.isLight&&N.layers.test(L.layers)&&(R.pushLight(N),N.castShadow&&R.pushShadow(N))}),x!==k&&x.traverseVisible(function(N){N.isLight&&N.layers.test(L.layers)&&(R.pushLight(N),N.castShadow&&R.pushShadow(N))}),R.setupLights();const F=new Set;return x.traverse(function(N){if(!(N.isMesh||N.isPoints||N.isLine||N.isSprite))return;const oe=N.material;if(oe)if(Array.isArray(oe))for(let he=0;he<oe.length;he++){const le=oe[he];Us(le,k,N),F.add(le)}else Us(oe,k,N),F.add(oe)}),R=P.pop(),F},this.compileAsync=function(x,L,k=null){const F=this.compile(x,L,k);return new Promise(N=>{function oe(){if(F.forEach(function(he){v.get(he).currentProgram.isReady()&&F.delete(he)}),F.size===0){N(x);return}setTimeout(oe,10)}qe.get("KHR_parallel_shader_compile")!==null?oe():setTimeout(oe,10)})};let Gr=null;function Gl(x){Gr&&Gr(x)}function Ns(){kn.stop()}function Fs(){kn.start()}const kn=new Il;kn.setAnimationLoop(Gl),typeof self<"u"&&kn.setContext(self),this.setAnimationLoop=function(x){Gr=x,H.setAnimationLoop(x),x===null?kn.stop():kn.start()},H.addEventListener("sessionstart",Ns),H.addEventListener("sessionend",Fs),this.render=function(x,L){if(L!==void 0&&L.isCamera!==!0){Ye("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(W===!0)return;const k=H.enabled===!0&&H.isPresenting===!0,F=_!==null&&(V===null||k)&&_.begin(y,V);if(x.matrixWorldAutoUpdate===!0&&x.updateMatrixWorld(),L.parent===null&&L.matrixWorldAutoUpdate===!0&&L.updateMatrixWorld(),H.enabled===!0&&H.isPresenting===!0&&(_===null||_.isCompositing()===!1)&&(H.cameraAutoUpdate===!0&&H.updateCamera(L),L=H.getCamera()),x.isScene===!0&&x.onBeforeRender(y,x,L,V),R=j.get(x,P.length),R.init(L),P.push(R),xt.multiplyMatrices(L.projectionMatrix,L.matrixWorldInverse),Le.setFromProjectionMatrix(xt,sn,L.reversedDepth),Re=this.localClippingEnabled,Ae=ee.init(this.clippingPlanes,Re),E=we.get(x,C.length),E.init(),C.push(E),H.enabled===!0&&H.isPresenting===!0){const he=y.xr.getDepthSensingMesh();he!==null&&Hr(he,L,-1/0,y.sortObjects)}Hr(x,L,0,y.sortObjects),E.finish(),y.sortObjects===!0&&E.sort(at,rt),Fe=H.enabled===!1||H.isPresenting===!1||H.hasDepthSensing()===!1,Fe&&_e.addToRenderList(E,x),this.info.render.frame++,Ae===!0&&ee.beginShadows();const N=R.state.shadowsArray;if(ge.render(N,x,L),Ae===!0&&ee.endShadows(),this.info.autoReset===!0&&this.info.reset(),(F&&_.hasRenderPass())===!1){const he=E.opaque,le=E.transmissive;if(R.setupLights(),L.isArrayCamera){const xe=L.cameras;if(le.length>0)for(let ye=0,Ie=xe.length;ye<Ie;ye++){const Be=xe[ye];Bs(he,le,x,Be)}Fe&&_e.render(x);for(let ye=0,Ie=xe.length;ye<Ie;ye++){const Be=xe[ye];Os(E,x,Be,Be.viewport)}}else le.length>0&&Bs(he,le,x,L),Fe&&_e.render(x),Os(E,x,L)}V!==null&&B===0&&(I.updateMultisampleRenderTarget(V),I.updateRenderTargetMipmap(V)),F&&_.end(y),x.isScene===!0&&x.onAfterRender(y,x,L),te.resetDefaultState(),X=-1,O=null,P.pop(),P.length>0?(R=P[P.length-1],Ae===!0&&ee.setGlobalState(y.clippingPlanes,R.state.camera)):R=null,C.pop(),C.length>0?E=C[C.length-1]:E=null};function Hr(x,L,k,F){if(x.visible===!1)return;if(x.layers.test(L.layers)){if(x.isGroup)k=x.renderOrder;else if(x.isLOD)x.autoUpdate===!0&&x.update(L);else if(x.isLight)R.pushLight(x),x.castShadow&&R.pushShadow(x);else if(x.isSprite){if(!x.frustumCulled||Le.intersectsSprite(x)){F&&$e.setFromMatrixPosition(x.matrixWorld).applyMatrix4(xt);const he=me.update(x),le=x.material;le.visible&&E.push(x,he,le,k,$e.z,null)}}else if((x.isMesh||x.isLine||x.isPoints)&&(!x.frustumCulled||Le.intersectsObject(x))){const he=me.update(x),le=x.material;if(F&&(x.boundingSphere!==void 0?(x.boundingSphere===null&&x.computeBoundingSphere(),$e.copy(x.boundingSphere.center)):(he.boundingSphere===null&&he.computeBoundingSphere(),$e.copy(he.boundingSphere.center)),$e.applyMatrix4(x.matrixWorld).applyMatrix4(xt)),Array.isArray(le)){const xe=he.groups;for(let ye=0,Ie=xe.length;ye<Ie;ye++){const Be=xe[ye],be=le[Be.materialIndex];be&&be.visible&&E.push(x,he,be,k,$e.z,Be)}}else le.visible&&E.push(x,he,le,k,$e.z,null)}}const oe=x.children;for(let he=0,le=oe.length;he<le;he++)Hr(oe[he],L,k,F)}function Os(x,L,k,F){const{opaque:N,transmissive:oe,transparent:he}=x;R.setupLightsView(k),Ae===!0&&ee.setGlobalState(y.clippingPlanes,k),F&&Se.viewport(G.copy(F)),N.length>0&&Ki(N,L,k),oe.length>0&&Ki(oe,L,k),he.length>0&&Ki(he,L,k),Se.buffers.depth.setTest(!0),Se.buffers.depth.setMask(!0),Se.buffers.color.setMask(!0),Se.setPolygonOffset(!1)}function Bs(x,L,k,F){if((k.isScene===!0?k.overrideMaterial:null)!==null)return;if(R.state.transmissionRenderTarget[F.id]===void 0){const be=qe.has("EXT_color_buffer_half_float")||qe.has("EXT_color_buffer_float");R.state.transmissionRenderTarget[F.id]=new ln(1,1,{generateMipmaps:!0,type:be?bn:Dt,minFilter:Qn,samples:Math.max(4,nt.samples),stencilBuffer:a,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:We.workingColorSpace})}const oe=R.state.transmissionRenderTarget[F.id],he=F.viewport||G;oe.setSize(he.z*y.transmissionResolutionScale,he.w*y.transmissionResolutionScale);const le=y.getRenderTarget(),xe=y.getActiveCubeFace(),ye=y.getActiveMipmapLevel();y.setRenderTarget(oe),y.getClearColor(Z),ce=y.getClearAlpha(),ce<1&&y.setClearColor(16777215,.5),y.clear(),Fe&&_e.render(k);const Ie=y.toneMapping;y.toneMapping=on;const Be=F.viewport;if(F.viewport!==void 0&&(F.viewport=void 0),R.setupLightsView(F),Ae===!0&&ee.setGlobalState(y.clippingPlanes,F),Ki(x,k,F),I.updateMultisampleRenderTarget(oe),I.updateRenderTargetMipmap(oe),qe.has("WEBGL_multisampled_render_to_texture")===!1){let be=!1;for(let je=0,ct=L.length;je<ct;je++){const st=L[je],{object:Je,geometry:bt,material:Me,group:Nt}=st;if(Me.side===_n&&Je.layers.test(F.layers)){const Xe=Me.side;Me.side=Lt,Me.needsUpdate=!0,zs(Je,k,F,bt,Me,Nt),Me.side=Xe,Me.needsUpdate=!0,be=!0}}be===!0&&(I.updateMultisampleRenderTarget(oe),I.updateRenderTargetMipmap(oe))}y.setRenderTarget(le,xe,ye),y.setClearColor(Z,ce),Be!==void 0&&(F.viewport=Be),y.toneMapping=Ie}function Ki(x,L,k){const F=L.isScene===!0?L.overrideMaterial:null;for(let N=0,oe=x.length;N<oe;N++){const he=x[N],{object:le,geometry:xe,group:ye}=he;let Ie=he.material;Ie.allowOverride===!0&&F!==null&&(Ie=F),le.layers.test(k.layers)&&zs(le,L,k,xe,Ie,ye)}}function zs(x,L,k,F,N,oe){x.onBeforeRender(y,L,k,F,N,oe),x.modelViewMatrix.multiplyMatrices(k.matrixWorldInverse,x.matrixWorld),x.normalMatrix.getNormalMatrix(x.modelViewMatrix),N.onBeforeRender(y,L,k,F,x,oe),N.transparent===!0&&N.side===_n&&N.forceSinglePass===!1?(N.side=Lt,N.needsUpdate=!0,y.renderBufferDirect(k,L,F,N,x,oe),N.side=Vn,N.needsUpdate=!0,y.renderBufferDirect(k,L,F,N,x,oe),N.side=_n):y.renderBufferDirect(k,L,F,N,x,oe),x.onAfterRender(y,L,k,F,N,oe)}function Zi(x,L,k){L.isScene!==!0&&(L=et);const F=v.get(x),N=R.state.lights,oe=R.state.shadowsArray,he=N.state.version,le=ie.getParameters(x,N.state,oe,L,k),xe=ie.getProgramCacheKey(le);let ye=F.programs;F.environment=x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial?L.environment:null,F.fog=L.fog;const Ie=x.isMeshStandardMaterial||x.isMeshLambertMaterial&&!x.envMap||x.isMeshPhongMaterial&&!x.envMap;F.envMap=q.get(x.envMap||F.environment,Ie),F.envMapRotation=F.environment!==null&&x.envMap===null?L.environmentRotation:x.envMapRotation,ye===void 0&&(x.addEventListener("dispose",Ke),ye=new Map,F.programs=ye);let Be=ye.get(xe);if(Be!==void 0){if(F.currentProgram===Be&&F.lightsStateVersion===he)return ks(x,le),Be}else le.uniforms=ie.getUniforms(x),x.onBeforeCompile(le,y),Be=ie.acquireProgram(le,xe),ye.set(xe,Be),F.uniforms=le.uniforms;const be=F.uniforms;return(!x.isShaderMaterial&&!x.isRawShaderMaterial||x.clipping===!0)&&(be.clippingPlanes=ee.uniform),ks(x,le),F.needsLights=Xl(x),F.lightsStateVersion=he,F.needsLights&&(be.ambientLightColor.value=N.state.ambient,be.lightProbe.value=N.state.probe,be.directionalLights.value=N.state.directional,be.directionalLightShadows.value=N.state.directionalShadow,be.spotLights.value=N.state.spot,be.spotLightShadows.value=N.state.spotShadow,be.rectAreaLights.value=N.state.rectArea,be.ltc_1.value=N.state.rectAreaLTC1,be.ltc_2.value=N.state.rectAreaLTC2,be.pointLights.value=N.state.point,be.pointLightShadows.value=N.state.pointShadow,be.hemisphereLights.value=N.state.hemi,be.directionalShadowMatrix.value=N.state.directionalShadowMatrix,be.spotLightMatrix.value=N.state.spotLightMatrix,be.spotLightMap.value=N.state.spotLightMap,be.pointShadowMatrix.value=N.state.pointShadowMatrix),F.currentProgram=Be,F.uniformsList=null,Be}function Vs(x){if(x.uniformsList===null){const L=x.currentProgram.getUniforms();x.uniformsList=Dr.seqWithValue(L.seq,x.uniforms)}return x.uniformsList}function ks(x,L){const k=v.get(x);k.outputColorSpace=L.outputColorSpace,k.batching=L.batching,k.batchingColor=L.batchingColor,k.instancing=L.instancing,k.instancingColor=L.instancingColor,k.instancingMorph=L.instancingMorph,k.skinning=L.skinning,k.morphTargets=L.morphTargets,k.morphNormals=L.morphNormals,k.morphColors=L.morphColors,k.morphTargetsCount=L.morphTargetsCount,k.numClippingPlanes=L.numClippingPlanes,k.numIntersection=L.numClipIntersection,k.vertexAlphas=L.vertexAlphas,k.vertexTangents=L.vertexTangents,k.toneMapping=L.toneMapping}function Hl(x,L,k,F,N){L.isScene!==!0&&(L=et),I.resetTextureUnits();const oe=L.fog,he=F.isMeshStandardMaterial||F.isMeshLambertMaterial||F.isMeshPhongMaterial?L.environment:null,le=V===null?y.outputColorSpace:V.isXRRenderTarget===!0?V.texture.colorSpace:Ci,xe=F.isMeshStandardMaterial||F.isMeshLambertMaterial&&!F.envMap||F.isMeshPhongMaterial&&!F.envMap,ye=q.get(F.envMap||he,xe),Ie=F.vertexColors===!0&&!!k.attributes.color&&k.attributes.color.itemSize===4,Be=!!k.attributes.tangent&&(!!F.normalMap||F.anisotropy>0),be=!!k.morphAttributes.position,je=!!k.morphAttributes.normal,ct=!!k.morphAttributes.color;let st=on;F.toneMapped&&(V===null||V.isXRRenderTarget===!0)&&(st=y.toneMapping);const Je=k.morphAttributes.position||k.morphAttributes.normal||k.morphAttributes.color,bt=Je!==void 0?Je.length:0,Me=v.get(F),Nt=R.state.lights;if(Ae===!0&&(Re===!0||x!==O)){const St=x===O&&F.id===X;ee.setState(F,x,St)}let Xe=!1;F.version===Me.__version?(Me.needsLights&&Me.lightsStateVersion!==Nt.state.version||Me.outputColorSpace!==le||N.isBatchedMesh&&Me.batching===!1||!N.isBatchedMesh&&Me.batching===!0||N.isBatchedMesh&&Me.batchingColor===!0&&N.colorTexture===null||N.isBatchedMesh&&Me.batchingColor===!1&&N.colorTexture!==null||N.isInstancedMesh&&Me.instancing===!1||!N.isInstancedMesh&&Me.instancing===!0||N.isSkinnedMesh&&Me.skinning===!1||!N.isSkinnedMesh&&Me.skinning===!0||N.isInstancedMesh&&Me.instancingColor===!0&&N.instanceColor===null||N.isInstancedMesh&&Me.instancingColor===!1&&N.instanceColor!==null||N.isInstancedMesh&&Me.instancingMorph===!0&&N.morphTexture===null||N.isInstancedMesh&&Me.instancingMorph===!1&&N.morphTexture!==null||Me.envMap!==ye||F.fog===!0&&Me.fog!==oe||Me.numClippingPlanes!==void 0&&(Me.numClippingPlanes!==ee.numPlanes||Me.numIntersection!==ee.numIntersection)||Me.vertexAlphas!==Ie||Me.vertexTangents!==Be||Me.morphTargets!==be||Me.morphNormals!==je||Me.morphColors!==ct||Me.toneMapping!==st||Me.morphTargetsCount!==bt)&&(Xe=!0):(Xe=!0,Me.__version=F.version);let qt=Me.currentProgram;Xe===!0&&(qt=Zi(F,L,N));let Qt=!1,Gn=!1,ri=!1;const tt=qt.getUniforms(),yt=Me.uniforms;if(Se.useProgram(qt.program)&&(Qt=!0,Gn=!0,ri=!0),F.id!==X&&(X=F.id,Gn=!0),Qt||O!==x){Se.buffers.depth.getReversed()&&x.reversedDepth!==!0&&(x._reversedDepth=!0,x.updateProjectionMatrix()),tt.setValue(w,"projectionMatrix",x.projectionMatrix),tt.setValue(w,"viewMatrix",x.matrixWorldInverse);const Rn=tt.map.cameraPosition;Rn!==void 0&&Rn.setValue(w,He.setFromMatrixPosition(x.matrixWorld)),nt.logarithmicDepthBuffer&&tt.setValue(w,"logDepthBufFC",2/(Math.log(x.far+1)/Math.LN2)),(F.isMeshPhongMaterial||F.isMeshToonMaterial||F.isMeshLambertMaterial||F.isMeshBasicMaterial||F.isMeshStandardMaterial||F.isShaderMaterial)&&tt.setValue(w,"isOrthographic",x.isOrthographicCamera===!0),O!==x&&(O=x,Gn=!0,ri=!0)}if(Me.needsLights&&(Nt.state.directionalShadowMap.length>0&&tt.setValue(w,"directionalShadowMap",Nt.state.directionalShadowMap,I),Nt.state.spotShadowMap.length>0&&tt.setValue(w,"spotShadowMap",Nt.state.spotShadowMap,I),Nt.state.pointShadowMap.length>0&&tt.setValue(w,"pointShadowMap",Nt.state.pointShadowMap,I)),N.isSkinnedMesh){tt.setOptional(w,N,"bindMatrix"),tt.setOptional(w,N,"bindMatrixInverse");const St=N.skeleton;St&&(St.boneTexture===null&&St.computeBoneTexture(),tt.setValue(w,"boneTexture",St.boneTexture,I))}N.isBatchedMesh&&(tt.setOptional(w,N,"batchingTexture"),tt.setValue(w,"batchingTexture",N._matricesTexture,I),tt.setOptional(w,N,"batchingIdTexture"),tt.setValue(w,"batchingIdTexture",N._indirectTexture,I),tt.setOptional(w,N,"batchingColorTexture"),N._colorsTexture!==null&&tt.setValue(w,"batchingColorTexture",N._colorsTexture,I));const Cn=k.morphAttributes;if((Cn.position!==void 0||Cn.normal!==void 0||Cn.color!==void 0)&&de.update(N,k,qt),(Gn||Me.receiveShadow!==N.receiveShadow)&&(Me.receiveShadow=N.receiveShadow,tt.setValue(w,"receiveShadow",N.receiveShadow)),(F.isMeshStandardMaterial||F.isMeshLambertMaterial||F.isMeshPhongMaterial)&&F.envMap===null&&L.environment!==null&&(yt.envMapIntensity.value=L.environmentIntensity),yt.dfgLUT!==void 0&&(yt.dfgLUT.value=Om()),Gn&&(tt.setValue(w,"toneMappingExposure",y.toneMappingExposure),Me.needsLights&&Wl(yt,ri),oe&&F.fog===!0&&Ee.refreshFogUniforms(yt,oe),Ee.refreshMaterialUniforms(yt,F,Ce,ue,R.state.transmissionRenderTarget[x.id]),Dr.upload(w,Vs(Me),yt,I)),F.isShaderMaterial&&F.uniformsNeedUpdate===!0&&(Dr.upload(w,Vs(Me),yt,I),F.uniformsNeedUpdate=!1),F.isSpriteMaterial&&tt.setValue(w,"center",N.center),tt.setValue(w,"modelViewMatrix",N.modelViewMatrix),tt.setValue(w,"normalMatrix",N.normalMatrix),tt.setValue(w,"modelMatrix",N.matrixWorld),F.isShaderMaterial||F.isRawShaderMaterial){const St=F.uniformsGroups;for(let Rn=0,ai=St.length;Rn<ai;Rn++){const Gs=St[Rn];fe.update(Gs,qt),fe.bind(Gs,qt)}}return qt}function Wl(x,L){x.ambientLightColor.needsUpdate=L,x.lightProbe.needsUpdate=L,x.directionalLights.needsUpdate=L,x.directionalLightShadows.needsUpdate=L,x.pointLights.needsUpdate=L,x.pointLightShadows.needsUpdate=L,x.spotLights.needsUpdate=L,x.spotLightShadows.needsUpdate=L,x.rectAreaLights.needsUpdate=L,x.hemisphereLights.needsUpdate=L}function Xl(x){return x.isMeshLambertMaterial||x.isMeshToonMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isShadowMaterial||x.isShaderMaterial&&x.lights===!0}this.getActiveCubeFace=function(){return A},this.getActiveMipmapLevel=function(){return B},this.getRenderTarget=function(){return V},this.setRenderTargetTextures=function(x,L,k){const F=v.get(x);F.__autoAllocateDepthBuffer=x.resolveDepthBuffer===!1,F.__autoAllocateDepthBuffer===!1&&(F.__useRenderToTexture=!1),v.get(x.texture).__webglTexture=L,v.get(x.depthTexture).__webglTexture=F.__autoAllocateDepthBuffer?void 0:k,F.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(x,L){const k=v.get(x);k.__webglFramebuffer=L,k.__useDefaultFramebuffer=L===void 0};const Yl=w.createFramebuffer();this.setRenderTarget=function(x,L=0,k=0){V=x,A=L,B=k;let F=null,N=!1,oe=!1;if(x){const le=v.get(x);if(le.__useDefaultFramebuffer!==void 0){Se.bindFramebuffer(w.FRAMEBUFFER,le.__webglFramebuffer),G.copy(x.viewport),U.copy(x.scissor),Q=x.scissorTest,Se.viewport(G),Se.scissor(U),Se.setScissorTest(Q),X=-1;return}else if(le.__webglFramebuffer===void 0)I.setupRenderTarget(x);else if(le.__hasExternalTextures)I.rebindTextures(x,v.get(x.texture).__webglTexture,v.get(x.depthTexture).__webglTexture);else if(x.depthBuffer){const Ie=x.depthTexture;if(le.__boundDepthTexture!==Ie){if(Ie!==null&&v.has(Ie)&&(x.width!==Ie.image.width||x.height!==Ie.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");I.setupDepthRenderbuffer(x)}}const xe=x.texture;(xe.isData3DTexture||xe.isDataArrayTexture||xe.isCompressedArrayTexture)&&(oe=!0);const ye=v.get(x).__webglFramebuffer;x.isWebGLCubeRenderTarget?(Array.isArray(ye[L])?F=ye[L][k]:F=ye[L],N=!0):x.samples>0&&I.useMultisampledRTT(x)===!1?F=v.get(x).__webglMultisampledFramebuffer:Array.isArray(ye)?F=ye[k]:F=ye,G.copy(x.viewport),U.copy(x.scissor),Q=x.scissorTest}else G.copy($).multiplyScalar(Ce).floor(),U.copy(ne).multiplyScalar(Ce).floor(),Q=ae;if(k!==0&&(F=Yl),Se.bindFramebuffer(w.FRAMEBUFFER,F)&&Se.drawBuffers(x,F),Se.viewport(G),Se.scissor(U),Se.setScissorTest(Q),N){const le=v.get(x.texture);w.framebufferTexture2D(w.FRAMEBUFFER,w.COLOR_ATTACHMENT0,w.TEXTURE_CUBE_MAP_POSITIVE_X+L,le.__webglTexture,k)}else if(oe){const le=L;for(let xe=0;xe<x.textures.length;xe++){const ye=v.get(x.textures[xe]);w.framebufferTextureLayer(w.FRAMEBUFFER,w.COLOR_ATTACHMENT0+xe,ye.__webglTexture,k,le)}}else if(x!==null&&k!==0){const le=v.get(x.texture);w.framebufferTexture2D(w.FRAMEBUFFER,w.COLOR_ATTACHMENT0,w.TEXTURE_2D,le.__webglTexture,k)}X=-1},this.readRenderTargetPixels=function(x,L,k,F,N,oe,he,le=0){if(!(x&&x.isWebGLRenderTarget)){Ye("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let xe=v.get(x).__webglFramebuffer;if(x.isWebGLCubeRenderTarget&&he!==void 0&&(xe=xe[he]),xe){Se.bindFramebuffer(w.FRAMEBUFFER,xe);try{const ye=x.textures[le],Ie=ye.format,Be=ye.type;if(x.textures.length>1&&w.readBuffer(w.COLOR_ATTACHMENT0+le),!nt.textureFormatReadable(Ie)){Ye("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!nt.textureTypeReadable(Be)){Ye("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}L>=0&&L<=x.width-F&&k>=0&&k<=x.height-N&&w.readPixels(L,k,F,N,re.convert(Ie),re.convert(Be),oe)}finally{const ye=V!==null?v.get(V).__webglFramebuffer:null;Se.bindFramebuffer(w.FRAMEBUFFER,ye)}}},this.readRenderTargetPixelsAsync=async function(x,L,k,F,N,oe,he,le=0){if(!(x&&x.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let xe=v.get(x).__webglFramebuffer;if(x.isWebGLCubeRenderTarget&&he!==void 0&&(xe=xe[he]),xe)if(L>=0&&L<=x.width-F&&k>=0&&k<=x.height-N){Se.bindFramebuffer(w.FRAMEBUFFER,xe);const ye=x.textures[le],Ie=ye.format,Be=ye.type;if(x.textures.length>1&&w.readBuffer(w.COLOR_ATTACHMENT0+le),!nt.textureFormatReadable(Ie))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!nt.textureTypeReadable(Be))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const be=w.createBuffer();w.bindBuffer(w.PIXEL_PACK_BUFFER,be),w.bufferData(w.PIXEL_PACK_BUFFER,oe.byteLength,w.STREAM_READ),w.readPixels(L,k,F,N,re.convert(Ie),re.convert(Be),0);const je=V!==null?v.get(V).__webglFramebuffer:null;Se.bindFramebuffer(w.FRAMEBUFFER,je);const ct=w.fenceSync(w.SYNC_GPU_COMMANDS_COMPLETE,0);return w.flush(),await cu(w,ct,4),w.bindBuffer(w.PIXEL_PACK_BUFFER,be),w.getBufferSubData(w.PIXEL_PACK_BUFFER,0,oe),w.deleteBuffer(be),w.deleteSync(ct),oe}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(x,L=null,k=0){const F=Math.pow(2,-k),N=Math.floor(x.image.width*F),oe=Math.floor(x.image.height*F),he=L!==null?L.x:0,le=L!==null?L.y:0;I.setTexture2D(x,0),w.copyTexSubImage2D(w.TEXTURE_2D,k,0,0,he,le,N,oe),Se.unbindTexture()};const ql=w.createFramebuffer(),$l=w.createFramebuffer();this.copyTextureToTexture=function(x,L,k=null,F=null,N=0,oe=0){let he,le,xe,ye,Ie,Be,be,je,ct;const st=x.isCompressedTexture?x.mipmaps[oe]:x.image;if(k!==null)he=k.max.x-k.min.x,le=k.max.y-k.min.y,xe=k.isBox3?k.max.z-k.min.z:1,ye=k.min.x,Ie=k.min.y,Be=k.isBox3?k.min.z:0;else{const yt=Math.pow(2,-N);he=Math.floor(st.width*yt),le=Math.floor(st.height*yt),x.isDataArrayTexture?xe=st.depth:x.isData3DTexture?xe=Math.floor(st.depth*yt):xe=1,ye=0,Ie=0,Be=0}F!==null?(be=F.x,je=F.y,ct=F.z):(be=0,je=0,ct=0);const Je=re.convert(L.format),bt=re.convert(L.type);let Me;L.isData3DTexture?(I.setTexture3D(L,0),Me=w.TEXTURE_3D):L.isDataArrayTexture||L.isCompressedArrayTexture?(I.setTexture2DArray(L,0),Me=w.TEXTURE_2D_ARRAY):(I.setTexture2D(L,0),Me=w.TEXTURE_2D),w.pixelStorei(w.UNPACK_FLIP_Y_WEBGL,L.flipY),w.pixelStorei(w.UNPACK_PREMULTIPLY_ALPHA_WEBGL,L.premultiplyAlpha),w.pixelStorei(w.UNPACK_ALIGNMENT,L.unpackAlignment);const Nt=w.getParameter(w.UNPACK_ROW_LENGTH),Xe=w.getParameter(w.UNPACK_IMAGE_HEIGHT),qt=w.getParameter(w.UNPACK_SKIP_PIXELS),Qt=w.getParameter(w.UNPACK_SKIP_ROWS),Gn=w.getParameter(w.UNPACK_SKIP_IMAGES);w.pixelStorei(w.UNPACK_ROW_LENGTH,st.width),w.pixelStorei(w.UNPACK_IMAGE_HEIGHT,st.height),w.pixelStorei(w.UNPACK_SKIP_PIXELS,ye),w.pixelStorei(w.UNPACK_SKIP_ROWS,Ie),w.pixelStorei(w.UNPACK_SKIP_IMAGES,Be);const ri=x.isDataArrayTexture||x.isData3DTexture,tt=L.isDataArrayTexture||L.isData3DTexture;if(x.isDepthTexture){const yt=v.get(x),Cn=v.get(L),St=v.get(yt.__renderTarget),Rn=v.get(Cn.__renderTarget);Se.bindFramebuffer(w.READ_FRAMEBUFFER,St.__webglFramebuffer),Se.bindFramebuffer(w.DRAW_FRAMEBUFFER,Rn.__webglFramebuffer);for(let ai=0;ai<xe;ai++)ri&&(w.framebufferTextureLayer(w.READ_FRAMEBUFFER,w.COLOR_ATTACHMENT0,v.get(x).__webglTexture,N,Be+ai),w.framebufferTextureLayer(w.DRAW_FRAMEBUFFER,w.COLOR_ATTACHMENT0,v.get(L).__webglTexture,oe,ct+ai)),w.blitFramebuffer(ye,Ie,he,le,be,je,he,le,w.DEPTH_BUFFER_BIT,w.NEAREST);Se.bindFramebuffer(w.READ_FRAMEBUFFER,null),Se.bindFramebuffer(w.DRAW_FRAMEBUFFER,null)}else if(N!==0||x.isRenderTargetTexture||v.has(x)){const yt=v.get(x),Cn=v.get(L);Se.bindFramebuffer(w.READ_FRAMEBUFFER,ql),Se.bindFramebuffer(w.DRAW_FRAMEBUFFER,$l);for(let St=0;St<xe;St++)ri?w.framebufferTextureLayer(w.READ_FRAMEBUFFER,w.COLOR_ATTACHMENT0,yt.__webglTexture,N,Be+St):w.framebufferTexture2D(w.READ_FRAMEBUFFER,w.COLOR_ATTACHMENT0,w.TEXTURE_2D,yt.__webglTexture,N),tt?w.framebufferTextureLayer(w.DRAW_FRAMEBUFFER,w.COLOR_ATTACHMENT0,Cn.__webglTexture,oe,ct+St):w.framebufferTexture2D(w.DRAW_FRAMEBUFFER,w.COLOR_ATTACHMENT0,w.TEXTURE_2D,Cn.__webglTexture,oe),N!==0?w.blitFramebuffer(ye,Ie,he,le,be,je,he,le,w.COLOR_BUFFER_BIT,w.NEAREST):tt?w.copyTexSubImage3D(Me,oe,be,je,ct+St,ye,Ie,he,le):w.copyTexSubImage2D(Me,oe,be,je,ye,Ie,he,le);Se.bindFramebuffer(w.READ_FRAMEBUFFER,null),Se.bindFramebuffer(w.DRAW_FRAMEBUFFER,null)}else tt?x.isDataTexture||x.isData3DTexture?w.texSubImage3D(Me,oe,be,je,ct,he,le,xe,Je,bt,st.data):L.isCompressedArrayTexture?w.compressedTexSubImage3D(Me,oe,be,je,ct,he,le,xe,Je,st.data):w.texSubImage3D(Me,oe,be,je,ct,he,le,xe,Je,bt,st):x.isDataTexture?w.texSubImage2D(w.TEXTURE_2D,oe,be,je,he,le,Je,bt,st.data):x.isCompressedTexture?w.compressedTexSubImage2D(w.TEXTURE_2D,oe,be,je,st.width,st.height,Je,st.data):w.texSubImage2D(w.TEXTURE_2D,oe,be,je,he,le,Je,bt,st);w.pixelStorei(w.UNPACK_ROW_LENGTH,Nt),w.pixelStorei(w.UNPACK_IMAGE_HEIGHT,Xe),w.pixelStorei(w.UNPACK_SKIP_PIXELS,qt),w.pixelStorei(w.UNPACK_SKIP_ROWS,Qt),w.pixelStorei(w.UNPACK_SKIP_IMAGES,Gn),oe===0&&L.generateMipmaps&&w.generateMipmap(Me),Se.unbindTexture()},this.initRenderTarget=function(x){v.get(x).__webglFramebuffer===void 0&&I.setupRenderTarget(x)},this.initTexture=function(x){x.isCubeTexture?I.setTextureCube(x,0):x.isData3DTexture?I.setTexture3D(x,0):x.isDataArrayTexture||x.isCompressedArrayTexture?I.setTexture2DArray(x,0):I.setTexture2D(x,0),Se.unbindTexture()},this.resetState=function(){A=0,B=0,V=null,Se.reset(),te.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return sn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=We._getDrawingBufferColorSpace(e),t.unpackColorSpace=We._getUnpackColorSpace()}}function gt(){return Math.random()>.5?Math.random()*10:Math.random()*100}function Te(r,e,t,n=1){return new ot(r,e,t,n)}function zl(r,e){return Te(Math.min(1,Math.max(0,r.x+e)),Math.min(1,Math.max(0,r.y+e*.8)),Math.min(1,Math.max(0,r.z+e*.6)),r.w)}function ti(r){const e=r.length,t=new Uint8Array(e*4);for(let i=0;i<e;i++){const a=r[i];t[i*4]=Math.round(a[0]*255),t[i*4+1]=Math.round(a[1]*255),t[i*4+2]=Math.round(a[2]*255),t[i*4+3]=Math.round(a[3]*255)}const n=new Ds(t,e,1,zt,Dt);return n.magFilter=ut,n.minFilter=ut,n.needsUpdate=!0,n}function dt(r,e,t=1,n=1){const i=new ii(t,n),a=new Gt({uniforms:e,vertexShader:Bm,fragmentShader:r,transparent:!0});return{mesh:new Yt(i,a),mat:a}}const Bm=`
varying vec3 vUv;
void main() {
  vUv = position;
  vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * modelViewPosition;
}`,kr=`
varying vec3 vUv;
uniform float lightIntensity;
uniform float pixels;
uniform float rotation;
uniform vec2 light_origin;
uniform float time_speed;
float dither_size = 2.0;
float light_border_1 = 0.4;
float light_border_2 = 0.6;
uniform vec4 color1;
uniform vec4 color2;
uniform vec4 color3;
float size = 10.0;
int OCTAVES = 20;
uniform float seed;
uniform float time;
bool should_dither = true;

float rand(vec2 coord) {
  coord = mod(coord, vec2(1.0,1.0)*floor(size+0.5));
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}
bool dither(vec2 uv1, vec2 uv2) {
  return mod(uv1.x+uv2.y,2.0/max(pixels,1.0)) <= 1.0 / max(pixels,1.0);
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float d_circle = distance(uv, vec2(0.5));
  float d_light = distance(uv, vec2(light_origin));
  float a = step(d_circle, 0.49999);
  bool dith = dither(uv, vUv.xy);
  uv = rotate(uv, rotation);
  float fbm1 = fbm(uv);
  d_light += fbm(uv*size+fbm1+vec2(time*0.1+time_speed, 0.0))*lightIntensity;
  float dither_border = (1.0/max(pixels,1.0))*dither_size;
  vec4 col = color1;
  if (d_light > light_border_1) {
    col = color2;
    if (d_light < light_border_1 + dither_border && (dith || !should_dither)) {
      col = color1;
    }
  }
  if (d_light > light_border_2) {
    col = color3;
    if (d_light < light_border_2 + dither_border && (dith || !should_dither)) {
      col = color2;
    }
  }
  gl_FragColor = vec4(col.rgb, a * col.a);
}`,zm=`
varying vec3 vUv;
uniform float lightIntensity;
uniform float pixels;
uniform float rotation;
uniform vec2 light_origin;
uniform float time_speed;
uniform float land_cutoff;
float dither_size = 2.0;
float light_border_1 = 0.4;
float light_border_2 = 0.6;
uniform vec4 col1;
uniform vec4 col2;
uniform vec4 col3;
uniform vec4 col4;
float size = 10.0;
int OCTAVES = 6;
uniform float seed;
uniform float time;

float rand(vec2 coord) {
  coord = mod(coord, vec2(1.0,1.0)*floor(size+0.5));
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float d_light = distance(uv, light_origin);
  float d_circle = distance(uv, vec2(0.5));
  float a = step(d_circle, 0.49999);
  uv = rotate(uv, rotation);
  uv = spherify(uv);
  vec2 base_fbm_uv = uv * size + vec2(time*time_speed, 0.0);
  float fbm1 = fbm(base_fbm_uv);
  float fbm2 = fbm(base_fbm_uv - light_origin*fbm1);
  float fbm3 = fbm(base_fbm_uv - light_origin*1.5*fbm1);
  float fbm4 = fbm(base_fbm_uv - light_origin*2.0*fbm1);
  if (d_light < light_border_1) { fbm4 *= 0.9; }
  if (d_light > light_border_1) { fbm2 *= 1.05; fbm3 *= 1.05; fbm4 *= 1.05; }
  if (d_light > light_border_2) { fbm2 *= 1.3; fbm3 *= 1.4; fbm4 *= 1.8; }
  d_light = pow(d_light, 2.0)*0.1;
  vec4 col = col4;
  if (fbm4 + d_light < fbm1) { col = col3; }
  if (fbm3 + d_light < fbm1) { col = col2; }
  if (fbm2 + d_light < fbm1) { col = col1; }
  gl_FragColor = vec4(col.rgb, step(land_cutoff, fbm1) * a * col.a);
}`,Vm=`
varying vec3 vUv;
uniform float pixels;
uniform float rotation;
uniform vec2 light_origin;
uniform float time_speed;
float light_border_1 = 0.4;
float light_border_2 = 0.6;
uniform float river_cutoff;
uniform vec4 color1;
uniform vec4 color2;
uniform vec4 color3;
float size = 10.0;
int OCTAVES = 5;
uniform float seed;
uniform float time;

float rand(vec2 coord) {
  coord = mod(coord, vec2(2.0,1.0)*floor(size+0.5));
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float d_light = distance(uv, light_origin);
  float d_circle = distance(uv, vec2(0.5));
  float a = step(d_circle, 0.49999);
  uv = rotate(uv, rotation);
  uv = spherify(uv);
  float fbm1 = fbm(uv*size+vec2(time*time_speed,0.0));
  float river_fbm = fbm(uv + fbm1*2.5);
  river_fbm = step(river_cutoff, river_fbm);
  vec4 col = color1;
  if (d_light > light_border_1) { col = color2; }
  if (d_light > light_border_2) { col = color3; }
  a *= step(river_cutoff, river_fbm);
  gl_FragColor = vec4(col.rgb, a * col.a);
}`,Vl=`
varying vec3 vUv;
uniform float pixels;
uniform float rotation;
uniform vec2 light_origin;
uniform float time_speed;
float dither_size = 2.0;
float light_border = 0.4;
uniform vec4 color1;
uniform vec4 color2;
float size = 5.0;
int OCTAVES = 20;
uniform float seed;
uniform float time;
bool should_dither = true;

float rand(vec2 coord) {
  coord = mod(coord, vec2(1.0,1.0)*floor(size+0.5));
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float circleNoise(vec2 uv) {
  float uv_y = floor(uv.y);
  uv.x += uv_y*.31;
  vec2 f = fract(uv);
  float h = rand(vec2(floor(uv.x),floor(uv_y)));
  float m = (length(f-0.25-(h*0.5)));
  float r = h*0.25;
  return m = smoothstep(r-.10*r,r,m);
}
float crater(vec2 uv) {
  float c = 1.0;
  for (int i = 0; i < 2; i++) {
    c *= circleNoise((uv * size) + (float(i+1)+10.) + vec2((time*0.1)+time_speed,0.0));
  }
  return 1.0 - c;
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float d_circle = distance(uv, vec2(0.5));
  float d_light = distance(uv, vec2(light_origin));
  float a = step(d_circle, 0.49999);
  uv = rotate(uv, rotation);
  uv = spherify(uv);
  float c1 = crater(uv);
  float c2 = crater(uv + (light_origin-0.5)*0.04);
  vec4 col = color1;
  a *= step(0.5, c1);
  if (c2 < c1-(0.5-d_light)*2.0) { col = color2; }
  if (d_light > light_border) { col = color2; }
  a *= step(d_circle, 0.5);
  gl_FragColor = vec4(col.rgb, a * col.a);
}`,kl=`
varying vec3 vUv;
uniform float pixels;
uniform float rotation;
uniform float cloud_cover;
uniform vec2 light_origin;
uniform float time_speed;
uniform float stretch;
float cloud_curve = 1.3;
float light_border_1 = 0.4;
float light_border_2 = 0.6;
uniform vec4 base_color;
uniform vec4 outline_color;
uniform vec4 shadow_base_color;
uniform vec4 shadow_outline_color;
float size = 4.0;
int OCTAVES = 4;
uniform float seed;
uniform float time;

float rand(vec2 coord) {
  coord = mod(coord, vec2(1.0,1.0)*floor(size+0.5));
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}
float circleNoise(vec2 uv) {
  float uv_y = floor(uv.y);
  uv.x += uv_y*.31;
  vec2 f = fract(uv);
  float h = rand(vec2(floor(uv.x),floor(uv_y)));
  float m = (length(f-0.25-(h*0.5)));
  float r = h*0.25;
  return smoothstep(0.0, r, m*0.75);
}
float cloud_alpha(vec2 uv) {
  float c_noise = 0.0;
  for (int i = 0; i < 9; i++) {
    c_noise += circleNoise((uv * size * 0.3) + (float(i+1)+10.) + (vec2(time*time_speed, 0.0)));
  }
  float f = fbm(uv*size+c_noise + vec2(time*time_speed, 0.0));
  return f;
}
bool dither(vec2 uv_pixel, vec2 uv_real) {
  return mod(uv_pixel.x+uv_real.y,2.0/max(pixels,1.0)) <= 1.0 / max(pixels,1.0);
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float d_light = distance(uv, light_origin);
  float d_circle = distance(uv, vec2(0.5));
  float a = step(d_circle, 0.5);
  float d_to_center = distance(uv, vec2(0.5));
  uv = rotate(uv, rotation);
  uv = spherify(uv);
  uv.y += smoothstep(0.0, cloud_curve, abs(uv.x-0.4));
  float c = cloud_alpha(uv*vec2(1.0, stretch));
  vec4 col = base_color;
  if (c < cloud_cover + 0.03) { col = outline_color; }
  if (d_light + c*0.2 > light_border_1) { col = shadow_base_color; }
  if (d_light + c*0.2 > light_border_2) { col = shadow_outline_color; }
  c *= step(d_to_center, 0.5);
  gl_FragColor = vec4(col.rgb, step(cloud_cover, c) * a * col.a);
}`,km=`
varying vec3 vUv;
uniform vec4 color;
uniform vec4 color2;
uniform vec4 color3;
float pixels = 50.0;

float dist(vec2 p0, vec2 pf){
  return sqrt((pf.x-p0.x)*(pf.x-p0.x)+(pf.y-p0.y)*(pf.y-p0.y));
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  vec2 pos_ndc = 2.0 * uv.xy - 1.0;
  float d = length(pos_ndc);
  float step0 = 0.65;
  float step1 = 0.87;
  float step2 = 0.97;
  float step3 = 1.04;
  float step4 = 1.04;
  vec4 c = mix(vec4(0,0,0,0), color, smoothstep(step0, step1, d));
  c = mix(c, color2, smoothstep(step1, step2, d));
  c = mix(c, color3, smoothstep(step2, step3, d));
  c = mix(c, vec4(0,0,0,0), smoothstep(step3, step4, d));
  gl_FragColor = c;
}`,Gm=`
varying vec3 vUv;
uniform float lightIntensity;
uniform float pixels;
uniform float rotation;
uniform vec2 light_origin;
uniform float time_speed;
float light_border_1 = 0.4;
float light_border_2 = 0.6;
uniform float lake_cutoff;
uniform vec4 color1;
uniform vec4 color2;
uniform vec4 color3;
float size = 10.0;
int OCTAVES = 4;
uniform float seed;
uniform float time;

float rand(vec2 coord) {
  coord = mod(coord, vec2(2.0,1.0)*floor(size+0.5));
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}
bool dither(vec2 uv1, vec2 uv2) {
  return mod(uv1.x+uv2.y,2.0/max(pixels,1.0)) <= 1.0 / max(pixels,1.0);
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float d_light = distance(uv, vec2(light_origin));
  uv = rotate(uv, rotation);
  uv = spherify(uv);
  float lake = fbm(uv*size+vec2(time*time_speed,0.0));
  vec4 col = color1;
  if (d_light > light_border_1) { col = color2; }
  if (d_light > light_border_2) { col = color3; }
  float a = step(lake_cutoff, lake);
  a *= step(distance(vec2(0.5), uv), 0.5);
  gl_FragColor = vec4(col.rgb, a * col.a);
}`,Zo=`
varying vec3 vUv;
uniform float pixels;
uniform float cloud_cover;
uniform vec2 light_origin;
uniform float time_speed;
uniform float stretch;
uniform float cloud_curve;
float light_border_1 = 0.4;
float light_border_2 = 0.6;
uniform float rotation;
uniform vec4 base_color;
uniform vec4 outline_color;
uniform vec4 shadow_base_color;
uniform vec4 shadow_outline_color;
float size = 9.0;
int OCTAVES = 5;
uniform float seed;
uniform float time;

float rand(vec2 coord) {
  coord = mod(coord, vec2(1.0,1.0)*floor(size+0.5));
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float circleNoise(vec2 uv) {
  float uv_y = floor(uv.y);
  uv.x += uv_y*.31;
  vec2 f = fract(uv);
  float h = rand(vec2(floor(uv.x),floor(uv_y)));
  float m = (length(f-0.25-(h*0.5)));
  float r = h*0.25;
  return smoothstep(0.0, r, m*0.75);
}
float fbm(vec2 coord){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}
float cloud_alpha(vec2 uv) {
  float c_noise = 0.0;
  for (int i = 0; i < 9; i++) {
    c_noise += circleNoise((uv * size * 0.3) + (float(i+1)+10.) + (vec2(time*time_speed, 0.0)));
  }
  float f = fbm(uv*size+c_noise + vec2(time*time_speed, 0.0));
  return f;
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float d_light = distance(uv, light_origin);
  float d_circle = distance(uv, vec2(0.5));
  float a = step(d_circle, 0.49999);
  uv = rotate(uv, rotation);
  uv = spherify(uv);
  uv.y += smoothstep(0.0, cloud_curve, abs(uv.x-0.4));
  float c = cloud_alpha(uv*vec2(1.0, stretch));
  vec4 col = base_color;
  if (c < cloud_cover + 0.03) { col = outline_color; }
  if (d_light + c*0.2 > light_border_1) { col = shadow_base_color; }
  if (d_light + c*0.2 > light_border_2) { col = shadow_outline_color; }
  gl_FragColor = vec4(col.rgb, step(cloud_cover, c) * a * col.a);
}`,Hm=`
varying vec3 vUv;
uniform float pixels;
uniform float rotation;
uniform vec2 light_origin;
uniform float time_speed;
uniform float cloud_cover;
float stretch = 2.0;
float cloud_curve = 1.3;
float light_border_1 = 0.4;
float light_border_2 = 0.6;
float bands = 1.0;
bool should_dither = true;
uniform sampler2D colorscheme;
uniform sampler2D dark_colorscheme;
float size = 15.0;
int OCTAVES = 6;
uniform float seed;
uniform float time;

float rand(vec2 coord) {
  coord = mod(coord, vec2(2.0,1.0)*floor(size+0.5));
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}
float circleNoise(vec2 uv) {
  float uv_y = floor(uv.y);
  uv.x += uv_y*.31;
  vec2 f = fract(uv);
  float h = rand(vec2(floor(uv.x),floor(uv_y)));
  float m = (length(f-0.25-(h*0.5)));
  float r = h*0.25;
  return smoothstep(0.0, r, m*0.75);
}
float turbulence(vec2 uv) {
  float c_noise = 0.0;
  for (int i = 0; i < 10; i++) {
    c_noise += circleNoise((uv * size * 0.3) + (float(i+1)+10.) + (vec2(time * time_speed, 0.0)));
  }
  return c_noise;
}
bool dither(vec2 uv_pixel, vec2 uv_real) {
  return mod(uv_pixel.x+uv_real.y,2.0/max(pixels,1.0)) <= 1.0 / max(pixels,1.0);
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float light_d = distance(uv, light_origin);
  bool dith = dither(uv, vUv.xy);
  float a = step(length(uv-vec2(0.5)), 0.49999);
  uv = rotate(uv, rotation);
  uv = spherify(uv);
  float band = fbm(vec2(0.0, uv.y*size*bands));
  float turb = turbulence(uv);
  float fbm1 = fbm(uv*size);
  float fbm2 = fbm(uv*vec2(1.0, 2.0)*size+fbm1+vec2(-time*time_speed,0.0)+turb);
  fbm2 *= pow(band,2.0)*7.0;
  float light = fbm2 + light_d*1.8;
  fbm2 += pow(light_d, 1.0)-0.3;
  fbm2 = smoothstep(-0.2, 4.0-fbm2, light);
  if (dith && should_dither) { fbm2 *= 1.1; }
  float posterized = floor(fbm2*4.0)/2.0;
  vec4 col;
  if (fbm2 < 0.625) {
    col = texture2D(colorscheme, vec2(posterized, uv.y));
  } else {
    col = texture2D(dark_colorscheme, vec2(posterized-1.0, uv.y));
  }
  gl_FragColor = vec4(col.rgb, a * col.a);
}`,Wm=`
varying vec3 vUv;
uniform float pixels;
uniform float rotation;
uniform vec2 light_origin;
uniform float time_speed;
float light_border_1 = 0.4;
float light_border_2 = 0.6;
uniform float ring_width;
uniform float ring_perspective;
uniform float scale_rel_to_planet;
uniform sampler2D colorscheme;
uniform sampler2D dark_colorscheme;
float size = 25.0;
int OCTAVES = 8;
uniform float seed;
uniform float time;

float rand(vec2 coord) {
  coord = mod(coord, vec2(2.0,1.0)*floor(size+0.5));
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}
float circleNoise(vec2 uv) {
  float uv_y = floor(uv.y);
  uv.x += uv_y*.31;
  vec2 f = fract(uv);
  float h = rand(vec2(floor(uv.x),floor(uv_y)));
  float m = (length(f-0.25-(h*0.5)));
  float r = h*0.25;
  return smoothstep(0.0, r, m*0.75);
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float light_d = distance(uv, light_origin);
  uv = rotate(uv, rotation);
  vec2 uv_center = uv - vec2(0.0, 0.5);
  uv_center *= vec2(1.0, ring_perspective);
  float center_d = distance(uv_center, vec2(0.5, 0.0));
  float ring = smoothstep(0.5-ring_width*2.0, 0.5-ring_width, center_d);
  ring *= smoothstep(center_d-ring_width, center_d, 0.4);
  if (uv.y < 0.5) {
    ring *= step(1.0/scale_rel_to_planet, distance(uv, vec2(0.5)));
  }
  uv_center = rotate(uv_center+vec2(0, 0.5), time*time_speed);
  ring *= fbm(uv_center*size);
  float posterized = floor((ring+pow(light_d, 2.0)*2.0)*4.0)/4.0;
  vec4 col;
  if (posterized <= 1.0) {
    col = texture2D(colorscheme, vec2(posterized, uv.y));
  } else {
    col = texture2D(dark_colorscheme, vec2(posterized-1.0, uv.y));
  }
  float ring_a = step(0.28, ring);
  gl_FragColor = vec4(col.rgb, ring_a * col.a);
}`,Xm=`
varying vec3 vUv;
uniform float pixels;
uniform float time_speed;
uniform float time;
uniform float rotation;
uniform sampler2D colorramp;
bool should_dither = true;
uniform float seed;
float size = 15.0;
int OCTAVES = 5;
float TILES = 2.0;

float rand(vec2 co) {
  co = mod(co, vec2(1.0,1.0)*floor(size+0.5));
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
vec2 rotate(vec2 vec, float angle) {
  vec -= vec2(0.5);
  vec *= mat2(vec2(cos(angle),-sin(angle)), vec2(sin(angle),cos(angle)));
  vec += vec2(0.5);
  return vec;
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
vec2 Hash2(vec2 p) {
  float r = 523.0*sin(dot(p, vec2(53.3158, 43.6143)));
  return vec2(fract(15.32354 * r), fract(17.25865 * r));
}
float cells(in vec2 p, in float numCells) {
  p *= numCells;
  float d = 1.0e10;
  for (int xo = -1; xo <= 1; xo++) {
    for (int yo = -1; yo <= 1; yo++) {
      vec2 tp = floor(p) + vec2(float(xo), float(yo));
      tp = p - tp - Hash2(mod(tp, numCells / TILES));
      d = min(d, dot(tp, tp));
    }
  }
  return sqrt(d);
}
bool dither(vec2 uv1, vec2 uv2) {
  return mod(uv1.x+uv2.y,2.0/max(pixels,1.0)) <= 1.0 / max(pixels,1.0);
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
void main() {
  vec2 pixelized = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float a = step(distance(pixelized, vec2(0.5)), .49999);
  bool dith = dither(vUv.xy, pixelized);
  pixelized = rotate(pixelized, rotation);
  pixelized = spherify(pixelized);
  float n = cells(pixelized - vec2(time * time_speed * 2.0, 0), 10.0);
  n *= cells(pixelized - vec2(time * time_speed * 1.0, 0), 20.0);
  n *= 2.;
  n = clamp(n, 0.0, 1.0);
  if (dith || !should_dither) { n *= 1.3; }
  float interpolate = floor(n * 3.0) / 3.0;
  vec4 col = texture2D(colorramp, vec2(interpolate, 0.0));
  gl_FragColor = vec4(col.rgb, a * col.a);
}`,Ym=`
varying vec3 vUv;
uniform float pixels;
uniform float time_speed;
uniform float time;
uniform float rotation;
uniform vec4 color;
bool should_dither = true;
uniform float circle_amount;
uniform float circle_size;
uniform float scale;
uniform float seed;
float size = 4.0;
int OCTAVES = 4;
float TILES = 1.0;

float rand(vec2 co){
  co = mod(co, vec2(1.0,1.0)*floor(size+0.5));
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
vec2 rotate(vec2 vec, float angle) {
  vec -= vec2(0.5);
  vec *= mat2(vec2(cos(angle),-sin(angle)), vec2(sin(angle),cos(angle)));
  vec += vec2(0.5);
  return vec;
}
float circle(vec2 uv) {
  float invert = 1.0 / circle_amount;
  if (mod(uv.y, invert*2.0) < invert) { uv.x += invert*0.5; }
  vec2 rand_co = floor(uv*circle_amount)/circle_amount;
  uv = mod(uv, invert)*circle_amount;
  float r = rand(rand_co);
  r = clamp(r, invert, 1.0 - invert);
  float c = distance(uv, vec2(r));
  return smoothstep(c, c+0.5, invert * circle_size * rand(rand_co*1.5));
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scl = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scl;
    coord *= 2.0;
    scl *= 0.5;
  }
  return value;
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
void main() {
  vec2 pixelized = (floor(vUv.xy*pixels)/pixels) + 0.5;
  vec2 uv = rotate(pixelized, rotation);
  float angle = atan(uv.x - 0.5, uv.y - 0.5);
  float d = distance(pixelized, vec2(0.5));
  float c = 0.0;
  for(int i = 0; i < 15; i++) {
    float r = rand(vec2(float(i)));
    vec2 circleUV = vec2(d, angle);
    c += circle(circleUV*size - time * time_speed - (1.0/max(d, 0.001)) * 0.1 + r);
  }
  c *= 0.37 - d;
  c = step(0.07, c - d);
  gl_FragColor = vec4(color.rgb, c * color.a);
}`,qm=`
varying vec3 vUv;
uniform float pixels;
uniform float time_speed;
uniform float time;
uniform float rotation;
uniform sampler2D colorramp;
bool should_dither = true;
uniform float storm_width;
uniform float storm_dither_width;
uniform float circle_amount;
uniform float circle_scale;
uniform float scale;
uniform float seed;
float size = 2.0;
int OCTAVES = 4;
float TILES = 1.0;

float rand(vec2 co){
  co = mod(co, vec2(1.0,1.0)*floor(size+0.5));
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
vec2 rotate(vec2 vec, float angle) {
  vec -= vec2(0.5);
  vec *= mat2(vec2(cos(angle),-sin(angle)), vec2(sin(angle),cos(angle)));
  vec += vec2(0.5);
  return vec;
}
float circle(vec2 uv) {
  float invert = 1.0 / circle_amount;
  if (mod(uv.y, invert*2.0) < invert) { uv.x += invert*0.5; }
  vec2 rand_co = floor(uv*circle_amount)/circle_amount;
  uv = mod(uv, invert)*circle_amount;
  float r = rand(rand_co);
  r = clamp(r, invert, 1.0 - invert);
  float c = distance(uv, vec2(r));
  return smoothstep(c, c+0.5, invert * circle_scale * rand(rand_co*1.5));
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scl = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scl;
    coord *= 2.0;
    scl *= 0.5;
  }
  return value;
}
bool dither(vec2 uv1, vec2 uv2) {
  return mod(uv1.x+uv2.y,2.0/max(pixels,1.0)) <= 1.0 / max(pixels,1.0);
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
void main() {
  vec2 pixelized = (floor(vUv.xy*pixels)/pixels) + 0.5;
  bool dith = dither(vUv.xy, pixelized);
  pixelized = rotate(pixelized, rotation);
  vec2 uv = pixelized;
  float angle = atan(uv.x - 0.5, uv.y - 0.5) * 0.4;
  float d = distance(pixelized, vec2(0.5));
  vec2 circleUV = vec2(d, angle);
  float n = fbm(circleUV*size - time * time_speed);
  float nc = circle(circleUV*scale - time * time_speed + n);
  nc *= 1.5;
  float n2 = fbm(circleUV*size - time + vec2(100, 100));
  nc -= n2 * 0.1;
  float a = 0.0;
  if (1.0 - d > nc) {
    if (nc > storm_width - storm_dither_width + d && (dith || !should_dither)) { a = 1.0; }
    else if (nc > storm_width + d) { a = 1.0; }
  }
  float interpolate = floor(n2 + nc);
  vec4 col = texture2D(colorramp, vec2(interpolate, 0.0));
  a *= step(n2 * 0.25, d);
  gl_FragColor = vec4(col.rgb, a * col.a);
}`,$m=`
varying vec3 vUv;
uniform float pixels;
uniform float rotation;
uniform vec2 light_origin;
uniform vec4 color1;
uniform vec4 color2;
uniform vec4 color3;
uniform float size;
int OCTAVES = 4;
uniform float seed;
uniform float time;
bool should_dither = true;

float rand(vec2 coord) {
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}
bool dither(vec2 uv1, vec2 uv2) {
  return mod(uv1.x+uv2.y,2.0/max(pixels,1.0)) <= 1.0 / max(pixels,1.0);
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
float circleNoise(vec2 uv) {
  float uv_y = floor(uv.y);
  uv.x += uv_y*.31;
  vec2 f = fract(uv);
  float h = rand(vec2(floor(uv.x),floor(uv_y)));
  float m = (length(f-0.25-(h*0.5)));
  float r = h*0.25;
  return m = smoothstep(r-.10*r,r,m);
}
float crater(vec2 uv) {
  float c = 1.0;
  for (int i = 0; i < 2; i++) {
    c *= circleNoise((uv * size) + (float(i+1)+10.));
  }
  return 1.0 - c;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  bool dith = dither(uv, vUv.xy);
  float d = distance(uv, vec2(0.5));
  uv = rotate(uv, time*0.1);
  float n = fbm(uv * size);
  float n2 = fbm(uv * size + (rotate(light_origin, rotation)-0.5) * 0.5);
  float n_step = step(0.2, n - d);
  float n2_step = step(0.2, n2 - d);
  float noise_rel = (n2_step + n2) - (n_step + n);
  float c1 = crater(uv);
  float c2 = crater(uv + (light_origin-0.5)*0.03);
  vec4 col = color2;
  if (noise_rel < -0.06 || (noise_rel < -0.04 && (dith || !should_dither))) { col = color1; }
  if (noise_rel > 0.05 || (noise_rel > 0.03 && (dith || !should_dither))) { col = color3; }
  if (c1 > 0.4) { col = color2; }
  if (c2 < c1) { col = color3; }
  gl_FragColor = vec4(col.rgb, n_step * col.a);
}`,Km=`
varying vec3 vUv;
uniform float pixels;
uniform float rotation;
uniform vec2 light_origin;
float light_distance1 = 0.362;
float light_distance2 = 0.525;
uniform float time_speed;
float dither_size = 2.0;
uniform sampler2D colors;
float size = 10.0;
int OCTAVES = 4;
uniform float seed;
uniform float time;
bool should_dither = true;

float rand(vec2 coord) {
  coord = mod(coord, vec2(1.0,1.0)*floor(size+0.5));
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
}
float noise(vec2 coord){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i);
  float b = rand(i + vec2(1.0, 0.0));
  float c = rand(i + vec2(0.0, 1.0));
  float d = rand(i + vec2(1.0, 1.0));
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}
float fbm(vec2 coord){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}
bool dither(vec2 uv1, vec2 uv2) {
  return mod(uv1.x+uv2.y,2.0/max(pixels,1.0)) <= 1.0 / max(pixels,1.0);
}
vec2 rotate(vec2 coord, float angle){
  coord -= 0.5;
  coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
  return coord + 0.5;
}
vec2 spherify(vec2 uv) {
  vec2 centered = uv * 2.0 - 1.0;
  float z = sqrt(max(0.0, 1.0 - dot(centered.xy, centered.xy)));
  vec2 sphere = centered / (z + 1.0);
  return sphere * 0.5 + 0.5;
}
void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  bool dith = dither(uv, vUv.xy);
  float d_circle = distance(uv, vec2(0.5));
  float a = step(d_circle, 0.49999);
  uv = spherify(uv);
  float d_light = distance(uv, vec2(light_origin));
  uv = rotate(uv, rotation);
  float f = fbm(uv*size+vec2(time*time_speed, 0.0));
  d_light = smoothstep(-0.3, 1.2, d_light);
  if (d_light < light_distance1) { d_light *= 0.9; }
  if (d_light < light_distance2) { d_light *= 0.9; }
  float c = d_light*pow(f,0.8)*3.5;
  if (dith || !should_dither) { c += 0.02; c *= 1.05; }
  float posterize = floor(c*4.0)/4.0;
  vec4 col = texture2D(colors, vec2(posterize, 0.0));
  gl_FragColor = vec4(col.rgb, a * col.a);
}`,wn={noatmosphere:{base:[Te(155/255,158/255,184/255),Te(71/255,97/255,124/255),Te(53/255,57/255,85/255)],crater:[Te(71/255,97/255,124/255),Te(53/255,57/255,85/255)]},earth:{base:[Te(102/255,176/255,199/255),Te(102/255,176/255,199/255),Te(52/255,65/255,157/255)],land:[Te(.784314,.831373,.364706),Te(.388235,.670588,.247059),Te(.184314,.341176,.32549),Te(.156863,.207843,.25098)],cloud:[Te(.882353,.94902,1),Te(.752941,.890196,1),Te(.368627,.439216,.647059),Te(.25098,.286275,.45098)],atmosphere:[Te(173/255,216/255,230/255,.25),Te(0,127/255,1,.35),Te(0,0,128/255,.45)]},ice:{base:[Te(250/255,1,1),Te(199/255,212/255,1),Te(146/255,143/255,184/255)],lake:[Te(79/255,164/255,184/255),Te(76/255,104/255,133/255),Te(58/255,63/255,94/255)],cloud:[Te(.882353,.94902,1),Te(.752941,.890196,1),Te(.368627,.439216,.647059),Te(.25098,.286275,.45098)]},lava:{base:[Te(.560784,.301961,.341176),Te(.321569,.2,.247059),Te(.239216,.160784,.211765)],crater:[Te(.321569,.2,.247059),Te(.239216,.160784,.211765)],river:[Te(1,.537255,.2),Te(.901961,.270588,.223529),Te(.678431,.184314,.270588)]},gasgiant:{base:[Te(.941176,.709804,.254902),Te(.811765,.458824,.168627),Te(.670588,.317647,.188235),Te(.490196,.219608,.2)],gas:[Te(.231373,.12549,.152941),Te(.231373,.12549,.152941),Te(.129412,.0941176,.105882),Te(.129412,.0941176,.105882)]},gasgiantring:{colorScheme1:[.94,.71,.25,1],colorScheme1_2:[.81,.46,.17,1],colorScheme1_3:[.67,.32,.19,1],colorScheme1_4:[.49,.22,.2,1],colorScheme2:[.49,.22,.2,1],colorScheme2_2:[.35,.15,.12,1],colorScheme2_3:[.23,.1,.08,1],colorScheme2_4:[.15,.06,.05,1]},star:{ramp:[[.95,.65,.2,1],[.9,.4,.1,1],[.7,.25,.08,1],[.5,.15,.08,1]],blobColor:Te(1,165/255,0)},asteroid:{colors:[Te(155/255,158/255,184/255),Te(71/255,97/255,124/255),Te(53/255,57/255,85/255)]},dry:{ramp:[[.79,.65,.36,1],[.66,.46,.24,1],[.56,.34,.18,1],[.38,.22,.12,1]]}};function Ut(r,e){return r.map(t=>zl(t,e))}function jo(r,e,t){const n=new ke(.39,.7),i=wn.noatmosphere,a=Ut(i.base,r),s=Ut(i.crater,r),o=[],l=new Vt,c=dt(kr,{pixels:{value:e},color1:{value:a[0]},color2:{value:a[1]},color3:{value:a[2]},lightIntensity:{value:.1},light_origin:{value:n},time_speed:{value:.1},rotation:{value:t},seed:{value:gt()},time:{value:0}});o.push(c.mat),l.add(c.mesh);const u=dt(Vl,{pixels:{value:e},color1:{value:s[0]},color2:{value:s[1]},light_origin:{value:n},time_speed:{value:.1},rotation:{value:t},seed:{value:gt()},time:{value:0}});u.mesh.position.z=.01,o.push(u.mat),l.add(u.mesh);const h=a[2];return{group:l,materials:o,textures:[],dominantColor:[h.x,h.y,h.z,h.w]}}function Zm(r,e,t){const n=new ke(.39,.7),i=wn.earth,a=Ut(i.base,r),s=Ut(i.land,r),o=Ut(i.cloud,r),l=[],c=new Vt,u=dt(kr,{pixels:{value:e},color1:{value:a[0]},color2:{value:a[1]},color3:{value:a[2]},lightIntensity:{value:.1},light_origin:{value:n},time_speed:{value:.1},rotation:{value:t},seed:{value:gt()},time:{value:0}});l.push(u.mat),c.add(u.mesh);const h=dt(zm,{pixels:{value:e},land_cutoff:{value:.5},col1:{value:s[0]},col2:{value:s[1]},col3:{value:s[2]},col4:{value:s[3]},lightIntensity:{value:.1},light_origin:{value:n},time_speed:{value:.1},rotation:{value:t},seed:{value:gt()},time:{value:0}});h.mesh.position.z=.01,l.push(h.mat),c.add(h.mesh);const d=dt(kl,{pixels:{value:e},light_origin:{value:n},seed:{value:gt()},time_speed:{value:.1},base_color:{value:o[0]},outline_color:{value:o[1]},shadow_base_color:{value:o[2]},shadow_outline_color:{value:o[3]},cloud_cover:{value:.546},rotation:{value:t},stretch:{value:2.5},time:{value:0}});d.mesh.position.z=.02,l.push(d.mat),c.add(d.mesh);const m=dt(km,{color:{value:i.atmosphere[0]},color2:{value:i.atmosphere[1]},color3:{value:i.atmosphere[2]}},1.02,1.02);m.mesh.position.z=.03,l.push(m.mat),c.add(m.mesh);const g=s[1];return{group:c,materials:l,textures:[],dominantColor:[g.x,g.y,g.z,g.w]}}function jm(r,e,t){const n=new ke(.39,.7),i=wn.ice,a=Ut(i.base,r),s=Ut(i.lake,r),o=Ut(i.cloud,r),l=[],c=new Vt,u=dt(kr,{pixels:{value:e},color1:{value:a[0]},color2:{value:a[1]},color3:{value:a[2]},lightIntensity:{value:.1},light_origin:{value:n},time_speed:{value:.1},rotation:{value:t},seed:{value:gt()},time:{value:0}});l.push(u.mat),c.add(u.mesh);const h=dt(Gm,{pixels:{value:e},light_origin:{value:n},seed:{value:gt()},time_speed:{value:.1},lake_cutoff:{value:.6},rotation:{value:t},color1:{value:s[0]},color2:{value:s[1]},color3:{value:s[2]},time:{value:0}});h.mesh.position.z=.01,l.push(h.mat),c.add(h.mesh);const d=dt(kl,{pixels:{value:e},light_origin:{value:n},seed:{value:gt()},time_speed:{value:.1},base_color:{value:o[0]},outline_color:{value:o[1]},shadow_base_color:{value:o[2]},shadow_outline_color:{value:o[3]},cloud_cover:{value:.546},rotation:{value:t},stretch:{value:2.5},time:{value:0}});d.mesh.position.z=.02,l.push(d.mat),c.add(d.mesh);const m=a[0];return{group:c,materials:l,textures:[],dominantColor:[m.x,m.y,m.z,m.w]}}function Jm(r,e,t){const n=new ke(.39,.7),i=wn.lava,a=Ut(i.base,r),s=Ut(i.crater,r),o=Ut(i.river,r),l=[],c=new Vt,u=dt(kr,{pixels:{value:e},color1:{value:a[0]},color2:{value:a[1]},color3:{value:a[2]},lightIntensity:{value:.1},light_origin:{value:n},time_speed:{value:.1},rotation:{value:t},seed:{value:gt()},time:{value:0}});l.push(u.mat),c.add(u.mesh);const h=dt(Vl,{pixels:{value:e},color1:{value:s[0]},color2:{value:s[1]},light_origin:{value:n},time_speed:{value:.1},rotation:{value:t},seed:{value:gt()},time:{value:0}});h.mesh.position.z=.01,l.push(h.mat),c.add(h.mesh);const d=dt(Vm,{pixels:{value:e},light_origin:{value:n},seed:{value:gt()},time_speed:{value:.1},river_cutoff:{value:.6},rotation:{value:t},color1:{value:o[0]},color2:{value:o[1]},color3:{value:o[2]},time:{value:0}});d.mesh.position.z=.02,l.push(d.mat),c.add(d.mesh);const m=o[0];return{group:c,materials:l,textures:[],dominantColor:[m.x,m.y,m.z,m.w]}}function Qm(r,e,t){const n=new ke(.39,.7),i=wn.gasgiant,a=Ut(i.base,r),s=Ut(i.gas,r),o=[],l=new Vt,c=dt(Zo,{pixels:{value:e},base_color:{value:a[0]},outline_color:{value:a[1]},shadow_base_color:{value:a[2]},shadow_outline_color:{value:a[3]},cloud_cover:{value:0},stretch:{value:1},cloud_curve:{value:0},time_speed:{value:.1},rotation:{value:t},light_origin:{value:n},seed:{value:gt()},time:{value:0}});o.push(c.mat),l.add(c.mesh);const u=dt(Zo,{pixels:{value:e},base_color:{value:s[0]},outline_color:{value:s[1]},shadow_base_color:{value:s[2]},shadow_outline_color:{value:s[3]},cloud_cover:{value:.538},stretch:{value:1},cloud_curve:{value:1.3},time_speed:{value:.1},rotation:{value:t},light_origin:{value:n},seed:{value:gt()},time:{value:0}});u.mesh.position.z=.01,o.push(u.mat),l.add(u.mesh);const h=a[0];return{group:l,materials:o,textures:[],dominantColor:[h.x,h.y,h.z,h.w]}}function e0(r,e,t){const n=new ke(.39,.7),i=wn.gasgiantring,a=[],s=[],o=new Vt,l=ti([[i.colorScheme1[0]+r,i.colorScheme1[1]+r*.8,i.colorScheme1[2]+r*.6,1],[i.colorScheme1_2[0]+r,i.colorScheme1_2[1]+r*.8,i.colorScheme1_2[2]+r*.6,1],[i.colorScheme1_3[0]+r,i.colorScheme1_3[1]+r*.8,i.colorScheme1_3[2]+r*.6,1],[i.colorScheme1_4[0]+r,i.colorScheme1_4[1]+r*.8,i.colorScheme1_4[2]+r*.6,1]]),c=ti([[i.colorScheme2[0]+r,i.colorScheme2[1]+r*.8,i.colorScheme2[2]+r*.6,1],[i.colorScheme2_2[0]+r,i.colorScheme2_2[1]+r*.8,i.colorScheme2_2[2]+r*.6,1],[i.colorScheme2_3[0]+r,i.colorScheme2_3[1]+r*.8,i.colorScheme2_3[2]+r*.6,1],[i.colorScheme2_4[0]+r,i.colorScheme2_4[1]+r*.8,i.colorScheme2_4[2]+r*.6,1]]);s.push(l,c);const u=dt(Hm,{colorscheme:{value:l},dark_colorscheme:{value:c},pixels:{value:150},light_origin:{value:n},time_speed:{value:.1},rotation:{value:t},seed:{value:gt()},time:{value:0},cloud_cover:{value:0}});a.push(u.mat),o.add(u.mesh);const h=ti([[i.colorScheme1[0]+r,i.colorScheme1[1]+r*.8,i.colorScheme1[2]+r*.6,1],[i.colorScheme1_2[0]+r,i.colorScheme1_2[1]+r*.8,i.colorScheme1_2[2]+r*.6,1],[i.colorScheme1_3[0]+r,i.colorScheme1_3[1]+r*.8,i.colorScheme1_3[2]+r*.6,1],[i.colorScheme1_4[0]+r,i.colorScheme1_4[1]+r*.8,i.colorScheme1_4[2]+r*.6,1]]),d=ti([[i.colorScheme2[0]+r,i.colorScheme2[1]+r*.8,i.colorScheme2[2]+r*.6,1],[i.colorScheme2_2[0]+r,i.colorScheme2_2[1]+r*.8,i.colorScheme2_2[2]+r*.6,1],[i.colorScheme2_3[0]+r,i.colorScheme2_3[1]+r*.8,i.colorScheme2_3[2]+r*.6,1],[i.colorScheme2_4[0]+r,i.colorScheme2_4[1]+r*.8,i.colorScheme2_4[2]+r*.6,1]]);s.push(h,d);const m=dt(Wm,{colorscheme:{value:h},dark_colorscheme:{value:d},ring_width:{value:.143},ring_perspective:{value:6},scale_rel_to_planet:{value:4},pixels:{value:250},light_origin:{value:n},time_speed:{value:.1},rotation:{value:t},seed:{value:gt()},time:{value:0}});return m.mesh.position.z=.01,m.mesh.scale.set(2,2,1),a.push(m.mat),o.add(m.mesh),{group:o,materials:a,textures:s,dominantColor:[i.colorScheme1[0],i.colorScheme1[1],i.colorScheme1[2],1]}}function t0(r,e,t){const n=new ke(.39,.7),i=wn.star,a=[],s=[],o=new Vt,l=ti(i.ramp.map(g=>[Math.min(1,Math.max(0,g[0]+r)),Math.min(1,Math.max(0,g[1]+r*.8)),Math.min(1,Math.max(0,g[2]+r*.6)),g[3]]));s.push(l);const c=dt(Ym,{pixels:{value:200},color:{value:zl(i.blobColor,r)},time_speed:{value:.1},rotation:{value:t},seed:{value:gt()},time:{value:0},circle_amount:{value:3},circle_size:{value:1.5},scale:{value:1}},1.3,1.3);c.mesh.position.z=-.01,c.mesh.scale.set(1.9,1.9,1),a.push(c.mat),o.add(c.mesh);const u=dt(Xm,{pixels:{value:e},colorramp:{value:l},lightIntensity:{value:.1},light_origin:{value:n},time_speed:{value:.01},rotation:{value:t},seed:{value:gt()},time:{value:0}});a.push(u.mat),o.add(u.mesh);const h=ti(i.ramp.map(g=>[Math.min(1,Math.max(0,g[0]+r)),Math.min(1,Math.max(0,g[1]+r*.8)),Math.min(1,Math.max(0,g[2]+r*.6)),g[3]]));s.push(h);const d=dt(qm,{pixels:{value:200},colorramp:{value:h},time_speed:{value:.05},rotation:{value:t},seed:{value:gt()},time:{value:0},storm_width:{value:.2},storm_dither_width:{value:.07},circle_amount:{value:2},circle_scale:{value:1},scale:{value:1}},1.5,1.5);d.mesh.position.z=.01,d.mesh.scale.set(1.2,1.2,1),a.push(d.mat),o.add(d.mesh);const m=i.ramp[0];return{group:o,materials:a,textures:s,dominantColor:[m[0],m[1],m[2],m[3]]}}function n0(r,e,t){const n=new ke(.39,.7),i=wn.asteroid,a=Ut(i.colors,r),s=[],o=new Vt,l=dt($m,{pixels:{value:e},color1:{value:a[0]},color2:{value:a[1]},color3:{value:a[2]},size:{value:Math.random()*10},light_origin:{value:n},rotation:{value:t},seed:{value:gt()},time:{value:0}},1.5,1.5);s.push(l.mat),o.add(l.mesh);const c=a[1];return{group:o,materials:s,textures:[],dominantColor:[c.x,c.y,c.z,c.w]}}function i0(r,e,t){const n=new ke(.39,.7),i=wn.dry,a=[],s=[],o=new Vt,l=ti(i.ramp.map(h=>[Math.min(1,Math.max(0,h[0]+r)),Math.min(1,Math.max(0,h[1]+r*.8)),Math.min(1,Math.max(0,h[2]+r*.6)),h[3]]));s.push(l);const c=dt(Km,{pixels:{value:e},colors:{value:l},light_origin:{value:n},time_speed:{value:.1},rotation:{value:t},seed:{value:gt()},time:{value:0}});a.push(c.mat),o.add(c.mesh);const u=i.ramp[1];return{group:o,materials:a,textures:s,dominantColor:[u[0],u[1],u[2],u[3]]}}function r0(r,e,t,n){switch(r){case"noatmosphere":return jo(e,t,n);case"earth":return Zm(e,t,n);case"ice":return jm(e,t,n);case"lava":return Jm(e,t,n);case"gasgiant":return Qm(e,t,n);case"gasgiantring":return e0(e,t,n);case"star":return t0(e,t,n);case"asteroid":return n0(e,t,n);case"dry":return i0(e,t,n);default:return jo(e,t,n)}}function a0(r){switch(r){case"gasgiantring":return 1.1;case"star":return 1.3;case"asteroid":return .8;default:return .55}}function Is(r,e,t){const n=document.createElement("canvas");n.width=e,n.height=e;let i;try{i=new Bl({canvas:n,alpha:!0,antialias:!1,preserveDrawingBuffer:!1})}catch{return null}i.setSize(e,e,!1),i.setPixelRatio(1);const a=t?.frustumScale??a0(r),s=new bl,o=new Br(-a,a,a,-a,.1,100);o.position.z=1;const l=t?.variationSeed??0,c=Math.sin(l*12.9898)*43758.5453%1*.14-.07,u=t?.pixels??50,h=t?.rotation??(Math.random()-.5)*.6,d=r0(r,c,u,h);s.add(d.group);const m=S=>{for(const f of d.materials)f.uniforms.time&&(f.uniforms.time.value=S);i.render(s,o)},g=()=>{for(const S of d.materials)S.dispose();for(const S of d.textures)S.dispose();i.dispose()};return m(0),{renderer:i,scene:s,camera:o,image:i.domElement,dominantColor:d.dominantColor,materials:d.materials,update:m,destroy:g}}class s0{cache=new Map;generateAll(e,t){this.cache.clear();for(const n of e){const i=wc(n),a=Math.max(64,Math.ceil(n.radius*2.5)),s=Is(i.id,a,{variationSeed:Number(n.id)+t});s&&this.cache.set(n.id,{image:s.image,resolution:a,typeId:i.id,dominantColor:s.dominantColor,runtime:s})}}get(e){return this.cache.get(e)??null}update(e){const t=e*.001;for(const n of this.cache.values())n.runtime.update(t),n.image=n.runtime.image}clear(){for(const e of this.cache.values())e.runtime.destroy();this.cache.clear()}}class o0{cache=new s0;webglAvailable;constructor(){this.webglAvailable=this.detectWebgl2()}init(e){if(!this.webglAvailable){this.cache.clear();return}this.cache.generateAll(e.planets,e.planets.length*31)}update(e){this.webglAvailable&&this.cache.update(e)}getCache(){return this.webglAvailable?this.cache:null}clear(){this.cache.clear()}destroy(){this.cache.clear()}detectWebgl2(){try{return!!document.createElement("canvas").getContext("webgl2")}catch{return!1}}}const Jo=`
varying vec3 vUv;
void main() {
  vUv = position;
  vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * modelViewPosition;
}
`,l0=`
varying vec3 vUv;
float size = 10.0;
int OCTAVES = 12;
uniform float seed;
float pixels = 100.0;
bool should_tile = false;
bool reduce_background = false;
uniform sampler2D colorscheme;
vec2 uv_correct = vec2(1.0);

float rand(vec2 coord, float tilesize) {
  if (should_tile) {
    coord = mod(coord / uv_correct, tilesize);
  }
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * (15.5453 + seed));
}

float noise(vec2 coord, float tilesize){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i, tilesize);
  float b = rand(i + vec2(1.0, 0.0), tilesize);
  float c = rand(i + vec2(0.0, 1.0), tilesize);
  float d = rand(i + vec2(1.0, 1.0), tilesize);
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}

float fbm(vec2 coord, float tilesize){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord, tilesize) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}

bool dither(vec2 uv1, vec2 uv2) {
  return mod(uv1.y+uv2.x,2.0/max(pixels,1.0)) <= 1.0 / max(pixels,1.0);
}

float circleNoise(vec2 uv, float tilesize) {
  if (should_tile) {
    uv = mod(uv, tilesize);
  }
  float uv_y = floor(uv.y);
  uv.x += uv_y*.31;
  vec2 f = fract(uv);
  float h = rand(vec2(floor(uv.x),floor(uv_y)), tilesize);
  float m = (length(f-0.25-(h*0.5)));
  float r = h*0.25;
  return smoothstep(0.0, r, m*0.75);
}

float cloud_alpha(vec2 uv, float tilesize) {
  float c_noise = 0.0;
  int iters = 2;
  for (int i = 0; i < iters; i++) {
    c_noise += circleNoise(uv * 0.5 + (float(i+1)) + vec2(-0.3, 0.0), ceil(tilesize * 0.5));
  }
  float f = fbm(uv+c_noise, tilesize);
  return f;
}

void main() {
  vec2 uv = floor((vUv.xy) * pixels) / pixels * uv_correct;
  bool dith = dither(uv, vUv.xy);
  float n_alpha = fbm(uv * ceil(size * 0.5) +vec2(2,2), ceil(size * 0.5));
  float n_dust = cloud_alpha(uv * size, size);
  float n_dust2 = fbm(uv * ceil(size * 0.2) -vec2(2,2),ceil(size * 0.2));
  float n_dust_lerp = n_dust2 * n_dust;
  if (dith) {
    n_dust_lerp *= 0.95;
  }
  float a_dust = step(n_alpha , n_dust_lerp * 1.8);
  n_dust_lerp = pow(n_dust_lerp, 3.2) * 56.0;
  if (dith) {
    n_dust_lerp *= 1.1;
  }
  if (reduce_background) {
    n_dust_lerp = pow(n_dust_lerp, 0.8) * 0.7;
  }
  float col_value = floor(n_dust_lerp) / 7.0;
  vec3 col = texture2D(colorscheme, vec2(col_value, 0.0)).rgb;
  gl_FragColor = vec4(col, a_dust);
}
`,c0=`
varying vec3 vUv;
float size = 5.0;
int OCTAVES = 8;
uniform float seed;
float pixels = 100.0;
uniform sampler2D colorscheme;
vec4 background_color = vec4(0,0,0,0);
bool should_tile = false;
bool reduce_background = false;
vec2 uv_correct = vec2(1.0);

float rand(vec2 coord, float tilesize) {
  if (should_tile) {
    coord = mod(coord / uv_correct, tilesize);
  }
  return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * (15.5453 + seed));
}

float noise(vec2 coord, float tilesize){
  vec2 i = floor(coord);
  vec2 f = fract(coord);
  float a = rand(i, tilesize);
  float b = rand(i + vec2(1.0, 0.0), tilesize);
  float c = rand(i + vec2(0.0, 1.0), tilesize);
  float d = rand(i + vec2(1.0, 1.0), tilesize);
  vec2 cubic = f * f * (3.0 - 2.0 * f);
  return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}

float fbm(vec2 coord, float tilesize){
  float value = 0.0;
  float scale = 0.5;
  for(int i = 0; i < OCTAVES ; i++){
    value += noise(coord, tilesize) * scale;
    coord *= 2.0;
    scale *= 0.5;
  }
  return value;
}

bool dither(vec2 uv1, vec2 uv2) {
  return mod(uv1.y+uv2.x,2.0/max(pixels,1.0)) <= 1.0 / max(pixels,1.0);
}

float circleNoise(vec2 uv, float tilesize) {
  if (should_tile) {
    uv = mod(uv, tilesize / uv_correct);
  }
  float uv_y = floor(uv.y);
  uv.x += uv_y*.31;
  vec2 f = fract(uv);
  float h = rand(vec2(floor(uv.x),floor(uv_y)), tilesize);
  float m = (length(f-0.25-(h*0.5)));
  float r = h*0.25;
  return smoothstep(0.0, r, m*0.75);
}

float cloud_alpha(vec2 uv, float tilesize) {
  float c_noise = 0.0;
  int iters = 4;
  for (int i = 0; i < iters; i++) {
    c_noise += circleNoise(uv * 0.5 + (float(i+1)) + vec2(-0.3, 0.0), ceil(tilesize * 0.5));
  }
  float f = fbm(uv+c_noise, tilesize);
  return f;
}

void main() {
  vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;
  float d = distance(uv, vec2(0.5)) * 0.4;
  uv *= uv_correct;
  bool dith = dither(uv, vUv.xy);
  float n = cloud_alpha(uv * size, size);
  float n2 = fbm(uv * size + vec2(1, 1), size);
  float n_lerp = n2 * n;
  float n_dust = cloud_alpha(uv * size, size);
  float n_dust_lerp = n_dust * n_lerp;
  if (dith) {
    n_dust_lerp *= 0.95;
    n_lerp *= 0.95;
    d*= 0.98;
  }
  float a = step(n2, 0.1 + d);
  float a2 = step(n2, 0.115 + d);
  if (should_tile) {
    a = step(n2, 0.3);
    a2 = step(n2, 0.315);
  }
  if (reduce_background) {
    n_dust_lerp = pow(n_dust_lerp, 1.2) * 0.7;
  }
  float col_value = 0.0;
  if (a2 > a) {
    col_value = floor(n_dust_lerp * 35.0) / 7.0;
  } else {
    col_value = floor(n_dust_lerp * 14.0) / 7.0;
  }
  vec3 col = texture2D(colorscheme, vec2(col_value, 0.0)).rgb;
  if (col_value < 0.1) {
    col = background_color.rgb;
  }
  gl_FragColor = vec4(col, a2);
}
`;function u0(){const r=[[.02,.02,.06,1],[.06,.04,.12,1],[.1,.06,.18,1],[.14,.08,.22,1],[.18,.1,.28,1],[.22,.12,.32,1],[.28,.16,.38,1],[.35,.2,.45,1]],e=r.length,t=new Uint8Array(e*4);for(let i=0;i<e;i++){const a=r[i];t[i*4]=Math.round(a[0]*255),t[i*4+1]=Math.round(a[1]*255),t[i*4+2]=Math.round(a[2]*255),t[i*4+3]=Math.round(a[3]*255)}const n=new Ds(t,e,1,zt,Dt);return n.magFilter=ut,n.minFilter=ut,n.needsUpdate=!0,n}function d0(r,e,t){const n=document.createElement("canvas");n.width=r,n.height=e;let i;try{i=new Bl({canvas:n,alpha:!1,antialias:!1,preserveDrawingBuffer:!0})}catch{return null}i.setSize(r,e,!1),i.setPixelRatio(1),i.setClearColor(329743,1);const a=new bl,s=new Br(-1,1,1,-1,.1,10);s.position.z=1;const o=u0(),l=new Gt({uniforms:{colorscheme:{value:o},seed:{value:t}},vertexShader:Jo,fragmentShader:l0,transparent:!0,depthWrite:!1}),c=new Yt(new ii(3,3),l);c.position.z=-1;const u=new Gt({uniforms:{colorscheme:{value:o},seed:{value:t*1.37}},vertexShader:Jo,fragmentShader:c0,transparent:!0,depthWrite:!1}),h=new Yt(new ii(3,3),u);h.position.z=-.9,a.add(c),a.add(h);const d=S=>{i.clear(),i.render(a,s)},m=(S,f)=>{n.width===S&&n.height===f||(n.width=S,n.height=f,i.setSize(S,f,!1))},g=()=>{l.dispose(),u.dispose(),o.dispose(),i.dispose()};return d(),{getCanvas:()=>n,update:d,resize:m,destroy:g}}function h0(r){return[]}function f0(r,e,t){const n=[];for(let i=0;i<t;i++){const a=ze(0,r),s=ze(0,e),l=Xr()?"sparkle":Xr()?"cross":"dot",c=Xr()?"#ffef9e":"#ffffff",u=ze(.1,1);n.push({x:a,y:s,type:l,color:c,opacity:u})}return n}class p0{constructor(e,t){this.canvas=e;const n=e.getContext("2d");if(!n)throw new Error("Canvas 2D context unavailable");this.ctx=n,this.visualState=this.createInitialVisualState(e.width,e.height,t),this.textureGenerator=new o0,this.textureGenerator.init(t);const i=(t.planets.length*31+17)%999999;this.starfield=d0(e.width,e.height,i),this.layers=[new gc,new vc,new yc,new Tc,new Ac],this.trailLayer=new Qs(!0),this.particleLayer=new Qs(!1),this.camera=new _c(e.width,e.height)}ctx;visualState;layers;trailLayer;particleLayer;textureGenerator;starfield;camera;timeMs=0;render(e,t,n,i,a,s,o,l,c){this.timeMs+=t,this.textureGenerator.update(this.timeMs),this.starfield?.update(this.timeMs),this.tickVisuals(e,t),this.camera.update(t),this.ctx.save(),this.visualState.screenShake.timeRemainingMs>0&&this.ctx.translate(ze(-this.visualState.screenShake.intensity,this.visualState.screenShake.intensity),ze(-this.visualState.screenShake.intensity,this.visualState.screenShake.intensity));const u={gameState:e,visualState:this.visualState,planetTextures:this.textureGenerator.getCache(),starfieldCanvas:this.starfield?.getCanvas()??null,camera:this.camera,dragState:n,selectedPlanetIds:i,hoverPlanetId:a,hoverPos:s,hoverDurationMs:o,paused:l,lassoState:c,canvasWidth:this.canvas.width,canvasHeight:this.canvas.height,timeMs:this.timeMs};this.layers[0]?.render(this.ctx,u),this.camera.applyTransform(this.ctx),this.layers[1]?.render(this.ctx,u),this.trailLayer.render(this.ctx,u),this.layers[2]?.render(this.ctx,u),this.layers[3]?.render(this.ctx,u),this.particleLayer.render(this.ctx,u),this.camera.resetTransform(this.ctx),this.layers[4]?.render(this.ctx,u),a!==null&&o>=500&&s&&this.renderTooltip(e,a,s),l&&(this.ctx.fillStyle="rgba(0,0,0,0.4)",this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height),this.ctx.fillStyle="#e0f7fa",this.ctx.font="bold 42px 'Orbitron', 'Exo 2', sans-serif",this.ctx.textAlign="center",this.ctx.textBaseline="middle",this.ctx.fillText("PAUSED",this.canvas.width/2,this.canvas.height/2)),this.ctx.restore()}handleEvent(e){if(e.type==="fleet_launched"){const t=On(e.fleet.owner);for(let n=0;n<12;n+=1){const i=e.fleet.angle+ze(-.6,.6);this.visualState.particles.push({x:e.from.x+Math.cos(e.fleet.angle)*e.from.radius,y:e.from.y+Math.sin(e.fleet.angle)*e.from.radius,vx:Math.cos(i)*ze(1,3),vy:Math.sin(i)*ze(1,3),life:1,decay:ze(.02,.04),size:ze(1.5,4),color:t.main})}}if(e.type==="planet_captured"){const t=this.visualState.planetVisuals.get(e.planet.id);t&&(t.captureFlash=1,t.colorTransitionMs=300,t.previousOwner=e.previousOwner===null?null:Number(e.previousOwner)),this.visualState.screenShake.timeRemainingMs=200,this.visualState.screenShake.intensity=4;const n=On(e.newOwner);for(let i=0;i<30;i+=1){const a=ze(0,Math.PI*2),s=ze(1,5);this.visualState.particles.push({x:e.planet.x,y:e.planet.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,decay:ze(.015,.035),size:ze(2,6),color:n.main})}}if(e.type==="fleet_arrived"&&!e.result.captured){const t=On(e.fleet.owner);for(let n=0;n<10;n+=1){const i=ze(0,Math.PI*2);this.visualState.particles.push({x:e.target.x+Math.cos(i)*e.target.radius,y:e.target.y+Math.sin(i)*e.target.radius,vx:Math.cos(i)*ze(.5,2),vy:Math.sin(i)*ze(.5,2),life:1,decay:ze(.03,.06),size:ze(1,3),color:t.main})}}}resize(e,t,n){this.canvas.width=e,this.canvas.height=t,this.starfield?.resize(e,t),this.camera.setViewport(e,t);const i=this.createInitialVisualState(e,t,n);this.visualState.stars=i.stars,this.visualState.nebulae=i.nebulae,this.visualState.flatStars=i.flatStars}getCamera(){return this.camera}destroy(){this.visualState.particles=[],this.visualState.trails=[],this.textureGenerator.destroy(),this.starfield?.destroy()}createInitialVisualState(e,t,n){const i=new Map;for(const a of n.planets)i.set(a.id,{pulse:ze(0,Math.PI*2),captureFlash:0,productionFlash:0,colorTransitionMs:0,previousOwner:a.owner===null?null:Number(a.owner)});return{particles:[],trails:[],stars:Array.from({length:Xt.starCount},()=>({x:ze(0,e),y:ze(0,t),size:ze(.4,2),brightness:ze(.2,.8),twinkleSpeed:ze(.005,.03),twinklePhase:ze(0,Math.PI*2)})),sphereStars:h0(),flatStars:f0(e,t,1100),nebulae:Array.from({length:Xt.nebulaCount},()=>({x:ze(0,e),y:ze(0,t),radius:ze(100,300),color:Math.random()>.5?"cyan":"red",alpha:ze(.015,.04)})),screenShake:{timeRemainingMs:0,intensity:0},planetVisuals:i}}tickVisuals(e,t){for(const n of e.planets){let i=this.visualState.planetVisuals.get(n.id);i||(i={pulse:0,captureFlash:0,productionFlash:0,colorTransitionMs:0,previousOwner:null},this.visualState.planetVisuals.set(n.id,i)),i.pulse=0,n.owner!==null&&Math.random()<.02&&(i.productionFlash=.3),i.productionFlash>0&&(i.productionFlash=Math.max(0,i.productionFlash-.02)),i.captureFlash>0&&(i.captureFlash-=.03),i.colorTransitionMs>0&&(i.colorTransitionMs=Math.max(0,i.colorTransitionMs-t))}for(const n of e.fleets)if(this.visualState.trails.length<Xt.trailLimit){const i=On(n.owner);this.visualState.trails.push({x:n.x+ze(-4,4),y:n.y+ze(-4,4),life:1,decay:ze(.025,.05),size:ze(1,2.5),color:i.trail})}for(let n=this.visualState.particles.length-1;n>=0;n-=1){const i=this.visualState.particles[n];i&&(i.x+=i.vx,i.y+=i.vy,i.vx*=.97,i.vy*=.97,i.life-=i.decay,i.life<=0&&this.visualState.particles.splice(n,1))}for(;this.visualState.particles.length>Xt.particleLimit;)this.visualState.particles.shift();for(let n=this.visualState.trails.length-1;n>=0;n-=1){const i=this.visualState.trails[n];i&&(i.life-=i.decay,i.life<=0&&this.visualState.trails.splice(n,1))}for(;this.visualState.trails.length>Xt.trailLimit;)this.visualState.trails.shift();this.visualState.screenShake.timeRemainingMs>0&&(this.visualState.screenShake.timeRemainingMs=Math.max(0,this.visualState.screenShake.timeRemainingMs-t))}renderTooltip(e,t,n){const i=e.planets.find(g=>g.id===t);if(!i)return;const a=i.owner===null?"Neutral":i.owner===0?"You":`Bot ${Number(i.owner)}`,s={sun:"☀ Sun",homeworld:"Homeworld",gasGiant:"Gas Giant",lavaWorld:"Lava World",terran:"Terran Planet",iceWorld:"Ice World",dryTerran:"Dry Terran",barren:"Barren Planet"}[i.type]??i.type,o=i.type!=="sun"&&i.effectiveProductionRate>i.productionRate+.001?`Production: ${si(i.effectiveProductionRate)}/sec (+10% ☀)`:`Production: ${si(i.effectiveProductionRate)}/sec`,l=i.shield>0?`Shield: ${Math.round(i.shield*100)}% (${(1/(1-i.shield)).toFixed(1)}x to capture)`:"Shield: None",c=i.isSun?[s,`Owner: ${a}`,`Units: ${si(i.units)} / ${si(i.maxUnits)}`,o,l,"Buff: +10% production to all planets"]:[s,`Owner: ${a}`,`Units: ${si(i.units)} / ${si(i.maxUnits)}`,o,l],u=6+c.length*16,h=250,d=Math.min(this.canvas.width-h,n.x+16),m=Math.min(this.canvas.height-u-10,n.y+16);this.ctx.fillStyle="rgba(5,8,15,0.85)",this.ctx.strokeStyle="rgba(0,229,255,0.25)",this.ctx.lineWidth=1,this.ctx.fillRect(d,m,h,u),this.ctx.strokeRect(d,m,h,u),this.ctx.fillStyle="#e0f7fa",this.ctx.font="12px 'Exo 2', sans-serif",this.ctx.textAlign="left",this.ctx.textBaseline="top";for(let g=0;g<c.length;g+=1)this.ctx.fillText(c[g]??"",d+8,m+6+g*16)}}function wa(r,e){const t=r.getBoundingClientRect(),n=r.width/t.width,i=r.height/t.height,a="touches"in e?e.touches[0]??e.changedTouches[0]:e;return a?{x:(a.clientX-t.left)*n,y:(a.clientY-t.top)*i}:{x:0,y:0}}class m0{constructor(e,t){this.canvas=e,this.callbacks=t}dragState=null;lassoState=null;hoverPlanetId=null;hoverPos=null;hoverStartMs=0;selectedPlanetIds=new Set;pointerDownPlanetId=null;pointerDownPos=null;selectMode=!1;options={passive:!1};getDragState(){return this.dragState}getHoverPlanetId(){return this.hoverPlanetId}getHoverPos(){return this.hoverPos}getHoverDurationMs(e){return this.hoverPlanetId===null||this.hoverStartMs===0?0:e-this.hoverStartMs}getSelectedPlanetIds(){return new Set(this.selectedPlanetIds)}clearSelection(){this.selectedPlanetIds.clear(),this.dragState=null,this.lassoState=null}selectAll(){const e=this.callbacks.getAllOwnedPlanetIds();this.selectedPlanetIds.clear();for(const t of e)this.selectedPlanetIds.add(t)}deselectAll(){this.clearSelection()}getLassoState(){return this.lassoState}setSelectMode(e){this.selectMode=e}isInteracting(){return this.dragState!==null||this.lassoState!==null}attach(){this.canvas.addEventListener("mousedown",this.handleDown,this.options),this.canvas.addEventListener("mousemove",this.handleMove,this.options),this.canvas.addEventListener("mouseup",this.handleUp,this.options),this.canvas.addEventListener("touchstart",this.handleDown,this.options),this.canvas.addEventListener("touchmove",this.handleMove,this.options),this.canvas.addEventListener("touchend",this.handleUp,this.options)}detach(){this.canvas.removeEventListener("mousedown",this.handleDown),this.canvas.removeEventListener("mousemove",this.handleMove),this.canvas.removeEventListener("mouseup",this.handleUp),this.canvas.removeEventListener("touchstart",this.handleDown),this.canvas.removeEventListener("touchmove",this.handleMove),this.canvas.removeEventListener("touchend",this.handleUp)}handleDown=e=>{if("button"in e&&e.button!==0)return;e.preventDefault();const t=wa(this.canvas,e),n=this.callbacks.screenToWorld(t.x,t.y),i=this.callbacks.getPlanetAt(n),a=this.isAdditiveSelection(e);if(this.pointerDownPlanetId=i,this.pointerDownPos=t,i===null){"touches"in e?a?this.clearSelection():this.dragState=null:this.lassoState={startScreen:t,currentScreen:t,startWorld:n,currentWorld:n};return}if(!this.callbacks.isOwnedByPlayer(i)){a||this.clearSelection();return}!a&&!this.selectedPlanetIds.has(i)?(this.selectedPlanetIds.clear(),this.selectedPlanetIds.add(i)):a&&(this.selectedPlanetIds.has(i)?this.selectedPlanetIds.delete(i):this.selectedPlanetIds.add(i)),this.selectedPlanetIds.size>0&&(this.dragState={fromPlanetIds:Array.from(this.selectedPlanetIds),current:n})};handleMove=e=>{if("buttons"in e&&e.buttons===0&&!("touches"in e))return;e.preventDefault();const t=wa(this.canvas,e);this.hoverPos=t;const n=this.callbacks.screenToWorld(t.x,t.y),i=this.callbacks.getPlanetAt(n);i!==this.hoverPlanetId&&(this.hoverPlanetId=i,this.hoverStartMs=performance.now()),this.dragState&&(this.dragState.current=n),this.lassoState&&(this.lassoState.currentScreen=t,this.lassoState.currentWorld=n)};handleUp=e=>{if("button"in e&&e.button!==0)return;e.preventDefault();const t=wa(this.canvas,e),n=this.callbacks.screenToWorld(t.x,t.y),i=this.callbacks.getPlanetAt(n),a=this.pointerDownPos!==null&&Math.hypot(t.x-this.pointerDownPos.x,t.y-this.pointerDownPos.y)>8;if(this.lassoState){if(a){const s=Math.min(this.lassoState.startWorld.x,this.lassoState.currentWorld.x),o=Math.max(this.lassoState.startWorld.x,this.lassoState.currentWorld.x),l=Math.min(this.lassoState.startWorld.y,this.lassoState.currentWorld.y),c=Math.max(this.lassoState.startWorld.y,this.lassoState.currentWorld.y),u=this.callbacks.getPlanetsInBox(s,l,o,c);this.isAdditiveSelection(e)||this.selectedPlanetIds.clear();for(const h of u)this.selectedPlanetIds.add(h)}else this.selectedPlanetIds.clear();this.lassoState=null,this.pointerDownPos=null,this.pointerDownPlanetId=null;return}if(!this.dragState||this.dragState.fromPlanetIds.length===0){this.pointerDownPos=null,this.pointerDownPlanetId=null;return}i!==null&&a&&!this.dragState.fromPlanetIds.includes(i)?this.callbacks.onFleetDispatch(this.dragState.fromPlanetIds,i):!a&&i===null&&this.selectedPlanetIds.clear(),this.dragState=null,this.pointerDownPos=null,this.pointerDownPlanetId=null};isAdditiveSelection(e){return!!(this.selectMode||"shiftKey"in e&&e.shiftKey||"touches"in e&&e.touches.length>=2)}}class g0{constructor(e,t,n,i={}){this.camera=e,this.canvas=t,this.inputManager=n,this.config=i}isPanning=!1;isRotating=!1;lastPointerPos=null;pinchStartDistance=null;pinchStartAngle=null;pinchStartZoom=1;pinchStartRotation=0;pinchCenter=null;arrowKeys={up:!1,down:!1,left:!1,right:!1};options={passive:!1};attach(){this.canvas.addEventListener("wheel",this.handleWheel,this.options),this.canvas.addEventListener("mousedown",this.handlePointerDown,this.options),window.addEventListener("mousemove",this.handlePointerMove),window.addEventListener("mouseup",this.handlePointerUp),this.canvas.addEventListener("touchstart",this.handleTouchStart,this.options),this.canvas.addEventListener("touchmove",this.handleTouchMove,this.options),window.addEventListener("touchend",this.handleTouchEnd),window.addEventListener("keydown",this.handleKeyDown),window.addEventListener("keyup",this.handleKeyUp)}detach(){this.canvas.removeEventListener("wheel",this.handleWheel),this.canvas.removeEventListener("mousedown",this.handlePointerDown),window.removeEventListener("mousemove",this.handlePointerMove),window.removeEventListener("mouseup",this.handlePointerUp),this.canvas.removeEventListener("touchstart",this.handleTouchStart),this.canvas.removeEventListener("touchmove",this.handleTouchMove),window.removeEventListener("touchend",this.handleTouchEnd),window.removeEventListener("keydown",this.handleKeyDown),window.removeEventListener("keyup",this.handleKeyUp)}updateArrowKeys(e){let i=0,a=0;if(this.arrowKeys.left&&(i-=.5*e),this.arrowKeys.right&&(i+=.5*e),this.arrowKeys.up&&(a-=.5*e),this.arrowKeys.down&&(a+=.5*e),i!==0||a!==0){const s=this.camera.getZoom(),o=i*s,l=a*s;this.camera.pan(o,l)}this.rotateLeft&&this.camera.rotateBy(-.09*e),this.rotateRight&&this.camera.rotateBy(.09*e)}rotateLeft=!1;rotateRight=!1;handleWheel=e=>{e.preventDefault();const t=this.canvas.getBoundingClientRect(),n=(e.clientX-t.left)*(this.canvas.width/t.width),i=(e.clientY-t.top)*(this.canvas.height/t.height),a=-Math.sign(e.deltaY)*.1;if(e.shiftKey){this.camera.rotateBy(a*18);return}this.camera.zoomAt(n,i,a)};handlePointerDown=e=>{if(e.button===2){this.isPanning=!0,this.lastPointerPos={x:e.clientX,y:e.clientY},e.preventDefault();return}if(e.button===1){this.isRotating=!0,this.lastPointerPos={x:e.clientX,y:e.clientY},e.preventDefault();return}this.inputManager.isInteracting()||e.button===0&&(this.isPanning=!0,this.lastPointerPos={x:e.clientX,y:e.clientY})};handlePointerMove=e=>{if(!this.lastPointerPos)return;const t=e.clientX-this.lastPointerPos.x,n=e.clientY-this.lastPointerPos.y;this.isPanning?this.camera.pan(t,n):this.isRotating&&this.camera.rotateBy(t*.25),this.lastPointerPos={x:e.clientX,y:e.clientY}};handlePointerUp=()=>{this.isPanning=!1,this.isRotating=!1,this.lastPointerPos=null};handleTouchStart=e=>{if(e.touches.length===2){const t=e.touches[0],n=e.touches[1];t&&n&&(this.pinchStartDistance=this.getTouchDistance(t,n),this.pinchStartAngle=this.getTouchAngle(t,n),this.pinchStartZoom=this.camera.getZoom(),this.pinchStartRotation=this.camera.getState().rotation,this.pinchCenter=this.getTouchCenter(t,n));return}if(e.touches.length===1&&!this.inputManager.isInteracting()){const t=e.touches[0];if(!t)return;this.isPanning=!0,this.lastPointerPos={x:t.clientX,y:t.clientY}}};handleTouchMove=e=>{if(e.touches.length===2&&this.pinchStartDistance!==null){e.preventDefault();const t=e.touches[0],n=e.touches[1];if(t&&n){const a=this.getTouchDistance(t,n)/this.pinchStartDistance,s=this.pinchStartZoom*a,o=this.getTouchAngle(t,n),l=o-(this.pinchStartAngle??o),c=this.getTouchCenter(t,n);if(this.camera.setZoom(s),this.camera.setRotation(this.pinchStartRotation+l),this.pinchCenter){const u=c.x-this.pinchCenter.x,h=c.y-this.pinchCenter.y;this.camera.pan(u,h)}this.pinchCenter=c}}else if(e.touches.length===1&&this.isPanning&&this.lastPointerPos&&!this.inputManager.isInteracting()){e.preventDefault();const t=e.touches[0];if(!t)return;const n=t.clientX-this.lastPointerPos.x,i=t.clientY-this.lastPointerPos.y;this.camera.pan(n,i),this.lastPointerPos={x:t.clientX,y:t.clientY}}};handleTouchEnd=()=>{this.pinchStartDistance=null,this.pinchStartAngle=null,this.pinchStartZoom=1,this.pinchCenter=null,this.isPanning=!1,this.lastPointerPos=null};handleKeyDown=e=>{switch(e.key){case"+":case"=":this.camera.zoomAt(this.camera.getViewport().width/2,this.camera.getViewport().height/2,.2);break;case"-":case"_":this.camera.zoomAt(this.camera.getViewport().width/2,this.camera.getViewport().height/2,-.2);break;case"Home":case"f":case"F":{this.config.onResetView?.();break}case"ArrowUp":this.arrowKeys.up=!0;break;case"ArrowDown":this.arrowKeys.down=!0;break;case"ArrowLeft":this.arrowKeys.left=!0;break;case"ArrowRight":this.arrowKeys.right=!0;break;case"q":case"Q":this.rotateLeft=!0;break;case"e":case"E":this.rotateRight=!0;break}};handleKeyUp=e=>{switch(e.key){case"ArrowUp":this.arrowKeys.up=!1;break;case"ArrowDown":this.arrowKeys.down=!1;break;case"ArrowLeft":this.arrowKeys.left=!1;break;case"ArrowRight":this.arrowKeys.right=!1;break;case"q":case"Q":this.rotateLeft=!1;break;case"e":case"E":this.rotateRight=!1;break}};getTouchDistance(e,t){const n=e.clientX-t.clientX,i=e.clientY-t.clientY;return Math.sqrt(n*n+i*i)}getTouchCenter(e,t){return{x:(e.clientX+t.clientX)/2,y:(e.clientY+t.clientY)/2}}getTouchAngle(e,t){return Math.atan2(t.clientY-e.clientY,t.clientX-e.clientX)*180/Math.PI}}class v0{constructor(e,t,n){this.camera=e,this.parentElement=t,this.onFitAll=n,this.container=document.createElement("div"),this.container.className="zoomControls",this.zoomInButton=document.createElement("button"),this.zoomInButton.className="zoomButton",this.zoomInButton.textContent="+",this.zoomInButton.title="Zoom In",this.zoomInButton.onclick=()=>this.zoomIn(),this.zoomOutButton=document.createElement("button"),this.zoomOutButton.className="zoomButton",this.zoomOutButton.textContent="−",this.zoomOutButton.title="Zoom Out",this.zoomOutButton.onclick=()=>this.zoomOut(),this.fitButton=document.createElement("button"),this.fitButton.className="zoomButton fitButton",this.fitButton.textContent="⊞",this.fitButton.title="Fit All (Home/F)",this.fitButton.onclick=()=>this.onFitAll(),this.slider=document.createElement("input"),this.slider.type="range",this.slider.className="zoomSlider",this.slider.min="0",this.slider.max="100",this.slider.step="1",this.slider.title="Zoom Level",this.slider.addEventListener("input",()=>{const i=parseFloat(this.slider.value),a=this.zoomFromPercent(i);this.camera.setZoom(a)}),this.container.append(this.zoomInButton,this.slider,this.zoomOutButton,this.fitButton),this.parentElement.appendChild(this.container),this.sync()}container;zoomInButton;zoomOutButton;fitButton;slider;lastKnownZoom=1;zoomIn(){this.camera.zoomAt(this.camera.getViewport().width/2,this.camera.getViewport().height/2,.2)}zoomOut(){this.camera.zoomAt(this.camera.getViewport().width/2,this.camera.getViewport().height/2,-.2)}percentFromZoom(e){const t=this.camera.getMinZoom(),n=this.camera.getMaxZoom(),i=(e-t)/(n-t)*100;return Math.max(0,Math.min(100,i))}zoomFromPercent(e){const t=this.camera.getMinZoom(),n=this.camera.getMaxZoom();return t+e/100*(n-t)}sync(){const e=this.camera.getZoom();e!==this.lastKnownZoom&&(this.lastKnownZoom=e,this.slider.value=String(this.percentFromZoom(e)))}destroy(){this.container.remove()}}class _0{constructor(e,t,n){this.camera=e,this.parentElement=t,this.onResetView=n,this.container=document.createElement("div"),this.container.className="rotationControls",this.rotateLeftButton=document.createElement("button"),this.rotateLeftButton.className="zoomButton",this.rotateLeftButton.textContent="↶",this.rotateLeftButton.title="Rotate Left (Q)",this.rotateLeftButton.onclick=()=>this.camera.rotateBy(-15),this.slider=document.createElement("input"),this.slider.type="range",this.slider.className="rotationSlider",this.slider.min="-180",this.slider.max="180",this.slider.step="1",this.slider.title="Camera Rotation",this.slider.addEventListener("input",()=>{this.camera.setRotation(Number(this.slider.value))}),this.rotateRightButton=document.createElement("button"),this.rotateRightButton.className="zoomButton",this.rotateRightButton.textContent="↷",this.rotateRightButton.title="Rotate Right (E)",this.rotateRightButton.onclick=()=>this.camera.rotateBy(15),this.resetButton=document.createElement("button"),this.resetButton.className="zoomButton fitButton",this.resetButton.textContent="↺",this.resetButton.title="Reset View (Home/F)",this.resetButton.onclick=()=>this.onResetView(),this.container.append(this.rotateLeftButton,this.slider,this.rotateRightButton,this.resetButton),this.parentElement.appendChild(this.container),this.sync()}container;rotateLeftButton;rotateRightButton;resetButton;slider;lastKnownRotation=0;sync(){const e=this.camera.getState().rotation;e!==this.lastKnownRotation&&(this.lastKnownRotation=e,this.slider.value=String(Math.round(e)))}destroy(){this.container.remove()}}const Qo=r=>{let e;const t=new Set,n=(c,u)=>{const h=typeof c=="function"?c(e):c;if(!Object.is(h,e)){const d=e;e=u??(typeof h!="object"||h===null)?h:Object.assign({},e,h),t.forEach(m=>m(e,d))}},i=()=>e,o={setState:n,getState:i,getInitialState:()=>l,subscribe:c=>(t.add(c),()=>t.delete(c))},l=e=r(n,i,o);return o},x0=(r=>r?Qo(r):Qo),Gi=8;function S0(){return[{id:0,name:"Player",colorIndex:0,isBot:!1},{id:1,name:"Bot 1",colorIndex:1,isBot:!0}]}function M0(r,e){const t=new Set(r.filter(n=>n.id!==e).map(n=>n.colorIndex));for(let n=0;n<Gi;n++)if(!t.has(n))return n;return 0}function el(r){return r.players.filter(e=>e.isBot).length}const Ve=x0(r=>({screen:"menu",difficulty:"balanced",gameSpeed:"normal",mapSize:"medium",players:S0(),winner:null,muted:!1,paused:!1,multiSelectMode:!1,endStats:null,endTelemetry:null,setScreen:e=>r({screen:e}),setDifficulty:e=>r({difficulty:e}),setGameSpeed:e=>r({gameSpeed:e}),setMapSize:e=>r({mapSize:e}),addBot:()=>r(e=>{if(e.players.length>=Gi)return e;const t=Math.max(...e.players.map(a=>a.id))+1,n=e.players.filter(a=>a.isBot).length+1,i=M0(e.players,-1);return{players:[...e.players,{id:t,name:`Bot ${n}`,colorIndex:i,isBot:!0}]}}),removeBot:()=>r(e=>{const t=e.players.filter(i=>i.isBot);if(t.length<=0)return e;const n=t[t.length-1];return{players:e.players.filter(i=>i.id!==n.id)}}),cyclePlayerColor:e=>r(t=>{const n=new Set(t.players.filter(o=>o.id!==e).map(o=>o.colorIndex)),i=t.players.find(o=>o.id===e);if(!i)return t;let a=(i.colorIndex+1)%Gi,s=0;for(;n.has(a)&&s<Gi;)a=(a+1)%Gi,s++;return{players:t.players.map(o=>o.id===e?{...o,colorIndex:a}:o)}}),setWinner:e=>r({winner:e}),setMuted:e=>r({muted:e}),toggleMuted:()=>r(e=>({muted:!e.muted})),setPaused:e=>r({paused:e}),togglePaused:()=>r(e=>({paused:!e.paused})),setMultiSelectMode:e=>r({multiSelectMode:e}),setEndStats:e=>r({endStats:e}),setEndTelemetry:e=>r({endTelemetry:e}),startGame:()=>r({screen:"playing",winner:null,paused:!1,endStats:null,endTelemetry:null})}));function Er(r){return r===null?"neutral":String(r)}const y0=1e4,b0=1500;class E0{metadata=null;snapshots=[];totalEvents=0;nextSnapshotAtMs=0;finalized=!1;sunOwnerChanges=0;sunCaptureTimeSec=null;leadReversals=0;lastLeaderKey=null;sunOwnershipWindows=[];activeSunWindowOwner=null;activeSunWindowStartSec=0;coordinatedAttackCount=0;fleetLaunchesByOwner={};recentLaunchesByOwner=new Map;planetTypeStats={sun:{captures:0,currentOwners:{}},homeworld:{captures:0,currentOwners:{}},gasGiant:{captures:0,currentOwners:{}},lavaWorld:{captures:0,currentOwners:{}},terran:{captures:0,currentOwners:{}},iceWorld:{captures:0,currentOwners:{}},dryTerran:{captures:0,currentOwners:{}},barren:{captures:0,currentOwners:{}}};configure(e,t){this.metadata=e,this.snapshots=[],this.totalEvents=0,this.nextSnapshotAtMs=0,this.finalized=!1,this.sunOwnerChanges=0,this.sunCaptureTimeSec=null,this.leadReversals=0,this.lastLeaderKey=null,this.sunOwnershipWindows.length=0,this.coordinatedAttackCount=0;for(const i of Object.keys(this.fleetLaunchesByOwner))delete this.fleetLaunchesByOwner[i];this.recentLaunchesByOwner.clear();for(const i of Object.keys(this.planetTypeStats))this.planetTypeStats[i]={captures:0,currentOwners:{}};this.capturePlanetOwnerSnapshot(t);const n=t.planets.find(i=>i.isSun);this.activeSunWindowOwner=n?.owner??null,this.activeSunWindowStartSec=0,this.tick(t)}recordEvent(e,t){if(this.totalEvents+=1,e.type==="fleet_launched"){const n=Er(e.fleet.owner);this.fleetLaunchesByOwner[n]=(this.fleetLaunchesByOwner[n]??0)+1;const i=this.recentLaunchesByOwner.get(n)??[],a=t.timeMs,s=i.filter(o=>a-o.timeMs<=b0);s.some(o=>o.toId===Number(e.fleet.toId)&&o.fromId!==Number(e.fleet.fromId))&&(this.coordinatedAttackCount+=1),s.push({timeMs:a,toId:Number(e.fleet.toId),fromId:Number(e.fleet.fromId)}),this.recentLaunchesByOwner.set(n,s);return}e.type==="planet_captured"&&(this.planetTypeStats[e.planet.type].captures+=1,e.planet.isSun&&(this.sunOwnerChanges+=1,this.sunCaptureTimeSec===null&&(this.sunCaptureTimeSec=t.timeMs/1e3),this.closeSunWindow(t.timeMs/1e3),this.activeSunWindowOwner=Number(e.newOwner),this.activeSunWindowStartSec=t.timeMs/1e3))}tick(e){if(!this.metadata||this.finalized)return;for(;e.timeMs>=this.nextSnapshotAtMs;)this.snapshots.push(this.buildSnapshot(e,this.nextSnapshotAtMs/1e3)),this.nextSnapshotAtMs+=y0;const t=this.getLeaderKey(e);t!==this.lastLeaderKey&&(this.lastLeaderKey!==null&&(this.leadReversals+=1),this.lastLeaderKey=t),this.capturePlanetOwnerSnapshot(e)}finalize(e){if(!this.metadata)throw new Error("TelemetryTracker configured before finalize");return this.finalized||(this.tick(e),this.closeSunWindow(e.timeMs/1e3),this.finalized=!0),{metadata:this.metadata,snapshots:[...this.snapshots],totalEvents:this.totalEvents,sunOwnerChanges:this.sunOwnerChanges,sunCaptureTimeSec:this.sunCaptureTimeSec,sunOwnershipWindows:[...this.sunOwnershipWindows],coordinatedAttackCount:this.coordinatedAttackCount,fleetLaunchesByOwner:{...this.fleetLaunchesByOwner},planetTypeStats:structuredClone(this.planetTypeStats),leadReversals:Math.max(0,this.leadReversals-1)}}buildSnapshot(e,t){const n={},i={};for(const s of e.planets){const o=Er(s.owner);n[o]=(n[o]??0)+s.units,i[o]=(i[o]??0)+1}for(const s of e.fleets){const o=Er(s.owner);n[o]=(n[o]??0)+s.units}const a=e.planets.find(s=>s.isSun)?.owner??null;return{timeSec:t,totalUnitsByOwner:n,planetCountByOwner:i,sunOwner:a===null?null:Number(a)}}getLeaderKey(e){const t=this.buildSnapshot(e,e.timeMs/1e3).totalUnitsByOwner;let n=null,i=-1/0;for(const[a,s]of Object.entries(t))a!=="neutral"&&s>i&&(i=s,n=a);return n}closeSunWindow(e){this.sunOwnershipWindows.push({owner:this.activeSunWindowOwner,startSec:this.activeSunWindowStartSec,endSec:e})}capturePlanetOwnerSnapshot(e){for(const t of Object.keys(this.planetTypeStats))this.planetTypeStats[t].currentOwners={};for(const t of e.planets){const n=Er(t.owner),i=this.planetTypeStats[t.type].currentOwners;i[n]=(i[n]??0)+1}}}class T0{analyze(e){const t=e.snapshots.map(l=>l.totalUnitsByOwner[0]??0),n=e.snapshots.map(l=>Object.entries(l.totalUnitsByOwner).filter(([c])=>c!=="0"&&c!=="neutral").reduce((c,[,u])=>c+u,0)),i=this.getMaxLeadRatio(t,n),a=e.sunOwnershipWindows.reduce((l,c)=>Math.max(l,c.endSec-c.startSec),0),s=Math.max(0,1-e.metadata.retryCount*.1),o={sunBalance:e.sunCaptureTimeSec===null?"Sun stayed neutral; no dominant sun swing observed.":a>60?"Sun ownership created a sustained advantage window.":"Sun changed hands often enough to stay contestable.",snowballRisk:i>=2.25?"High snowball risk detected from economy lead.":i>=1.5?"Moderate snowballing appeared but remained recoverable.":"Economy stayed relatively close throughout the match.",mapFairness:s<.5?"Map needed many retries before fairness validation passed.":"Map fairness looked stable from retry count and lead reversals.",aiCoordination:e.coordinatedAttackCount>0?`AI executed ${e.coordinatedAttackCount} coordinated attack windows.`:"No coordinated AI attack bursts were detected.",economy:e.leadReversals>1?"Lead changed multiple times, suggesting contested economies.":"Economy lead stayed mostly stable once established."};return{raw:e,verdicts:o,summaryLines:[`Auto-orient ${e.metadata.autoOrientAngle.toFixed(1)} deg, retries ${e.metadata.retryCount}.`,`Sun changes ${e.sunOwnerChanges}, first capture ${this.formatMaybeTime(e.sunCaptureTimeSec)}.`,`Lead reversals ${e.leadReversals}, max lead ratio ${i.toFixed(2)}x.`,`AI coordination windows ${e.coordinatedAttackCount}.`]}}getMaxLeadRatio(e,t){let n=1;for(let i=0;i<Math.max(e.length,t.length);i+=1){const a=e[i]??0,s=t[i]??0,o=Math.max(1,Math.min(a,s)),l=Math.max(a,s,1);n=Math.max(n,l/o)}return n}formatMaybeTime(e){return e===null?"never":`${e.toFixed(1)}s`}}class A0{constructor(e,t,n,i,a,s,o){this.canvas=e,this.difficulty=t,this.gameSpeed=n,this.mapSize=i,this.botCount=a,this.audio=s,this.callbacks=o}engine=null;renderer=null;input=null;cameraController=null;zoomControls=null;rotationControls=null;rafId=null;resizeObserver=null;lastTs=performance.now();worldBounds=null;autoOrientAngle=0;telemetryTracker=null;telemetryFinalized=!1;suppressContextMenu=e=>e.preventDefault();mount(){const e=Hs(this.canvas);this.engine=new dc({width:e.width,height:e.height,playerId:0,botCount:this.botCount,mapSize:this.mapSize,homeUnits:30},this.difficulty in tl?this.difficulty:"balanced"),this.renderer=new p0(this.canvas,this.engine.getState()),this.telemetryTracker=new E0,this.telemetryFinalized=!1;const t=this.engine.getState().planets;if(t.length>0){this.worldBounds=this.calculateWorldBounds(t);const n=t.find(i=>i.isSun);n&&this.renderer.getCamera().setPivot(n.x,n.y),this.autoOrientAngle=this.calculateAutoOrientAngle(this.engine.getState()),this.applyAutoOrientView(),this.telemetryTracker.configure({...this.engine.getMapMetadata(),autoOrientAngle:this.autoOrientAngle,worldBounds:this.worldBounds},this.engine.getState())}if(this.engine.on(n=>{this.renderer?.handleEvent(n);const i=this.engine?.getState();i&&this.telemetryTracker?.recordEvent(n,i),n.type==="fleet_launched"&&this.audio.play("fleetLaunch"),n.type==="fleet_arrived"&&(n.result.captured?this.audio.play(n.fleet.owner===0?"planetCaptured":"planetLost"):n.target.owner===n.fleet.owner?this.audio.play("fleetArriveReinforce"):this.audio.play("fleetArriveCombat")),n.type==="game_over"&&(this.audio.play(n.winner===0?"victory":"defeat"),this.finalizeTelemetry(),this.callbacks.onGameOver(Number(n.winner),this.engine.getStats()))}),this.input=new m0(this.canvas,{onFleetDispatch:(n,i)=>this.engine?.dispatchMultiFleet(n,i,0),getPlanetAt:n=>{const i=this.engine?.getState().planets??[];for(const a of i)if(rn(n,a)<a.radius+10)return a.id;return null},isOwnedByPlayer:n=>this.engine?.getState().planets.find(a=>a.id===n)?.owner===0,getPlanetsInBox:(n,i,a,s)=>{const o=this.engine?.getState().planets??[],l=[];for(const c of o)c.owner===0&&c.x>=n&&c.x<=a&&c.y>=i&&c.y<=s&&l.push(c.id);return l},getAllOwnedPlanetIds:()=>{const n=this.engine?.getState().planets??[],i=[];for(const a of n)a.owner===0&&i.push(a.id);return i},screenToWorld:(n,i)=>{const a=this.renderer?.getCamera();return a?a.screenToWorld(n,i):{x:n,y:i}}}),this.input.setSelectMode(Ve.getState().multiSelectMode),this.input.attach(),this.canvas.addEventListener("contextmenu",this.suppressContextMenu),this.renderer){this.cameraController=new g0(this.renderer.getCamera(),this.canvas,this.input,{onResetView:()=>this.applyAutoOrientView()}),this.cameraController.attach();const n=this.canvas.parentElement??document.body;this.zoomControls=new v0(this.renderer.getCamera(),n,()=>this.applyAutoOrientView()),this.rotationControls=new _0(this.renderer.getCamera(),n,()=>this.applyAutoOrientView())}this.startLoop(),this.startResizeObserver()}calculateWorldBounds(e){let t=1/0,n=1/0,i=-1/0,a=-1/0;for(const s of e)t=Math.min(t,s.x-s.radius),n=Math.min(n,s.y-s.radius),i=Math.max(i,s.x+s.radius),a=Math.max(a,s.y+s.radius);return{minX:t,minY:n,maxX:i,maxY:a}}destroy(){this.rafId!==null&&(cancelAnimationFrame(this.rafId),this.rafId=null),this.zoomControls?.destroy(),this.zoomControls=null,this.rotationControls?.destroy(),this.rotationControls=null,this.cameraController?.detach(),this.cameraController=null,this.input?.detach(),this.canvas.removeEventListener("contextmenu",this.suppressContextMenu),this.input=null,this.renderer?.destroy(),this.renderer=null,this.engine=null,this.telemetryTracker=null,this.resizeObserver?.disconnect(),this.resizeObserver=null}clearSelection(){this.input?.clearSelection()}selectAll(){this.input?.selectAll()}deselectAll(){this.input?.deselectAll()}recenterCamera(){this.applyAutoOrientView()}startLoop(){const e=t=>{const n=Math.min(34,t-this.lastTs);this.lastTs=t;const i=Ve.getState().paused;if(this.input?.setSelectMode(Ve.getState().multiSelectMode),this.cameraController?.updateArrowKeys(n),!i){const a=n*Kl[this.gameSpeed];this.engine?.tick(a)}this.engine&&this.telemetryTracker?.tick(this.engine.getState()),this.engine&&this.renderer&&(this.renderer.render(this.engine.getState(),n||It.frameDurationMs,this.input?.getDragState()??null,this.input?.getSelectedPlanetIds()??new Set,this.input?.getHoverPlanetId()??null,this.input?.getHoverPos()??null,this.input?.getHoverDurationMs(performance.now())??0,i,this.input?.getLassoState()??null),this.zoomControls?.sync(),this.rotationControls?.sync()),this.rafId=requestAnimationFrame(e)};this.rafId=requestAnimationFrame(e)}startResizeObserver(){const e=this.canvas.parentElement;e&&(this.resizeObserver=new ResizeObserver(()=>{const{width:t,height:n}=Hs(this.canvas);this.engine&&this.renderer&&(this.renderer.resize(t,n,this.engine.getState()),this.applyAutoOrientView())}),this.resizeObserver.observe(e))}applyAutoOrientView(){!this.renderer||!this.worldBounds||this.renderer.getCamera().fitBounds(this.worldBounds,100,this.autoOrientAngle)}calculateAutoOrientAngle(e){const t=e.planets.find(a=>a.isSun),n=e.planets.find(a=>a.isHomeworld&&a.owner===0);if(!t||!n)return 0;const i=Math.atan2(n.y-t.y,n.x-t.x)*180/Math.PI;return Mi(180-i)}finalizeTelemetry(){if(!this.engine||!this.telemetryTracker||this.telemetryFinalized)return;this.telemetryFinalized=!0;const e=this.telemetryTracker.finalize(this.engine.getState()),t=new T0().analyze(e);console.log("[Telemetry] Balance Summary");for(const n of t.summaryLines)console.log(n);console.log("[Telemetry] JSON",t),Ve.getState().setEndTelemetry(t)}}const Kn=300;class w0{constructor(e,t){this.onBack=t,this.container=document.createElement("div"),this.container.className="demoPlanetPage";const n=document.createElement("div");n.className="demoLayout";const i=document.createElement("div");i.className="demoPreview",this.previewCanvas=document.createElement("canvas"),this.previewCanvas.width=Kn,this.previewCanvas.height=Kn,this.previewCanvas.className="demoCanvas",this.previewCtx=this.previewCanvas.getContext("2d"),i.append(this.previewCanvas);const a=this.createControls();n.append(i,a),this.container.append(n),e.replaceChildren(this.container),this.rebuildPlanet(),this.startTime=performance.now(),this.animate()}container;previewCanvas;previewCtx;runtime=null;animFrameId=0;startTime=0;currentType="earth";currentSeed=Math.floor(Math.random()*999999999);currentPixels=100;currentRotation=0;createControls(){const e=document.createElement("div");e.className="demoControls",e.append(this.createLabel("PLANET TYPE:"));const t=document.createElement("select");t.className="demoSelect";for(const g of nl){const S=pt.find(p=>p.id===g)?.name??g,f=document.createElement("option");f.value=g,f.textContent=S.toUpperCase(),f.selected=g===this.currentType,t.append(f)}t.onchange=()=>{this.currentType=t.value,this.rebuildPlanet()},e.append(t),e.append(this.createLabel("SEED:"));const n=document.createElement("div");n.className="demoRow";const i=document.createElement("input");i.className="demoInput",i.type="number",i.value=String(this.currentSeed),i.onchange=()=>{this.currentSeed=Number(i.value),this.rebuildPlanet()};const a=document.createElement("button");a.className="demoBtn",a.textContent="RAND",a.onclick=()=>{this.currentSeed=Math.floor(Math.random()*999999999),i.value=String(this.currentSeed),this.rebuildPlanet()},n.append(i,a),e.append(n),e.append(this.createLabel("PIXELS:"));const s=document.createElement("div");s.className="demoRow";const o=document.createElement("span");o.className="demoValue",o.textContent=String(this.currentPixels);const l=document.createElement("input");l.type="range",l.className="demoSlider",l.min="20",l.max="300",l.value=String(this.currentPixels),l.oninput=()=>{this.currentPixels=Number(l.value),o.textContent=String(this.currentPixels),this.updatePixels()},s.append(l,o),e.append(s),e.append(this.createLabel("ROTATION:"));const c=document.createElement("div");c.className="demoRow";const u=document.createElement("input");u.type="range",u.className="demoSlider",u.min="-314",u.max="314",u.value=String(Math.round(this.currentRotation*100)),u.oninput=()=>{this.currentRotation=Number(u.value)/100,this.updateRotation()},c.append(u),e.append(c),e.append(document.createElement("hr"));const h=document.createElement("div");h.className="demoRow";const d=document.createElement("button");d.className="demoBtn",d.textContent="EXPORT PNG",d.onclick=()=>this.exportPng(),h.append(d),e.append(h),e.append(document.createElement("hr"));const m=document.createElement("button");return m.className="demoBtn demoBackBtn",m.textContent="← BACK TO MENU",m.onclick=()=>this.onBack(),e.append(m),e}createLabel(e){const t=document.createElement("div");return t.className="demoLabel",t.textContent=e,t}rebuildPlanet(){this.runtime?.destroy(),this.runtime=null;const e=this.frustumForType(this.currentType),t={variationSeed:this.currentSeed,frustumScale:e,pixels:this.currentPixels,rotation:this.currentRotation};this.runtime=Is(this.currentType,Kn,t),this.startTime=performance.now()}updatePixels(){if(this.runtime)for(const e of this.runtime.materials)e.uniforms.pixels&&(e.uniforms.pixels.value=this.currentPixels)}updateRotation(){if(this.runtime)for(const e of this.runtime.materials)e.uniforms.rotation&&(e.uniforms.rotation.value=this.currentRotation)}frustumForType(e){switch(e){case"gasgiantring":return 1.1;case"star":return 1.3;case"asteroid":return .8;default:return .55}}animate=()=>{if(this.animFrameId=requestAnimationFrame(this.animate),!this.runtime)return;const e=(performance.now()-this.startTime)*.001;this.runtime.update(e),this.previewCtx.clearRect(0,0,Kn,Kn),this.previewCtx.drawImage(this.runtime.image,0,0,Kn,Kn)};exportPng(){if(!this.runtime)return;const e=document.createElement("a");e.download=`planet_${this.currentType}_${this.currentSeed}.png`,e.href=this.previewCanvas.toDataURL("image/png"),e.click()}destroy(){cancelAnimationFrame(this.animFrameId),this.runtime?.destroy(),this.runtime=null}}function Ls(r,e,t,n){r.gain.setValueAtTime(1e-4,e),r.gain.exponentialRampToValueAtTime(Math.max(t,1e-4),e+.01),r.gain.exponentialRampToValueAtTime(1e-4,e+n)}function Pt(r,e,t,n,i,a,s){const o=r.createOscillator(),l=r.createGain();o.type=i,o.frequency.setValueAtTime(t,s),o.connect(l),l.connect(e),Ls(l,s,a,n),o.start(s),o.stop(s+n+.02)}function C0(r,e,t,n){const i=r.createBuffer(1,Math.floor(r.sampleRate*t),r.sampleRate),a=i.getChannelData(0);for(let c=0;c<a.length;c+=1)a[c]=Math.random()*2-1;const s=r.createBufferSource();s.buffer=i;const o=r.createBiquadFilter();o.type="lowpass",o.frequency.setValueAtTime(300,n);const l=r.createGain();s.connect(o),o.connect(l),l.connect(e),Ls(l,n,.12,t),s.start(n)}function R0(r,e,t,n){switch(r){case"fleetLaunch":{const i=e.createOscillator(),a=e.createGain();i.type="triangle",i.frequency.setValueAtTime(200,n),i.frequency.exponentialRampToValueAtTime(800,n+.1),i.connect(a),a.connect(t),Ls(a,n,.05,.11),i.start(n),i.stop(n+.12);return}case"fleetArriveReinforce":Pt(e,t,600,.15,"sine",.08,n);return;case"fleetArriveCombat":C0(e,t,.05,n);return;case"planetCaptured":Pt(e,t,400,.08,"sine",.2,n),Pt(e,t,600,.12,"sine",.22,n+.11);return;case"planetLost":Pt(e,t,500,.08,"sine",.2,n),Pt(e,t,300,.12,"sine",.2,n+.11);return;case"victory":Pt(e,t,400,.1,"sine",.25,n),Pt(e,t,500,.1,"sine",.25,n+.15),Pt(e,t,700,.12,"sine",.25,n+.3);return;case"defeat":Pt(e,t,500,.12,"sine",.22,n),Pt(e,t,400,.12,"sine",.22,n+.14),Pt(e,t,250,.14,"sine",.22,n+.28);return;case"uiClick":Pt(e,t,1e3,.03,"square",.04,n);return;case"uiHover":Pt(e,t,1200,.02,"square",.02,n);return;case"selectPlanet":Pt(e,t,500,.06,"sine",.03,n);return;default:return}}class P0{ctx=null;masterGain=null;enabled=!0;volume=.3;init(){if(this.ctx){this.ctx.state==="suspended"&&this.ctx.resume().catch(()=>{});return}const e=window.AudioContext??window.webkitAudioContext;e&&(this.ctx=new e,this.masterGain=this.ctx.createGain(),this.masterGain.gain.value=this.volume,this.masterGain.connect(this.ctx.destination))}play(e){!this.enabled||!this.ctx||!this.masterGain||R0(e,this.ctx,this.masterGain,this.ctx.currentTime)}setVolume(e){this.volume=Math.max(0,Math.min(1,e)),this.masterGain&&(this.masterGain.gain.value=this.volume)}setMuted(e){this.enabled=!e}toggleMute(){this.enabled=!this.enabled}destroy(){this.ctx&&this.ctx.close().catch(()=>{}),this.ctx=null,this.masterGain=null}}class D0{constructor(e){this.root=e,this.container=document.createElement("div"),this.container.className="appRoot",this.canvasEl=document.createElement("canvas"),this.canvasEl.className="gameCanvas",this.overlayEl=document.createElement("div"),this.overlayEl.className="overlayLayer",this.helpButton=document.createElement("button"),this.helpButton.className="ingameHelpButton",this.helpButton.textContent="?",this.helpButton.onclick=()=>this.openHelp(),this.muteButton=document.createElement("button"),this.muteButton.className="hudToggleButton",this.muteButton.onclick=()=>{this.audio.init(),Ve.getState().toggleMuted(),this.audio.play("uiClick")},this.multiSelectButton=document.createElement("button"),this.multiSelectButton.className="hudToggleButton selectModeBtn",this.multiSelectButton.onclick=()=>{this.audio.init(),Ve.getState().setMultiSelectMode(!Ve.getState().multiSelectMode),this.audio.play("uiClick")},this.selectAllButton=document.createElement("button"),this.selectAllButton.className="hudToggleButton selectAllBtn",this.selectAllButton.textContent="[ALL]",this.selectAllButton.onclick=()=>{this.audio.init(),this.gameCanvas?.selectAll(),this.audio.play("uiClick")},this.deselectAllButton=document.createElement("button"),this.deselectAllButton.className="hudToggleButton deselectAllBtn",this.deselectAllButton.textContent="[NONE]",this.deselectAllButton.onclick=()=>{this.audio.init(),this.gameCanvas?.deselectAll(),this.audio.play("uiClick")},this.container.append(this.canvasEl,this.overlayEl,this.helpButton,this.muteButton,this.selectAllButton,this.deselectAllButton,this.multiSelectButton)}gameCanvas=null;demoPage=null;bgPlanet=null;bgCanvas=null;bgAnimId=0;bgStartTime=0;audio=new P0;container;canvasEl;overlayEl;helpButton;muteButton;multiSelectButton;selectAllButton;deselectAllButton;mount(){this.root.replaceChildren(this.container),Ve.subscribe(e=>this.renderFromState(e)),window.addEventListener("keydown",this.handleKeyDown),this.renderFromState(Ve.getState())}renderFromState(e){this.render(e.screen,e.difficulty,e.winner,e.gameSpeed,e.mapSize,e.players,e.muted,e.multiSelectMode,e.endStats,e.endTelemetry)}render(e,t,n,i,a,s,o,l,c,u){this.audio.setMuted(o);const h=s.filter(d=>d.isBot).length;e==="playing"&&!this.gameCanvas&&(this.gameCanvas=new A0(this.canvasEl,t,i,a,h,this.audio,{onGameOver:(d,m)=>{Ve.getState().setWinner(d),Ve.getState().setEndStats(m),Ve.getState().setScreen(d===0?"victory":"defeat")}}),this.gameCanvas.mount()),e!=="playing"&&this.gameCanvas&&(this.gameCanvas.destroy(),this.gameCanvas=null),e==="demo"&&!this.demoPage&&(this.demoPage=new w0(this.overlayEl,()=>{Ve.getState().setScreen("menu")})),e!=="demo"&&this.demoPage&&(this.demoPage.destroy(),this.demoPage=null),e==="menu"?this.ensureBgPlanet():this.destroyBgPlanet(),this.helpButton.style.display=e==="playing"?"block":"none",this.muteButton.style.display=e==="playing"?"block":"none",this.muteButton.textContent=o?"[SFX OFF]":"[SFX ON]",this.selectAllButton.style.display=e==="playing"?"block":"none",this.deselectAllButton.style.display=e==="playing"?"block":"none",this.multiSelectButton.style.display=e==="playing"?"block":"none",this.multiSelectButton.textContent=l?"[MULTI ON]":"[MULTI OFF]",e!=="demo"&&this.overlayEl.replaceChildren(this.buildScreen(e,n,t,i,a,s,c,u))}ensureBgPlanet(){if(this.bgPlanet)return;const e=nl.filter(a=>a!=="asteroid"),t=e[Math.floor(Math.random()*e.length)],n=400,i=t==="star"?1.3:t==="gasgiantring"?1.1:.55;this.bgPlanet=Is(t,n,{variationSeed:Math.random()*999999,frustumScale:i,pixels:100}),this.bgPlanet&&(this.bgCanvas=document.createElement("canvas"),this.bgCanvas.className="menuBgCanvas",this.bgCanvas.width=n,this.bgCanvas.height=n,this.bgStartTime=performance.now(),this.animateBg())}animateBg=()=>{if(this.bgAnimId=requestAnimationFrame(this.animateBg),!this.bgPlanet||!this.bgCanvas)return;const e=(performance.now()-this.bgStartTime)*.001;this.bgPlanet.update(e);const t=this.bgCanvas.getContext("2d");t&&(t.clearRect(0,0,this.bgCanvas.width,this.bgCanvas.height),t.drawImage(this.bgPlanet.image,0,0))};destroyBgPlanet(){cancelAnimationFrame(this.bgAnimId),this.bgPlanet?.destroy(),this.bgPlanet=null,this.bgCanvas=null}buildScreen(e,t,n,i,a,s,o,l){return e==="playing"||e==="demo"?document.createElement("div"):e==="menu"?this.buildMenuScreen(n,i,a,s):e==="help"?this.buildHelpScreen():this.buildEndScreen(e,t,o,l)}buildMenuScreen(e,t,n,i){const a=this.overlay("menuScreen");if(this.bgCanvas){const h=document.createElement("div");h.className="menuBgWrap",h.append(this.bgCanvas),a.append(h)}const s=document.createElement("div");s.className="menuContent",s.innerHTML=`
      <div class="menuHeader">
        <div class="menuTag">DISCORD ACTIVITY</div>
        <h1 class="menuTitle">NODE WARS</h1>
        <div class="menuSubtitle">Galactic Conquest</div>
        <div class="divider"></div>
      </div>
    `;const o=document.createElement("div");o.className="menuSettingsRow",o.append(this.selectSetting("Difficulty",[{label:"Easy",value:"passive"},{label:"Normal",value:"balanced"},{label:"Hard",value:"aggressive"}],e,h=>Ve.getState().setDifficulty(h)),this.selectSetting("Speed",[{label:"Slowest",value:"slowest"},{label:"Slow",value:"slow"},{label:"Normal",value:"normal"},{label:"Fast",value:"fast"},{label:"Fastest",value:"fastest"}],t,h=>Ve.getState().setGameSpeed(h)),this.selectSetting("Map",[{label:"Small",value:"small"},{label:"Medium",value:"medium"},{label:"Large",value:"large"}],n,h=>Ve.getState().setMapSize(h))),s.append(o);const l=this.buildPlayerPanel(i);s.append(l);const c=document.createElement("div");c.className="menuActions";const u=this.button("▶  Start Game","primary",()=>{this.audio.init(),Ve.getState().startGame()});return i.length<2&&(u.disabled=!0,u.title="Need at least 2 players"),c.append(u,this.button("?  How to Play","secondary",()=>Ve.getState().setScreen("help")),this.button("◎  Demo Planet","secondary",()=>Ve.getState().setScreen("demo"))),s.append(c),a.append(s),a}buildPlayerPanel(e){const t=document.createElement("div");t.className="playerPanel";const n=document.createElement("div");n.className="playerPanelHeader";const i=document.createElement("div");i.className="playerPanelTitle",i.innerHTML=`<span class="playerPanelLabel">Players</span><span class="playerPanelCount">${e.length} / 8</span>`;const a=document.createElement("div");a.className="botControls";const s=document.createElement("span");s.className="botControlsLabel",s.textContent="Bots";const o=document.createElement("button");o.className="botStepBtn",o.textContent="−",o.disabled=el(Ve.getState())<=0,o.onclick=()=>{this.audio.init(),this.audio.play("uiClick"),Ve.getState().removeBot()};const l=document.createElement("span");l.className="botStepCount",l.textContent=String(el(Ve.getState()));const c=document.createElement("button");c.className="botStepBtn",c.textContent="+",c.disabled=e.length>=8,c.onclick=()=>{this.audio.init(),this.audio.play("uiClick"),Ve.getState().addBot()},a.append(s,o,l,c),n.append(i,a),t.append(n);const u=document.createElement("div");u.className="playerList";for(const h of e)u.append(this.buildPlayerRow(h));return t.append(u),t}buildPlayerRow(e){const t=Bt.teamColors[e.colorIndex]??Bt.teamColors[0],n=document.createElement("div");n.className="playerRow";const i=document.createElement("div");i.className="playerAvatar",i.style.background=t.dark,i.style.borderColor=t.main,i.innerHTML=`<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="9" r="4" fill="${t.main}" opacity="0.7"/><path d="M12 14c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z" fill="${t.main}" opacity="0.5"/></svg>`;const a=document.createElement("span");a.className="playerName",a.textContent=e.name;const s=document.createElement("button");return s.className="colorSwatch",s.style.background=t.main,s.title="Change team color",s.onclick=()=>{this.audio.init(),this.audio.play("uiClick"),Ve.getState().cyclePlayerColor(e.id)},n.append(i,a,s),n}buildHelpScreen(){const e=this.overlay("helpScreen");return e.innerHTML=`
      <div class="helpBody">
        <h2 class="helpTitle">HOW TO PLAY</h2>
        <ul class="helpList">
          <li><b>CAPTURE PLANETS</b> Planets generate units. Capture all planets to win.</li>
          <li><b>SEND FLEETS</b> Drag from your planet to a target to send 55% units.</li>
          <li><b>COMBAT</b> Attackers subtract defenders. If attackers remain, planet is captured.</li>
          <li><b>STRATEGY</b> Larger planets produce faster, but overextending loses games.</li>
          <li><b>AVATARS</b> Planet interiors are avatar-ready placeholders for Discord integration.</li>
          <li><b>DIFFICULTY</b> Easy teaches flow, Normal is fair, Hard is ruthless AI pressure.</li>
        </ul>
      </div>
    `,e.append(this.button("← Back","secondary",()=>Ve.getState().setScreen("menu"))),e}buildEndScreen(e,t,n,i){const a=e==="victory",s=this.overlay(a?"victoryScreen":"defeatScreen"),o=a?Bt.player.main:Bt.enemy.main,l=a?"CONQUEST COMPLETE":"SYSTEMS OVERWHELMED",c=a?"VICTORY":"DEFEAT";s.innerHTML=`
      <div class="endTag" style="color:${o}">${l}</div>
      <h2 class="endTitle">${c}</h2>
      <div class="divider" style="background: linear-gradient(90deg, transparent, ${o}, transparent)"></div>
      <div class="winnerText">${t===0?"You dominate the sector.":"Bot controls the sector."}</div>
    `,s.append(this.buildStatsReport(n)),s.append(this.buildTelemetryReport(i));const u=document.createElement("div");return u.className="controls",u.append(this.button(a?"Play Again":"Try Again","secondary",()=>Ve.getState().startGame()),this.button("Menu","secondary",()=>Ve.getState().setScreen("menu"))),s.append(u),s}overlay(e){const t=document.createElement("div");return t.className=`screenOverlay ${e}`,t}button(e,t,n){const i=document.createElement("button");return i.className=`actionButton ${t}`,i.textContent=e,i.onmouseenter=()=>this.audio.play("uiHover"),i.onclick=()=>{this.audio.init(),this.audio.play("uiClick"),n()},i}selectSetting(e,t,n,i){const a=document.createElement("label");a.className="settingRow";const s=document.createElement("span");s.className="settingLabel",s.textContent=e;const o=document.createElement("select");o.className="settingSelect";for(const l of t){const c=document.createElement("option");c.value=l.value,c.text=l.label,c.selected=l.value===n,o.append(c)}return o.onchange=()=>{this.audio.init(),this.audio.play("uiClick"),i(o.value)},a.append(s,o),a}startGameWithDifficulty(e){this.audio.init(),Ve.getState().setDifficulty(e),Ve.getState().startGame()}openHelp(){this.audio.init(),Ve.getState().setScreen("help")}handleKeyDown=e=>{const t=Ve.getState();if(e.key==="Escape"){if(t.screen==="help"||t.screen==="demo"){Ve.getState().setScreen("menu");return}if(t.screen==="victory"||t.screen==="defeat"){Ve.getState().setScreen("menu");return}this.gameCanvas?.clearSelection();return}if(e.key===" "&&t.screen==="playing"){e.preventDefault(),this.gameCanvas?.recenterCamera();return}if(e.key.toLowerCase()==="p"&&t.screen==="playing"){e.preventDefault(),Ve.getState().togglePaused();return}if(e.key.toLowerCase()==="m"){Ve.getState().toggleMuted();return}if(e.key.toLowerCase()==="h"){t.screen==="help"?Ve.getState().setScreen("menu"):Ve.getState().setScreen("help");return}if(e.key.toLowerCase()==="a"&&e.ctrlKey&&t.screen==="playing"){e.preventDefault(),this.audio.init(),this.gameCanvas?.selectAll(),this.audio.play("uiClick");return}if(e.key.toLowerCase()==="d"&&e.ctrlKey&&t.screen==="playing"){e.preventDefault(),this.audio.init(),this.gameCanvas?.deselectAll(),this.audio.play("uiClick");return}};buildStatsReport(e){const t=document.createElement("div");if(t.className="statsReport",!e)return t;const n=[["Duration",this.fmtDur(e.player.gameDuration),""],["Fleets",String(e.player.fleetsLaunched),`Bot: ${e.enemy.fleetsLaunched}`],["Units Produced",Bn(e.player.unitsProduced),`Bot: ${Bn(e.enemy.unitsProduced)}`],["Units Destroyed",Bn(e.player.unitsKilled),`Bot: ${Bn(e.enemy.unitsKilled)}`],["Planets Captured",String(e.player.planetsCaptured),`Bot: ${e.enemy.planetsCaptured}`],["Peak Control",`${e.player.peakPlanets}`,`Bot: ${e.enemy.peakPlanets}`]],i=document.createElement("div");return i.className="statsTitle",i.textContent="BATTLE REPORT",t.append(i),n.forEach(([a,s,o],l)=>{const c=document.createElement("div");c.className="statsRow",c.style.animationDelay=`${l*150}ms`,c.innerHTML=`<span class="statsLabel">${a}</span><span class="statsValue">${s}</span><span class="statsCompare">${o}</span>`,t.append(c)}),t}buildTelemetryReport(e){const t=document.createElement("details");if(t.className="telemetryReport",!e)return t;const n=document.createElement("summary");n.textContent="Balance Data",t.append(n);const i=document.createElement("div");i.className="telemetryVerdicts";for(const[s,o]of Object.entries(e.verdicts)){const l=document.createElement("div");l.className="telemetryRow",l.innerHTML=`<span class="telemetryLabel">${s}</span><span class="telemetryValue">${o}</span>`,i.append(l)}const a=document.createElement("div");a.className="telemetryNotes";for(const s of e.summaryLines){const o=document.createElement("div");o.className="telemetryNote",o.textContent=s,a.append(o)}return t.append(i,a),t}fmtDur(e){const t=Math.floor(e/60),n=Math.floor(e%60);return`${t}:${String(n).padStart(2,"0")}`}}async function I0(){await document.fonts.ready;const r=document.querySelector("#app");if(!r)throw new Error("Missing #app root");new D0(r).mount()}I0();
