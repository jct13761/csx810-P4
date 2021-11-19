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

let mainTeapot;
let otherTeapot;
let mainCube;
let mainSphere;
let mainCylinder;
let mainTorus;
let mainTorusKnot;
let objArray = [];
let threejsObjArray = [];

let teapotGeo;
let cubeGeo;
let sphereGeo;
let cylinderGeo;
let torusGeo;
let torusKnotGeo;


let materialsArray = [];
let threejsMaterialsArray = [];
let shading = 0;

// lambert stuff
let lambertColorHex = 0x000000;
let lambertColor = new THREE.Color(lambertColorHex);

// glow stuff
let glowColorHex = 0xCC661A;
let glowColor = new THREE.Color(glowColorHex);
let matColorHex = 0x000000;
let matColor = new THREE.Color(matColorHex);

// toonShader stuff
let toonColorHex = 0x880033;
let toonColor = new THREE.Color(toonColorHex);
let toonNumLayers = 5;
let toonStartingBound = 0.8;
let toonColorIntensityPerStep = 0.15;
let fiveTone = new THREE.TextureLoader().load('textures/fiveTone.jpg');

// Phong Shader stuff
let phongIsAmbientEnabled = true;
let phongAmbientHex = 0xE61AE6;
let phongAmbient = new THREE.Color(phongAmbientHex);
let phongIsDiffuseEnabled = true;
let phongDiffuseHex = 0xcccccc;
let phongDiffuse = new THREE.Color(phongDiffuseHex);
let phongIsSpecularEnabled = true;
let phongSpecularHex = 0xffffff;
let phongSpecular = new THREE.Color(phongSpecularHex);
let phongLightIntensity = new THREE.Vector4(0.5, 0.5, 0.5, 1.0);
let phongLightPosition = new THREE.Vector4(0.0, 2000.0, 0.0, 1.0);
let phongShininess = 200.0;

// experimental stuff
let experimentalColorAHex = 0x74ebd5;
let experimentalColorA = new THREE.Color(experimentalColorAHex);
let experimentalColorBHex = 0xACB6E5;
let experimentalColorB = new THREE.Color(experimentalColorBHex);

let customShadingAlgorithm = [
    {
        Diffuse: 0,  /**/
        Texture: 1,
        Normal: 2,      /* OK */
        Glow: 3,      /* OK */
        Toon: 4,      /* OK */
        Phong: 5,
        Lambert: 6,
        Experimental: 7,
    },
];

let customShadingAlgorithmString = [
    'Diffuse',
    'Texture',
    'Normal',
    'Glow',
    'Toon',
    'Phong',
    'Lambert',
    'Experimental',
];

function addControls(controlObject) {
    gui = new GUI();

    // controls the shader type
    gui.add(controlObject, 'Shader', customShadingAlgorithm[0]).onChange(updateShaderType);

    // controls for the meshes, like scale and rotation
    let objControlls = gui.addFolder('Mesh Controls');
    objControlls.add(controlObject, 'rotationSpeed', -0.01, 0.01).step(0.001);
    objControlls.add(controlObject, 'doScale').name('Apply Scale');
    objControlls.add(controlObject, 'scale', 0, 2).step(0.1).onChange(updateScale);

    // controls for glow shader
    let glowControls = gui.addFolder('Glow Controls');
    glowControls.addColor(controlObject, 'glowColorHex').name('Glow Color').onChange(function (color) {
        glowColorHex = color;
        glowColor = new THREE.Color(glowColorHex);
        updateGlowShader();
    });
    glowControls.addColor(controlObject, 'matColorHex').name('Material Color').onChange(function (color) {
        matColorHex = color;
        matColor = new THREE.Color(matColorHex);
        updateGlowShader();
    });

    // controls for toon shader
    let toonControls = gui.addFolder('Toon Controls');
    toonControls.addColor(controlObject, 'toonColorHex').name('Color').onChange(function (color) {
        toonColorHex = color;
        toonColor = new THREE.Color(toonColorHex);
        updateToonShader();
    });
    toonControls.add(controlObject, 'toonNumLayers', 2, 20).name('Layers').step(1).onChange(function (layers) {
        toonNumLayers = layers;
        updateToonShader();
    });
    toonControls.add(controlObject, 'toonStartingBound', 0.1, 2.0).name('Starting Bound').step(0.1).onChange(function (bound) {
        toonStartingBound = bound;
        updateToonShader();
    });
    toonControls.add(controlObject, 'toonColorIntensityPerStep', 0.01, 2.0).name('Step Intensity').step(0.01).onChange(function (step) {
        toonColorIntensityPerStep = step;
        updateToonShader();
    });

    // controls for phong shader
    let phongControls = gui.addFolder('Phong Controls');
    phongControls.add(controlObject, 'phongIsAmbientEnabled').name('Enable Ambient').onChange(function (value) {
        phongIsAmbientEnabled = value;
        updatePhongShader();
    });
    phongControls.addColor(controlObject, 'phongAmbientHex').name('Ambient Color').onChange(function (color) {
        phongSpecularHex = color;
        phongAmbient = new THREE.Color(phongSpecularHex);
        updatePhongShader();
    });
    phongControls.add(controlObject, 'phongIsDiffuseEnabled').name('Enable Diffuse').onChange(function (value) {
        phongIsDiffuseEnabled = value;
        updatePhongShader();
    });
    phongControls.addColor(controlObject, 'phongDiffuseHex').name('Diffuse Color').onChange(function (color) {
        phongDiffuseHex = color;
        phongDiffuse = new THREE.Color(phongDiffuseHex);
        updatePhongShader();
    });
    phongControls.add(controlObject, 'phongIsSpecularEnabled').name('Enable Specular').onChange(function (value) {
        phongIsSpecularEnabled = value;
        updatePhongShader();
    });
    phongControls.addColor(controlObject, 'phongSpecularHex').name('Specular Color').onChange(function (color) {
        phongSpecularHex = color;
        phongSpecular = new THREE.Color(phongSpecularHex);
        updatePhongShader();
    });

    // ADD THE LAST 3 VARIABLES FOR PHONG SHADING

    // controls for lambert shader
    let lambertControls = gui.addFolder('Lambert Controls');
    lambertControls.addColor(controlObject, 'lambertColorHex').name('Color').onChange(function (color) {
        lambertColorHex = color;
        lambertColor = new THREE.Color(lambertColorHex);
        updateLambertShader();
    });

    // controls for experimental shader
    let experimentalControls = gui.addFolder('Experimental Controls');
    experimentalControls.addColor(controlObject, 'experimentalColorAHex').name('Color A').onChange(function (color) {
        experimentalColorAHex = color;
        experimentalColorA = new THREE.Color(experimentalColorAHex);
        updateExperimentalShader();
    });
    experimentalControls.addColor(controlObject, 'experimentalColorBHex').name('Color B').onChange(function (color) {
        experimentalColorBHex = color;
        experimentalColorB = new THREE.Color(experimentalColorBHex);
        updateExperimentalShader();
    });
}

// the function to update the type of shader on all the objects. This function is called from the GUI controller
function updateShaderType(value) {
    shading = value;
    for (let i = 0; i < objArray.length; i++) {
        objArray[i].material = materialsArray[value];
        objArray[i].material.needsUpdate = true;
        threejsObjArray[i].material = threejsMaterialsArray[value];
        threejsObjArray[i].material.needsUpdate = true;
    } // for
}

// update the scale. This function is called from the GUI controller
function updateScale(value) {
    scale = value;
}

// update the glow shader with the new variables and recompile it. This function is called from the GUI controller
function updateGlowShader() {
    let glowPos = 3;
    let newGlowShader = glowShaderMaterial();
    materialsArray.splice(glowPos, 1, newGlowShader);
    if (shading == glowPos)
        updateShaderType(shading);
}

// update the Lambert shader with the new variables and recompile it. This function is called from the GUI controller
function updateLambertShader() {
    let lamPos = 6;
    let newLambertShader = lambertShaderMaterial();
    materialsArray.splice(lamPos, 1, newLambertShader);
    if (shading == lamPos)
        updateShaderType(shading);
}

// update the toon shader with the new variables and recompile it. This function is called from the GUI controller
function updateToonShader() {
    let toonPos = 4;
    let libToonShader = setLibraryToonShader();
    threejsMaterialsArray.splice(toonPos, 1, libToonShader);
    let newToonShader = toonShaderMaterial();
    materialsArray.splice(toonPos, 1, newToonShader);
    if (shading == toonPos)
        updateShaderType(shading);
}

// update the phong shader with the new variables and recompile it. This function is called from the GUI controller
function updatePhongShader() {
    let phongPos = 5;
    let newPhongShader = phongShaderMaterial();
    let libPhongShader = setLibraryPhongShader();
    materialsArray.splice(phongPos, 1, newPhongShader);
    threejsMaterialsArray.splice(phongPos, 1, libPhongShader);
    if (shading == phongPos)
        updateShaderType(shading);
}

// update the experimental shader with the new variables and recompile it. This function is called from the GUI controller
function updateExperimentalShader() {
    let expPos = 7;
    let newExperimentalShader = experimentalShaderMaterial();
    let libExpShader = setLibraryExperimentalShader();
    materialsArray.splice(expPos, 1, newExperimentalShader);
    threejsMaterialsArray.splice(expPos, 1, libExpShader);
    if (shading == expPos)
        updateShaderType(shading);
}

// create all the three.js shader objects
function addBuiltInShadersTeapot() {
    // create the three.js library geometries
    createGeometries();

    // create the three.js library shaders
    createThreejsShaders();

    // Create Meshes
    mainTeapot = new THREE.Mesh(teapotGeo, threejsMaterialsArray[shading]);
    mainCube = new THREE.Mesh(cubeGeo, threejsMaterialsArray[shading]);
    mainSphere = new THREE.Mesh(sphereGeo, threejsMaterialsArray[shading]);
    mainCylinder = new THREE.Mesh(cylinderGeo, threejsMaterialsArray[shading]);
    mainTorus = new THREE.Mesh(torusGeo, threejsMaterialsArray[shading]);
    mainTorusKnot = new THREE.Mesh(torusKnotGeo, threejsMaterialsArray[shading]);

    // add meshes to array
    threejsObjArray.push(mainTeapot);
    threejsObjArray.push(mainCube);
    threejsObjArray.push(mainSphere);
    threejsObjArray.push(mainCylinder);
    threejsObjArray.push(mainTorus);
    threejsObjArray.push(mainTorusKnot);

    // add the objects to the scene
    for (let i = 0; i < threejsObjArray.length; i++ ) {
        scene.add(threejsObjArray[i]);
        threejsObjArray[i].position.z = -8;
    }

    // set obj x positions
    mainTeapot.position.x = 0 * scale;
    mainCube.position.x = -3 * scale;
    mainSphere.position.x = -5 * scale;
    mainCylinder.position.x = -7 * scale;
    mainTorus.position.x = 4 * scale;
    mainTorusKnot.position.x = 8 * scale;
} // addBuiltInShadersTeapot

// create the three.js shaders
function createThreejsShaders() {
    let materialColor = new THREE.Color(0xffffff); // white

    // TEXTURE MAP
    textureMap = new THREE.TextureLoader().load('textures/Grass.jpeg');
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

    // Gourard
    threejsMaterialsArray.push(new THREE.MeshLambertMaterial({color: materialColor, side: THREE.DoubleSide}));
    // Texture
    threejsMaterialsArray.push(new THREE.MeshPhongMaterial({color: materialColor, map: textureMap, side: THREE.DoubleSide}));
    // normal
    threejsMaterialsArray.push(new THREE.MeshNormalMaterial({color: materialColor}));
    // glow
    threejsMaterialsArray.push( new THREE.MeshPhongMaterial({color: materialColor, envMap: textureCube, side: THREE.DoubleSide}));
    // toon
    let toon = setLibraryToonShader();
    threejsMaterialsArray.push(toon);
    // phong
    let phong = setLibraryPhongShader();
    threejsMaterialsArray.push(phong);
    // Diffuse/Lambert
    let lam = setLibraryLambertShader();
    threejsMaterialsArray.push(new THREE.MeshLambertMaterial({color: materialColor, side: THREE.DoubleSide}));

    // wireframe (Experimental)
    let wire = setLibraryExperimentalShader();
    threejsMaterialsArray.push(wire);

} // createThreejsShaders()

// create the three.js library toon shader and return it
function setLibraryToonShader() {
    fiveTone.minFilter = THREE.NearestFilter;
    fiveTone.magFilter = THREE.NearestFilter;
    let toon = new THREE.MeshToonMaterial({color: toonColor, gradientMap: fiveTone});
    // let toon = new THREE.MeshToonMaterial({color: toonColor, gradientMap: fiveTone});
    return toon;
}

// create the three.js library phong shader and return it
function setLibraryPhongShader() {
    return new THREE.MeshPhongMaterial({color: phongAmbient, side: THREE.DoubleSide});
}

// create the three.js library lambert shader and return it
function setLibraryLambertShader() {
    return new THREE.MeshLambertMaterial({color: lambertColor, side: THREE.DoubleSide});
}

// create the three.js library Wire shader and return it
function setLibraryExperimentalShader() {
    let wireMaterial = new THREE.MeshBasicMaterial({color: experimentalColorA, wireframe: true});
    wireMaterial.needsUpdate = true;
    return wireMaterial;
}

// create my custom shader objects and add them to the scene
function addCustomShadersShapes() {

    // create Materials
    createArrayOfMaterials();

    // create Geometries
    createGeometries();

    // Create Meshes
    mainTeapot = new THREE.Mesh(teapotGeo, materialsArray[shading]);
    mainCube = new THREE.Mesh(cubeGeo, materialsArray[shading]);
    mainSphere = new THREE.Mesh(sphereGeo, materialsArray[shading]);
    mainCylinder = new THREE.Mesh(cylinderGeo, materialsArray[shading]);
    mainTorus = new THREE.Mesh(torusGeo, materialsArray[shading]);
    mainTorusKnot = new THREE.Mesh(torusKnotGeo, materialsArray[shading]);

    // add meshes to array
    objArray.push(mainTeapot);
    objArray.push(mainCube);
    objArray.push(mainSphere);
    objArray.push(mainCylinder);
    objArray.push(mainTorus);
    objArray.push(mainTorusKnot);

    // add the objects to the scene
    for (let i = 0; i < objArray.length; i++ ) {
        scene.add(objArray[i]);
    } // for

    // set obj positions
    mainTeapot.position.x = 0 * scale;
    mainCube.position.x = -3 * scale;
    mainSphere.position.x = -5 * scale;
    mainCylinder.position.x = -7 * scale;
    mainTorus.position.x = 4 * scale;
    mainTorusKnot.position.x = 8 * scale;
} // addCustomShadersShapes()

// create the geometires of the shapes to add
function createGeometries() {
    teapotGeo = new TeapotBufferGeometry(1 * scale, -1, true, true, true, true);
    cubeGeo = new THREE.BoxGeometry(1 * scale, 1 * scale, 1 * scale);
    sphereGeo = new THREE.SphereGeometry(1 * scale/1.2, 32, 16);
    cylinderGeo = new THREE.CylinderGeometry( 0, 1*scale/2, 3, 32 );
    torusGeo = new THREE.TorusGeometry( scale, 1*scale/2.5, 15, 50 );
    torusKnotGeo = new THREE.TorusKnotGeometry( scale, 1*scale/3, 100, 16 );
} // createGeometries()

// create my custom materials and add them to the array
function createArrayOfMaterials() {
    // let texturePath = 'textures/crate.gif';
    // let texturePath = 'textures/Cobblestone.jpeg';
    let texturePath = 'textures/Grass.jpeg';

    materialsArray.push(diffuseShaderMaterial());
    materialsArray.push(diffuseWithTextureShaderMaterial(texturePath));
    materialsArray.push(normalShaderMaterial());
    materialsArray.push(glowShaderMaterial());
    materialsArray.push(toonShaderMaterial());
    materialsArray.push(phongShaderMaterial());
    materialsArray.push(lambertShaderMaterial());
    materialsArray.push(experimentalShaderMaterial());
} // createArrayOfMaterials()

// tester function for phong shader
// function addPhongTeapot() {
//     const teapotGeometry2 = new TeapotBufferGeometry(1 * scale, -1, true, true, true, true);
//     let itemMaterial = phongShaderMaterial();
//     otherTeapot = new THREE.Mesh(teapotGeometry2, itemMaterial);
//     scene.add(otherTeapot);
//     teapotObjects.push(otherTeapot);
//     otherTeapot.position.x = -6 * scale;
// }

// create my custom phong shader material and return it
function phongShaderMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
                ambientEnabled: {value: phongIsAmbientEnabled},
                diffuseEnabled: {value: phongIsDiffuseEnabled},
                specularEnabled: {value: phongIsSpecularEnabled},
                Ka: {value: phongAmbient}, // the color
                Kd: {value: phongDiffuse},
                Ks: {value: phongSpecular},
                LightIntensity: {value: phongLightIntensity},
                LightPosition: {value: phongLightPosition},
                Shininess: {value: phongShininess}
            },
        vertexShader: phongVertexShader(),
        fragmentShader: phongFragmentShader(),
    });
} // phongShaderMaterial()

// tester function for diffuse shader
// function addDiffuseShadingCube() {
//     let material = diffuseShaderMaterial();
//     let geometry = new THREE.BoxGeometry(1 * scale, 1 * scale, 1 * scale)
//     let mesh = new THREE.Mesh(geometry, material);
//     mesh.position.x = -2 * scale;
//     scene.add(mesh)
//     sceneObjects.push(mesh)
// }

// create my custom diffuse shader material and return it
function diffuseShaderMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: { uLightDirection: {value: phongLightPosition} },
        vertexShader: diffuseVertexShader(),
        fragmentShader: diffuseFragmentShader(),
    });
} // diffuseShaderMaterial

// Tester function for normal shaders
// function addNormalShadingSphere() {
//     let material = normalShaderMaterial();
//     let geometry = new THREE.SphereGeometry(1 * scale, 32, 16)
//     let mesh = new THREE.Mesh(geometry, material);
//     mesh.position.x = -10 * scale;
//     scene.add(mesh)
//     sceneObjects.push(mesh)
// }

// create my custom normal shader material and return it
function normalShaderMaterial() {
    return new THREE.ShaderMaterial({
        vertexShader: normalVertexShader(),
        fragmentShader: normalFragmentShader(),
    });
} // normalShaderMaterial

// tester function for glow shader
// function addGlowShadingSphere() {
//     let material = glowShaderMaterial();
//     let geometry = new THREE.SphereGeometry(1 * scale, 32, 16)
//     let mesh = new THREE.Mesh(geometry, material);
//     mesh.position.z = -3 * scale;
//     scene.add(mesh)
//     sceneObjects.push(mesh)
// }

// create my custom glow shader material and return it
function glowShaderMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
                glowColor: {type: 'vec3', value: glowColor},
                matColor: {type: 'vec3', value: matColor}
            },
        vertexShader: glowVertexShader(),
        fragmentShader: glowFragmentShader(),
    });
} // glowShaderMaterial()

// tester function for toon shader
// function addToonShadingSphere() {
//    let material = toonShaderMaterial();
//     let geometry = new THREE.SphereGeometry(1 * scale, 32, 16)
//     let mesh = new THREE.Mesh(geometry, material);
//     mesh.position.z = -6 * scale;
//     scene.add(mesh)
//     sceneObjects.push(mesh)
// }

// create my custom toon shader material and return it
function toonShaderMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
                mainColor: {type: 'vec3', value: toonColor},
                numLayers: {type: 'int', value: toonNumLayers},
                startingBound: {type: 'float', value: toonStartingBound},
                colorIntensityPerStep: {type: 'float', value: toonColorIntensityPerStep}
            },
        vertexShader: toonVertexShader(),
        fragmentShader: toonFragmentShader(),
    });
} // toonshadermaterial()

// tester function for lambert shader
// function addLambertShadingSphere() {
//     let material = lambertShaderMaterial();
//     let geometry = new THREE.SphereGeometry(1 * scale, 32, 16)
//     let mesh = new THREE.Mesh(geometry, material);
//     mesh.position.z = 3 * scale;
//     scene.add(mesh)
//     sceneObjects.push(mesh)
// }

// create my custom lambert shader material and return it
function lambertShaderMaterial() {
    uniforms.lambertColor = {type: 'vec3', value: lambertColor}
    uniforms = THREE.UniformsUtils.merge([
        uniforms,
        THREE.UniformsLib['lights']
    ]);

    return new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: lambertVertexShader(),
        fragmentShader: lambertFragmentShader(),
        lights: true
    });
} // lambertShaderMaterial()

// tester function for diffuse shader with texture
// function addDiffuseShadingCubeWithTexture() {
//     let itemMaterial = diffuseWithTextureShaderMaterial('textures/crate.gif');
//     let geometry = new THREE.BoxGeometry(1 * scale, 1 * scale, 1 * scale)
//     let mesh = new THREE.Mesh(geometry, itemMaterial); // use new material
//     mesh.position.x = 0 * scale;
//     scene.add(mesh)
//     sceneObjects.push(mesh)
// }

// create my custom diffuse texture shader material and return it
function diffuseWithTextureShaderMaterial(texturePath) {
    return new THREE.ShaderMaterial({
        uniforms: { theTexture: {type: 't', value: new THREE.TextureLoader().load(texturePath, render)}},
        vertexShader: diffuseVertexShader(),
        fragmentShader: diffuseFragmentShaderTexture(),
        transparent: true //Set transparent to true if your texture has some regions with alpha=0
    });
} //

//  tester function for experimental shader
// function addExperimentalShaderCube() {
//     let geometry = new THREE.BoxGeometry(1 * scale, 1 * scale, 1 * scale)
//     let material = experimentalShaderMaterial();
//     let mesh = new THREE.Mesh(geometry, material)
//     mesh.position.x = 2 * scale;
//     scene.add(mesh)
//     sceneObjects.push(mesh)
// }

// create my custom experimental shader material and return it
function experimentalShaderMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
                colorA: {type: 'vec3', value: experimentalColorA},
                colorB: {type: 'vec3', value: experimentalColorB}
        },
        fragmentShader: experimentalFragmentShader(),
        vertexShader: experimentalVertexShader(),
    });
}

// renderer function
function render() {
    renderer.render(scene, camera);
}

// creates some helper grids for scale reference and orientation
function createHelperGrids() {
    // Create a Helper Grid ---------------------------------------------
    let size = 200;
    let divisions = 200;
    // Ground grid
    let gridHelper = new THREE.GridHelper(size, divisions, 0xff5555, 0x444488);
    scene.add(gridHelper);
} // createHelperGrids()

// main animation loop
function animationLoop(ts) {
    renderer.render(scene, camera)

    for (let i = 0; i < objArray.length; i++) {
        objArray[i].rotation.x += controls[0].rotationSpeed;
        objArray[i].rotation.y += controls[0].rotationSpeed;
        threejsObjArray[i].rotation.x += controls[0].rotationSpeed;
        threejsObjArray[i].rotation.y += controls[0].rotationSpeed;
    } // for
    requestAnimationFrame(animationLoop)
} // animationLoop()

// create cam controls
function createCameraControls() {
    cameraControls = new OrbitControls(camera, renderer.domElement);
} // createCameraControls()

// create the lights
function createLights() {
    ambientLight = new THREE.AmbientLight(0x333333);	        // 0.2
    light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
} // createLights()

// add specific settings to the lights
function adjustLighting() {
    let pointLight = new THREE.PointLight(0xdddddd)
    pointLight.position.set(-5, -3, 3)
    scene.add(pointLight)

    let ambientLight = new THREE.AmbientLight(0x505050)
    scene.add(ambientLight)
} // adjustLighting()

/*
 * The controller class for the GUI component
 */
class Controller {
    constructor(cube, controller) {
        this.cube = cube;
        this.controller = controller; // hacky

        // available data for the instantiations of the function
        this.rotationSpeed = 0.00;
        this.scale = scale;
        this.Shader = shading;
        this.theta = 0.1;
        this.parameters = {a: false,}

        // shader variables
        // lambert
        this.lambertColorHex = lambertColorHex;
        this.lambertColor = lambertColor;
        // glow
        this.glowColorHex = glowColorHex;
        this.glowColor = glowColor;
        this.matColorHex = matColorHex;
        this.matColor = matColor;
        // experimental
        this.experimentalColorA = experimentalColorA;
        this.experimentalColorAHex = experimentalColorAHex;
        this.experimentalColorB = experimentalColorB;
        this.experimentalColorBHex = experimentalColorBHex;
        // toon
        // this.toonColor = toonColor;
        this.toonColorHex = toonColorHex;
        this.toonNumLayers = toonNumLayers;
        this.toonStartingBound = toonStartingBound;
        this.toonColorIntensityPerStep = toonColorIntensityPerStep;
        // phong
        this.phongIsAmbientEnabled = phongIsAmbientEnabled;
        // this.phongAmbientX = phongAmbientX;
        // this.phongAmbientY = phongAmbientY;
        // this.phongAmbientZ = phongAmbientZ;
        this.phongAmbientHex = phongAmbientHex;
        this.phongAmbient = phongAmbient;

        this.phongIsDiffuseEnabled = phongIsDiffuseEnabled;
        // this.phongDiffuseX = phongDiffuseX;
        // this.phongDiffuseY = phongDiffuseY;
        // this.phongDiffuseZ = phongDiffuseZ;
        this.phongDiffuseHex = phongDiffuseHex;
        this.phongDiffuse = phongDiffuse;

        this.phongIsSpecularEnabled = phongIsSpecularEnabled
        // this.phongSpecularX = phongSpecularX;
        // this.phongSpecularY = phongSpecularY;
        // this.phongSpecularZ = phongSpecularZ;
        this.phongSpecularHex = phongSpecularHex;
        this.phongSpecular = phongSpecular;

        this.phongLightIntensity = phongLightIntensity;
        this.phongLightPosition = phongLightPosition;
        this.phongShininess = phongShininess;
    } // constructor

    // applies the scaling matrix to the objects in the scene
    doScale() {
        for (let i = 0; i < objArray.length; i++) {
            let matrix = new THREE.Matrix4();
            matrix.set(
                scale, 0, 0, 0,
                0, scale, 0, 0,
                0, 0, scale, 0,
                0, 0, 0, 1);

            objArray[i].geometry.applyMatrix4(matrix);
            objArray[i].geometry.verticesNeedUpdate = true;

            threejsObjArray[i].geometry.applyMatrix4(matrix);
            threejsObjArray[i].geometry.verticesNeedUpdate = true;
        } // for
    } // doScale
} // controller class

// the init function to get everything started.
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x555555);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5 * scale;
    camera.position.set(0 , 15 , 17 );
    camera.lookAt(scene.position);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    adjustLighting();

    createLights();

    addBuiltInShadersTeapot();          // addTheeJSTeapot : rightmost

    addCustomShadersShapes();

    controls = [];
    controls.push(new Controller(mainTeapot, 0));
    addControls(controls[0]);

    createHelperGrids();

    createCameraControls();

    animationLoop();

} // init()

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
  			vNormal = normalize(mat3(modelMatrix) * normal);
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
  			//vec3 light = vec3(0.5, 0.2, 1.0);
  			vec3 light = vec3(0.5, -0.4, 1.0);
  			// vec3 light = uLightDirection;

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
// Source: https://dev.to/maniflames/creating-a-custom-shader-in-threejs-3bhi
// --------------------------------------------------
function lambertVertexShader() {
    return `
    varying vec3 vUv; 
    varying vec4 modelViewPosition; 
    varying vec3 vecNormal;

    void main() {
      vUv = position; 
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      vec3 Normal = normalize(mat3(modelMatrix) * normal);
      vecNormal = (modelViewMatrix * vec4(Normal, 0.0)).xyz; //????????
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
        		Normal = normalize(mat3(modelMatrix) * normal);
        		Position = vec3(modelViewMatrix * vec4(position, 1.0));
        		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      		}
    `
}

function phongFragmentShader() {
    return `
      		varying vec3 Normal;
      		varying vec3 Position;

            uniform bool ambientEnabled;
            uniform bool diffuseEnabled;
            uniform bool specularEnabled;
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

                vec3 ambient;
                vec3 diffuse;
                vec3 specular;
                
                if (ambientEnabled == true)
                    ambient = Ka;
                else 
                    ambient = vec3(0.0,0.0,0.0);
        		
        		if (diffuseEnabled == true)
        		    diffuse = Kd * max(dot(s, n), 0.0);
        		else 
        		    diffuse = vec3(0.0,0.0,0.0);
        		    
        		if (specularEnabled == true)
        		    specular = Ks * pow(max(dot(r, v), 0.0), Shininess);
        		else 
        		    specular = vec3(0.0,0.0,0.0);

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
	        vNormal = mat3(modelMatrix) * normal;
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


// Call the init function
init();
