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

let Ateapot;
let Bteapot;

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
        Text: 8,

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
    'Text',

];

let shading = 0;

function setSomeVariables(value) {
    console.log("stuff:" + value);
    console.log("stuff:" + shadingAlgorithmString[value]);
    shading = value;
}

function addControls(controlObject) {
    gui = new GUI();
    gui.add(controlObject, 'rotationSpeed', -0.01, 0.01).step(0.01);
    gui.add(controlObject, 'scale', 0, 2).step(0.1);
    gui.add(controlObject, 'Shader', shadingAlgorithm[0]).onChange(setSomeVariables);
}


// using the code as a string from  app.html --
function addNormalMapTeapot()  // comparison teapot using library routines
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

    const teapotGeometry = new TeapotBufferGeometry(
        teapotSize,
        tess,
        true,
        true,
        true,
        true
    );

    let thematerials = [];

    let wireMaterial = new THREE.MeshBasicMaterial({color: 0x7777ff, wireframe: true});
    thematerials.push(wireMaterial);

    let flatMaterial = new THREE.MeshPhongMaterial({
        color: materialColor,
        specular: 0x000000,
        flatShading: true,
        side: THREE.DoubleSide
    });
    thematerials.push(flatMaterial);

    let normalMaterial = new THREE.MeshNormalMaterial({color: 0x7777ff});
    thematerials.push(normalMaterial);

    let glowMaterial = new THREE.MeshPhongMaterial({color: materialColor, envMap: textureCube, side: THREE.DoubleSide});
    thematerials.push(glowMaterial);

    //let toonMaterial       = new THREE.MeshToonMaterial( { color: 0x7777ff  } );
    let toonMaterial = new THREE.MeshToonMaterial({color: 0x7777ff});
    thematerials.push(toonMaterial);

    let phongMaterial = new THREE.MeshPhongMaterial({color: materialColor, side: THREE.DoubleSide});
    thematerials.push(phongMaterial);

    let lambertMaterial = new THREE.MeshLambertMaterial({color: materialColor, side: THREE.DoubleSide});
    thematerials.push(lambertMaterial);

    let gouraudMaterial = new THREE.MeshLambertMaterial({color: materialColor, side: THREE.DoubleSide});
    thematerials.push(gouraudMaterial);

    let texturedMaterial = new THREE.MeshPhongMaterial({color: materialColor, map: textureMap, side: THREE.DoubleSide});
    thematerials.push(texturedMaterial);

    console.log("inShader:" + shadingAlgorithmString[shading]);

    // redraw the teapot ----- (not done here )
    shading = 2;
    Ateapot = new THREE.Mesh(
        teapotGeometry,
        thematerials[shading]);

    scene.add(Ateapot);
    teapotObjects.push(Ateapot);

    Ateapot.position.x = 6 * scale;
}


// using the code as a string from  app.html --
function addPhongTeapot() {
    let teapotSize = 1 * scale;
    let tess = -1;	// force initialization

    teapotSize = 1 * scale;
    //tess          = 5;

    let materialColor = new THREE.Color();
    materialColor.setRGB(1.0, 0, 0);

    // let vShader = document.getElementById('teapotVertexShader').innerHTML;
    // let fShader = document.getElementById('teapotFragmentShader').innerHTML;

    const teapotGeometry = new TeapotBufferGeometry(
        teapotSize,
        tess,
        true,
        true,
        true,
        true
    );

    let wireMaterial = new THREE.MeshBasicMaterial({color: 0xff0066, wireframe: true});
    let phongMaterial = new THREE.MeshPhongMaterial({color: materialColor, side: THREE.DoubleSide});

    let itemMaterial = new THREE.ShaderMaterial({
        //Optional, here you can supply uniforms and attributes
        uniforms:
            {
                Ka: {value: new THREE.Vector3(0.9, 0.5, 0.3)},
                Kd: {value: new THREE.Vector3(0.9, 0.5, 0.3)},
                Ks: {value: new THREE.Vector3(0.8, 0.8, 0.8)},
                LightIntensity: {value: new THREE.Vector4(0.5, 0.5, 0.5, 1.0)},
                LightPosition: {value: new THREE.Vector4(0.0, 2000.0, 0.0, 1.0)},
                Shininess: {value: 200.0}
            },
        vertexShader: phongVertexShader(),
        fragmentShader: phongFragmentShader(),
        // fragmentShader: lambertLightFragmentShader(),
        // vertexShader: lambertVertexShader(),
    });

    Bteapot = new THREE.Mesh(teapotGeometry, itemMaterial);

    scene.add(Bteapot);
    teapotObjects.push(Bteapot);

    Bteapot.position.x = -6 * scale;
}

// using the code as a string from  app.html --
function addDiffuseShadingCube() {
    // get from header - just another method.
    // let vShader = document.getElementById('cubeVertexShader').innerHTML;
    // let fShader = document.getElementById('cubeFragmentShader').innerHTML;

    let material = new THREE.ShaderMaterial({
        //Optional, here you can supply uniforms and attributes
        uniforms:
            {
                uLightDirection: {type: 'vec3', value: new THREE.Vector3(light.direction)}
            },
        vertexShader: normalVertexShader(),
        fragmentShader: normalFragmentShader(),
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
        uniforms:
            {
                uLightDirection: {type: 'vec3', value: new THREE.Vector3(light.direction)}
            },
        vertexShader: diffuseVertexShader(),
        fragmentShader: diffuseFragmentShader(),
    });

    let geometry = new THREE.BoxGeometry(1 * scale, 1 * scale, 1 * scale)
    let mesh = new THREE.Mesh(geometry, material);

    mesh.position.x = -2 * scale;
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
        this.Shader = 1;
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

    addNormalMapTeapot();          // addTheeJSTeapot : rightmost

    addPhongTeapot();         // shader teapot.

    controls = [];
    controls.push(new Controller(Ateapot, 0));
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
    // returns a string //  in  C program syntax '
    return `
    varying vec3 vUv; 
    varying vec4 modelViewPosition; 
    varying vec3 vecNormal;

    void main() 
    {
      vUv = position; 
      
      
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      vecNormal = normalize((modelViewMatrix * vec4(normal, 0.0)).xyz); 
      gl_Position = projectionMatrix * modelViewPosition; 
    }
  `
}

function experimentalFragmentShader() {
    // returns a string //  in  C program syntax '
    return `
      uniform vec3 colorA; 
      uniform vec3 colorB; 
      varying vec3 vUv;

      void main() 
      {
        gl_FragColor = vec4(mix(colorA, colorB, vUv.z), 1.0);
      }
  `
}

// --------------------------------------------------
// Diffuse Shader
// --------------------------------------------------
function diffuseVertexShader() {
    // returns a string //  in  C program syntax '
    return `
   // https://pandaqitutorials.com/Games/9-three-js-complete-glsl-tutorial
		// ---Vertex Shader Code
		//		Here's the space for variables

		varying vec3 	vNormal;
		uniform vec3 	uLightDirection;
		varying vec2 	vUv;

		//The built-in main function
		void main()
		{
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

  			gl_Position = 	projectionMatrix *
                			modelViewMatrix *
                			vec4( position, 1.0 );
		}
  `
}

function diffuseFragmentShader() {
    // returns a string //  in  C program syntax '
    return `
     //Fragment Shader Code
		//  Works with a  lot of triangles, and  determines the colors for each pixel in them.
		//  These are sent back and properly displayed on the monitor.
		//

		varying vec3 vNormal;
		uniform vec3 uLightDirection;

		varying vec2 vUv;
		uniform sampler2D theTexture;

		void main()
		{
            //Create a vector to determine where light comes from
  			// (similar to directional light in this case)
  			vec3 light = vec3(0.5, 0.2, 1.0);
  			//vec3 light = uLightDirection;

  			//Normalize it
  			//shrinks all x,y and z all three values of the vector down to a value between 0 and 1.
  			light = normalize(light);


			//vNormal = mat3(transpose(inverse(-light))) * aNormal;

			//Calculate 'dot product'
  			// and clamp 0->1 instead of -1->1
  			float dProd = max(0.0, dot(vNormal, light));

  			// If the normal and light vector are equal (point in same direction),
  			// this returns 1 (fully lit)
  			// If they are completely opposite,
  			// this returns -1 (which we make 0.0, and is completely dark).

 			//And output this color. // not sure why the color rotates with the cube.
  			gl_FragColor = vec4( dProd, dProd, dProd, 1.0 );  //RGBA
		}
  `
}

// --------------------------------------------------
// Diffuse With Texture Shader
// --------------------------------------------------
function diffuseFragmentShaderTexture() {
    return `
    //Fragment Shader Code
		//  Works with a  lot of triangles, and  determines the colors for each pixel in them.
		//  These are sent back and properly displayed on the monitor.
		//
		//varying vec3 vNormal;
		//uniform vec3 uLightDirection;

		varying vec2 vUv;
		uniform sampler2D theTexture;

		void main()
		{
  			//Just as vertex shader, fragment shader must in the end set this variable (gl_FragColor)
  			//We set it to a pink color, a very pink color
  			gl_FragColor = vec4(	1.0,  // R
                      				0.0,  // G
                      				1.0,  // B
                      				1.0); // A

    		gl_FragColor = texture2D(theTexture, vUv);

		}
    `
}

// --------------------------------------------------
// Lambert Shader
// --------------------------------------------------
function lambertVertexShader() {
    // returns a string //  in  C program syntax '
    return `
    varying vec3 vUv; 
    varying vec4 modelViewPosition; 
    varying vec3 vecNormal;

    void main() 
    {
      vUv = position; 
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      vecNormal = (modelViewMatrix * vec4(normal, 0.0)).xyz; //????????
      gl_Position = projectionMatrix * modelViewPosition; 
    }
  `
}

function lambertLightFragmentShader() {
    return `
      struct PointLight 
      {
        vec3 color;
        vec3 position;
        float distance; 
      };  

      uniform vec3 colorA; 
      uniform vec3 colorB; 
      uniform PointLight pointLights[NUM_POINT_LIGHTS];
      varying vec3 vUv;
      varying vec4 modelViewPosition; 
      varying vec3 vecNormal; 

      void main() 
      {
        // looping through all the point light and than apply magic
        //https://csantosbh.wordpress.com/2014/01/09/custom-shaders-with-three-js-uniforms-textures-and-lighting/
        
        vec4 addedLights = vec4(0.0, 0.0, 0.0, 1.0);

        for(int l = 0; l < NUM_POINT_LIGHTS; l++) 
        {
            vec3 lightDirection = normalize(modelViewPosition.xyz + pointLights[l].position);
            addedLights.rgb += clamp(dot(-lightDirection, vecNormal), 0.0, 1.0) * pointLights[l].color
               * 1.0; //'light intensity' 
        }

        //TODO get ambient light from THREE.js 
        //logic at this point is: always add a constant float since ambient light is evenly distributed in the scene
        //Not lambert direction is defintely not the same as the lambert material from three

        vec3 redAndPoint = vec3(1.0 * addedLights.r, 1.0 * addedLights.g, 1.0 * addedLights.b);
        //vec3 finalRed = vec3(redAndPoint.r + 0.3, 0.0, 0.0); 
        vec3 finalWhite = vec3(redAndPoint.r + 0.3, redAndPoint.r + 0.3, redAndPoint.r + 0.3); 

        vec3 colorAndPointLight = mix(colorB, colorB, vUv.z) * addedLights.rgb;
        vec3 finalColor = vec3(colorAndPointLight.r + 0.3, colorAndPointLight.g + 0.3, colorAndPointLight.b + 0.3);

        gl_FragColor = vec4(finalWhite, 1.0);
      }
  `
}

// --------------------------------------------------
// Phong Shader
// --------------------------------------------------
function phongVertexShader() {
    return `
    // add code here
	      	varying vec3 Normal;
      		varying vec3 Position;

      		void main()
      		{
        		Normal = normalize(normalMatrix * normal);
        		Position = vec3(modelViewMatrix * vec4(position, 1.0));
        		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      		}
    `
}

function phongFragmentShader() {
    return `
    // add code here

      		varying vec3 Normal;
      		varying vec3 Position;

      		uniform vec3 Ka;
      		uniform vec3 Kd;
      		uniform vec3 Ks;
      		uniform vec4 LightPosition;
      		uniform vec3 LightIntensity;
      		uniform float Shininess;

      		vec3 phong()
      		{
       			vec3 n = normalize(Normal);
        		vec3 s = normalize(vec3(LightPosition) - Position);
        		vec3 v = normalize(vec3(-Position));
        		vec3 r = reflect(-s, n);

        		vec3 ambient = Ka;
        		vec3 diffuse = Kd * max(dot(s, n), 0.0);
        		vec3 specular = Ks * pow(max(dot(r, v), 0.0), Shininess);

        		return LightIntensity * (ambient + diffuse + specular);
      		}

      		void main()
      		{
        		gl_FragColor = vec4(phong(), 1.0);
      		}
    `
}

// --------------------------------------------------
// Normal Shader
// --------------------------------------------------
function normalVertexShader() {
    return `
    // https://pandaqitutorials.com/Games/9-three-js-complete-glsl-tutorial
		// ---Vertex Shader Code
		//		Here's the space for variables

		varying vec3 	vNormal;
		uniform vec3 	uLightDirection;
		varying vec2 	vUv;

		//The built-in main function
		void main()
		{
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

  			gl_Position = 	projectionMatrix *
                			modelViewMatrix *
                			vec4( position, 1.0 );
		}
    `
}
function normalFragmentShader() {
    return `
    //Fragment Shader Code
		//  Works with a  lot of triangles, and  determines the colors for each pixel in them.
		//  These are sent back and properly displayed on the monitor.
		//

		varying vec3 vNormal;
		uniform vec3 uLightDirection;

		varying vec2 vUv;
		uniform sampler2D theTexture;

		void main()
		{
            //Create a vector to determine where light comes from
  			// (similar to directional light in this case)
  			//vec3 light = vec3(0.5, 0.2, 1.0);
  			//vec3 light = uLightDirection;

  			//Normalize it
  			//shrinks all x,y and z all three values of the vector down to a value between 0 and 1.
  			//light = normalize(light);


			//vNormal = mat3(transpose(inverse(-light))) * aNormal;

			//Calculate 'dot product'
  			// and clamp 0->1 instead of -1->1
  			float dProd = max(0.0, vNormal);

  			// If the normal and light vector are equal (point in same direction),
  			// this returns 1 (fully lit)
  			// If they are completely opposite,
  			// this returns -1 (which we make 0.0, and is completely dark).

 			//And output this color. // not sure why the color rotates with the cube.
  			gl_FragColor = vec4( dProd, dProd, dProd, 1.0 );  //RGBA
		}
    `
}


// --------------------------------------------------
// Glow Shader
// --------------------------------------------------
function glowVertexShader() {
    return `
    
    `
}
function glowFragmentShader() {
    return `
    
    `
}

// --------------------------------------------------
// Toon Shader
// --------------------------------------------------
function toonVertexShader() {
    return `
    
    `
}
function toonFragmentShader() {
    return `
    
    `
}

// --------------------------------------------------
// Some Shader
// --------------------------------------------------
function someVertexShader() {
    return `
    
    `
}
function someFragmentShader() {
    return `
    
    `
}


init();
