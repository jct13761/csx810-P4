// Read/Do:
//  Dusan Bosnjak (triangles)
//      https://medium.com/@pailhead011/writing-glsl-with-three-js-part-1-1acb1de77e5c
//      https://medium.com/@pailhead011/extending-three-js-materials-with-glsl-78ea7bbb9270
//
//  Basic (step by step includes set-up)
//      https://pandaqitutorials.com/Games/9-three-js-complete-glsl-tutorial
//
//  A bit random but still OK (jump to the shader section)
//      https://dev.to/maniflames/creating-a-custom-shader-in-threejs-3bhi
//      (we will fix and work with this one)

//
//  CJ Gammon -- Shader Tutorial Nice video with nice results:
//      https://www.youtube.com/watch?v=uD4GnMsAH1U&t=522s
//
//  later more in-depth:
//      https://thebookofshaders.com/
//  debugging hints:
//      https://threejsfundamentals.org/threejs/lessons/threejs-debugging-glsl.html
//
// Here we are doing partly
// https://pandaqitutorials.com/Games/9-three-js-complete-glsl-tutorial
//


import * as THREE from 'https://unpkg.com/three@0.120.0/build/three.module.js';
import {OrbitControls} from 'https://unpkg.com/three@0.120.0/examples/jsm/controls/OrbitControls.js';
import {GUI} from 'https://unpkg.com/three@0.120.0/examples/jsm/libs/dat.gui.module.js';
import {TeapotBufferGeometry} from 'https://unpkg.com/three@0.120.0/examples/jsm/geometries/TeapotBufferGeometry.js';

let controls = [];      // array of instances from a class (new in javascript)
let gui;

let scene;
let camera;
let renderer;
let sceneObjects = [];
let teapotObjects = [];

let uniforms = {};
let cameraControls;

let ambientLight;
let light;

let scale = 2;

let textureMap;

let teapotA;
let teapotB;
let materialsArray = [];
let teapotGeometry;
let shading = 0;

// lambert stuff
let lambertColor = new THREE.Color(0x0000ff);;

// toonShader stuff
let toonColor = 0;
let toonNumLayers = 0;
let toonStartingBound = 0.8;
let toonColorIntensityPerStep = 0.15;

// Phong Shader stuff
let phongAmbientX = 0.9;
let phongAmbientY = 0.3;
let phongAmbientZ = 0.9;
// let phongAmbient = new THREE.Vector3(phongAmbientX, phongAmbientY, phongAmbientZ);
let phongDiffuseX = 0.9;
let phongDiffuseY = 0.5;
let phongDiffuseZ = 0.3;
// let phongDiffuse = new THREE.Vector3(phongDiffuseX, phongDiffuseY, phongDiffuseZ);
let phongSpecularX = 0.8;
let phongSpecularY = 0.8;
let phongSpecularZ = 0.8;
// let phongSpecular = new THREE.Vector3(phongSpecularX, phongSpecularY, phongSpecularZ);
let phongLightIntensity = new THREE.Vector4(0.5, 0.5, 0.5, 1.0);
let phongLightPosition = new THREE.Vector4(0.0, 2000.0, 0.0, 1.0);
let phongShininess = 200.0;

let shadingAlgorithm = [
    {
        WireFrame: 0,  /**/
        Flat: 1,
        Normal: 2,      /* OK */
        Glow: 3,      /* OK */
        Toon: 4,      /* OK */
        Phong: 5,
        Lambert: 6,
        Gourard: 7,
        Texture: 8,

    },
];

let shadingAlgorithmString = [
    'WireFrame',
    'Flat',
    'Normal',
    'Glow',
    'Toon',
    'Phong',
    'Lambert',
    'Gourard',
    'Texture',

];


function setSomeVariables(value) {
    console.log("stuff:" + value);
    console.log("stuff:" + shadingAlgorithmString[value]);
    shading = value;

    teapotA.material = materialsArray[value];
    teapotA.material.needsUpdate = true;

    // teapotGeometry.attributes.color.needsUpdate = true;
}

function addControls(controlObject) {
    gui = new GUI();
    gui.add(controlObject, 'rotationSpeed', -0.01, 0.01).step(0.01);
    gui.add(controlObject, 'scale', 0, 2).step(0.1);
    gui.add(controlObject, 'Shader', shadingAlgorithm[0]).onChange(setSomeVariables);
    // gui.add(controlObject, 'shear_a', -5, 5).step(0.1);

}


// using the code as a string from  app.html --
function addBuiltInShadersTeapot()  // comparison teapot using library routines
{
    let teapotSize = 1 * scale;
    let tess = -1;	// force initialization

    let materialColor = new THREE.Color();
    materialColor.setRGB(1.0, 0.8, 0.6);

    // TEXTURE MAP
    textureMap = new THREE.TextureLoader().load('textures/uv_grid_opengl.jpg');
    textureMap.wrapS = textureMap.wrapT = THREE.RepeatWrapping;
    textureMap.anisotropy = 16;
    textureMap.encoding = THREE.sRGBEncoding;

    // REFLECTION MAP
    let path = "textures/cube/pisa/";
    let urls = [
        path + "px.png", path + "nx.png",
        path + "py.png", path + "ny.png",
        path + "pz.png", path + "nz.png"
    ];

    let textureCube = new THREE.CubeTextureLoader().load(urls);
    textureCube.encoding = THREE.sRGBEncoding;

    teapotGeometry = new TeapotBufferGeometry(
        teapotSize,
        tess,
        true,
        true,
        true,
        true
    );


    let wireMaterial = new THREE.MeshBasicMaterial({color: 0x7777ff, wireframe: true});
    wireMaterial.needsUpdate = true;
    materialsArray.push(wireMaterial);

    let flatMaterial = new THREE.MeshPhongMaterial({
        color: materialColor,
        specular: 0x000000,
        flatShading: true,
        side: THREE.DoubleSide
    });
    materialsArray.push(flatMaterial);

    let normalMaterial = new THREE.MeshNormalMaterial({color: 0x7777ff});
    materialsArray.push(normalMaterial);

    let glowMaterial = new THREE.MeshPhongMaterial({color: materialColor, envMap: textureCube, side: THREE.DoubleSide});
    materialsArray.push(glowMaterial);

    //let toonMaterial       = new THREE.MeshToonMaterial( { color: 0x7777ff  } );
    let toonMaterial = new THREE.MeshToonMaterial({color: 0x7777ff});
    materialsArray.push(toonMaterial);

    let phongMaterial = new THREE.MeshPhongMaterial({color: materialColor, side: THREE.DoubleSide});
    materialsArray.push(phongMaterial);

    let lambertMaterial = new THREE.MeshLambertMaterial({color: materialColor, side: THREE.DoubleSide});
    materialsArray.push(lambertMaterial);

    let gouraudMaterial = new THREE.MeshLambertMaterial({color: materialColor, side: THREE.DoubleSide});
    materialsArray.push(gouraudMaterial);

    let texturedMaterial = new THREE.MeshPhongMaterial({color: materialColor, map: textureMap, side: THREE.DoubleSide});
    materialsArray.push(texturedMaterial);

    //console.log("inShader:" + shadingAlgorithmString[shading]);

    // redraw the teapot ----- (not done here )
    shading = 2;
    teapotA = new THREE.Mesh(teapotGeometry, materialsArray[shading]);

    scene.add(teapotA);
    teapotObjects.push(teapotA);

    teapotA.position.x = 6 * scale;
}


// using the code as a string from  app.html --
function addPhongTeapot() {
    let teapotSize = 1 * scale;
    let tess = -1;	// force initialization

    const teapotGeometry2 = new TeapotBufferGeometry(teapotSize, tess, true, true, true, true);


    let itemMaterial = new THREE.ShaderMaterial({
        //Optional, here you can supply uniforms and attributes
        uniforms:
            {
                Ka: {value: new THREE.Vector3(phongAmbientX, phongAmbientY, phongAmbientZ)}, // the color
                Kd: {value: new THREE.Vector3(phongDiffuseX, phongDiffuseY, phongDiffuseZ)},
                Ks: {value: new THREE.Vector3(phongSpecularX, phongSpecularY, phongSpecularZ)},
                // Ka: {value: phongAmbient}, // the color
                // Kd: {value: phongDiffuse},
                // Ks: {value: phongSpecular},
                LightIntensity: {value: phongLightIntensity},
                LightPosition: {value: phongLightPosition},
                Shininess: {value: phongShininess}
            },
        // vertexShader: phongVertexShader(),
        // fragmentShader: phongFragmentShader(),
        fragmentShader: lambertFragmentShader(),
        vertexShader: lambertVertexShader(),
    });

    teapotB = new THREE.Mesh(teapotGeometry2, itemMaterial);

    scene.add(teapotB);
    teapotObjects.push(teapotB);

    teapotB.position.x = -6 * scale;
}

// using the code as a string from  app.html --
function addDiffuseShadingCube() {
    // get from header - just another method.
    // let vShader = document.getElementById('cubeVertexShader').innerHTML;
    // let fShader = document.getElementById('cubeFragmentShader').innerHTML;

    let material = new THREE.ShaderMaterial({
        //Optional, here you can supply uniforms and attributes
        vertexShader: diffuseVertexShader(),
        fragmentShader: diffuseFragmentShader(),
    });

    let geometry = new THREE.BoxGeometry(1 * scale, 1 * scale, 1 * scale)
    let mesh = new THREE.Mesh(geometry, material);

    mesh.position.x = -2 * scale;
    scene.add(mesh)
    sceneObjects.push(mesh)
}

function addNormalShadingSphere() {
    // get from header - just another method.
    // let vShader = document.getElementById('cubeVertexShader').innerHTML;
    // let fShader = document.getElementById('cubeFragmentShader').innerHTML;

    let material = new THREE.ShaderMaterial({
        //Optional, here you can supply uniforms and attributes
        vertexShader: normalVertexShader(),
        fragmentShader: normalFragmentShader(),
    });

    let geometry = new THREE.SphereGeometry(1 * scale, 32, 16)
    let mesh = new THREE.Mesh(geometry, material);

    mesh.position.x = -10 * scale;
    scene.add(mesh)
    sceneObjects.push(mesh)
}

function addGlowShadingSphere() {
    uniforms.glowColor = {type: 'vec3', value: new THREE.Vector3(0.8, 0.4, 0.1)}
    // uniforms.glowColor = {type: 'vec3', value: new THREE.Vector3(1.0, 0.68, 0)}
    uniforms.matColor = {type: 'vec3', value: new THREE.Vector3(0.0, 0.0, 0.0)}


    let material = new THREE.ShaderMaterial({
        //Optional, here you can supply uniforms and attributes
        uniforms: uniforms,
        vertexShader: glowVertexShader(),
        fragmentShader: glowFragmentShader(),
    });

    let geometry = new THREE.SphereGeometry(1 * scale, 32, 16)
    let mesh = new THREE.Mesh(geometry, material);

    mesh.position.z = -3 * scale;
    scene.add(mesh)
    sceneObjects.push(mesh)
}

function addToonShadingSphere() {
    // get from header - just another method.
    // let vShader = document.getElementById('cubeVertexShader').innerHTML;
    // let fShader = document.getElementById('cubeFragmentShader').innerHTML;

    toonColor = new THREE.Color(0x660033);
    toonNumLayers = 5;
    toonStartingBound = 0.8;
    toonColorIntensityPerStep = 0.15;

    uniforms.mainColor = {type: 'vec3', value: toonColor};
    uniforms.numLayers = {type: 'int', value: toonNumLayers};
    uniforms.startingBound = {type: 'float', value: toonStartingBound};
    uniforms.colorIntensityPerStep = {type: 'float', value: toonColorIntensityPerStep};


    let material = new THREE.ShaderMaterial({
        //Optional, here you can supply uniforms and attributes
        uniforms: uniforms,
        vertexShader: toonVertexShader(),
        fragmentShader: toonFragmentShader(),
    });

    let geometry = new THREE.SphereGeometry(1 * scale, 32, 16)
    let mesh = new THREE.Mesh(geometry, material);

    mesh.position.z = -6 * scale;
    scene.add(mesh)
    sceneObjects.push(mesh)
}

function addLambertShadingSphere() {
    // get from header - just another method.
    // let vShader = document.getElementById('cubeVertexShader').innerHTML;
    // let fShader = document.getElementById('cubeFragmentShader').innerHTML;

    uniforms.lambertColor = {type: 'vec3', value: lambertColor}
    // uniforms.colorB = {type: 'vec3', value: new THREE.Color(0xACB6E5)}
    uniforms = THREE.UniformsUtils.merge([
        uniforms,
        THREE.UniformsLib['lights']
    ])

    let material = new THREE.ShaderMaterial({
        //Optional, here you can supply uniforms and attributes
        uniforms: uniforms,
        vertexShader: lambertVertexShader(),
        fragmentShader: lambertFragmentShader(),
        lights: true

    });

    // let geometry = new THREE.SphereGeometry(1 * scale, 32, 16)
    let geometry = new THREE.BoxGeometry(1 * scale, 1 * scale, 1 * scale)

    let mesh = new THREE.Mesh(geometry, material);

    mesh.position.z = 3 * scale;
    scene.add(mesh)
    sceneObjects.push(mesh)
}


// using the code as a string from  app.html -- using texture
function addDiffuseShadingCubeWithTexture() // texture
{
    // either tex works.
    //let tex = THREE.ImageUtils.loadTexture('textures/crate.gif');
    let tex = new THREE.TextureLoader().load('textures/crate.gif', render);
    //optionally set some settings for it
    //tex.magFilter = THREE.NearestFilter;


    let itemMaterial = new THREE.ShaderMaterial({
        //Optional, here you can supply uniforms and attributes
        uniforms:
            {
                theTexture: {type: 't', value: tex}
            },
        vertexShader: diffuseVertexShader(),
        fragmentShader: diffuseFragmentShaderTexture(),
        //Set transparent to true if your texture has some regions with alpha=0
        transparent: true
    });

    let geometry = new THREE.BoxGeometry(1 * scale, 1 * scale, 1 * scale)
    let mesh = new THREE.Mesh(geometry, itemMaterial); // use new material

    mesh.position.x = 0 * scale;
    scene.add(mesh)
    sceneObjects.push(mesh)
}


function addExperimentalShaderCube() {
    uniforms.colorA = {type: 'vec3', value: new THREE.Color(0x74ebd5)}
    uniforms.colorB = {type: 'vec3', value: new THREE.Color(0xACB6E5)}

    let geometry = new THREE.BoxGeometry(1 * scale, 1 * scale, 1 * scale)
    let material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        fragmentShader: experimentalFragmentShader(),
        vertexShader: experimentalVertexShader(),
    })

    let mesh = new THREE.Mesh(geometry, material)
    mesh.position.x = 2 * scale;
    scene.add(mesh)
    sceneObjects.push(mesh)
}


// Old renderer  -----
function render() {
    renderer.render(scene, camera);
}


// Old helper grids -----
function createHelperGrids() {
    // Create a Helper Grid ---------------------------------------------
    let size = 200;
    let divisions = 200;

    // Ground
    let gridHelper = new THREE.GridHelper(size, divisions, 0xff5555, 0x444488);
    scene.add(gridHelper);
    //
    // //  Vertical
    // let gridGround = new THREE.GridHelper(size, divisions, 0x55ff55, 0x667744);
    // gridGround.rotation.x = Math.PI / 2;
    // scene.add(gridGround);
}


function animationLoop(ts) {
    renderer.render(scene, camera)

    // now -- lets rotate the cubes ----
    let rotating = 0.005;
    let rotatex = rotating;
    let rotatey = rotating;

    for (let object of sceneObjects) {
        object.rotation.x += rotatex
        object.rotation.y += rotatey
    }

    for (let object of teapotObjects) {
        object.rotation.x += controls[0].rotationSpeed;
        object.rotation.y += controls[0].rotationSpeed;
    }

    requestAnimationFrame(animationLoop)
}


function createCameraControls() {
    cameraControls = new OrbitControls(camera, renderer.domElement);
}

function createLights() {
    ambientLight = new THREE.AmbientLight(0x333333);	        // 0.2
    light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
}


function adjustLighting() {
    let pointLight = new THREE.PointLight(0xdddddd)
    pointLight.position.set(-5, -3, 3)
    scene.add(pointLight)

    let ambientLight = new THREE.AmbientLight(0x505050)
    scene.add(ambientLight)
}

class Controller {
    constructor(cube, controller) {
        this.cube = cube;
        this.controller = controller; // hacky

        // available data for the instantiations of the function
        this.rotationSpeed = 0.00;
        this.scale = 1;
        this.Shader = shading;
        this.theta = 0.1;
        this.parameters = {a: false,}
    }
}


function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x555555);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5 * scale;
    camera.position.set(0 * scale, 10 * scale, 10 * scale);
    camera.lookAt(scene.position);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    adjustLighting();

    createLights();

    addDiffuseShadingCube();             // on left = -2*scale;

    addDiffuseShadingCubeWithTexture();      // middle cube

    addExperimentalShaderCube();      // on right

    addBuiltInShadersTeapot();          // addTheeJSTeapot : rightmost

    addPhongTeapot();         // shader teapot.

    addNormalShadingSphere();

    addGlowShadingSphere();

    addToonShadingSphere();

    addLambertShadingSphere();

    controls = [];
    controls.push(new Controller(teapotA, 0));
    addControls(controls[0]);

    createHelperGrids();

    createCameraControls();

    animationLoop();

}

// =====================================================================================================================
// Shaders (Vertex and Fragment)
// =====================================================================================================================

// --------------------------------------------------
// Experimental Shader
// --------------------------------------------------
function experimentalVertexShader() {
    return `
    varying vec3 vUv; 
    varying vec4 modelViewPosition; 
    varying vec3 vecNormal;

    void main() {
      vUv = position; 
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      vecNormal = normalize((modelViewMatrix * vec4(normal, 0.0)).xyz); 
      gl_Position = projectionMatrix * modelViewPosition; 
    }
  `
}

function experimentalFragmentShader() {
    return `
      uniform vec3 colorA; 
      uniform vec3 colorB; 
      varying vec3 vUv;

      void main() {
        gl_FragColor = vec4(mix(colorA, colorB, vUv.z), 1.0);
      }
  `
}

// --------------------------------------------------
// Diffuse Shader
// --------------------------------------------------
function diffuseVertexShader() {
    return `
        // https://pandaqitutorials.com/Games/9-three-js-complete-glsl-tutorial

		varying vec3 	vNormal;
		uniform vec3 	uLightDirection;
		varying vec2 	vUv;

		//The built-in main function
		void main() {
 		 	//Every vertex shader must eventually set 'gl_Position'
  			//And in this case, we multiply the vertex position with the camera view and
  			// screen matrix to get the final output.

  			// 'normal' is a standard value provided by Three.js for every vertex
  			// just as 'position'

  			//  normal = normalize(gl_NormalMatrix * gl_Normal);
  			vNormal = normalize(normalMatrix * normal);
  			//vNormal = normal;

    		//Get UV coordinates
  			vUv = uv;

  			gl_Position = 	projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}
  `
}

function diffuseFragmentShader() {
    return `
        //Fragment Shader Code
		//  Works with a  lot of triangles, and  determines the colors for each pixel in them.
		//  These are sent back and properly displayed on the monitor.

		varying vec3 vNormal;
		uniform vec3 uLightDirection;
		varying vec2 vUv;

		void main() {
            //Create a vector to determine where light comes from
  			// (similar to directional light in this case)
  			vec3 light = vec3(0.5, 0.2, 1.0);

  			//Normalize it
  			//shrinks all x,y and z all three values of the vector down to a value between 0 and 1.
  			light = normalize(light);

			//Calculate 'dot product'
  			// and clamp 0->1 instead of -1->1
  			float dProd = max(0.0, dot(vNormal, light));

  			// If the normal and light vector are equal (point in same direction),
  			// this returns 1 (fully lit)
  			// If they are completely opposite,
  			// this returns -1 (which we make 0.0, and is completely dark).
  			gl_FragColor = vec4( dProd, dProd, dProd, 1.0 );  //RGBA
		}
  `
}

// --------------------------------------------------
// Diffuse With Texture Shader
// --------------------------------------------------
function diffuseFragmentShaderTexture() {
    return `
		varying vec2 vUv;
		uniform sampler2D theTexture;

		void main() {
    		gl_FragColor = texture2D(theTexture, vUv);
		}
    `
}

// --------------------------------------------------
// Lambert Shader
// --------------------------------------------------
function lambertVertexShader() {
    return `
    varying vec3 vUv; 
    varying vec4 modelViewPosition; 
    varying vec3 vecNormal;

    void main() {
      vUv = position; 
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      vecNormal = (modelViewMatrix * vec4(normal, 0.0)).xyz; //????????
      gl_Position = projectionMatrix * modelViewPosition; 
    }
  `
}

function lambertFragmentShader() {
    return `
      struct PointLight {
        vec3 color;
        vec3 position;
        float distance; 
      };  

      uniform vec3 colorA; 
      uniform vec3 lambertColor; 
      uniform PointLight pointLights[NUM_POINT_LIGHTS];
      varying vec3 vUv;
      varying vec4 modelViewPosition; 
      varying vec3 vecNormal; 

      void main() {
        //https://csantosbh.wordpress.com/2014/01/09/custom-shaders-with-three-js-uniforms-textures-and-lighting/
        
        vec4 addedLights = vec4(0.0, 0.0, 0.0, 1.0);

        for(int l = 0; l < NUM_POINT_LIGHTS; l++) {
            vec3 lightDirection = normalize(modelViewPosition.xyz + pointLights[l].position);
            addedLights.rgb += clamp(dot(-lightDirection, vecNormal), 0.0, 1.0) * pointLights[l].color * 1.0; //'light intensity' 
        }

        vec3 redAndPoint = vec3(1.0 * addedLights.r, 1.0 * addedLights.g, 1.0 * addedLights.b);
        vec3 finalWhite = vec3(redAndPoint.r + lambertColor.r, redAndPoint.g + lambertColor.g, redAndPoint.b + lambertColor.b); 
        
        gl_FragColor = vec4(finalWhite, 1.0);
      }
  `
}

// --------------------------------------------------
// Phong Shader
// --------------------------------------------------
function phongVertexShader() {
    return `
	      	varying vec3 Normal;
      		varying vec3 Position;

      		void main()	{
        		Normal = normalize(normalMatrix * normal);
        		Position = vec3(modelViewMatrix * vec4(position, 1.0));
        		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      		}
    `
}

function phongFragmentShader() {
    return `
      		varying vec3 Normal;
      		varying vec3 Position;

      		uniform vec3 Ka;
      		uniform vec3 Kd;
      		uniform vec3 Ks;
      		uniform vec4 LightPosition;
      		uniform vec3 LightIntensity;
      		uniform float Shininess;

      		vec3 phong() {
       			vec3 n = normalize(Normal);
        		vec3 s = normalize(vec3(LightPosition) - Position);
        		vec3 v = normalize(vec3(-Position));
        		vec3 r = reflect(-s, n);

        		vec3 ambient = Ka;
        		vec3 diffuse = Kd * max(dot(s, n), 0.0);
        		vec3 specular = Ks * pow(max(dot(r, v), 0.0), Shininess);

        		return LightIntensity * (ambient + diffuse + specular);
      		}

      		void main()	{
        		gl_FragColor = vec4(phong(), 1.0);
      		}
    `
}

// --------------------------------------------------
// Normal Shader
// --------------------------------------------------
function normalVertexShader() {
    return `
		varying vec3 	vNormal;
		uniform vec3 	uLightDirection;
		varying vec2 	vUv;

		//The built-in main function
		void main() {
  			vNormal = normalize(normalMatrix * normal);
  			
    		//Get UV coordinates
  			vUv = uv;

  			gl_Position = 	projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}
    `
}

function normalFragmentShader() {
    return `
		varying vec3 vNormal;
		uniform vec3 uLightDirection;
		varying vec2 vUv;
		uniform sampler2D theTexture;

		void main() {
			//Calculate 'dot product' of each color based on normal value
  			// and clamp 0->1 instead of -1->1
  			float r = max(0.0, vNormal.x);
  			float g = max(0.0, vNormal.y);
  			float b = max(0.0, vNormal.z);

 			//And output this color.
  			gl_FragColor = vec4(r, g, b, 1.0 );  //RGBA
		}
    `
}


// --------------------------------------------------
// Glow Shader
// --------------------------------------------------
function glowVertexShader() {
    return `
		varying vec3 	vNormal;
		uniform vec3 	uLightDirection;
		varying vec2 	vUv;

		void main() {
		    // normalize the normals
  			vNormal = normalize(normalMatrix * normal);
  			
    		//Get UV coordinates
  			vUv = uv;

  			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}
    `
}

function glowFragmentShader() {
    return `
		uniform vec3 glowColor; 
        uniform vec3 matColor; 
		varying vec3 vNormal;

		void main() {
			// lerp between the glowColor and matColor based on the normal's z value
  			gl_FragColor = vec4(mix(glowColor, matColor, vNormal.z), 1.0);
		}
    `
}

// --------------------------------------------------
// Toon Shader
// Source: https://www.lighthouse3d.com/tutorials/glsl-12-tutorial/toon-shader-version-ii/
// --------------------------------------------------
function toonVertexShader() {
    return `
        varying vec3 vNormal;
        uniform int numLayers;

        void main() {
	        vNormal = normalMatrix * normal;
            // vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `;
}

function toonFragmentShader() {
    return `
        varying vec3 vNormal;
        uniform vec3 mainColor;
        uniform int numLayers;
        uniform float startingBound;
        uniform float colorIntensityPerStep;

        void main() {
            float intensity;
            vec3 light = normalize(vec3(-0.9, 0.3, 0.3));
            intensity = dot(light,vNormal);
            // vec4 color;
            vec4 color = vec4(mainColor, 1.0);
            
            //// the number of steps on the texture
            int stepNum = numLayers; 
            //// the float version of steps
            float stepNum_float = float(stepNum);
            //// save the value of the previous step to compare the next step to 
            float stepOld = 0.0;
            //// calculates the amount of intensity to subtract on each subsequent iteration
            float step = 2.0/stepNum_float;
            //// the start value of the intensity to check against
            float start = startingBound;
            //// how much to decrease the color by (how much darker to make it each step)
            float colorIntensity = colorIntensityPerStep;
            //// save the color of the previous step
            vec4 oldColor = vec4(0,0,0, 1.0);
            //// used to calculate the very end color so its not just black
            float i_float = 0.0;
            
            // // set the darkest end's color 
            // if (intensity < 0.8) {
            //     // color = vec4(mainColor, 1.0);
            //     // color = vec4(0,0,0, 1.0); // make the end always black
            //     // color = vec4((mainColor/(1.0+(stepNum_float*(colorIntensity * (2.0*stepNum_float))))), 1.0);
            // } // if
            
            // iterate over the number of steps to add to the toon shader
            for (int i = 0; i < stepNum; i++) {
                // cast i to a float
                i_float = float(i);
                // calculate the intensity step for the lower bound
                float intensityStep = (start-(i_float*step));
                // if the intensity is less than the old step's upper bound 
                if (intensity < stepOld) {
                     // if the intensity is more than the current lower bound  
                     if (intensity > intensityStep) {
                         // save the current color to the old color value
                         oldColor = vec4((mainColor/(1.0+(i_float*colorIntensity))), 1.0);
                         // set the color to the current color
                         color = oldColor;
                     } // if 
                } // if 
                colorIntensity = colorIntensity * 2.0;
                stepOld = intensityStep;
            } // if
            
            if (intensity < stepOld)
                color = oldColor;
           
            gl_FragColor = color;
        }
    `
}

// --------------------------------------------------
// Some Shader
// --------------------------------------------------
// function flatVertexShader() {
//     return `
//         flat out vec4 polygon_color;
//
//        
//         void main() {
//             vec3 ambient = vec3(0.9,0.3,0.9);
//             vec3 diffuse = vec3(0.9,0.5,0.3);
//             vec3 specular = vec3(0.8,0.8,0.8);
//        
//             polygon_color = vec4(normalize(ambient + diffuse + specular), 1.0);
//             gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
//         }
//     `
// }
//
// function flatFragmentShader() {
//     return `
//         flat in vec4 polygon_color;
//    
//         void main() {
// 			// lerp between the glowColor and matColor based on the normal's z value
//   			gl_FragColor = polygon_color;
// 		}
//     `
// }


init();
