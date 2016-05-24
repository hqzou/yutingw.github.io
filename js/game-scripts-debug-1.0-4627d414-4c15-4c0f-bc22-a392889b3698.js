/**
 * 用户自定义脚本.
 */
(function(window, Object, undefined) {

/**
 * Created by zouhq on 2016/5/18.
 */
window.Happy = qc.Happy = {

	//每个格子的大小
	SIZE: 100,

	//行，列
	ROW: 6,
	COL: 6,

	//每级的分数
	FirstLEVEL: 10,

	SECONDLEVEL: 20,

	//ui事件
	uiEvent: new qc.Signal(),

	//点击事件
	onClick: new qc.Signal(),

	//全局事件
	e: new qc.Signal(),

	//最高分显示标志位
	isNew: false
};

qc.initGame = function(game){
	game.log.trace('开始游戏');

	Happy.game = game;

	//实例化玩家得分类
	qc.Happy.me = new qc.Happy.Me();

};
/**
 * Created by zouhq on 2016/5/24.
 */
/**
 * 引导界面
 */
var Guide = qc.defineBehaviour('qc.Happy.Guide',qc.Behaviour,function(){

},{
	sureBtn: qc.Serializer.NODE,
	gameScene: qc.Serializer.NODE
});

Guide.prototype.awake = function(){
	this.addListener(this.sureBtn.onClick,this.startGame,this);
	this.addListener(qc.Happy.uiEvent,function(e){
		if(e === 'guide'){
			this.guide();
		}
	},this);
};

/**
 * 开始游戏
 */
Guide.prototype.startGame = function(){

	this.gameScene.visible = true;
	this.gameObject.visible = false;
};

Guide.prototype.guide = function(){

	var tp = this.gameObject.getScript('qc.TweenPosition');
	tp.resetToBeginning();
	tp.playForward();
};
/**
 * Created by zouhq on 2016/5/18.
 */
var Brick = qc.defineBehaviour('qc.Happy.Brick',qc.Behaviour,function(){

	//记录自身的索引及类型
	this.index = null;
	this.type = null;

	//标志已经进行了TweenScale动画，无需再进行
	this.becomeBigFlag = false;
},{
	sourceParent: qc.Serializer.NODE,

	//飘分节点
	flyScore: qc.Serializer.NODE
});

Brick.prototype.awake = function(){

	var self = this;
	//分离出两个TweePosition
	this.gameObject.scripts.forEach(function(script){
		if(script.flag === 'move'){
			self.moveTween = script;
		}
		else if(script.flag === 'merge'){
			self.mergeTween = script;
		}
	});
	this.addListenerOnce(qc.Happy.onClick,function(e){
			this.move(e);
	},this);

	//开始合并
	this.addListener(qc.Happy.uiEvent,function(e){
		if(arguments[0] === 'startMerge'){
			this.moveToDes(arguments[1],arguments[2],arguments[3]);
		}
	},this);

	//监听升级事件
	this.addListener(qc.Happy.uiEvent,function(e){
		if(arguments[0] === this.index){
			this.becomeBig(arguments[0],arguments[1]);
		}
	},this);
};

//移动到点击地点
Brick.prototype.move = function(arg){

	this.gameObject.switchParent(this.sourceParent);

	var size = qc.Happy.SIZE;

	var LocalPoint = arg;

	//转换成行列
	var col = this.game.math.floorTo(LocalPoint.x / size),
		row = this.game.math.floorTo(LocalPoint.y / size);

	//所在的格子索引及类型
	this.index = row * qc.Happy.COL + col;
	this.type = Util.getNum(this.gameObject.frame) * 1;

	//放在中心位置
	this.gameObject.setAnchor(new qc.Point(0,0),new qc.Point(0,0));

	var tp = this.gameObject.getScript('qc.TweenPosition');
	tp.setCurrToStartValue();
	tp.to = new qc.Point(50 + size * col,50 + size * row);

	//获取两点距离
	var distance = Util.distance(tp.from,tp.to);

	//每秒1000像素的速度
	tp.duration = distance * 0.001;


	tp.onFinished.addOnce(this.finishMove,this);
	tp.resetToBeginning();
	tp.playForward();
};

//完成移动
Brick.prototype.finishMove = function(){

	//派发完成移动事件
	qc.Happy.uiEvent.dispatch('finishMove',this);
};

/**
 * 移动到合并地点
 * @param arg1 {指向当前点击的脚本}
 * @param arg2 {array}
 * @param score {number}
 */
Brick.prototype.moveToDes = function(arg1,arg2,score){

	this.arg1Script = arg1;
	var score = score;

	//如果是最后点击的则不动
	if(this.index === arg1.index ){
		return;
	}
	for(var i = 0; i < arg2.length; i++){
		if(this.index === arg2[i]){
			var tp = this.mergeTween;
			tp.setCurrToStartValue();
			tp.to = new qc.Point(arg1.gameObject.x,arg1.gameObject.y);

			//以200的速度移动
			tp.duration = Util.distance(tp.from,tp.to) * 0.005;
			if((i+1) === arg2.length){
				tp.onFinished.addOnce(function(){

					//派发合并后的处理事件,只派发一次
					qc.Happy.uiEvent.dispatch(this.arg1Script.index,score);

				},this);
			}
			tp.resetToBeginning();
			tp.playForward();
		}
	}
};
/**
 * 变大并飘分
 * @param index
 * @param score
 */
Brick.prototype.becomeBig = function(index,score){

	var ts = this.gameObject.getScript('qc.TweenScale');
	ts.onFinished.addOnce(function(){

		//派发进行下一次事件,index可以派发出去
		qc.Happy.uiEvent.dispatch('setType',index);

		//飘分
		this.flyScore.text = '+' + score;
		this.flyScore.switchParent(this.gameObject);
		this.flyScore.setAnchor(new qc.Point(0,0),new qc.Point(0,0));
		this.flyScore.anchoredX = 0;
		this.flyScore.anchoredY = 0;
		var tp = this.flyScore.getScript('qc.TweenPosition');
		tp.setCurrToStartValue();
		//tp.from = new qc.Point(0,0);
		tp.to = new qc.Point(tp.from.x, tp.from.y - 100);
		tp.onFinished.addOnce(function(){
			//this.disappearScore();
			this.flyScore.text = '';
		},this);
		tp.resetToBeginning();
		tp.playForward();

	},this);
	ts.resetToBeginning();
	ts.playForward();

};
/**
 * 飘分消失
 */
Brick.prototype.disappearScore = function(){

	var ta = this.flyScore.getScript('qc.TweenAlpha');
	ta.resetToBeginning();
	ta.playForward();
};
/**
 * Created by zouhq on 2016/5/18.
 */
var BrickPool = qc.defineBehaviour('qc.Happy.BrickPool',qc.Behaviour,function(){
	this.frameArray = ['black1','white2','green3'];
},{
	brick: qc.Serializer.PREFAB
});

BrickPool.prototype.awake = function(){

	//产生方块
	this.produceBrick();

	//监听产生方块事件
	this.addListener(qc.Happy.uiEvent,function(e){
		if(e === 'finishMove'){
			this.produceBrick();
		}
	},this);

	//监听重新开始事件
	this.addListener(qc.Happy.uiEvent,function(e){
		if(e === 'restart'){
			this.restart();
		}
	},this);
};

//顶部产生方块
BrickPool.prototype.produceBrick = function(){

	//获取随机值
	var rn = Util.random(0,2);
	var node = this.gameObject.find('source');
	if(!node)
		node = this.game.add.clone(this.brick,this.gameObject);

	node.frame = this.frameArray[rn] + '.png';

};

//重新来过
BrickPool.prototype.restart = function(){

	this.produceBrick();
};

/**
 * Created by zouhq on 2016/5/23.
 */
var GameOver = qc.defineBehaviour('qc.Happy.GameOver',qc.Behaviour,function(){

},{
	currentScore: qc.Serializer.NODE,
	bestScore: qc.Serializer.NODE,
	retryBtn: qc.Serializer.NODE,
	new: qc.Serializer.NODE
});

GameOver.prototype.awake = function(){

	//监听游戏是否结束事件
	this.addListener(qc.Happy.uiEvent,function(e){
		if(e === 'gameOver'){
			this.gameOver();
		}
	},this);

	//重来
	this.addListener(this.retryBtn.onClick,function(){

		//派发重新开始事件
		this.gameObject.visible = false;
		qc.Happy.uiEvent.dispatch('restart');
		qc.Happy.e.dispatch('restart');
	},this);
};

//显示游戏结束界面
GameOver.prototype.gameOver = function(){
	this.gameObject.visible = true;

	//是否刷新最高分
	if(qc.Happy.isNew){
		this.new.visible = true;
	}
	else
		this.new.visible = false;
	qc.Happy.isNew = false;
	this.currentScore.text = '' + qc.Happy.me.current;
	this.bestScore.text = '' + qc.Happy.me.best;
};
/**
 * Created by zouhq on 2016/5/20.
 */
/**
 * 玩家分数管理类
 * @type {Function}
 */
var Me = qc.Happy.Me = function(){

	//当前分数
	this._current = 0;

	//最高分
	this._best = 0;

	//取出数据
	if(Happy.game.storage.get('best')){
		this._best = Happy.game.storage.get('best');
	}

	//监听重置事件
	qc.Happy.e.add(function(e){
		if(e === 'restart'){
			this.reset();
		}
	},this);
};
Me.prototype = {};
Me.prototype.constructor = Me;

Object.defineProperties(Me.prototype,{
	current: {
		get: function(){
			return this._current;
		},
		set: function(v){
			if(this._current === v){
				return;
			}
			this._current = v;

			if(this.best < v){
				qc.Happy.isNew = true;
				this.best = v;
			}

			//派发分数更新事件
			qc.Happy.uiEvent.dispatch('updateScore',this._current);
		}
	},

	best: {
		get: function(){
			return this._best;
		},

		set: function(v){
			this._best = v;
			Happy.game.storage.set('best',v);
			Happy.game.storage.save();
		}

	}
});
/**
 * 加分
 * @param score
 */
Me.prototype.addScore = function(score) {
	if (typeof score !== 'number' || score <= 0) return;

	this.current = this._current + score;
};

/**
 * 重置
 */
Me.prototype.reset = function(){
	this.current = 0;
};
/**
 * Created by zouhq on 2016/5/18.
 */
var Panel = qc.defineBehaviour('qc.Happy.Panel',qc.Behaviour,function(){
	this.runInEditor = true;
},{

});

Panel.prototype.awake = function(){

	//绘制面板
	this.drawPanel();
};

//绘制面板
Panel.prototype.drawPanel = function(){

	var row = qc.Happy.ROW,
		col = qc.Happy.COL,
		size = qc.Happy.SIZE;

	//设置线条的宽度、颜色、透明度
	this.gameObject.lineStyle(1,0xFF0000,1);


	//绘制横线
	for(var i = 0; i <= row; i++ ){
		this.gameObject.moveTo(0,i * size);
		this.gameObject.lineTo(size * col, i * size);
	}

	//绘制竖线
	for(var j = 0; j <= col; j++ ){
		this.gameObject.moveTo(j * size,0);
		this.gameObject.lineTo(j * size, size * col);
	}
};
/**
 * Created by zouhq on 2016/5/18.
 */
var PanelUI = qc.defineBehaviour('qc.Happy.PanelUI',qc.Behaviour,function(){
	//this.runInEditor = true;
	//存储行列
	this.data = [];

	//存储index、type
	this._bricks = {};

	//存储当前的索引
	this.currIndex = null;

},{
	brick:qc.Serializer.PREFAB,
	redBrick: qc.Serializer.PREFAB,
	source: qc.Serializer.NODE,
	redBrickParent: qc.Serializer.NODE,
	flyScore: qc.Serializer.NODE
});

PanelUI.prototype.awake = function(){

	this.addListener(qc.Happy.uiEvent,function(e){
		if(e === 'finishMove'){
			//this.gameObject.interactive = true;

			//将索引对应相应的脚本
			this._bricks[arguments[1].index] = arguments[1];

			//存储各个brick的index,type
			this.data[arguments[1].index] = arguments[1].type;


			//存储当前索引
			this.currIndex = arguments[1].index;

			//搜索是否可以消除
			this.findResult();
		}
	},this);

	this.addListener(qc.Happy.uiEvent,function(e){
		if(e !== 'setType')
			return;

		//重新设置类型
		this.setType(arguments[1]);
	},this);

	//重新开始
	this.addListener(qc.Happy.uiEvent,function(e){
		if(e === 'restart'){
			this.restart();
		}
	},this);

	this.reset();
	//初始化
	this.init();
	//测试
	//this.data = [0,0,0,0,0,0,
	//			 0,2,2,0,0,1,
	//			 0,4,2,0,3,1,
	//			 0,0,0,0,0,0,
	//			 0,0,0,0,0,0,
	//			 0,0,0,0,0,0
	//]
	//this.findResult();
};

PanelUI.prototype.reset = function(){
	//给格子逻辑初始化
	for(var i = 0; i < 36; i++){
		this.data[i] = 0;
	}
};
/**
 * 初始化格子，36个格子中随机选择7个格子出来
 */
PanelUI.prototype.init = function(){
	var index = [], i,randomNum ;

	for(i = 0; i <=35; i++){
		index[i] = i;
	}
	for( i = 0; i < 7; i++){
		randomNum = this.game.math.random(0,35-i);



		//产生红色方块
		var width = qc.Happy.SIZE;
		var node = this.game.add.clone(this.redBrick,this.redBrickParent);
		var row = Math.floor(index[randomNum] / qc.Happy.ROW);
		var col = index[randomNum] % qc.Happy.COL;
		node.frame = 'red5.png';
		node.resetNativeSize();
		node.x = col * width + width / 2;
		node.y = row * width + width / 2;
		this.data[index[randomNum]] = 7;
		var position = index.indexOf(index[randomNum]);
		index.splice(position,1);
	}
};
//点击
PanelUI.prototype.onClick = function(e){

	var x = e.source.x,
		y = e.source.y;

	var size = qc.Happy.SIZE;
	var LocalPoint = this.gameObject.toLocal(new qc.Point(x,y));


	var col = this.game.math.floorTo(LocalPoint.x / size),
		row = this.game.math.floorTo(LocalPoint.y / size);

	//计算格子索引
	var index = row * qc.Happy.COL + col;


	//判断是否重复点击格子
	if(this.data[index] !== 0){
		this.game.log.trace('重复点击');
		return;
	}

	//设置为不可交互
	this.gameObject.interactive = false;

	//派发点击事件
	qc.Happy.onClick.dispatch(LocalPoint);
};

PanelUI.prototype.findResult = function(){

	var result = Util.findResult(this.data);

	//游戏是否结束
	if(this.isFull() && result.length === 0){
		qc.Happy.uiEvent.dispatch('gameOver');
	}
	//判断是否有元素
	if(result.length === 0){
		this.gameObject.interactive = true;
		return;
	}

	//设置分数
	var score,
		type = this.data[result[0]];
	switch(type){
		case 1:
			score = qc.Happy.FirstLEVEL * result.length;
			break;
		case 2:
			score = qc.Happy.FirstLEVEL * result.length;
			break;
		case 3:
			score = qc.Happy.FirstLEVEL * result.length;
			break;
		case 4:
			score = qc.Happy.SECONDLEVEL * result.length;
			break;
		case 5:
			score = qc.Happy.SECONDLEVEL * result.length;
			break;
		case 6:
			score = qc.Happy.SECONDLEVEL * result.length;
			break;
		default:
			break;
	}
	qc.Happy.me.addScore(score);

	var ret = result;
	//判断返回的横竖同类型的方块是否大于3
	if(ret.length >= 3){

		//先分离出最后点击的索引
		var index = ret.indexOf(this.currIndex);
		var currInex = ret[index];

		//返回的是[2]数组
		ret.splice(index,1);

		this.otherIndex = ret;
		//派发开始合并事件
		qc.Happy.uiEvent.dispatch('startMerge',this._bricks[currInex],ret,score);
	}
};
/**
 * 重新设置类型
 * @param index  {number} 当前的索引值
 */
PanelUI.prototype.setType = function(index){

	//设置已合并的方块
	var type = this._bricks[index].type;
	switch(type){
		case 1:
			this.data[index] = 4;//黑方块升级
			this._bricks[index].type = 4;
			break;
		case 2:
			this.data[index] = 5;//白方块升级
			this._bricks[index].type = 5;
			break;
		case 3:
			this.data[index] = 6;//绿方块升级
			this._bricks[index].type = 6;
			break;
		case 4:
			this.data[index] = 7;//黑方块升级
			this._bricks[index].type = 7;
			this._bricks[index].gameObject.frame = 'red5.png';
			break;
		case 5:
			this.data[index] = 8;//白方块升级
			this._bricks[index].type = 8;
			this._bricks[index].gameObject.frame = 'red5.png';
			break;
		case 6:
			this.data[index] = 9;//绿方块升级
			this._bricks[index].type = 9;
			this._bricks[index].gameObject.frame = 'red5.png';
			break;
		default:
			break;
	}

	//清除
	this.otherIndex.forEach(function(index){

		//重新设置type
		this.data[index] = 0;

		//销毁对象
		this._bricks[index].gameObject.destroy();
	},this);

	//合并后是否产生新的合并
	this.findResult();
	this.gameObject.interactive = true;
};

//检查游戏是否结束
PanelUI.prototype.isFull = function(){

	for(var i = 0; i < 36; i++){
		if(this.data[i] === 0){

			return false;
		}
	}
	return true;
};

//重来
PanelUI.prototype.restart = function(){
	var source = this.source.children,
		redBrick = this.redBrickParent.children;

	var i;
	this.flyScore.switchParent(this.gameObject);
	//移除方块
	source.forEach(function(s){
		s.destroy();
	});

	for( i in redBrick){
		redBrick[i].destroy();
	}
	this.reset();
	this.init();
};
/**
 * Created by zouhq on 2016/5/20.
 */
/**
 * 玩家分数显示
 */

var ScoreUI = qc.defineBehaviour('qc.Happy.ScoreUI',qc.Behaviour,function(){
	qc.Happy.score = this;
},{

});

ScoreUI.prototype.awake = function(){

	// 分数文本中间值，用于TweenProperty组件使用
	this.gameObject._tempText = 0;
	Object.defineProperties(this.gameObject, {
		'tempText' : {
			get : function() { return this._tempText; },
			set : function(v) {
				if (this._tempText === v) return;

				this._tempText = v;
				this.text = Math.floor(v) + '';
			}
		}
	});

	//更新分数显示
	this.addListener(qc.Happy.uiEvent,function(e){
		if(e !== 'updateScore'){
			return;
		}
		this.updateScore(arguments[1]);
	},this);
};

/**
 * 更新分数显示
 * @param score
 */
ScoreUI.prototype.updateScore = function(score){

	var tp = this.gameObject.getScript('qc.TweenProperty');
	tp.setCurrToStartValue();
	tp.to = score;
	tp.resetToBeginning();
	tp.playForward();
};
/**
 * Created by zouhq on 2016/5/24.
 */
var Welcome = qc.defineBehaviour('qc.Happy.Welcome',qc.Behaviour,function(){

},{
	startBtn: qc.Serializer.NODE

});

Welcome.prototype.awake = function(){

	//开始游戏
	this.addListener(this.startBtn.onClick,this.startGuide,this);
};

/**
 * 开始游戏
 */
Welcome.prototype.startGuide = function(){

	this.gameObject.visible = false;
	qc.Happy.uiEvent.dispatch('guide');
};
/**
 * Created by zouhq on 2016/5/18.
 */
//工具类
var Util = {};

/**
 * 取随机值
 * @param  {number} min - 下限
 * @param  {number} max - 上限
 * @return {number}
 */
Util.random = function(min,max){
	min = min || 0;
	max = max || 0;
	var delta = max - min + 1;
	var ran = Math.random() * delta;
	return Math.floor(ran) + min;
};

/**
 * 计算两点之间的距离
 * @param  {point}
 * @param  {point}
 * @return {number}
 */
Util.distance = function(point1,point2){

	point1 = point1 || 0;
	point2 = point2 || 0;
	var diffX = point1.x - point2.x,
		diffY = point1.y - point2.y;
	return Math.pow((diffX * diffX + diffY * diffY),0.5);
};

/**
 * 在字符串中提取数字
 * @param {string}
 * return {number}
 */
Util.getNum = function(text){
	return text.replace(/[^0-9]/ig,"");
};

/**
 * 查找所有可以被消灭的格子
 * @param sourceTable
 * @param w
 * @param h
 * @param limit
 * @returns {Array}
 */
Util.findResult = function(sourceTable, w, h, limit) {
	var list;
	var table = [];
	var i, j, k;
	var head, tail;
	var count, lastType, type;
	var slot;
	var xi, xj, yi, yj, yslot;
	var output = [], singleOutput= [];
	w = w || 6;
	h = h || 6;
	limit = limit || 2;

	var hash = function(i, j) { return i * w + j; };

	for (i = 0; i < h; i++) {
		table.push([]);
		for (j = 0; j < w; j++) {
			table[i].push({
				type: sourceTable[hash(i, j)]
			});
		}
	}
	/**
	 * 横向统计同一种类型的个数，如数组=[[0,0,0,1],[0,1,2,0],[0,2,0,1],[2,1,0,0]];
	 * 横向统计后：数组的hc(横向个数)为=[[3,3,3,1],[1,1,1,1],[1,1,1,1],[1,1,2,2]];
	 */

	// 横向统计
	for (i = 0; i < h; i++) {
		lastType = -1;
		for (j = 0; j <= w; j++) {
			slot = table[i][j] || {};
			type = slot.type;

			if (type !== lastType) {
				// 向前找所有跟我一样的 slot，记录横向数量
				for (k = j - 1; k >= 0; k--) {
					if (table[i][k].type === lastType)
						table[i][k].hc = count;
					else
						break;
				}
				count = 1;
				lastType = type;
			}

			//类型为0,7,8,9则不作检查
			else {
				if(type === 0 || type === 7 || type === 8 || type === 9){
					count = 1;
				}
				else count++;
			}
		}
	}
	/**
	 * 纵向统计后，数组的vc个数=[[3,1,1,1],[3,1,1,1],[3,1,2,1],[1,1,2,1]];
	 */
	// 纵向统计
	for (j = 0; j < w; j++) {
		lastType = -1;
		for (i = 0; i <= h; i++) {
			slot = (i == h ? {} : table[i][j]);
			type = slot.type;

			if (type !== lastType) {
				// 向上找所有跟我一样的 slot，记录纵向数量
				for (k = i - 1; k >= 0; k--) {
					if (table[k][j].type === lastType)
						table[k][j].vc = count;
					else
						break;
				}
				count = 1;
				lastType = type;
			}
			else {
				if(type === 0 || type === 7 || type === 8 || type === 9){
					count = 1;
				}
				else count++;
			}
		}
	}

	// 来一次广度优先吧
	for (i = 0; i < h; i++) {
		for (j = 0; j < w; j++) {
			// seek for next blank slot
			slot = table[i][j];
			if (slot.hc < limit && slot.vc < limit) continue;
			if (slot.visited) continue;

			// new begin slot
			list = [];
			singleOutput = [hash(i, j)];

			list.push([i, j]);
			slot.visited = true;
			head = 0;
			tail = 1;
			type = slot.type;

			while (head < tail) {
				xi = list[head][0];
				xj = list[head][1];
				head++;

				// 四方查找
				[
					[-1, 0],  // 上
					[1, 0],  // 下
					[0, -1],  // 左
					[0, 1]  // 右
				].forEach(function(direction) {
						yi = xi + direction[0];
						yj = xj + direction[1];

						if (!table[yi]) return;
						if (!(yslot = table[yi][yj])) return;

						if (yslot.visited ||
							yslot.type !== type ||
							(yslot.hc < limit && yslot.vc < limit))
							return;

						list.push([yi, yj]);
						tail++;
						yslot.visited = true;

						singleOutput.push(hash(yi, yj));
					});
			}

			output.push(singleOutput);
		}
	}

	//判断是否大于等于3
	for(i = 0; i < output.length; i++){
		if(output[i].length >= 3){
			return output[i];
		}
	}
	return [];
};

}).call(this, this, Object);
