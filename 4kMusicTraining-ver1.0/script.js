// 游戏核心变量
let game = {
    bpm: 120,
    speed: 1.0,
    judgementLevel: 8,
    linePosition: 70,
    isPlaying: false,
    notes: [],
    score: 0,
    combo: 0,
    maxCombo: 0,
    hitCount: 0,
    totalNotes: 0,
    perfectCount: 0,
    greatCount: 0,
    goodCount: 0,
    missCount: 0,
    noteInterval: null,
    animationFrame: null,
    keyPressEffect: {
        lane: -1,
        time: 0,
        duration: 100
    },
    waitingForSpace: false
};

// 获取HTML元素
let canvas, ctx;
let bpmSlider, speedSlider, judgementSlider, linePositionSlider;
let bpmValue, speedValue, judgementValue, linePositionValue;
let startBtn, pauseBtn, resetBtn;
let scoreDisplay, comboDisplay, accuracyDisplay, maxComboDisplay;
let perfectCountDisplay, greatCountDisplay, goodCountDisplay, missCountDisplay;
let judgementDisplay, startHint;

// 键盘映射
const KEY_MAPPING = {
    'KeyD': 0,
    'KeyF': 1,  
    'KeyJ': 2,
    'KeyK': 3
};

// 判定窗口配置
const JUDGEMENT_CONFIG = {
    1: { perfect: 15, great: 30, good: 45 },
    2: { perfect: 18, great: 36, good: 54 },
    3: { perfect: 21, great: 42, good: 63 },
    4: { perfect: 24, great: 48, good: 72 },
    5: { perfect: 27, great: 54, good: 81 },
    6: { perfect: 30, great: 60, good: 90 },
    7: { perfect: 33, great: 66, good: 99 },
    8: { perfect: 36, great: 72, good: 108 },
    9: { perfect: 39, great: 78, good: 117 },
    10: { perfect: 42, great: 84, good: 126 }
};

// 判定文字描述
const JUDGEMENT_LABELS = {
    1: "超严格", 2: "严格", 3: "较严格", 4: "稍严格", 5: "中等",
    6: "稍宽松", 7: "较宽松", 8: "宽松", 9: "很宽松", 10: "超宽松"
};

// 分数配置
const SCORE_CONFIG = {
    PERFECT: 100,
    GREAT: 80,
    GOOD: 60,
    MISS: 0
};

// 初始化游戏
function initGame() {
    console.log('🎮 开始初始化游戏...');
    
    try {
        // 获取所有HTML元素
        canvas = document.getElementById('gameCanvas');
        if (!canvas) throw new Error('找不到canvas元素');
        
        ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('无法获取canvas上下文');
        
        // 获取滑块元素
        bpmSlider = document.getElementById('bpmSlider');
        speedSlider = document.getElementById('speedSlider');
        judgementSlider = document.getElementById('judgementSlider');
        linePositionSlider = document.getElementById('linePositionSlider');
        
        // 获取显示元素
        bpmValue = document.getElementById('bpmValue');
        speedValue = document.getElementById('speedValue');
        judgementValue = document.getElementById('judgementValue');
        linePositionValue = document.getElementById('linePositionValue');
        
        // 获取按钮元素
        startBtn = document.getElementById('startBtn');
        pauseBtn = document.getElementById('pauseBtn');
        resetBtn = document.getElementById('resetBtn');
        
        // 获取统计元素
        scoreDisplay = document.getElementById('score');
        comboDisplay = document.getElementById('combo');
        accuracyDisplay = document.getElementById('accuracy');
        maxComboDisplay = document.getElementById('maxCombo');
        perfectCountDisplay = document.getElementById('perfectCount');
        greatCountDisplay = document.getElementById('greatCount');
        goodCountDisplay = document.getElementById('goodCount');
        missCountDisplay = document.getElementById('missCount');
        
        // 获取其他元素
        judgementDisplay = document.getElementById('judgementDisplay');
        startHint = document.getElementById('startHint');
        
        console.log('✅ 所有HTML元素获取成功');
        
        // 设置滑块初始值
        updateSliderValues();
        
        // 设置滑块事件
        setupSliders();
        
        // 设置按钮事件
        setupButtons();
        
        // 设置键盘和触摸事件
        setupInputEvents();
        
        // 初始绘制
        drawGame();
        
        console.log('🎉 游戏初始化完成！');
        
    } catch (error) {
        console.error('❌ 初始化失败:', error);
        alert('游戏初始化失败: ' + error.message);
    }
}

// 更新滑块显示值
function updateSliderValues() {
    bpmValue.textContent = game.bpm;
    speedValue.textContent = game.speed.toFixed(1) + 'x';
    judgementValue.textContent = JUDGEMENT_LABELS[game.judgementLevel];
    linePositionValue.textContent = game.linePosition + '%';
}

// 设置滑块事件
function setupSliders() {
    bpmSlider.addEventListener('input', function() {
        game.bpm = parseInt(this.value);
        updateSliderValues();
        if (game.isPlaying && !game.waitingForSpace) {
            restartGame();
        }
    });

    speedSlider.addEventListener('input', function() {
        game.speed = parseFloat(this.value);
        updateSliderValues();
        if (game.isPlaying && !game.waitingForSpace) {
            restartGame();
        }
    });

    judgementSlider.addEventListener('input', function() {
        game.judgementLevel = parseInt(this.value);
        updateSliderValues();
        drawGame(); // 立即更新画面
    });

    linePositionSlider.addEventListener('input', function() {
        game.linePosition = parseInt(this.value);
        updateSliderValues();
        drawGame(); // 立即更新画面
    });
}

// 设置按钮事件
function setupButtons() {
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    resetBtn.addEventListener('click', resetGame);
}

// 设置输入事件
function setupInputEvents() {
    // 画布点击事件
    canvas.addEventListener('click', handleCanvasClick);
    
    // 键盘事件
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // 防止页面滚动
    document.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space') {
            e.preventDefault();
        }
    });
}

// 获取判定线Y坐标
function getJudgementLineY() {
    return canvas.height * (game.linePosition / 100);
}

// 处理键盘按下
function handleKeyDown(event) {
    console.log('按键:', event.code);
    
    // 空格键处理
    if (event.code === 'Space') {
        event.preventDefault();
        
        if (game.waitingForSpace) {
            console.log('🎵 开始音符生成');
            game.waitingForSpace = false;
            startHint.style.display = 'none';
            startNoteGeneration();
        } else if (game.isPlaying) {
            console.log('⏸️ 暂停/继续游戏');
            pauseGame();
        }
        return;
    }
    
    if (!game.isPlaying || game.waitingForSpace) return;
    
    const lane = KEY_MAPPING[event.code];
    if (lane !== undefined) {
        game.keyPressEffect.lane = lane;
        game.keyPressEffect.time = Date.now();
        checkHit(lane);
        event.preventDefault();
    }
}

// 处理键盘释放
function handleKeyUp(event) {
    const lane = KEY_MAPPING[event.code];
    if (lane !== undefined && game.keyPressEffect.lane === lane) {
        game.keyPressEffect.lane = -1;
        event.preventDefault();
    }
}

// 计算音符生成间隔
function calculateNoteInterval() {
    return (60000 / game.bpm) * 2;
}

// 开始游戏
function startGame() {
    console.log('🚀 开始游戏');
    if (game.isPlaying) return;
    
    resetGameState();
    game.isPlaying = true;
    game.waitingForSpace = true;
    
    updateStats();
    startHint.style.display = 'block';
    gameLoop();
    
    startBtn.textContent = "游戏中...";
    startBtn.disabled = true;
    pauseBtn.textContent = "暂停";
    
    console.log('🔄 游戏循环启动，等待空格键...');
}

// 重置游戏状态
function resetGameState() {
    game.notes = [];
    game.score = 0;
    game.combo = 0;
    game.maxCombo = 0;
    game.hitCount = 0;
    game.totalNotes = 0;
    game.perfectCount = 0;
    game.greatCount = 0;
    game.goodCount = 0;
    game.missCount = 0;
    game.keyPressEffect.lane = -1;
    game.waitingForSpace = false;
}

// 开始音符生成
function startNoteGeneration() {
    const interval = calculateNoteInterval();
    console.log('📝 音符生成间隔:', interval + 'ms');
    
    if (game.noteInterval) {
        clearInterval(game.noteInterval);
    }
    
    game.noteInterval = setInterval(() => {
        createNote();
    }, interval);
}

// 暂停游戏
function pauseGame() {
    if (game.waitingForSpace) return;
    
    console.log('⏸️ 切换暂停状态');
    game.isPlaying = !game.isPlaying;
    
    if (!game.isPlaying) {
        if (game.noteInterval) {
            clearInterval(game.noteInterval);
            game.noteInterval = null;
        }
        pauseBtn.textContent = "继续";
    } else {
        startNoteGeneration();
        pauseBtn.textContent = "暂停";
    }
}

// 重置游戏
function resetGame() {
    console.log('🔄 重置游戏');
    game.isPlaying = false;
    game.waitingForSpace = false;
    
    if (game.noteInterval) {
        clearInterval(game.noteInterval);
        game.noteInterval = null;
    }
    
    if (game.animationFrame) {
        cancelAnimationFrame(game.animationFrame);
        game.animationFrame = null;
    }
    
    resetGameState();
    updateStats();
    drawGame();
    
    startHint.style.display = 'none';
    startBtn.textContent = "开始训练";
    startBtn.disabled = false;
    pauseBtn.textContent = "暂停";
}

// 重新开始游戏
function restartGame() {
    console.log('🔄 重新开始游戏');
    if (!game.isPlaying) return;
    
    const wasPlaying = game.isPlaying;
    resetGame();
    if (wasPlaying) {
        startGame();
    }
}

// 创建新音符
function createNote() {
    const lane = Math.floor(Math.random() * 4);
    const note = {
        id: Date.now() + Math.random(),
        lane: lane,
        position: -50,
        speed: 2 + (game.speed * 3),
        hit: false,
        missed: false,
        judgement: null,
        createTime: Date.now()
    };
    game.notes.push(note);
    game.totalNotes++;
    updateStats();
    
    console.log('🎵 创建音符，轨道:', lane, '总数:', game.notes.length);
}

// 处理画布点击
function handleCanvasClick(event) {
    if (!game.isPlaying || game.waitingForSpace) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const clickLane = Math.floor(x / (canvas.width / 4));
    
    game.keyPressEffect.lane = clickLane;
    game.keyPressEffect.time = Date.now();
    checkHit(clickLane);
}

// 检查点击判定
function checkHit(clickLane) {
    let hitFound = false;
    const judgementLineY = getJudgementLineY();
    const config = JUDGEMENT_CONFIG[game.judgementLevel];
    
    for (let i = 0; i < game.notes.length; i++) {
        const note = game.notes[i];
        
        if (note.hit || note.missed) continue;
        if (note.lane !== clickLane) continue;
        
        const distanceToLine = Math.abs(note.position - judgementLineY);
        
        if (distanceToLine <= config.perfect) {
            processHit(note, 'PERFECT', '#FFD700', SCORE_CONFIG.PERFECT);
            hitFound = true;
            break;
        } else if (distanceToLine <= config.great) {
            processHit(note, 'GREAT', '#00FF00', SCORE_CONFIG.GREAT);
            hitFound = true;
            break;
        } else if (distanceToLine <= config.good) {
            processHit(note, 'GOOD', '#3498db', SCORE_CONFIG.GOOD);
            hitFound = true;
            break;
        }
    }
    
    if (!hitFound) {
        game.combo = 0;
        game.missCount++;
        showJudgement('MISS', '#FF4444');
    }
    
    game.maxCombo = Math.max(game.maxCombo, game.combo);
    updateStats();
}

// 处理命中逻辑
function processHit(note, judgement, color, score) {
    note.hit = true;
    note.judgement = judgement;
    showJudgement(judgement, color);
    game.score += score;
    game.combo++;
    game.hitCount++;
    
    if (judgement === 'PERFECT') game.perfectCount++;
    else if (judgement === 'GREAT') game.greatCount++;
    else if (judgement === 'GOOD') game.goodCount++;
}

// 显示判定效果
function showJudgement(text, color) {
    judgementDisplay.textContent = text;
    judgementDisplay.style.color = color;
    judgementDisplay.style.opacity = '1';
    
    setTimeout(() => {
        judgementDisplay.style.opacity = '0';
    }, 500);
}

// 更新统计信息
function updateStats() {
    scoreDisplay.textContent = game.score;
    comboDisplay.textContent = game.combo;
    maxComboDisplay.textContent = game.maxCombo;
    perfectCountDisplay.textContent = game.perfectCount;
    greatCountDisplay.textContent = game.greatCount;
    goodCountDisplay.textContent = game.goodCount;
    missCountDisplay.textContent = game.missCount;
    
    const accuracy = game.totalNotes > 0 ? 
        ((game.hitCount / game.totalNotes) * 100).toFixed(1) : 100;
    accuracyDisplay.textContent = accuracy + '%';
}

// 游戏主循环
function gameLoop() {
    if (!game.isPlaying) return;
    
    updateNotes();
    drawGame();
    game.animationFrame = requestAnimationFrame(gameLoop);
}

// 更新音符状态
function updateNotes() {
    const judgementLineY = getJudgementLineY();
    const config = JUDGEMENT_CONFIG[game.judgementLevel];
    
    for (let i = game.notes.length - 1; i >= 0; i--) {
        const note = game.notes[i];
        note.position += note.speed;
        
        if (!note.hit && !note.missed && note.position > judgementLineY + config.good) {
            note.missed = true;
            note.judgement = 'MISS';
            game.combo = 0;
            game.missCount++;
            updateStats();
        }
        
        if (note.position > canvas.height + 100) {
            game.notes.splice(i, 1);
        }
    }
    
    if (game.keyPressEffect.lane !== -1) {
        const pressDuration = Date.now() - game.keyPressEffect.time;
        if (pressDuration > game.keyPressEffect.duration) {
            game.keyPressEffect.lane = -1;
        }
    }
}

// 绘制判定区域
function drawJudgementArea() {
    const judgementLineY = getJudgementLineY();
    const config = JUDGEMENT_CONFIG[game.judgementLevel];
    
    // 绘制判定区域背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, judgementLineY - config.good, canvas.width, config.good * 2);
    
    // 绘制判定线
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // GOOD 线
    ctx.beginPath();
    ctx.moveTo(0, judgementLineY - config.good);
    ctx.lineTo(canvas.width, judgementLineY - config.good);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, judgementLineY + config.good);
    ctx.lineTo(canvas.width, judgementLineY + config.good);
    ctx.stroke();
    
    // GREAT 线
    ctx.strokeStyle = '#00FF00';
    ctx.beginPath();
    ctx.moveTo(0, judgementLineY - config.great);
    ctx.lineTo(canvas.width, judgementLineY - config.great);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, judgementLineY + config.great);
    ctx.lineTo(canvas.width, judgementLineY + config.great);
    ctx.stroke();
    
    // PERFECT 线
    ctx.strokeStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(0, judgementLineY - config.perfect);
    ctx.lineTo(canvas.width, judgementLineY - config.perfect);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, judgementLineY + config.perfect);
    ctx.lineTo(canvas.width, judgementLineY + config.perfect);
    ctx.stroke();
    
    ctx.setLineDash([]);
}

// 绘制游戏
function drawGame() {
    if (!ctx) return;
    
    // 清空画布
    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const laneWidth = canvas.width / 4;
    const judgementLineY = getJudgementLineY();
    
    // 绘制判定区域
    drawJudgementArea();
    
    // 绘制轨道线
    ctx.strokeStyle = '#4a6572';
    ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * laneWidth, 0);
        ctx.lineTo(i * laneWidth, canvas.height);
        ctx.stroke();
    }
    
    // 绘制判定线
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, judgementLineY);
    ctx.lineTo(canvas.width, judgementLineY);
    ctx.stroke();
    
    // 绘制键盘按下效果
    if (game.keyPressEffect.lane !== -1) {
        const x = game.keyPressEffect.lane * laneWidth;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x, 0, laneWidth, canvas.height);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        const keyLabels = ['D', 'F', 'J', 'K'];
        ctx.fillText(keyLabels[game.keyPressEffect.lane], x + laneWidth/2, 30);
    }
    
    // 绘制音符
    game.notes.forEach(note => {
        const x = note.lane * laneWidth;
        
        if (note.judgement === 'PERFECT') {
            ctx.fillStyle = '#FFD700';
        } else if (note.judgement === 'GREAT') {
            ctx.fillStyle = '#00FF00';
        } else if (note.judgement === 'GOOD') {
            ctx.fillStyle = '#3498db';
        } else if (note.missed) {
            ctx.fillStyle = '#e74c3c';
        } else {
            ctx.fillStyle = '#9b59b6';
        }
        
        ctx.fillRect(x + 5, note.position, laneWidth - 10, 40);
        
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 5, note.position, laneWidth - 10, 40);
        
        if (note.judgement) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(note.judgement, x + laneWidth/2, note.position + 25);
        }
    });
    
    // 绘制连击数
    if (game.combo > 0) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(game.combo + ' COMBO', canvas.width / 2, 60);
    }
    
    // 绘制游戏状态
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('BPM: ' + game.bpm, 10, 30);
    ctx.fillText('流速: ' + game.speed.toFixed(1) + 'x', 10, 55);
    ctx.fillText('判定: ' + JUDGEMENT_LABELS[game.judgementLevel], 10, 80);
    
    // 绘制键盘提示
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 18px Arial';
    const keys = ['D', 'F', 'J', 'K'];
    for (let i = 0; i < 4; i++) {
        const x = i * laneWidth + laneWidth / 2;
        ctx.fillText(keys[i], x, canvas.height - 20);
    }

    // 绘制等待空格提示
    if (game.waitingForSpace) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('按下空格键开始音符下落', canvas.width / 2, canvas.height / 2);
        ctx.font = '18px Arial';
        ctx.fillText('准备好后按空格键', canvas.width / 2, canvas.height / 2 + 40);
    }
}

// 页面加载完成后初始化游戏
window.addEventListener('load', initGame);

console.log('🎮 script.js 加载完成 - 等待页面初始化');