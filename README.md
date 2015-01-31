Balls
===========

WebGL experimentation. Using HTML5 Canvas with JavaScript. 

Playable at

http://koti.kapsi.fi/~sklappal/balls/

Note: Requires a WebGL -enabled browser.

Instructions
============

- WASDQE to move (press shift to move faster, 'X' to go warpspeed)
- Arrows or mouse to rotate camera (press space)
- 'R' to reset to initial state
- TFGH to rotate objects
- Space to enable mouse control of the camera
- IJKL to rotate directional light ("sun")
- 'N' cycle camera through objects
- 'B' center camera on current object 
- '1' toggle "flashlight"
- '2' toggle directional light
- '3' toggle ambient light
- '4' toggle specular highlights
- 'z' toggle wireframe rendering
- '+', '-' adjust FOV


Technical
============

- All geometry is procedurally generated. Most of the surfaces are randomly perturbated to have a more organic feel. 
- Surface normals are defined per-vertex and are weighted by the triangle areas that meet at the vertex. This makes the edges of the cubes seem a bit odd.
- Lighting is based on Phong-shading. That is, lighting is calculated per-fragment (as opposed to per-vertex or per-triangle) and the surface normals are interpolated for the non-vertex points of the triangles. 
 
