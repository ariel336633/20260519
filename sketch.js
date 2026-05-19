let capture;
let handPose;
let hands = [];
let playerGesture = "";
let aiGesture = "";
let resultText = "請出拳 (石頭、剪刀、布)";
let gameState = "WAITING"; // "WAITING" 或 "FINISHED"
let choices = ["石頭", "剪刀", "布"];
let isModelReady = false;

function preload() {
  // 載入 ml5.js 手部追蹤模型
  // 修正：flipped 設為 false，因為 draw 裡面已經有 scale(-1, 1) 做鏡像了
  handPose = ml5.handPose({ flipped: false }, () => {
    console.log("模型載入完成");
    isModelReady = true;
  });
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 修正：針對手機優化，強制使用前鏡頭並根據視窗調整大小
  let constraints = {
    video: {
      facingMode: "user"
    },
    audio: false
  };
  capture = createCapture(constraints);
  capture.size(VIDEO.width, VIDEO.height);
  // 隱藏預設產生的 HTML 影片元件，我們要在畫布上自行繪製
  capture.hide();

  // 開始偵測手部
  handPose.detectStart(capture, (results) => {
    hands = results;
  });
  
  textAlign(CENTER, CENTER);
}

function draw() {
  background('lightblue');
  
  // 檢查攝影機是否已啟動
  if (capture.width === 0) {
    fill(0);
    text("攝影機啟動中...", width / 2, height / 2);
    return;
  }

  let w = width * 0.6;
  let h = height * 0.6;

  push();
  // 移至中心
  translate(width / 2, height / 2);
  // 處理左右鏡像
  scale(-1, 1);
  
  imageMode(CENTER);
  image(capture, 0, 0, w, h);

  // 繪製手部骨架並辨識手勢
  if (hands.length > 0) {
    drawHandLines(hands[0], w, h);
    
    // 遊戲邏輯
    if (gameState === "WAITING") {
      let gesture = detectGesture(hands[0]);
      if (gesture) {
        playerGesture = gesture;
        playGame(playerGesture);
      }
    }
  } else if (!isModelReady) {
    push();
    scale(-1, 1); // 將文字轉回正向
    fill(0);
    text("AI 模型載入中...", 0, 0);
    pop();
  }
  pop();

  displayUI();
}

function drawHandLines(hand, w, h) {
  for (let kp of hand.keypoints) {
    // 5. 使用 map 精確轉換座標，確保線條對齊手部
    let x = map(kp.x, 0, capture.width, -w/2, w/2);
    let y = map(kp.y, 0, capture.height, -h/2, h/2);
    
    fill(0, 255, 0);
    noStroke();
    ellipse(x, y, 10);
  }
  
  // 繪製手指連線
  stroke(0, 255, 0);
  strokeWeight(3);
  noFill();
  let fingers = [
    [0, 1, 2, 3, 4],    // 拇指
    [0, 5, 6, 7, 8],    // 食指
    [0, 9, 10, 11, 12], // 中指
    [0, 13, 14, 15, 16],// 無名指
    [0, 17, 18, 19, 20] // 小指
  ];
  for (let f of fingers) {
    beginShape();
    for (let idx of f) {
      let x = map(hand.keypoints[idx].x, 0, capture.width, -w/2, w/2);
      let y = map(hand.keypoints[idx].y, 0, capture.height, -h/2, h/2);
      vertex(x, y);
    }
    endShape();
  }
}

function detectGesture(hand) {
  let k = hand.keypoints;
  // 簡易邏輯：判斷指尖(Tip)是否高於指根關節(PIP)
  // 注意：y 座標越小代表位置越高
  let indexUp = k[8].y < k[5].y;
  let middleUp = k[12].y < k[9].y;
  let ringUp = k[16].y < k[13].y;
  let pinkyUp = k[20].y < k[17].y;
  
  // 手勢辨識判斷
  if (indexUp && middleUp && ringUp && pinkyUp) return "布";
  if (indexUp && middleUp && !ringUp && !pinkyUp) return "剪刀";
  if (!indexUp && !middleUp && !ringUp && !pinkyUp) return "石頭";
  return null;
}

function playGame(player) {
  aiGesture = random(choices);
  gameState = "FINISHED";
  
  if (player === aiGesture) {
    resultText = "平手！";
  } else if (
    (player === "石頭" && aiGesture === "剪刀") ||
    (player === "剪刀" && aiGesture === "布") ||
    (player === "布" && aiGesture === "石頭")
  ) {
    resultText = "你贏了！";
  } else {
    resultText = "你輸了！";
  }
}

function displayUI() {
  fill(0);
  textSize(height * 0.04);
  text(`玩家出拳: ${playerGesture || "偵測中..."}`, width / 2, height * 0.85);
  
  if (gameState === "FINISHED") {
    fill(255, 0, 0);
    textSize(height * 0.06);
    text(`AI 出拳: ${aiGesture}`, width / 2, height * 0.1);
    textSize(height * 0.1);
    text(resultText, width / 2, height / 2);
    
    fill(50);
    textSize(height * 0.03);
    text("按下任意鍵重新開始", width / 2, height * 0.95);
  } else {
    fill(0);
    text(resultText, width / 2, height * 0.1);
  }
}

function keyPressed() {
  // 重開局邏輯
  if (gameState === "FINISHED") {
    gameState = "WAITING";
    playerGesture = "";
    aiGesture = "";
    resultText = "請出拳 (石頭、剪刀、布)";
  }
}

// 當視窗大小改變時，自動調整畫布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
