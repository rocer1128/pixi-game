var type="WebGL";

if(!PIXI.utils.isWebGLSupported){
	type = "canvas";
}

PIXI.utils.sayHello(type);

//创建一个画布
var renderer = PIXI.autoDetectRenderer(512,512);
document.body.appendChild(renderer.view);

//创建一个舞台
var stage = new PIXI.Container;

//加载材质集
PIXI.loader.add("image/treasureHunter.json").load(setup);
//加载完成后的回调函数

var gameScene, id, dungeon, door, explorer, treasure, blobs, healthBar, gameOverScene, state, explorerHit;
function setup(){
	gameScene = new PIXI.Container();
	stage.addChild(gameScene);

	//获取素材集
	id = PIXI.loader.resources["image/treasureHunter.json"].textures;

	//创建地牢精灵并添加到场景中
	dungeon = new PIXI.Sprite(id["dungeon.png"]);
	gameScene.addChild(dungeon);

	//创建门精灵并添加到场景中
	door = new PIXI.Sprite(id["door.png"]);
	door.position.set(32,0);
	gameScene.addChild(door);

	//创建冒险家精灵并添加到场景中
	explorer = new PIXI.Sprite(id["explorer.png"]);
	explorer.x = 68;
	explorer.y = gameScene.height / 2 - explorer.height / 2;
	explorer.vx = 0;
	explorer.vy = 0;
	gameScene.addChild(explorer);

	//创建宝箱精灵并添加到场景中
	treasure = new PIXI.Sprite(id["treasure.png"]);
	treasure.x = gameScene.width - treasure.width - 48;
	treasure.y = gameScene.height / 2 - treasure.height / 2;
	gameScene.addChild(treasure);

	var numberOfBlobs = 6,
		spacing = 48, //怪物之间的间隔
		xOffset = 150, // x轴偏移
		speed = 2, //怪物运行的速度
		direction = 1; //运行的方向

		blobs = [];
	for(var i = 0; i<numberOfBlobs;i++){
		var blob = new PIXI.Sprite(id["blob.png"]);
		var x = spacing * i + xOffset;
		var y = randomInt(0,stage.height - blob.height);
		blob.x = x;
		blob.y = y;
		blob.vy = speed * direction;
		direction *= -1;
		blobs.push(blob);
		gameScene.addChild(blob);
	}

	//血条精灵容器
	healthBar = new PIXI.Container();
	healthBar.position.set(stage.width - 170,6);
	gameScene.addChild(healthBar);

	//底层黑色矩形
	var innerBar = new PIXI.Graphics();
	innerBar.beginFill(0x000000);
	innerBar.drawRect(0,0,128,8);
	innerBar.endFill();
	healthBar.addChild(innerBar);

	//添加上层红色矩形
	var outerBar = new PIXI.Graphics();
	outerBar.beginFill(0xFF3300);
	outerBar.drawRect(0,0,128,8);
	outerBar.endFill();
	healthBar.addChild(outerBar);
	healthBar.outer = outerBar;

	//创建gameOverScene组
	gameOverScene = new PIXI.Container();
	gameOverScene.visible = false;

	stage.addChild(gameOverScene);
	//添加game over 提示语
	message = new PIXI.Text(
		"The End!!",{fontFamily:"64px Futura",fill:"white"});
	message.x = 120;
	message.y = stage.height / 2 - 32;
	gameOverScene.addChild(message);

	//按键监听
	var left = keyboard(37),
		up = keyboard(38),
		right = keyboard(39),
		down = keyboard(40);

	left.press = function(){
		explorer.vx = -5;
		explorer.vy = 0;
	};

	left.release = function(){
		if(!right.isDown && explorer.vy === 0){
			explorer.vx = 0;
		}
	};

	up.press = function(){
		explorer.vy = -5;
		explorer.vx = 0;
	};

	up.release = function(){
		if(!down.isDown && explorer.vx === 0){
			explorer.vy = 0;
		}
	};

	right.press = function(){
		explorer.vx = 5;
		explorer.vy = 0;
	};

	right.release = function(){
		if(!left.isDown && explorer.vy === 0){
			explorer.vx = 0;
		}
	};

	down.press = function(){
		explorer.vy = 5;
		explorer.vx = 0;
	};

	down.release = function(){
		if(!up.isDown && explorer.vx === 0){
			explorer.vy = 0;
		}
	};

	state = play;
	gameLoop();
}

function gameLoop(){
	requestAnimationFrame(gameLoop);
	state();
	renderer.render(stage);
}

function play(){
	//游戏处理逻辑
	//怪物运动
	explorer.x += explorer.vx;
	explorer.y += explorer.vy;

	contain(explorer, {x: 28, y: 10, width: 488, height: 480});

	blobs.forEach(function(blob){
		blob.y += blob.vy;
		var blobHitsWall = contain(blob,{x:28,y:10,width:488,height:480});
		if(blobHitsWall === "top" || blobHitsWall === "bottom"){
			blob.vy *= -1;
		}
		if(hitTestRectangle(explorer,blob)){
			explorerHit = true;
		}
	});
	// //	撞到怪物掉血
	if(explorerHit){
		explorer.alpha = 0.5;
		healthBar.outer.width -=1;
		// explorerHit = false;
	}else{
		explorer.alpha = 1;
	}
	//撞到宝箱和人绑定
	if(hitTestRectangle(explorer,treasure)){
		treasure.x = explorer.x + 8;
		treasure.y = explorer.y + 8;
	}
	//宝箱碰到门
	if(hitTestRectangle(treasure,door)){
		state = stop;
		message.text = "YOU WIN!!!";
	}
	//空血停止游戏
	if(healthBar.outer.width<0){
		state = stop;
		message.text = "YOU LOST!!!";
	}
}

function stop(){
	gameScene.visible = false;
    gameOverScene.visible = true;
}

function contain(sprite,container){
	var collision = undefined;

	//精灵已经移动到最左侧
	if(sprite.x < container.x){
		sprite.x = container.x;
		collision = "left";
	}

	//精灵已经移动到最上侧
	if(sprite.y <container.y){
		sprite.y = container.y;
		collision = "top";
	}

	//精灵移动到最右侧
	if(sprite.x + sprite.width > container.width){
		sprite.x = container.width - sprite.width;
		collision = "right";
	}

	//精灵已经移动到最下侧
	if(sprite.y + sprite.height > container.height){
		sprite.y = container.height - sprite.height;
		collision = "bottom";
	}
	return collision;
}

function keyboard(keyCode){
	var key = {};
	key.code = keyCode;
	key.isDown = false;
	key.isUp = true;
	key.press = undefined;
	key.release = undefined;

	key.downHandler = function(event){
		if(event.keyCode === key.code){
			if(key.isUp && key.press){
				return key.press();
			}
			key.isDown = true;
			key.isUp = false;
		}
		event.preventDefault();
	};

	key.upHandler = function(event){
		if(event.keyCode === key.code){
			if(key.isDown && key.release){
				return key.release();
			}
			key.isDown = false;
			key.isUp = true;
		}
		event.preventDefault();
	};

	window.addEventListener("keydown",key.downHandler.bind(key),false);
	window.addEventListener("keyup",key.upHandler.bind(key),false);

	return key;
}

function hitTestRectangle(r1,r2){
	var hit,combinedHalfWidths,combinedHalfHeights,vx,vy;
	hit = false;

	r1.centerX = r1.x + r1.width / 2;
	r1.centerY = r1.y + r1.height / 2;
	r2.centerX = r2.x + r2.width / 2;
	r2.centerY = r2.y + r2.height / 2;

	r1.halfWidth = r1.width / 2;
	r1.halfHeight = r1.height / 2;
	r2.halfWidth = r2.width / 2;
	r2.halfHeight = r2.height / 2;

	vx = r1.centerX - r2.centerX;
	vy = r1.centerY - r2.centerY;

	combinedHalfWidths = r1.halfWidth + r2.halfWidth;
	combinedHalfHeights = r1.halfHeight + r2.halfHeight;

	if(Math.abs(vx)<combinedHalfWidths){
		hit = Math.abs(vy)<combinedHalfHeights;
	}else{
		hit = false;
	}
	return hit;
}

function randomInt(min,max){
	return Math.floor(Math.random() * (max - min + 1)) + min;
}