let capture;
let handPose;
let hands = [];
let playerGesture = "";
let aiGesture = "";
let resultText = "請出拳 (石頭、剪刀、布)";
let gameState = "WAITING"; // "WAITING" 或 "FINISHED"
let choices = ["石頭", "剪刀", "布"];

function preload() {
  // 載入 ml5.js 手部追蹤模型
  handPose = ml5.handPose();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 擷取攝影機影像
  capture = createCapture(VIDEO);
  capture.size(640, 480);
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

  let w = width * 0.6;
  let h = height * 0.6;

  push();
  // 修正左右顛倒：移至中心並進行水平翻轉
  translate(width / 2, height / 2);
  scale(-1, 1);
  
  imageMode(CENTER);
  image(capture, 0, 0, w, h);

  // 繪製手部骨架並辨識手勢
  if (hands.length > 0) {
    drawHandLines(hands[0], w, h);
    
    // 遊戲邏輯：若在等待狀態且偵測到穩定手勢，則觸發 AI 出拳
    if (gameState === "WAITING") {
      let gesture = detectGesture(hands[0]);
      if (gesture) {
        playerGesture = gesture;
        playGame(playerGesture);
      }
    }
  }
  pop();

  displayUI();
}

function drawHandLines(hand, w, h) {
  // 將偵測座標映射到畫布上的影像大小 (影像預設 640x480)
  let sx = w / 640;
  let sy = h / 480;
  let offsetX = -w / 2;
  let offsetY = -h / 2;

  // 繪製關節點
  for (let kp of hand.keypoints) {
    fill(255, 0, 0);
    noStroke();
    ellipse(offsetX + kp.x * sx, offsetY + kp.y * sy, 8);
  }
  
  // 繪製手指連線
  stroke(255);
  strokeWeight(2);
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
      vertex(offsetX + hand.keypoints[idx].x * sx, offsetY + hand.keypoints[idx].y * sy);
    }
    endShape();
  }
}

function detectGesture(hand) {
  let k = hand.keypoints;
  // 簡易邏輯：判斷指尖(Tip)是否高於指根關節(PIP)
  let indexUp = k[8].y < k[6].y;
  let middleUp = k[12].y < k[10].y;
  let ringUp = k[16].y < k[14].y;
  let pinkyUp = k[20].y < k[18].y;
  
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
  textSize(32);
  text(`玩家出拳: ${playerGesture || "偵測中..."}`, width / 2, height * 0.85);
  
  if (gameState === "FINISHED") {
    fill(255, 0, 0);
    textSize(50);
    text(`AI 出拳: ${aiGesture}`, width / 2, height * 0.1);
    textSize(80);
    text(resultText, width / 2, height / 2);
    
    fill(50);
    textSize(20);
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
