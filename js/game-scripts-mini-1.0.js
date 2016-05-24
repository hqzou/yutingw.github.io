(function(e,t,n){e.Happy=qc.Happy={SIZE:100,ROW:6,COL:6,FirstLEVEL:10,SECONDLEVEL:20,uiEvent:new qc.Signal,onClick:new qc.Signal,e:new qc.Signal,isNew:!1},qc.initGame=function(e){e.log.trace("开始游戏"),Happy.game=e,qc.Happy.me=new qc.Happy.Me};var r=qc.defineBehaviour("qc.Happy.Guide",qc.Behaviour,function(){},{sureBtn:qc.Serializer.NODE,gameScene:qc.Serializer.NODE});r.prototype.awake=function(){this.addListener(this.sureBtn.onClick,this.startGame,this),this.addListener(qc.Happy.uiEvent,function(e){e==="guide"&&this.guide()},this)},r.prototype.startGame=function(){this.gameScene.visible=!0,this.gameObject.visible=!1},r.prototype.guide=function(){var e=this.gameObject.getScript("qc.TweenPosition");e.resetToBeginning(),e.playForward()};var i=qc.defineBehaviour("qc.Happy.Brick",qc.Behaviour,function(){this.index=null,this.type=null,this.becomeBigFlag=!1},{sourceParent:qc.Serializer.NODE,flyScore:qc.Serializer.NODE});i.prototype.awake=function(){var e=this;this.gameObject.scripts.forEach(function(t){t.flag==="move"?e.moveTween=t:t.flag==="merge"&&(e.mergeTween=t)}),this.addListenerOnce(qc.Happy.onClick,function(e){this.move(e)},this),this.addListener(qc.Happy.uiEvent,function(e){arguments[0]==="startMerge"&&this.moveToDes(arguments[1],arguments[2],arguments[3])},this),this.addListener(qc.Happy.uiEvent,function(e){arguments[0]===this.index&&this.becomeBig(arguments[0],arguments[1])},this)},i.prototype.move=function(e){this.gameObject.switchParent(this.sourceParent);var t=qc.Happy.SIZE,n=e,r=this.game.math.floorTo(n.x/t),i=this.game.math.floorTo(n.y/t);this.index=i*qc.Happy.COL+r,this.type=h.getNum(this.gameObject.frame)*1,this.gameObject.setAnchor(new qc.Point(0,0),new qc.Point(0,0));var s=this.gameObject.getScript("qc.TweenPosition");s.setCurrToStartValue(),s.to=new qc.Point(50+t*r,50+t*i);var o=h.distance(s.from,s.to);s.duration=o*.001,s.onFinished.addOnce(this.finishMove,this),s.resetToBeginning(),s.playForward()},i.prototype.finishMove=function(){qc.Happy.uiEvent.dispatch("finishMove",this)},i.prototype.moveToDes=function(e,t,n){this.arg1Script=e;var n=n;if(this.index===e.index)return;for(var r=0;r<t.length;r++)if(this.index===t[r]){var i=this.mergeTween;i.setCurrToStartValue(),i.to=new qc.Point(e.gameObject.x,e.gameObject.y),i.duration=h.distance(i.from,i.to)*.005,r+1===t.length&&i.onFinished.addOnce(function(){qc.Happy.uiEvent.dispatch(this.arg1Script.index,n)},this),i.resetToBeginning(),i.playForward()}},i.prototype.becomeBig=function(e,t){var n=this.gameObject.getScript("qc.TweenScale");n.onFinished.addOnce(function(){qc.Happy.uiEvent.dispatch("setType",e),this.flyScore.text="+"+t,this.flyScore.switchParent(this.gameObject),this.flyScore.setAnchor(new qc.Point(0,0),new qc.Point(0,0)),this.flyScore.anchoredX=0,this.flyScore.anchoredY=0;var n=this.flyScore.getScript("qc.TweenPosition");n.setCurrToStartValue(),n.to=new qc.Point(n.from.x,n.from.y-100),n.onFinished.addOnce(function(){this.flyScore.text=""},this),n.resetToBeginning(),n.playForward()},this),n.resetToBeginning(),n.playForward()},i.prototype.disappearScore=function(){var e=this.flyScore.getScript("qc.TweenAlpha");e.resetToBeginning(),e.playForward()};var s=qc.defineBehaviour("qc.Happy.BrickPool",qc.Behaviour,function(){this.frameArray=["black1","white2","green3"]},{brick:qc.Serializer.PREFAB});s.prototype.awake=function(){this.produceBrick(),this.addListener(qc.Happy.uiEvent,function(e){e==="finishMove"&&this.produceBrick()},this),this.addListener(qc.Happy.uiEvent,function(e){e==="restart"&&this.restart()},this)},s.prototype.produceBrick=function(){var e=h.random(0,2),t=this.gameObject.find("source");t||(t=this.game.add.clone(this.brick,this.gameObject)),t.frame=this.frameArray[e]+".png"},s.prototype.restart=function(){this.produceBrick()};var o=qc.defineBehaviour("qc.Happy.GameOver",qc.Behaviour,function(){},{currentScore:qc.Serializer.NODE,bestScore:qc.Serializer.NODE,retryBtn:qc.Serializer.NODE,"new":qc.Serializer.NODE});o.prototype.awake=function(){this.addListener(qc.Happy.uiEvent,function(e){e==="gameOver"&&this.gameOver()},this),this.addListener(this.retryBtn.onClick,function(){this.gameObject.visible=!1,qc.Happy.uiEvent.dispatch("restart"),qc.Happy.e.dispatch("restart")},this)},o.prototype.gameOver=function(){this.gameObject.visible=!0,qc.Happy.isNew?this.new.visible=!0:this.new.visible=!1,qc.Happy.isNew=!1,this.currentScore.text=""+qc.Happy.me.current,this.bestScore.text=""+qc.Happy.me.best};var u=qc.Happy.Me=function(){this._current=0,this._best=0,Happy.game.storage.get("best")&&(this._best=Happy.game.storage.get("best")),qc.Happy.e.add(function(e){e==="restart"&&this.reset()},this)};u.prototype={},u.prototype.constructor=u,t.defineProperties(u.prototype,{current:{get:function(){return this._current},set:function(e){if(this._current===e)return;this._current=e,this.best<e&&(qc.Happy.isNew=!0,this.best=e),qc.Happy.uiEvent.dispatch("updateScore",this._current)}},best:{get:function(){return this._best},set:function(e){this._best=e,Happy.game.storage.set("best",e),Happy.game.storage.save()}}}),u.prototype.addScore=function(e){if(typeof e!="number"||e<=0)return;this.current=this._current+e},u.prototype.reset=function(){this.current=0};var a=qc.defineBehaviour("qc.Happy.Panel",qc.Behaviour,function(){this.runInEditor=!0},{});a.prototype.awake=function(){this.drawPanel()},a.prototype.drawPanel=function(){var e=qc.Happy.ROW,t=qc.Happy.COL,n=qc.Happy.SIZE;this.gameObject.lineStyle(1,16711680,1);for(var r=0;r<=e;r++)this.gameObject.moveTo(0,r*n),this.gameObject.lineTo(n*t,r*n);for(var i=0;i<=t;i++)this.gameObject.moveTo(i*n,0),this.gameObject.lineTo(i*n,n*t)};var f=qc.defineBehaviour("qc.Happy.PanelUI",qc.Behaviour,function(){this.data=[],this._bricks={},this.currIndex=null},{brick:qc.Serializer.PREFAB,redBrick:qc.Serializer.PREFAB,source:qc.Serializer.NODE,redBrickParent:qc.Serializer.NODE,flyScore:qc.Serializer.NODE});f.prototype.awake=function(){this.addListener(qc.Happy.uiEvent,function(e){e==="finishMove"&&(this._bricks[arguments[1].index]=arguments[1],this.data[arguments[1].index]=arguments[1].type,this.currIndex=arguments[1].index,this.findResult())},this),this.addListener(qc.Happy.uiEvent,function(e){if(e!=="setType")return;this.setType(arguments[1])},this),this.addListener(qc.Happy.uiEvent,function(e){e==="restart"&&this.restart()},this),this.reset(),this.init()},f.prototype.reset=function(){for(var e=0;e<36;e++)this.data[e]=0},f.prototype.init=function(){var e=[],t,n;for(t=0;t<=35;t++)e[t]=t;for(t=0;t<7;t++){n=this.game.math.random(0,35-t);var r=qc.Happy.SIZE,i=this.game.add.clone(this.redBrick,this.redBrickParent),s=Math.floor(e[n]/qc.Happy.ROW),o=e[n]%qc.Happy.COL;i.frame="red5.png",i.resetNativeSize(),i.x=o*r+r/2,i.y=s*r+r/2,this.data[e[n]]=7;var u=e.indexOf(e[n]);e.splice(u,1)}},f.prototype.onClick=function(e){var t=e.source.x,n=e.source.y,r=qc.Happy.SIZE,i=this.gameObject.toLocal(new qc.Point(t,n)),s=this.game.math.floorTo(i.x/r),o=this.game.math.floorTo(i.y/r),u=o*qc.Happy.COL+s;if(this.data[u]!==0){this.game.log.trace("重复点击");return}this.gameObject.interactive=!1,qc.Happy.onClick.dispatch(i)},f.prototype.findResult=function(){var e=h.findResult(this.data);this.isFull()&&e.length===0&&qc.Happy.uiEvent.dispatch("gameOver");if(e.length===0){this.gameObject.interactive=!0;return}var t,n=this.data[e[0]];switch(n){case 1:t=qc.Happy.FirstLEVEL*e.length;break;case 2:t=qc.Happy.FirstLEVEL*e.length;break;case 3:t=qc.Happy.FirstLEVEL*e.length;break;case 4:t=qc.Happy.SECONDLEVEL*e.length;break;case 5:t=qc.Happy.SECONDLEVEL*e.length;break;case 6:t=qc.Happy.SECONDLEVEL*e.length;break;default:}qc.Happy.me.addScore(t);var r=e;if(r.length>=3){var i=r.indexOf(this.currIndex),s=r[i];r.splice(i,1),this.otherIndex=r,qc.Happy.uiEvent.dispatch("startMerge",this._bricks[s],r,t)}},f.prototype.setType=function(e){var t=this._bricks[e].type;switch(t){case 1:this.data[e]=4,this._bricks[e].type=4;break;case 2:this.data[e]=5,this._bricks[e].type=5;break;case 3:this.data[e]=6,this._bricks[e].type=6;break;case 4:this.data[e]=7,this._bricks[e].type=7,this._bricks[e].gameObject.frame="red5.png";break;case 5:this.data[e]=8,this._bricks[e].type=8,this._bricks[e].gameObject.frame="red5.png";break;case 6:this.data[e]=9,this._bricks[e].type=9,this._bricks[e].gameObject.frame="red5.png";break;default:}this.otherIndex.forEach(function(e){this.data[e]=0,this._bricks[e].gameObject.destroy()},this),this.findResult(),this.gameObject.interactive=!0},f.prototype.isFull=function(){for(var e=0;e<36;e++)if(this.data[e]===0)return!1;return!0},f.prototype.restart=function(){var e=this.source.children,t=this.redBrickParent.children,n;this.flyScore.switchParent(this.gameObject),e.forEach(function(e){e.destroy()});for(n in t)t[n].destroy();this.reset(),this.init()};var l=qc.defineBehaviour("qc.Happy.ScoreUI",qc.Behaviour,function(){qc.Happy.score=this},{});l.prototype.awake=function(){this.gameObject._tempText=0,t.defineProperties(this.gameObject,{tempText:{get:function(){return this._tempText},set:function(e){if(this._tempText===e)return;this._tempText=e,this.text=Math.floor(e)+""}}}),this.addListener(qc.Happy.uiEvent,function(e){if(e!=="updateScore")return;this.updateScore(arguments[1])},this)},l.prototype.updateScore=function(e){var t=this.gameObject.getScript("qc.TweenProperty");t.setCurrToStartValue(),t.to=e,t.resetToBeginning(),t.playForward()};var c=qc.defineBehaviour("qc.Happy.Welcome",qc.Behaviour,function(){},{startBtn:qc.Serializer.NODE});c.prototype.awake=function(){this.addListener(this.startBtn.onClick,this.startGuide,this)},c.prototype.startGuide=function(){this.gameObject.visible=!1,qc.Happy.uiEvent.dispatch("guide")};var h={};h.random=function(e,t){e=e||0,t=t||0;var n=t-e+1,r=Math.random()*n;return Math.floor(r)+e},h.distance=function(e,t){e=e||0,t=t||0;var n=e.x-t.x,r=e.y-t.y;return Math.pow(n*n+r*r,.5)},h.getNum=function(e){return e.replace(/[^0-9]/ig,"")},h.findResult=function(e,t,n,r){var i,s=[],o,u,a,f,l,c,h,p,d,v,m,g,y,b,w=[],E=[];t=t||6,n=n||6,r=r||2;var S=function(e,n){return e*t+n};for(o=0;o<n;o++){s.push([]);for(u=0;u<t;u++)s[o].push({type:e[S(o,u)]})}for(o=0;o<n;o++){h=-1;for(u=0;u<=t;u++){d=s[o][u]||{},p=d.type;if(p!==h){for(a=u-1;a>=0;a--){if(s[o][a].type!==h)break;s[o][a].hc=c}c=1,h=p}else p===0||p===7||p===8||p===9?c=1:c++}}for(u=0;u<t;u++){h=-1;for(o=0;o<=n;o++){d=o==n?{}:s[o][u],p=d.type;if(p!==h){for(a=o-1;a>=0;a--){if(s[a][u].type!==h)break;s[a][u].vc=c}c=1,h=p}else p===0||p===7||p===8||p===9?c=1:c++}}for(o=0;o<n;o++)for(u=0;u<t;u++){d=s[o][u];if(d.hc<r&&d.vc<r)continue;if(d.visited)continue;i=[],E=[S(o,u)],i.push([o,u]),d.visited=!0,f=0,l=1,p=d.type;while(f<l)v=i[f][0],m=i[f][1],f++,[[-1,0],[1,0],[0,-1],[0,1]].forEach(function(e){g=v+e[0],y=m+e[1];if(!s[g])return;if(!(b=s[g][y]))return;if(b.visited||b.type!==p||b.hc<r&&b.vc<r)return;i.push([g,y]),l++,b.visited=!0,E.push(S(g,y))});w.push(E)}for(o=0;o<w.length;o++)if(w[o].length>=3)return w[o];return[]}}).call(this,this,Object)