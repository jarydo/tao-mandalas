baseUrl = document.currentScript.getAttribute("data-base-url") || "";

let handPose;
let video;
let hands = [];
let rotation = 0;
let innerCircle, outerCircle;
let glowIntensity = 0;
let pulsePhase = 0;

// Video aspect ratio and scaling variables
let videoAspectRatio = 16 / 9; // Default camera aspect ratio
let videoScale = 1;
let videoOffsetX = 0;
let videoOffsetY = 0;

let handStates = [];

function preload() {
  handPose = ml5.handPose();
  innerCircle = loadImage(baseUrl + "/inner_circle.png");
  outerCircle = loadImage(baseUrl + "/outer_circle.png");

  soundFormats("mp3");
  shieldOpen = loadSound(baseUrl + "/shield_open.mp3");
  shieldOpen.rate(1.2);
  shieldClose = loadSound(baseUrl + "/shield_close.mp3");
  shieldClose.rate(1.2);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  video.elt.addEventListener("loadedmetadata", () => {
    calculateVideoScaling();
  });

  handPose.detectStart(video, gotHands);
}

function calculateVideoScaling() {
  // Get actual video dimensions
  let videoWidth = video.width;
  let videoHeight = video.height;
  videoAspectRatio = videoWidth / videoHeight;

  // Calculate scaling to fill screen while maintaining aspect ratio
  let screenAspectRatio = width / height;

  if (videoAspectRatio > screenAspectRatio) {
    // Video is wider than screen - scale by height
    videoScale = height / videoHeight;
    videoOffsetX = (width - videoWidth * videoScale) / 2;
    videoOffsetY = 0;
  } else {
    // Video is taller than screen - scale by width
    videoScale = width / videoWidth;
    videoOffsetX = 0;
    videoOffsetY = (height - videoHeight * videoScale) / 2;
  }
}

function windowResized() {
  // Resize canvas when window is resized
  resizeCanvas(windowWidth, windowHeight);
  calculateVideoScaling();
}

function draw() {
  // Fill background with black in case video doesn't fill entire screen
  background(0);

  let scaledWidth = video.width * videoScale;
  let scaledHeight = video.height * videoScale;

  image(video, videoOffsetX, videoOffsetY, scaledWidth, scaledHeight);

  rotation += 2;
  pulsePhase += 0.1;

  drawMagicEffects();
}

function gotHands(results) {
  hands = results;

  while (handStates.length < hands.length) {
    handStates.push({ isOpen: false, wasOpen: false });
  }
  handStates = handStates.slice(0, hands.length);
}

function drawMagicEffects() {
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    let handState = handStates[i];

    let wrist = hand.wrist;
    let middleTip = hand.middle_finger_tip;
    let middleMcp = hand.middle_finger_mcp;
    let thumbCmc = hand.thumb_cmc;
    let pinkyMcp = hand.pinky_finger_mcp;

    console.log(hand);

    // Convert hand coordinates to screen coordinates
    let screenX = middleMcp.x * videoScale + videoOffsetX;
    let screenY = middleMcp.y * videoScale + videoOffsetY;

    // Calculate if hand is open using ratio-based approach
    let palmWidth = dist(thumbCmc.x, thumbCmc.y, pinkyMcp.x, pinkyMcp.y);
    let fingerSpread = dist(wrist.x, wrist.y, middleTip.x, middleTip.y);
    let openness = fingerSpread / palmWidth;

    // Use ratio threshold (independent of distance/scale)
    let threshold = 1.5; // Adjust this ratio as needed

    // Update hand state
    handState.wasOpen = handState.isOpen;
    handState.isOpen = openness > threshold;

    // Handle state changes
    if (handState.isOpen && !handState.wasOpen) {
      // Hand just opened
      shieldOpen.play();
    } else if (!handState.isOpen && handState.wasOpen) {
      // Hand just closed
      shieldClose.play();
    }

    // Draw effects for open hands
    if (handState.isOpen) {
      glowIntensity = lerp(glowIntensity, 1.0, 0.1);
      drawShields(
        width - screenX,
        screenY,
        openness * palmWidth * videoScale * 0.8
      );
    }
  }
}

function drawShields(x, y, baseSize) {
  // Scale circle size based on video scaling
  let sizeMultiplier = map(videoScale, 0.5, 3.0, 1.5, 3.5);
  let circleSize = baseSize * sizeMultiplier;
  let pulse = sin(pulsePhase) * 0.01 + 1.0;

  push();
  translate(x, y);

  let glowColor = `rgba(200, 33, 16, ${glowIntensity * 0.8})`;
  let shadowBlur = 40 * glowIntensity;

  // Apply glow filter to the drawing context
  if (glowIntensity > 0.1) {
    drawingContext.shadowColor = glowColor;
    drawingContext.shadowBlur = shadowBlur;
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 0;
  }

  // OUTER CIRCLE
  push();
  rotate(radians(rotation));
  imageMode(CENTER);

  tint(255, 255, 255, 255);
  image(outerCircle, 0, 0, circleSize * pulse, circleSize * pulse);
  pop();

  // INNER CIRCLE
  push();
  rotate(radians(-rotation));
  imageMode(CENTER);

  tint(255, 255, 255, 255);
  image(innerCircle, 0, 0, circleSize * pulse, circleSize * pulse);
  pop();

  // Reset shadow
  drawingContext.shadowBlur = 0;

  pop();
}
