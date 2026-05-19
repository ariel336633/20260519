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
  // 重要：這裡開啟 flipped: true 處理水平鏡像
  // 這會讓 ml5 回傳的座標直接與「鏡像後」的畫面對齊
  handPose = ml5.handPose({ flipped: true }, () => {
    console.log("模型載入完成");
    isModelReady = true;
  });
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  let constraints = {
    video: {
      facingMode: "user",
      width: { ideal: 640 },
      height: { ideal: 480 }
    },
    audio: false
  };

  capture = createCapture(constraints, () => {
    console.log("攝影機啟動完成");
  });
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
  translate(width / 2, height / 2);
  
  // 2. 只有「影像」需要手動鏡像翻轉
  push();
  scale(-1, 1); 
  imageMode(CENTER);
  image(capture, 0, 0, w, h);
  pop();

  // 3. 繪製骨架與遊戲邏輯
  // 這裡不執行 scale(-1, 1)，因為 ml5 的 flipped: true 座標已經與影像對齊
  if (isModelReady && hands && hands.length > 0) {
    // 繪製線條
    drawHandLines(hands[0], w, h);
    
    if (gameState === "WAITING") {
      let gesture = detectGesture(hands[0]);
      if (gesture) {
        playerGesture = gesture;
        playGame(playerGesture);
      }
    }
  } else if (!isModelReady) {
    fill(0);
    textSize(16);
    text("AI 手勢模型載入中...", 0, 0);
  }
  pop();

  displayUI();
}

function drawHandLines(hand, w, h) {
  for (let kp of hand.keypoints) {
    // 4. 修正上下顛倒：將 y 軸的映射目標範圍對調 (-h/2, h/2) 變更為 (h/2, -h/2)
    // 這會確保無論手機如何旋轉，線條都會正確疊加在手上
    let x = map(kp.x, 0, capture.width, -w / 2, w / 2);
    let y = map(kp.y, 0, capture.height, h / 2, -h / 2);
    
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
      let x = map(hand.keypoints[idx].x, 0, capture.width, -w / 2, w / 2);
      let y = map(hand.keypoints[idx].y, 0, capture.height, h / 2, -h / 2);
      vertex(x, y);
    }
    endShape();
  }
}

function detectGesture(hand) {
  let k = hand.keypoints;
  // 5. 修正辨識邏輯：由於 y 座標在手機上可能反向，我們改用相對距離判斷
  // 判斷指尖與手掌中心（點 0）的距離是否遠於指根與手掌中心的距離
  let indexUp = dist(k[8].x, k[8].y, k[0].x, k[0].y) > dist(k[5].x, k[5].y, k[0].x, k[0].y);
  let middleUp = dist(k[12].x, k[12].y, k[0].x, k[0].y) > dist(k[9].x, k[9].y, k[0].x, k[0].y);
  let ringUp = dist(k[16].x, k[16].y, k[0].x, k[0].y) > dist(k[13].x, k[13].y, k[0].x, k[0].y);
  let pinkyUp = dist(k[20].x, k[20].y, k[0].x, k[0].y) > dist(k[17].x, k[17].y, k[0].x, k[0].y);
  
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
