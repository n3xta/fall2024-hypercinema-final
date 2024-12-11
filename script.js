const container = document.querySelector('.container');
const pads = document.querySelectorAll('.pad');

const bpm = 120;
const intervalDuration = (60 / bpm) * 1000; // 每个 1/4 拍的毫秒数

let lastInterval = -1;
let audioStarted = false;
let startTime = 0;
const audio = new Audio('https://raw.githubusercontent.com/n3xta/image-hosting/main/audio/Tanchiky%20-%20Test%20Pulse_1.mp3');
audio.loop = true; // 使音乐循环播放

const pauseButton = document.querySelector('.pause-button');
pauseButton.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        pauseButton.textContent = '⏸';
    } else {
        audio.pause();
        pauseButton.textContent = '▶️';
    }
});

const fallingContainer = document.querySelector('.falling-words-container');

// 预加载所有音频文件
const audioFiles = [
    'rizz', 'npc', 'based', 'cringe', 'mid', 'slay', 'gatekeep', 'ratio',
    'no_cap', 'chad', 'simp', 'W', 'L', 'yeet', 'bussin', 'cope'
];
const audioMap = {};
audioFiles.forEach(word => {
    audioMap[word] = new Audio(`public/${word}.mp3`);
});

// 引入Matter.js模块
const Engine = Matter.Engine;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Events = Matter.Events;
const Body = Matter.Body;

// 创建引擎和物理世界
const engine = Engine.create();
const world = engine.world;

// 运行引擎
Engine.run(engine);

// 添加地面
const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 50, window.innerWidth, 100, { isStatic: true });
World.add(world, ground);

// 存储物体和DOM元素的数组
const wordBodies = [];

// 存储每个节拍的选词
let totalBeats;
// 初始化beatWords数组，确保在每次循环中累积词语
const beatWords = [];

// 定义字体数组
const fonts = ['Impact', 'Lobster', 'Open Sans', 'Roboto', 'Poppins', 'Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'];

audio.addEventListener('loadedmetadata', () => {
    totalBeats = Math.floor((audio.duration * bpm) / 60);
    for (let i = 0; i < totalBeats; i++) {
        beatWords[i] = [];
    }

    // 初始化进度条节拍指示器
    const beatsContainer = document.querySelector('.progress-bar .beats');
    beatsContainer.innerHTML = '';
    for (let i = 0; i < totalBeats; i++) {
        const beatDiv = document.createElement('div');
        beatDiv.classList.add('beat');
        beatsContainer.appendChild(beatDiv);
    }
});

// 更新进度条
function updateProgressBar() {
    const progressBar = document.querySelector('.progress-bar .progress');
    if (progressBar) {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = progress + '%';
    }
    requestAnimationFrame(updateProgressBar);
}
updateProgressBar();

// 创建下落的单词元素时，随机分配字体并增加大小
function createFallingWord(word) {
    const fallingWordElement = document.createElement('div');
    fallingWordElement.classList.add('falling-word');
    fallingWordElement.textContent = word.toUpperCase();

    // 随机选择字体
    const randomFont = fonts[Math.floor(Math.random() * fonts.length)];
    fallingWordElement.style.fontFamily = `'${randomFont}', sans-serif`;

    // 增加字体大小
    fallingWordElement.style.fontSize = '4vw';

    // 设置初始位置
    const startX = Math.random() * window.innerWidth;
    const startY = -50;

    fallingWordElement.style.left = startX + 'px';
    fallingWordElement.style.top = startY + 'px';

    document.body.appendChild(fallingWordElement);

    // 获取元素的宽高
    const wordWidth = fallingWordElement.offsetWidth;
    const wordHeight = fallingWordElement.offsetHeight;

    // 创建对应的物理实体，并设置边界反弹
    const wordBody = Bodies.rectangle(
        startX + wordWidth / 2,
        startY + wordHeight / 2,
        wordWidth,
        wordHeight,
        {
            restitution: 0.8,
            friction: 0.1,
            density: 0.001,
            collisionFilter: {
                group: Body.nextGroup(true)
            }
        }
    );

    // 添加边界限制，防止文字弹出视窗之外
    Body.setVelocity(wordBody, { x: 0, y: 0 });
    Body.setAngularVelocity(wordBody, 0);

    World.add(world, wordBody);

    // 将物体和元素添加到数组
    wordBodies.push({ body: wordBody, element: fallingWordElement });
}

// 定时器，用于处理节拍和回放
const glitchThreshold = 5; // 调节这个参数来设置触发glitch的词汇密度阈值
let glitchActive = false;
let intervalId;

function checkForGlitch() {
    const totalWords = wordBodies.length;
    console.log(`当前词汇密度: ${totalWords}`);
    if (totalWords >= glitchThreshold && !glitchActive) {
        glitchActive = true;
        triggerGlitch();
    }
}

function triggerGlitch() {
    // document.body.classList.add('glitch');
    audio.pause();
    gsap.to(document.body, {
        duration: 1,
        opacity: 0,
        onComplete: () => {
            // document.body.classList.remove('glitch'); // 移除glitch类
            // document.body.style.backgroundColor = 'black';
            document.body.innerHTML = '';
            stopAllAudio();
            clearScreen();
            clearInterval(intervalId); // 停止掉落单词的逻辑

            // 创建视频元素
            const video = document.createElement('video');
            video.src = 'public/ending.mp4';
            video.classList.add('ending-video');
            video.autoplay = true;
            video.playsInline = true; // 兼容移动设备
            video.controls = false;
            video.style.display = 'block'; // Ensure the video is displayed
            document.body.appendChild(video);

            // 调试信息
            console.log('Video element created:', video);
            console.log('Video source:', video.src);

            // 淡入视频并恢复body的opacity
            gsap.to(video, {
                duration: 1,
                opacity: 1,
                onComplete: () => {
                    console.log('Video fade-in complete');
                    document.body.style.opacity = 1; // 恢复body的opacity
                }
            });
        }
    });
}

function clearScreen() {
    // 清空所有 falling-word 元素
    wordBodies.forEach(({ element }) => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    });
    wordBodies.length = 0; // 清空数组
}

function stopAllAudio() {
    Object.values(audioMap).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
}

intervalId = setInterval(() => {
    if (glitchActive) return; // 如果glitch已经激活，停止执行

    const currentInterval = Math.floor((audio.currentTime * bpm) / 60) % totalBeats;

    // 自动播放存储的词语
    if (beatWords[currentInterval]) {
        beatWords[currentInterval].forEach(word => {
            const audioClone = audioMap[word].cloneNode();
            audioClone.currentTime = 0;
            audioClone.play();

            createFallingWord(word);
        });
    }

    // 更新节拍高亮
    const beats = document.querySelectorAll('.progress-bar .beats .beat');
    beats.forEach((beatDiv, index) => {
        const wordCount = beatWords[index] ? beatWords[index].length : 0;
        beatDiv.className = 'beat'; // 重置class
        if (wordCount > 0) {
            if (wordCount === 1) {
                beatDiv.classList.add('one-word');
            } else if (wordCount === 2) {
                beatDiv.classList.add('two-words');
            } else if (wordCount >= 3) {
                beatDiv.classList.add('three-or-more-words');
            }
        }
    });

    checkForGlitch();

}, intervalDuration);

// 确认事件监听器是否被多次添加
console.log('Adding event listeners to pads');

const imageSequenceContainer = document.querySelector('.image-sequence');
const imageCount = 12;
let currentImageIndex = 0;
let imageIntervalId;

function startImageSequence() {
    imageIntervalId = setInterval(() => {
        const images = imageSequenceContainer.querySelectorAll('img');
        images.forEach((img, index) => {
            img.style.display = index === currentImageIndex ? 'block' : 'none';
        });
        currentImageIndex = (currentImageIndex + 1) % imageCount;
    }, 1000 / 12); // Loop through images each 1/12 second
}

const textBubbleImages = ['A.png', 'B.png', 'C.png'];

function createTextBubble(pad) {
    const bubble = document.createElement('img');
    bubble.src = `public/${textBubbleImages[Math.floor(Math.random() * textBubbleImages.length)]}`;
    bubble.classList.add('text-bubble');

    document.body.appendChild(bubble); // Append first to calculate dimensions

    const bubbleRect = bubble.getBoundingClientRect(); // Get actual size
    const padRect = pad.getBoundingClientRect();

    // Base position relative to the pad
    let left = padRect.left + padRect.width / 2 - bubbleRect.width / 2;
    let top = padRect.top + padRect.height;

    // Add randomness
    const randomHorizontalOffset = (Math.random() - 0.5) * 300; // Random offset between -100 and +100
    const randomVerticalOffset = (Math.random() - 0.5) * 200; // Random offset between -50 and +50
    left += randomHorizontalOffset;
    top += randomVerticalOffset;

    // Ensure the bubble is fully inside the viewport
    if (left + bubbleRect.width > window.innerWidth) {
        left = window.innerWidth - bubbleRect.width;
    } else if (left < 0) {
        left = 0;
    }
    if (top + bubbleRect.height > window.innerHeight) {
        top = window.innerHeight - bubbleRect.height;
    } else if (top < 0) {
        top = 0;
    }

    // Apply adjusted positions
    bubble.style.position = 'absolute'; // Ensure absolute positioning
    bubble.style.left = `${left}px`;
    bubble.style.top = `${top}px`;

    console.log('Text bubble created at random position:', { left, top });

    setTimeout(() => {
        if (bubble.parentNode) {
            bubble.parentNode.removeChild(bubble);
            console.log('Text bubble removed:', bubble);
        }
    }, 2000);
}

pads.forEach(pad => {
    pad.addEventListener('click', () => {
        const currentTime = Date.now();

        // 如果音频还未开始，播放音频并记录开始时间
        if (!audioStarted) {
            audio.play();
            audioStarted = true;
            startTime = currentTime;
            startImageSequence(); // Start the image sequence
        }

        const elapsedTime = currentTime - startTime;
        const currentInterval = Math.floor(elapsedTime / intervalDuration);

        // 新的调试输出
        console.log(`currentTime: ${currentTime}`);
        console.log(`elapsedTime: ${elapsedTime}`);
        console.log(`currentInterval: ${currentInterval}`);
        console.log(`lastInterval: ${lastInterval}`);

        // 检查当前间隔是否已处��过
        if (currentInterval !== lastInterval) {
            lastInterval = currentInterval;

            let word = pad.getAttribute('data-word');
            console.log(`Selected word: ${word}`);

            // 确保当前节拍数组已初始化
            if (!beatWords[currentInterval]) {
                beatWords[currentInterval] = [];
            }

            // 检查当前节拍是否已有词语
            if (beatWords[currentInterval].length === 0) {
                // 存储当前节拍的选词
                beatWords[currentInterval].push(word);
                console.log(`beatWords[${currentInterval}]: ${beatWords[currentInterval]}`);

                // 播放音频（允许重叠）
                const audioClone = audioMap[word].cloneNode();
                console.log(`Before playing audio for word: ${word}, paused=${audioClone.paused}, currentTime=${audioClone.currentTime}`); 
                audioClone.currentTime = 0;
                audioClone.play().then(() => {
                    console.log(`After playing audio for word: ${word}, paused=${audioClone.paused}, currentTime=${audioClone.currentTime}`);
                }).catch(error => {
                    console.error(`Error playing audio for word: ${word}`, error);
                });

                // 创建一个显示单词的元素
                const wordElement = document.createElement('div');
                wordElement.classList.add('word-display');
                wordElement.textContent = word.toUpperCase();
                pad.appendChild(wordElement);

                // 0.5 秒后移除显示的单词
                setTimeout(() => {
                    pad.removeChild(wordElement);
                }, 500);

                createFallingWord(word);

                // 更新进度条高亮
                const beatDivs = document.querySelectorAll('.progress-bar .beats .beat');
                if (beatDivs[currentInterval]) {
                    beatDivs[currentInterval].classList.add('one-word');
                }
            } else {
                console.log(`Already have words: ${beatWords[currentInterval]}`);
            }
        } else {
            console.log('Neglected click');
        }

        createTextBubble(pad);
    });
});

// 只添加一次afterUpdate事件监听器
Events.on(engine, 'afterUpdate', () => {
    for (let i = wordBodies.length - 1; i >= 0; i--) {
        const { body, element } = wordBodies[i];

        // 更新DOM元素位置
        element.style.left = body.position.x - element.offsetWidth / 2 + 'px';
        element.style.top = body.position.y - element.offsetHeight / 2 + 'px';
        element.style.transform = `rotate(${body.angle}rad)`;

        // 检查是否超出屏幕
        if (body.position.y > window.innerHeight + 200) {
            // 从物理世界中移除
            World.remove(world, body);
            // 从DOM中移除
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            // 从数组中移除
            wordBodies.splice(i, 1);
        }
    }
});

// 调整重力（可选）
engine.world.gravity.y = 0.8; // 默认值为1，可以根据需要调整

// 添加边界，防止文字弹出视窗之外
const wallOptions = { isStatic: true };
const walls = [
    Bodies.rectangle(window.innerWidth / 2, -50, window.innerWidth, 100, wallOptions), // 顶部
    Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 50, window.innerWidth, 100, wallOptions), // 底部
    Bodies.rectangle(-50, window.innerHeight / 2, 100, window.innerHeight, wallOptions), // 左侧
    Bodies.rectangle(window.innerWidth + 50, window.innerHeight / 2, 100, window.innerHeight, wallOptions) // 右侧
];
World.add(world, walls);

// 监听窗口大小变化，更新地面位置
window.addEventListener('resize', () => {
    Matter.Body.setPosition(ground, {
        x: window.innerWidth / 2,
        y: window.innerHeight + 50
    });
    Matter.Body.setVertices(ground, [
        { x: 0, y: window.innerHeight },
        { x: window.innerWidth, y: window.innerHeight },
        { x: window.innerWidth, y: window.innerHeight + 100 },
        { x: 0, y: window.innerHeight + 100 }
    ]);

    // 更新墙壁位置和大小
    Body.setPosition(walls[0], { x: window.innerWidth / 2, y: -50 }); // 顶部
    Body.setPosition(walls[1], { x: window.innerWidth / 2, y: window.innerHeight + 50 }); // 底部
    Body.setPosition(walls[2], { x: -50, y: window.innerHeight / 2 }); // 左侧
    Body.setPosition(walls[3], { x: window.innerWidth + 50, y: window.innerHeight / 2 }); // 右侧

    Body.setVertices(walls[0], [ // 顶部
        { x: 0, y: -100 },
        { x: window.innerWidth, y: -100 },
        { x: window.innerWidth, y: 0 },
        { x: 0, y: 0 }
    ]);
    Body.setVertices(walls[1], [ // 底部
        { x: 0, y: window.innerHeight },
        { x: window.innerWidth, y: window.innerHeight },
        { x: window.innerWidth, y: window.innerHeight + 100 },
        { x: 0, y: window.innerHeight + 100 }
    ]);
    Body.setVertices(walls[2], [ // 左侧
        { x: -100, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: window.innerHeight },
        { x: -100, y: window.innerHeight }
    ]);
    Body.setVertices(walls[3], [ // 右侧
        { x: window.innerWidth, y: 0 },
        { x: window.innerWidth + 100, y: 0 },
        { x: window.innerWidth + 100, y: window.innerHeight },
        { x: window.innerWidth, y: window.innerHeight }
    ]);
});