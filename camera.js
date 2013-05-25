

function camera() {
  
  var prevPos;
  
  this.Reset = function() {
    this.position = vec3.createFrom(0.0, 0.0, 30.0);
    this.rotation = mat4.identity();
    prevPos = this.position;   
  }
  
  this.Reset();
  
  this.UpVector = function() {
    return mat4.multiplyVec3(this.rotation, vec3.createFrom(0.0, 1.0, 0.0));
  }
  
  this.RightVector = function() {
    return mat4.multiplyVec3(this.rotation, vec3.createFrom(1.0, 0.0, 0.0));
  }
  
  this.LookVector = function() {
    return mat4.multiplyVec3(this.rotation, vec3.createFrom(0.0, 0.0, 1.0));
  }
  
  this.Rotate = function(yaw, pitch) {
    mat4.identity(this.rotation);
    mat4.rotateY(this.rotation, yaw);
    mat4.rotateX(this.rotation, pitch);
  }
  
  this.Move = function(lookAmount, rightAmount, upAmount) {
    var normalizedMovement = vec3.createFrom(Math.abs(lookAmount), Math.abs(rightAmount), Math.abs(upAmount));
    vec3.normalize(normalizedMovement);
    
    prevPos = this.position;
    
    var movement = this.LookVector();
    vec3.scale(movement, lookAmount * normalizedMovement[0]);
    vec3.add(this.position, movement);
    
    movement = this.RightVector();
    vec3.scale(movement, rightAmount * normalizedMovement[1]);
    vec3.add(this.position, movement);
    
    movement = this.UpVector();
    vec3.scale(movement, upAmount * normalizedMovement[2]);
    vec3.add(this.position, movement);
  }
  
  this.SetPosition = function(vec) {
    prevPos = this.position;
    this.position = vec;
  }
  
  this.GetSpeed = function() {
    return 0.0;//vec3.length(vec3.subtract(prevPos, this.position));
  }
  
  this.GetPosition = function() {
    return this.position;
  }
  
}
