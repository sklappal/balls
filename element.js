// Copyright Sampsa Lappalainen 2012

  function assert(test, note) {
    if (!test) {
      alert("Test failed:" + note + "!");
    }    
  }
  
  function showVal(val, name) {
    alert(name + " " + val);
  }

  function showVec(vec) {
    alert("(" + vec[0] + " " + vec[1] + " " + vec[2] + ")");
  }
    
    
  function sub(v1, v2) {
    return [v1[0]-v2[0], v1[1]-v2[1], v1[2]-v2[2]];
  }
  
  function calculateTriangleNormal(v1, v2, v3) {
    var p1 = sub(v2, v1);
    var p2 = sub(v3, v1);
    
    vec3.cross(p1, p2);

    vec3.normalize(p1);
    
    return p1;
  }

  function calculateTriangleArea(v1, v2, v3) {
    var a = vec3.length(sub(v1, v2));
    var b = vec3.length(sub(v1, v3));
    var c = vec3.length(sub(v3, v2));
    
    var s = (a+b+c) / 2;
    // Herons formula 
    return ret = Math.sqrt(s * (s-a) * (s-b) * (s-c));
  }


  function calculateVertexNormals(vertices, indices) {
    var vertexNormals = [];

    var triangleAreas = [];
    var triangleNormals = [];
    var tempVec = vec3.create();
    for (var i = 0; i < indices.length; i++) {
      var currentTriangle = indices[i];
      var v1 = vertices[currentTriangle[0]];
      var v2 = vertices[currentTriangle[1]];
      var v3 = vertices[currentTriangle[2]];

      var w = calculateTriangleArea(v1, v2, v3);
      var n = calculateTriangleNormal(v1, v2, v3);
      triangleAreas.push(w);
      triangleNormals.push(n);
    }

    triangles_for_each_vertex = [];
    
    for (var i = 0; i < vertices.length; i++) {
      triangles_for_each_vertex[i] = [];
    }
    
    for (var i = 0; i < indices.length; i++) {
      var curTri = indices[i];
      triangles_for_each_vertex[curTri[0]].push(i);
      triangles_for_each_vertex[curTri[1]].push(i);
      triangles_for_each_vertex[curTri[2]].push(i);
    }

    for (var i = 0; i < vertices.length; i++) {
      var triangles_with_this_vertex = triangles_for_each_vertex[i]; 
            
      var accum = vec3.createFrom(0.0, 0.0, 0.0);
      for (var j = 0; j < triangles_with_this_vertex.length; j++) {
        var currentTriangleIndex = triangles_with_this_vertex[j];
        vec3.scale(triangleNormals[currentTriangleIndex], triangleAreas[currentTriangleIndex], tempVec)
        accum[0] += tempVec[0];
        accum[1] += tempVec[1];
        accum[2] += tempVec[2]; 
      }
      
      vec3.normalize(accum);
      vertexNormals.push(accum);
    }
    return vertexNormals;
  }
  
  function triangleBoundingBox(v1, v2, v3) {    
    
    var minx = v2[0] < v1[0] ? (v3[0] < v2[0] ? v3[0] : v2[0]) : v1[0];
    var miny = v2[1] < v1[1] ? (v3[1] < v2[1] ? v3[1] : v2[1]) : v1[1];
    var minz = v2[2] < v1[2] ? (v3[2] < v2[2] ? v3[2] : v2[2]) : v1[2];
    
    var maxx = v2[0] > v1[0] ? (v3[0] > v2[0] ? v3[0] : v2[0]) : v1[0];
    var maxy = v2[1] > v1[1] ? (v3[1] > v2[1] ? v3[1] : v2[1]) : v1[1];
    var maxz = v2[2] > v1[2] ? (v3[2] > v2[2] ? v3[2] : v2[2]) : v1[2];
    
    return { minimums : [minx, miny, minz], maximums : [maxx, maxy, maxz] }
  }

  function BufferContainer(mesh, gl) {
    this.vertexBuffer = gl.createBuffer();
    this.triangleIndexBuffer = gl.createBuffer();
    this.wireIndexBuffer = gl.createBuffer();
    this.normalBuffer = gl.createBuffer();
      
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    
    var verts = mesh.vertexBuffer();
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    this.vertexBuffer.itemSize = 3;
    this.vertexBuffer.numItems = verts.length;

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangleIndexBuffer);
    var inds = mesh.triangleIndexBuffer();
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(inds), gl.STATIC_DRAW);
    this.triangleIndexBuffer.itemSize = 1;
    this.triangleIndexBuffer.numItems = inds.length;

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.wireIndexBuffer);
    var inds = mesh.wireIndexBuffer();
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(inds), gl.STATIC_DRAW);
    this.wireIndexBuffer.itemSize = 1;
    this.wireIndexBuffer.numItems = inds.length;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    var normals = mesh.normalBuffer()
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    this.normalBuffer.itemSize = 3;
    this.normalBuffer.numItems = normals.length;
  }
    
  function element(position, mesh) {
    this.position = position;
    this.mesh = mesh;
    
    this.initBuffer = function(gl) {
      this.bufferContainer = new BufferContainer(mesh, gl);  
    }
    
    this.Contains = function(vWorld) {
      var trans = vec3.create();
      vec3.subtract(this.position, vWorld, trans);
      return AABBContainsV(this.mesh.boundingBox(), trans);
    }
    
  }

  function trianglemesh(vertices, indices) {
    assert(vertices.length % 3 == 0, "vert len % 3 == 0");
    this.vertices = [];
    for (var i = 0; i < vertices.length; i+=3) {
      this.vertices.push([vertices[i], vertices[i+1], vertices[i+2]]);
    }
    
    assert(indices.length % 3 == 0, "ind len % 3 == 0");
    this.triangles = [];    
    for (var i = 0; i < indices.length; i+=3) {
      this.triangles.push([indices[i], indices[i+1], indices[i+2]]);
    }
    
    var bufferConvert = function(buf) {
      retBuf = [];
      for (var i = 0; i < buf.length; i++) {
        retBuf.push(buf[i][0]);
        retBuf.push(buf[i][1]);
        retBuf.push(buf[i][2]);
      }
      return retBuf;
    }
    
    this.vertexBuffer = function() {
      return bufferConvert(this.vertices);
    }
    
    this.triangleIndexBuffer = function() {
      return bufferConvert(this.triangles);
    }
    
    this.wireIndexBuffer = function() {
      retBuf = [];
      for (var i = 0; i < this.triangles.length; i++) {
        retBuf.push(this.triangles[i][0]);
        retBuf.push(this.triangles[i][1]);
        retBuf.push(this.triangles[i][1]);
        retBuf.push(this.triangles[i][2]);
        retBuf.push(this.triangles[i][2]);
        retBuf.push(this.triangles[i][0]);
      }
      return retBuf;
    }
    
    this.normalBuffer = function() {
      if (!this.vertexNormals) {
        this.vertexNormals = calculateVertexNormals(this.vertices, this.triangles);
      }
      return bufferConvert(this.vertexNormals);
    }
    
    this.boundingBox = function() {
      if (!this.bbCache) {
        var minx = this.vertices[0][0];
        var maxx = this.vertices[0][0];
        var miny = this.vertices[0][1];
        var maxy = this.vertices[0][1];
        var minz = this.vertices[0][2];
        var maxz = this.vertices[0][2];
        for (var i = 1; i < this.vertices.length; i++) {
          minx = Math.min(minx, this.vertices[i][0]);
          maxx = Math.max(maxx, this.vertices[i][0]);
          miny = Math.min(miny, this.vertices[i][1]);
          maxy = Math.max(maxy, this.vertices[i][1]);
          minz = Math.min(minz, this.vertices[i][2]);
          maxz = Math.max(maxz, this.vertices[i][2]);
        }
        this.bbCache = { min : [minx, miny, minz], max : [maxx, maxy, maxz] };
      }
      
      return this.bbCache;
    }
  }
  
  function AABBContainsV(aabb, v) {
    return (v[0] >= aabb.min[0] && v[0] <= aabb.max[0]) &&
      (v[1] >= aabb.min[1] && v[1] <= aabb.max[1]) &&
      (v[2] >= aabb.min[2] && v[2] <= aabb.max[2]);
  }
  
  function identity(v) {
    return v;
  }
 
  function CreateDiamond3D(position, radius) {
    
    radius = radius ? radius : 1.0;
    
    var vertices =  [
      //Front bottom
      0.0, -1.0, 0.0,
      1.0, 0.0, 0.5,
      -1.0, 0.0, 0.5,
      0.66, 0.5, 0.3,
      -0.66, 0.5, 0.3,
      0.0, 0.5, -0.84,
      0.0, 0.0, -1.23
      ]
    var indices = [
      // bottom front
      0, 1, 2,
      // bottom left
      0, 6, 1,
      // bottom right
      0, 2, 6,
      // front top
      1, 4, 2,
      1, 3, 4,
      // left top
      1, 6, 3,
      5, 3, 6,
      // right top
      4, 6, 2,
      4, 5, 6,
      // top
        4, 3, 5];

      return new element(
        position, 
        scaleMesh(
          perturbMesh(
            refineMesh(
              new trianglemesh(vertices, indices)
            )
          )
        ,
        radius));
              
    }
 
    function CreateSphere(position, radius) {
      
      radius = radius ? radius : 1.0;
  
      var vertices =  [
        0.0, 1.0, 0.0,
        -1.0, 0.0, 0.0,
        0.0, 0.0, 1.0,
        1.0, 0.0, 0.0,
        0.0, 0.0, -1.0,
        0.0, -1.0, 0.0
        ]
      var indices = [
        1, 2, 0,
        2, 3, 0,
        3, 4, 0,
        4, 1, 0,
        1, 5, 2,
        2, 5, 3,
        3, 5, 4,
        4, 5, 1
       ];
      
      return new element(
        position, 
        perturbMesh(
          scaleMesh(
            refineMesh(
              new trianglemesh(vertices, indices),
              3, 
              vec3.normalize
            ), radius
          )   
        )
        ); 
    }
    
    function CreateCube(position, sideLength) {
      return CreateCuboid(position, sideLength, sideLength, sideLength);
    }
    
    function CreateCuboid(position, width, height, depth) {
      var w2 = -width * 0.5;
      var h2 = -height * 0.5;
      var d2 = -depth * 0.5;
      
      var vertices =  [
        w2, h2, d2,
        w2, h2, -d2,
        w2, -h2, d2,
        w2, -h2, -d2,
        -w2, h2, d2,
        -w2, h2, -d2,
        -w2, -h2, d2,
        -w2, -h2, -d2
      ]
      var indices = [
        0, 6, 4,
        0, 2, 6,
        4, 6, 7,
        4, 7, 5,
        7, 3, 1,
        7, 1, 5,
        3, 2, 0,
        3, 0, 1,
        3, 7, 6,
        3, 6, 2,
        4, 5, 1,
        4, 1, 0
       ];
      
      return new element(
        position, 
        perturbMesh(
          refineMesh(new trianglemesh(vertices, indices))
        )
      ); 
    }
    
    
    function CreateTorus(position, radius1, radius2) {
      
      var vertices = [];
      
      var width = 32.0;
      var height = 16.0;
      var twoPi = 2.0 * Math.PI;
      
      
      for (var j = 0; j < height; j++) {
        for (var i = 0; i < width; i++) {
          var theta = twoPi * (i / width);
          var phi = twoPi * (j / height);
          vertices.push((radius1 + radius2 * Math.cos(phi)) * Math.cos(theta));
          vertices.push((radius1 + radius2 * Math.cos(phi)) * Math.sin(theta));
          vertices.push(radius2 * Math.sin(phi));
        }
      }
      
      var indices = [];
      
      
      for (var j = 0; j < height; j++) {
        for (var i = 0; i < width; i++) {
          iPlus1 = (i+1) % width;
          jPlus1 = (j+1) % height;
          
          indices.push(i + j * width);
          indices.push(iPlus1 + j * width);
          indices.push(i + jPlus1 * width);
          
          indices.push(i + jPlus1 * width);
          indices.push(iPlus1 + j * width);
          indices.push(iPlus1 + jPlus1 * width);
            
        }
      }
      
      for (var i = 0; i < indices.length; i++) {
        assert(indices[i] < vertices.length);
      }
      
      return new element(position, new trianglemesh(vertices, indices));
      
    }
    
    function CreateShip() {
      var vertices =  [
        0.0, 0.0, -1.0,
        0.0, 0.2, +0.8,
        0.5, 0.0, +1.0,
        -0.5, 0.0, +1.0       
      ];
      var indices = [
        0, 1, 2,
        0, 2, 3,
        0, 3, 1,
        1, 3, 2
      ];
      
      return new element([0.0, 0.0, 0.0], new trianglemesh(vertices, indices));
      
    }
    
    /*
     * Refinemesh creates 3 new vertices and 4 new triangles for each triangle 
     *
     *       *             *
     *      / \           / \
     *     /   \   =>    *---*
     *    /     \       /\   /\
     *   *-------*     *---*---*
      
     */
  function refineMesh(mesh, steps, normalization) {
    function findIndex(ind1, ind2, pairs) {
      for (var i = 0; i < pairs.length; i++) {
        if ((pairs[i].ind1 == ind1) && (pairs[i].ind2 == ind2) ||
            (pairs[i].ind1 == ind2) && (pairs[i].ind2 == ind1)) {
          return pairs[i].index;
        }
      }
      return -1;
    }
    
    function splitVertex(ind1, ind2, newVerts, processed) {
      var p = vec3.create();
      vec3.add(vertices[ind1], vertices[ind2], p);
      vec3.scale(p, 0.5);
      normalization(p);
      newVerts.push(p);
      var ret = newVerts.length-1;
      processed.push({ind1: ind1, ind2: ind2, index: ret});
      return ret;
    }
    
    steps = steps ? steps : 3;
    normalization = normalization ? normalization : identity;
    
    var triangles = mesh.triangles;
    var vertices = mesh.vertices;
    
    for (var i = 0; i < steps; i++) {
      var newTriangles = [];
      var newVertices = [];
      var processedPairs = [];
      for (var j = 0; j < triangles.length; j++) {
         
        var tri = triangles[j];
        
        var p1ind = tri[0];
        var p2ind = tri[1];
        var p3ind = tri[2];
        var p4ind = findIndex(p1ind, p2ind, processedPairs);
        var p5ind = findIndex(p1ind, p3ind, processedPairs);
        var p6ind = findIndex(p2ind, p3ind, processedPairs);
        
        if (p4ind == -1) {
          p4ind = splitVertex(p1ind, p2ind, newVertices, processedPairs);
        }
        p4ind += vertices.length; 
        
        if (p5ind == -1) {
          p5ind = splitVertex(p1ind, p3ind, newVertices, processedPairs);
        }
        p5ind += vertices.length;
        
        if (p6ind == -1) {
          p6ind = splitVertex(p2ind, p3ind, newVertices, processedPairs);
        }
        p6ind += vertices.length;
            
        newTriangles.push([p1ind, p4ind, p5ind]);
        newTriangles.push([p2ind, p6ind, p4ind]);
        newTriangles.push([p3ind, p5ind, p6ind]);
        newTriangles.push([p4ind, p6ind, p5ind]); 
      }
      vertices = vertices.concat(newVertices);
      triangles = newTriangles;
    }

    
    mesh.vertices = vertices;
    mesh.triangles = triangles;
    return mesh;
  }  


  // Not used at the moment.
  function removeDuplicateVertices(vertices, triangles) {
              
    var newVertices = [];
    for (var i = 0; i < vertices.length; i++) {
      found = false;
      var thisVert = vertices[i];
      for (var j = 0; j < newVertices.length; j++) {
        var newVert = newVertices[j];
        if (vec3.equal(thisVert, newVert)) {
          found = true;
          break;
        }
      }
      
      if (!found) {
        newVertices.push(vertices[i]);
      } 
    }
    
    // find new indices for triangles
    for (var i = 0; i < triangles.length; i++) {
      
      var t = triangles[i];
      var p1 = vertices[t[0]];
      var p2 = vertices[t[1]];
      var p3 = vertices[t[2]];
      
      var found = false;
      
      for (var j = 0; j < newVertices.length; j++) {
        if (vec3.equal(p1, newVertices[j])) {
          t[0] = j;
          break;
        }
      }
      
      for (var j = 0; j < newVertices.length; j++) {
        if (vec3.equal(p2, newVertices[j])) {
          t[1] = j;
          break;
        }
      }
      
      for (var j = 0; j < newVertices.length; j++) {
        if (vec3.equal(p3, newVertices[j])) {
          t[2] = j;
          break;
        }
      }
      
      triangles[i] = t;
    }
    
    return {v : newVertices, t : triangles }; 
  }

  function perturbMesh(mesh) {
    var coeff = 2/100;
    for (var i = 0; i < mesh.vertices.length; i++) {
      vec3.scale(mesh.vertices[i], 1 + (Math.random() - 0.5) * coeff);
    }
    return mesh;
  }
  
  function scaleMesh(mesh, radius) {
    for (var i = 0; i < mesh.vertices.length; i++) {
      vec3.scale(mesh.vertices[i], radius);
    }
    return mesh;
  }
    

