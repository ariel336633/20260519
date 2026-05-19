let capture;

function setup() {
  // 1. 產生一個全螢幕的畫布
  createCanvas(windowWidth, windowHeight);
  
  // 擷取攝影機影像
  capture = createCapture(VIDEO);
  // 隱藏預設產生的 HTML 影片元件，我們要在畫布上自行繪製
  capture.hide();
}

function draw() {
  // 2. 畫布的背景顏色為淺藍色
  background('lightblue');

  // 計算 60% 的寬高
  let w = width * 0.6;
  let h = height * 0.6;

  push();
  // 3. 修正左右顛倒：移至中心並進行水平翻轉 (scale -1)
  translate(width / 2, height / 2);
  scale(-1, 1);
  
  // 4. 設定影像模式為中心點繪製，並顯示影像
  imageMode(CENTER);
  image(capture, 0, 0, w, h);
  pop();
}

// 當視窗大小改變時，自動調整畫布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
