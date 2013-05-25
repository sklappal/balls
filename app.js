// Copyright Sampsa Lappalainen 2013
function App() {
  
  var gl;
  function initGL() {
      try {
          var canvas = Get3dCanvas();
          gl = canvas.getContext("experimental-webgl");
          gl.viewportWidth = canvas.width;
          gl.viewportHeight = canvas.height;
      } catch (e) {
  
      }
      if (!gl) {
          alert("Could not initialise WebGL, sorry :-(");
      }
  }
  
  function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent + "\n";
        }
        k = k.nextSibling;
    }
    
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
  }
  
  
  var shaderProgram;
  
  function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.modelMatrixUniform = gl.getUniformLocation(shaderProgram, "uModelMatrix");
    shaderProgram.viewMatrixUniform = gl.getUniformLocation(shaderProgram, "uViewMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNormalMatrix");

    shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
    shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
    
    shaderProgram.usePositionalLight = gl.getUniformLocation(shaderProgram, "usePositionalLight");
    shaderProgram.useDirectionalLight = gl.getUniformLocation(shaderProgram, "useDirectionalLight");
    shaderProgram.useAmbientLight = gl.getUniformLocation(shaderProgram, "useAmbientLight");
  }
  
  
  var modelMatrix = mat4.create();
  var modelMatrixStack = [];
  var pMatrix = mat4.create();
  var viewMatrix = mat4.create();
  
  function modelPushMatrix() {
    var copy = mat4.create();
    mat4.set(modelMatrix, copy);
    modelMatrixStack.push(copy);
  }
  
  function modelPopMatrix() {
    if (modelMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    modelMatrix = modelMatrixStack.pop();
  }
  
  
  function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.modelMatrixUniform, false, modelMatrix);
    gl.uniformMatrix4fv(shaderProgram.viewMatrixUniform, false, viewMatrix);
    
    var normalMatrix = mat3.create();
    var temp = mat4.create();
    mat4.multiply(viewMatrix, modelMatrix, temp);
    mat4.toInverseMat3(temp, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
    gl.uniform1i(shaderProgram.usePositionalLight, usePositionalLight);
    gl.uniform1i(shaderProgram.useDirectionalLight, useDirectionalLight);
    gl.uniform1i(shaderProgram.useAmbientLight, useAmbientLight);
  }
   
   var xSpeed;
   var ySpeed;
   var objectRotation = mat4.identity();

   var lastTime;
   var pi = Math.pi;
   var lightingTransform = mat4.identity();
   var lRotX;
   var lRotY;
   
   var pitchRate;
   var pitch;
   var yawRate;
   var yaw;
   
   var movementRate;
   var strafeRate;
   var upRate;
   
   var cam = new camera();

   var r;
   var g;
   var b;
   var fps;
   var frameTime;
   var frameMovement;   
   var fpsFilter;
   var lookAtObject;
   var fovy;
   var usePositionalLight;
   var useDirectionalLight;
   var useAmbientLight;
   var drawtriangles;
   
   var mouseX;
   var mouseY;
   var sensitivity = 0.01;
   
   
   Reset();
    
  function Move(fwdAmount, sideAmount, upAmount) {
    cam.Move(fwdAmount, sideAmount, upAmount);
  }
  
  function SetPosition(vec) {
    cam.SetPosition(vec);
  }
  
  function GetPosition() {
    return cam.position;
  }
  
  
  function Rotate(yawAmount, pitchAmount) {
    Yaw(yawAmount);
    Pitch(pitchAmount);
    cam.Rotate(yaw, pitch);
  }
  
  function SetRotation(newYaw, newPitch) {
    SetYaw(newYaw);
    SetPitch(newPitch);
    cam.Rotate(yaw, pitch);
  }
  
  function Yaw(yawAmount) {
    SetYaw(yaw + yawAmount);
  }
  
  function SetYaw(newYaw) {
    yaw = moduloPi(newYaw);
  }
  
  function Pitch(pitchAmount) {
    SetPitch(pitch + pitchAmount);
  }
  
  function SetPitch(newPitch) {
    pitch = Math.min((Math.PI * 0.5) * 0.8, newPitch);
    pitch = Math.max((-Math.PI * 0.5) * 0.8, pitch);
  }     
  
  function Reset() {
    xSpeed = 0;
    ySpeed = 0;
    objectRotation = mat4.identity();
    
    lastTime = 0;
    fps = 0;
    pi = Math.PI;
    lightingTransform = mat4.identity();
    lRotX = -pi/4;
    lRotY = pi/4;
    
    pitchRate = 0.0;
    pitch = 0.0;
    yawRate = 0.0;
    yaw = 0.0;
    
    cam.Reset();
    
    movementRate = 0;
    strafeRate = 0;
    upRate = 0;
    r = 0.5;
    g = 0.5;
    b = 0.5;
    
    fpsFilter = 0.01;
    frameTime = 1/50.0 * 1000;
    frameMovement = 0;
    lookAtObject = 0;
    fovy = 60.0;
    usePositionalLight = false;
    useDirectionalLight = true;
    useAmbientLight = true;
    drawTriangles = true;
    
    mouseX = Get3dCanvas().width * 0.5;;
    mouseY = Get3dCanvas().height * 0.5;
    
    disableMouseRotate = false;
    
  }
  
  function handleMousePos() {
    
    if (disableMouseRotate) {
      return;
    }
    
    var midx = Get3dCanvas().width * 0.5;
    var midy = Get3dCanvas().height * 0.5;
    
    var dx = midx - mouseX;
    var dy = midy - mouseY;
    
    var len = dx*dx + dy*dy;
    
    // Safe zone in center of screen
    if (len < 100) {
      return;
    }

    yawRate += sensitivity * (dx / midx);
    pitchRate += sensitivity *  (dy / midy);
    
  }
  var t = 0.0;
  function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
      var elapsed = timeNow - lastTime;
      
      frameTime = (1-fpsFilter) * frameTime + fpsFilter * elapsed;
      fps = 1.0 / frameTime * 1000.0;
      var coeff = elapsed / 1000.0;
      xSpeed *= Math.pow(0.9, coeff);
      ySpeed *= Math.pow(0.9, coeff);
      
      t += coeff;
      
      var newObjectRotationMatrix = mat4.create();
      mat4.identity(newObjectRotationMatrix);
      mat4.rotateX(newObjectRotationMatrix, xSpeed * coeff);
      mat4.rotateY(newObjectRotationMatrix, ySpeed * coeff);
      mat4.multiply(newObjectRotationMatrix, objectRotation, objectRotation);

      handleMousePos();
      Rotate(yawRate * elapsed, pitchRate * elapsed);

    
      Move(movementRate * coeff, strafeRate * coeff, upRate * coeff);
   
      lRotY -= coeff / 10;
      frameMovement = cam.GetSpeed();
    }
    
    yawRate = 0.0;
    pitchRate = 0.0;
    
    lastTime = timeNow;
  }
   
  function drawHud() {
        
    var ro = function(value) {
      return " " + (value.toFixed(3)) + "\t";
    }
    
    var calcTris = function() {
      var ntris = 0;
      for (var i = 0; i < buffers.length; i++) {
        ntris += buffers[i].indexBuffer.numItems;
      }
      return ntris;
    }
    
    var calcVerts = function() {
      var nverts = 0;
      for (var i = 0; i < buffers.length; i++) {
        nverts += buffers[i].vertexBuffer.numItems / 3;
      }
      return nverts;
    }

    Clear2dCanvas();
    
    var text = 
    "yaw:" + ro(yaw) +
    "pitch:" + ro(pitch) +
    "\nX: " + ro(GetPosition()[0]) + " " +
    "Y: " + ro(GetPosition()[1]) + " " +
    "Z: " + ro(GetPosition()[2]) + " " +
    "\nFPS: " + ro(fps) + " " +
    "FOV: " + ro(fovy) + " " +
    "";
    
    var ctx = Get2dContext();
    ctx.font = "18px Segoe UI";
    ctx.fillStyle = "#FFFFFF"
    ctx.fillText(text, 30, 50);
    
  }
   
  function tick() {
    requestAnimFrame(tick);
    handleKeys();
    drawScene();
    drawHud();
    animate();
  }
  
  function moduloPi(val) {
    while (val > Math.PI) {
      val -= 2 * Math.PI;
    }
    
    while (val < -Math.PI) {
      val += 2 * Math.PI;
    }
    return val;
  }
      
  var currentlyPressedKeys = {};
  
  function lookAt(dest) {
    var dir = vec3.create();
    vec3.subtract(dest, GetPosition(), dir);
    vec3.normalize(dir);
    
    var newYaw = -(Math.atan2(dir[2], dir[0]) + Math.PI * 0.5);
    var newPitch = -(Math.acos(dir[1]) - Math.PI * 0.5);  
    
    SetRotation(newYaw, newPitch);
  }
  
  function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
    
    if (event.keyCode == 78) {
      // N  
      lookAtObject = (lookAtObject + 1) % objects.length;
      o = objects[lookAtObject];
      lookAt(o.position);
    }
    
    if (event.keyCode == 107) {
      // -
      if (fovy > 5.0) {
        fovy -=  5.0;
      }
    }
    
    if (event.keyCode == 109) {
      // +
      if (fovy < 175) {
        fovy += 5.0;
      }
    }
    
    if (event.keyCode == 49) {
      // 1
      usePositionalLight = !usePositionalLight;
    }
    
    if (event.keyCode == 50) {
      // 2
      useDirectionalLight = !useDirectionalLight;
    }
    
    if (event.keyCode == 51) {
      // 3
      useAmbientLight = !useAmbientLight;
    }
    
    if (event.keyCode == 90) {
      // z
      drawTriangles = !drawTriangles;
    }
    
  }

  function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
  }
  
 
  
  var objects = [];
  
  var centerBall;
  
  var ship;
  
  function initObjects() {
    
    var staticObjects = true;
    if (staticObjects) {
      objects.push(CreateDiamond3D([0.0, 0.0, 10.0]));
      objects.push(CreateSphere([-2.5, 0.0, 10.0]));
      objects.push(CreateCube([2.5, 0.0, 10.0], 2));
      
      objects.push(CreateTorus([5.0, 0.0, 10.0], 1.0, 0.5));
      
      objects.push(CreateSphere([0.0, 0.0, 0.0], 5.0));
      objects.push(CreateSphere([8.0, 0.0, 2.0], 0.1));
      objects.push(CreateDiamond3D([0.0, 0.0, -10.0]));
      objects.push(CreateSphere([0.0, 0.0, 1000], 500.0));
      objects.push(CreateSphere([0.0, -100.0, 450], 10.0));
      objects.push(CreateSphere([0.0, -70.0, 460], 5.0));
      objects.push(CreateDiamond3D([100, 0, 0], 40.0));
      
      objects.push(CreateSphere([20.0, 20.0, -200.0], 4.0));
      objects.push(CreateSphere([30.0, 20.0, -202.0], 0.5));
      objects.push(CreateCuboid([-110.0, -70.0, -202.0], 50, 50, 50));
      objects.push(CreateSphere([6000.0, -11000.0, -2000], 7000.0));
   } else {
      for (var i = 0; i < 5; i++) {
        var pos = vec3.createFrom((Math.random()-0.5) * 7000, (Math.random()-0.5) * 7000, (Math.random()-0.5) * 7000);
        var lbd = 0.001;
        var sz = Math.log(1-Math.random()) / (-lbd) ;
        objects.push(CreateSphere(pos, sz));
      }
      
      for (var i = 0; i < 30; i++) {
        var pos = vec3.createFrom((Math.random()-0.5) * 7000, (Math.random()-0.5) * 7000, (Math.random()-0.5) * 7000);
        var lbd = 0.01;
        var sz = Math.log(1-Math.random()) / (-lbd) ;
        objects.push(CreateSphere(pos, sz));
      }
    }
   
    centerBall = CreateSphere([0.0, 0.0, -0.1], 0.001);
   
    ship = CreateShip();
    ship.rotation = mat4.identity();
   
    
    
    initBuffers();
  }
  
  function initBuffers() {
    for (var i = 0; i < objects.length; i++) {
      objects[i].initBuffer(gl);
    }
    
    centerBall.initBuffer(gl);
    ship.initBuffer(gl);
    
  }
  
  function drawObject(object) {
    
    var posBuffer = object.bufferContainer.vertexBuffer; 
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, posBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    var normalBuffer = object.bufferContainer.normalBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
    
    modelPushMatrix();
    
    mat4.translate(modelMatrix, object.position)
    
    var obRot = object.rotation ? object.rotation : objectRotation;
    
    mat4.multiply(modelMatrix, obRot);
    setMatrixUniforms();
    
    if (drawTriangles) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.bufferContainer.triangleIndexBuffer);
      gl.drawElements(gl.TRIANGLES, object.bufferContainer.triangleIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    } else {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.bufferContainer.wireIndexBuffer);
      gl.drawElements(gl.LINES, object.bufferContainer.wireIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    } 
    
    modelPopMatrix();
  }
  
  function handleLighting() {
    
    var invCamera = mat4.create();
    mat4.inverse(cam.rotation, invCamera);
    
    lightingTransform = mat4.identity();
    mat4.multiply(lightingTransform, invCamera);
    mat4.rotateY(lightingTransform, lRotY);
    mat4.rotateX(lightingTransform, lRotX);
    
    var adjustedLD = vec3.createFrom(0.0, 0.0, 1.0);        
    mat4.multiplyVec3(lightingTransform, adjustedLD);

    gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);
    
    var stepr = (Math.random() - 0.5) / 30;
    var stepg = (Math.random() - 0.5) / 30;
    var stepb = (Math.random() - 0.5) / 30;
    
    r = Math.min(1.0, Math.max(0.0, stepr+r));
    g = Math.min(1.0, Math.max(0.0, stepg+g));
    b = Math.min(1.0, Math.max(0.0, stepb+b));
    
    gl.uniform3f(
      shaderProgram.directionalColorUniform,
      0.8, 0.0, 0.1);    
  }
  
  function drawScene() {
  
    //gl.clearColor(r, g, b, 1.0);
    gl.clearColor(0.0, 0.0, 0.15, 1.0);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(fovy, gl.viewportWidth / gl.viewportHeight, 0.1, 20000.0, pMatrix);

    mat4.identity(modelMatrix);
    mat4.identity(viewMatrix);
    
    thirdPerson = false;
    
    if (thirdPerson) {
      mat4.translate(viewMatrix, [0.0, -2.0, -50.0]);
      mat4.rotateX(viewMatrix, Math.PI / 12);
      drawObject(ship);
    } else {
      drawObject(centerBall);
    }
    
    var invCamera = mat4.create();
    mat4.inverse(cam.rotation, invCamera);
    mat4.multiply(viewMatrix, invCamera);
    
    var invPos = vec3.create();
    vec3.set(cam.position, invPos);
    vec3.scale(invPos, -1);
    mat4.translate(viewMatrix, invPos);

    handleLighting();

    for (var i = 0; i < objects.length; i++) {
      drawObject(objects[i]);  
    }        
    
  }
  
  function initialize() {
    initCanvasStyles();
    resize();
    initGL();
    initShaders();
    //console.profile();
    console.time("initobjects");
    initObjects();
    console.timeEnd("initobjects");
    //console.profileEnd();
  }
  
  function initCanvasStyles() { 
    var canvas3d = Get3dCanvas();
    canvas3d.style.position = 'absolute';
    //canvas3d.style.cursor = 'none';
  
    var canvas2d = Get2dCanvas();
    canvas2d.style.position = 'absolute'
    canvas2d.style.backgroundColor = "#000020";
    //canvas2d.style.cursor = 'none';
    
  }
  
  function resize() {    
    var HUDHeight = 80;
    
    var canvas = Get3dCanvas();
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight-HUDHeight;
    var canvas2d = Get2dCanvas();
    canvas2d.width = window.innerWidth;
    canvas2d.height = HUDHeight;
    canvas2d.style.top = window.innerHeight-HUDHeight;
    
  }
  
  function Get3dCanvas() {
    return document.getElementById("canvas");
  }
  
  function Get2dCanvas() {
    return document.getElementById("canvas2d");
  }
  
  function Get2dContext() {
    return Get2dCanvas().getContext("2d");
  }
  
  function Clear2dCanvas() {
    var ctx = Get2dContext();
    ctx.clearRect(0, 0, Get2dCanvas().width, Get2dCanvas().height);
  }
  
  
  this.webGLStart = function() {
    initialize();
    gl.enable(gl.DEPTH_TEST);
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    document.onmousemove = handleMouseMovement;
    window.onresize = resize;
    
    tick();
  }
  
  function handleKeys() {

    var speed = 5;
    var rotSpeed = speed / 1000;
    var lRotSpeed = speed / 100;
    if (currentlyPressedKeys[82]) {
      // R
      Reset();
      return;
    }
    if (currentlyPressedKeys[16]) {
      // Shift
      speed *= 10;
    }
    if (currentlyPressedKeys[88]) {
      // x
      speed *= 100;
    }

    if (currentlyPressedKeys[66]) {
      // B  
      o = objects[lookAtObject];
      lookAt(o.position);
    }
    
    upRate = 0;
    if (currentlyPressedKeys[81]) {
      // Q
      upRate = +speed;
    }
    if (currentlyPressedKeys[69]) {
      // E
      upRate = -speed;
    }
    if (currentlyPressedKeys[70]) {
      // F 
      ySpeed -= lRotSpeed;
    }
    if (currentlyPressedKeys[72]) {
      // H
      ySpeed += lRotSpeed;
    }
    if (currentlyPressedKeys[84]) {
      // T 
      xSpeed -= lRotSpeed;
    }
    if (currentlyPressedKeys[71]) {
      // G 
      xSpeed += lRotSpeed;
    }
    strafeRate = 0;
    if (currentlyPressedKeys[65]) {
      // A
      strafeRate = -speed;
    }
    if (currentlyPressedKeys[68]) {
      // D
      strafeRate = +speed;
    }
    movementRate = 0;
    if (currentlyPressedKeys[83]) {
      // S
      movementRate = +speed;
    }
    if (currentlyPressedKeys[87]) {
      // W
      movementRate = -speed;
    }
    if (currentlyPressedKeys[74]) {
      // J
      lRotY -= lRotSpeed;
      lRotY = moduloPi(lRotY);
    }
    if (currentlyPressedKeys[76]) {
      // L
      lRotY += lRotSpeed;
      lRotY = moduloPi(lRotY);
    }
    if (currentlyPressedKeys[75]) {
      // K
      lRotX += lRotSpeed;
      lRotX = moduloPi(lRotX);
    }
    if (currentlyPressedKeys[73]) {
      // I
      lRotX -= lRotSpeed;
      lRotX = moduloPi(lRotX);
    }
    if (currentlyPressedKeys[38]) {
      // UP
      pitchRate = -rotSpeed;
    }    
    if (currentlyPressedKeys[40]) {
      // DOWN
      pitchRate = +rotSpeed;
    }
    if (currentlyPressedKeys[37]) {
      // LEFT
      yawRate = +rotSpeed;
    }
    if (currentlyPressedKeys[39]) {
      // RIGHT
      yawRate = -rotSpeed;
    }
    disableMouseRotate = false;
    if (currentlyPressedKeys[32]) {
      // space
      xSpeed = 0.0;
      ySpeed = 0.0;
      disableMouseRotate = true;
    }
  }
  
  function handleMouseMovement(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
  }
  
}