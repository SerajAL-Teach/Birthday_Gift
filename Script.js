/* ---- Main desk scene (Three.js) + book page interaction ---- */
import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';

const loadingManager = new THREE.LoadingManager();
const loadingScreenEl = document.getElementById('loading-screen');
const loadingBarFillEl = document.getElementById('loading-bar-fill');
const loadingPercentEl = document.getElementById('loading-percent');

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  const pct = itemsTotal > 0 ? Math.round((itemsLoaded / itemsTotal) * 100) : 0;
  loadingBarFillEl.style.width = pct + '%';
  loadingPercentEl.textContent = pct + '%';
};

loadingManager.onLoad = () => {
  loadingBarFillEl.style.width = '100%';
  loadingPercentEl.textContent = '100%';
  
  setTimeout(() => {
    loadingScreenEl.classList.add('hidden');
    window.dispatchEvent(new Event('scene-loaded'));
  }, 350);
};

loadingManager.onError = (url) => {
  console.error('Error loading:', url);
};

const isMobileDevice = /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent));

const CAM_X   = 0;
const CAM_Y   = 1.05;

/* Mobile camera is aspect-dependent so it stays framed correctly across
   phone rotation and different device aspect ratios. Narrower (more square)
   aspects need the camera closer/wider FOV to still hide the wall edges;
   wider aspects (typical landscape) need it closer to the desktop framing. */
function computeMobileCam(aspect) {
  const minAspect = 1.3;   
  const maxAspect = 2.2;   
  const t = THREE.MathUtils.clamp((aspect - minAspect) / (maxAspect - minAspect), 0, 1);
  return {
    z:   THREE.MathUtils.lerp(0.72, 0.95, t),
    fov: THREE.MathUtils.lerp(60, 52, t),
  };
}

const initialAspect = window.innerWidth / window.innerHeight;
const initialMobileCam = isMobileDevice ? computeMobileCam(initialAspect) : null;

const CAM_Z   = isMobileDevice ? initialMobileCam.z : 1.1;
const CAM_FOV = isMobileDevice ? initialMobileCam.fov : 62;  

const CAM_LOOK_X = 0;
const CAM_LOOK_Y = 1.18;
const CAM_LOOK_Z = -0.3;

const FLOOR_Y = -0.02;   
const WALL_Z  = -0.550;  

const WIN_X = 0;       
const WIN_Y = 2.075;   
const WIN_W = 1.25;    
const WIN_H = 1.55;    

const FRAME_T   = 0.055;  
const MULLION_T = 0.030;  
const SILL_PROJ = 0.055;  
const ARCH_T      = 0.022;  
const ARCH_W      = 0.040;  
const ARCH_OFFSET = -0.01;  
const WIN_DEPTH = 0.095;  

const WINDOW_BACKGROUND = './images/image_2.png';

const DESK_TARGET_WIDTH = 1.53;  

const BOOKSHELF_REF_WIDTH   = 1.23;   
const BOOKSHELF_WIDTH_RATIO = 0.95;   
const BOOKSHELF_TOP_GAP     = 0.26;   

const LAMP_TARGET_HEIGHT = 0.35;   
const LAMP_INSET_X       = 0.255; 
const LAMP_INSET_Z_FRONT = 0.235; 

const MUSIC_TARGET_HEIGHT = 0.37;  
const MUSIC_INSET_X       = 0.225; 
const MUSIC_INSET_Z_BACK  = 0.32; 

const PICTURE_FRAME_TARGET_HEIGHT = 0.15;  
const PICTURE_FRAME_INSET_X       = 0.225;  
const PICTURE_FRAME_INSET_Z_BACK  = 0.67;  
const PICTURE_FRAME_TILT_DEG      = 12;    
const PICTURE_FRAME_YAW_DEG       = -30;    
const PICTURE_FRAME_DESK_Y_EPS    = -0.005; 

const BOOK_SHELF_TRANSFORM = {
  position: { x: 0.1777, y: 1.1309, z: -0.3968 },
  rotation: { x: 0, y: -Math.PI / 2, z: 0 },
  scale: 0.8887,
};

const BOOK_DESK_TRANSFORM = {
  position: { x: 0, y: 0, z: 0 }, 
  rotation: { x: Math.PI / 2, y: 0.18, z: 0 },
  scale: 0.9421,
};
const VINTAGE_BOOK_DESK_Y_EPS = 0.001; 

const BOUQUET_TARGET_LENGTH = 0.35;    
const BOUQUET_ROTATION_X    = Math.PI / 2; 
const BOUQUET_ROTATION_Y    = -0.5;        
const BOUQUET_ROTATION_Z    = 0;           
const BOUQUET_BACK_TILT_DEG = -20;    
const BOUQUET_Y_EPS         = -0.1;   

const BOOK_DESK_TARGET_LENGTH = 0.265;  
const BOOK_DESK_INSET_X       = 0.275;  
const BOOK_DESK_INSET_Z_FRONT = 0.55;   
const BOOK_DESK_ROTATION_Y    = 0.18;   
const BOOK_DESK_Y_EPS         = 0.001;  

const PINK_FLOWERS_TARGET_H = 0.20;
const PINK_FLOWERS_INSET_X  = 0.15;
const PINK_FLOWERS_Z_RATIO  = 0.45;

const MAGNOLIA_TARGET_H     = 0.22;
const MAGNOLIA_INSET_X      = 0.17;
const MAGNOLIA_Z_RATIO      = 0.45;
const MAGNOLIA_ROTATION_Y   = -0.14;
const MAGNOLIA_TILT_X       = 1.6;
const MAGNOLIA_TILT_Z       = 0.6;
const MAGNOLIA_OFFSET_Y     = 0.125;
const MAGNOLIA_OFFSET_Z     = 0.09;

const FLOWERS_VASE_ROTATION_X   = 0;       
const FLOWERS_VASE_ROTATION_Y   = 0.15;    
const FLOWERS_VASE_X_CLEARANCE  = 0.18;    
const FLOWERS_VASE_Z_OFFSET     = 0.0;     
const FLOWERS_VASE_Y_EPS        = 0.002;   

const WALL_TARGET_HEIGHT = 3.05;    
const WALL_FRONT_Z       = -0.550;  

const FRAME_FLORAL_TARGET_H = 0.55;   
const FRAME_FLORAL_TARGET_W = 0.55;   
const FRAME_FLORAL_DEPTH    = 0.1;    
const FRAME_FLORAL_OFFSET   = -0.08;    
const FRAME_FLORAL_CENTER_X = -1.25;  
const FRAME_FLORAL_CENTER_Y = 1.89;   

const WALL_PIC_TARGET_W    = 0.78;          
const WALL_PIC_TARGET_H    = 0.68;          
const WALL_PIC_DEPTH       = 0.06;          
const WALL_PIC_CENTER_X    = 1.25;          
const WALL_PIC_CENTER_Y    = 1.82;          
const WALL_PIC_ROTATION_Y  = 0;            
const WALL_PIC_Z_OFFSET    = -0.07;          

const SMALL_FRAME_TARGET_W   = 0.46;        
const SMALL_FRAME_TARGET_H   = 0.38;        
const SMALL_FRAME_DEPTH      = 0.055;       
const SMALL_FRAME_CENTER_X   = -1.22;       
const SMALL_FRAME_CENTER_Y   = 1.2;        
const SMALL_FRAME_ROTATION_Y = 0;          
const SMALL_FRAME_Z_OFFSET   = -0.04;        

const PICTURE_FRAME_IMAGE = './images/MM_2.jpg';

const PLANT_W_TARGET_H      = 1.10;               
const PLANT_W_VISIBLE_RATIO = 0.75;               
const PLANT_W_X             = WIN_X - WIN_W * 0.22;  
const PLANT_W_ROTATION_Y    = 1.5;               
const PLANT_W_Z_OFFSET      = -0.025;             

const PLANT_W2_TARGET_H      = 1.00;                 
const PLANT_W2_VISIBLE_RATIO = 0.66;                 
const PLANT_W2_X             = PLANT_W_X + 0.20;     
const PLANT_W2_ROTATION_Y    = 1.32;                 
const PLANT_W2_Z_OFFSET      = -0.040;               
const PLANT_W2_Y_LIFT        = 0.05;                 

const PLANT_GROUP_X_SHIFT = -0.15;   
const PLANT_GROUP_Y_SHIFT = -0.15;   
const PLANT_GROUP_Z_SHIFT =  0.11;  

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
document.getElementById('scene-wrap').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1714);

const camera = new THREE.PerspectiveCamera(CAM_FOV, window.innerWidth / window.innerHeight, 0.1, 100);
window.__sceneRefs = { scene, camera, renderer };

const CAM_BASE = { x: CAM_X, y: CAM_Y, z: CAM_Z };
const CAM_LOOK = new THREE.Vector3(CAM_LOOK_X, CAM_LOOK_Y, CAM_LOOK_Z);
camera.position.set(CAM_BASE.x, CAM_BASE.y, CAM_BASE.z);
camera.lookAt(CAM_LOOK);

/* ---- Desk picture frame close-up zoom state ---- */
const FRAME_ZOOM_STANDOFF = 0.32;   
const FRAME_ZOOM_DURATION = 0.9;    
let frameZoomActive   = false;      
let frameZoomProgress = 0;          
let frameZoomTarget   = null;       

/* ---- Depth-of-field composer (background blur for frame close-up) ---- */
const FRAME_BOKEH_APERTURE = 0.00035; 
const FRAME_BOKEH_MAXBLUR  = 0.012;   

const bokehPass = new BokehPass(scene, camera, {
  focus: FRAME_ZOOM_STANDOFF,
  aperture: 0,
  maxblur: 0,
  width: window.innerWidth,
  height: window.innerHeight,
});
bokehPass.renderToScreen = true;

const composer = new EffectComposer(renderer);
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(bokehPass);

const windowMoonlight = new THREE.SpotLight(
  0x9fc6ff,                 
  30,                        
  15,                         
  THREE.MathUtils.degToRad(60), 
  0.75,                       
  1.05                        
);
windowMoonlight.position.set(WIN_X, WIN_Y + 1, WALL_Z - 1.9); 
scene.add(windowMoonlight);

windowMoonlight.target = new THREE.Object3D();
windowMoonlight.target.name = 'windowMoonlight_target';
windowMoonlight.target.position.set(0, 0.80, 0.35); 
scene.add(windowMoonlight.target);

windowMoonlight.castShadow = true;
windowMoonlight.shadow.mapSize.set(2048, 2048);
windowMoonlight.shadow.camera.near = 0.5;
windowMoonlight.shadow.camera.far  = 11;
windowMoonlight.shadow.bias        = -0.0004;

windowMoonlight.shadow.radius      = 8;
scene.add(windowMoonlight);

const bankersLampLight = new THREE.SpotLight(
  0xffb46b,                  
  15.5,
  1.8,                        
  THREE.MathUtils.degToRad(50),
  0.8,
  1.8
);
bankersLampLight.position.set(-0.4, 0.95, 0.55); 
scene.add(bankersLampLight);

bankersLampLight.target = new THREE.Object3D();
bankersLampLight.target.name = 'bankersLampLight_target';
bankersLampLight.target.position.set(-0.4, 0.0, 0.55); 
scene.add(bankersLampLight.target);

bankersLampLight.castShadow = true;
bankersLampLight.shadow.mapSize.set(1024, 1024);
bankersLampLight.shadow.camera.near = 0.05;
bankersLampLight.shadow.camera.far  = 1.9;
bankersLampLight.shadow.bias        = -0.0015;
bankersLampLight.shadow.radius      = 4;
scene.add(bankersLampLight);

const tinyFillLightLeft = new THREE.PointLight(0xc7d6e8, 0.85, 4.0, 1.4);
tinyFillLightLeft.position.set(-1.1, 1.6, 0.2); 
tinyFillLightLeft.castShadow = false;
scene.add(tinyFillLightLeft);

const tinyFillLightRight = new THREE.PointLight(0xc7d6e8, 0.85, 4.0, 1.4);
tinyFillLightRight.position.set(1.1, 1.6, 0.2); 
tinyFillLightRight.castShadow = false;
scene.add(tinyFillLightRight);

const cameraDepthLight = new THREE.PointLight(0xcdd8ea, 0.35, 2.6, 2);
cameraDepthLight.position.set(0, 0.25, 0.65); 
cameraDepthLight.castShadow = false;
camera.add(cameraDepthLight);

scene.fog = new THREE.FogExp2(0x07090c, 0.085);

scene.add(camera);

const mixers = [];

let rainSystem = null;

function shadowAll(obj) {
  obj.traverse(child => {
    if (child.isMesh) {
      child.castShadow    = true;
      child.receiveShadow = true;
    }
  });
}

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow    = true;
  m.receiveShadow = true;
  return m;
}

function buildFloor(scene) {
  const floorMat = new THREE.ShadowMaterial({ opacity: 0.38 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), floorMat);
  floor.rotation.x   = -Math.PI / 2;
  floor.position.y   = FLOOR_Y;
  floor.receiveShadow = true;
  scene.add(floor);
  return floor;
}

function buildDeskModel(scene) {
  const deskModelGroup = new THREE.Group();
  deskModelGroup.name = 'DeskModel';
  scene.add(deskModelGroup);

  const loader = new GLTFLoader(loadingManager);
  loader.load(
    './models/desk-model.glb',
    (gltf) => {
      const model = gltf.scene;

      
      model.rotation.y = -Math.PI / 2;

      
      const rawBox  = new THREE.Box3().setFromObject(model);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      const scale   = DESK_TARGET_WIDTH / rawSize.x;
      model.scale.set(scale, scale, scale * 1.075);

      
      const scaledBox    = new THREE.Box3().setFromObject(model);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
      model.position.x  -= scaledCenter.x;
      model.position.z  -= scaledCenter.z;
      model.position.y  += FLOOR_Y - scaledBox.min.y;

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow    = true;
          child.receiveShadow = true;
        }
      });

      deskModelGroup.add(model);

      const deskTopY = scaledBox.max.y + model.position.y;
      buildBookshelfModel(scene, deskTopY);

      
      const deskBounds = {
        topY:   deskTopY,
        minX:   scaledBox.min.x + model.position.x,
        maxX:   scaledBox.max.x + model.position.x,
        minZ:   scaledBox.min.z + model.position.z,
        maxZ:   scaledBox.max.z + model.position.z,
      };
      buildBankerLamp(scene, deskBounds);
      buildMusicPlayer(scene, deskBounds);
      buildDeskPictureFrame(scene, deskBounds);
      buildBookOnDesk(scene, deskBounds);
      buildFlowersWithVase(scene, deskBounds);

      
      
      
      
       const deskBookGroup = buildVintageBook(scene, BOOK_DESK_TRANSFORM, deskBounds);
       window.__vintageBookDeskGroup = deskBookGroup;

       
       
       
       
       
       const shelfBookGroup = buildVintageBook(scene, BOOK_SHELF_TRANSFORM, null, 'VintageBookShelf');
       shelfBookGroup.visible = false;
       window.__vintageBookShelfGroup = shelfBookGroup;

       
       
       
       const bouquetGroup = buildBouquet(scene, deskBounds);
       bouquetGroup.visible = false;
       window.__deskBouquetGroup = bouquetGroup;
    },
    undefined,
    (error) => {
      console.error('Failed to load ./models/desk-model.glb — make sure it is in the same folder as this HTML file:', error);
    }
  );

  return deskModelGroup;
}

function buildBookshelfModel(scene, deskTopY) {
  const bookshelfGroup = new THREE.Group();
  bookshelfGroup.name = 'Bookshelf';
  scene.add(bookshelfGroup);

  const TARGET_WIDTH  = BOOKSHELF_REF_WIDTH * BOOKSHELF_WIDTH_RATIO;
  const SILL_TOP_Y    = WIN_Y - WIN_H / 2;
  const SILL_BOTTOM_Y = SILL_TOP_Y - FRAME_T * 0.6;  

  const loader = new GLTFLoader(loadingManager);
  loader.load(
    './models/wooden_wall_bookshelf.glb',
    (gltf) => {
      const model = gltf.scene;

      const rawBox  = new THREE.Box3().setFromObject(model);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      const scale   = TARGET_WIDTH / rawSize.x;
      model.scale.setScalar(scale);

      const scaledBox    = new THREE.Box3().setFromObject(model);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

      
      model.position.x -= scaledCenter.x;
      model.position.z -= (scaledBox.min.z - WALL_Z +0.05);
      model.position.y += (SILL_BOTTOM_Y - BOOKSHELF_TOP_GAP) - scaledBox.max.y;

      
      let shelfColor = new THREE.Color(0x3a2a18);  
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow    = true;
          child.receiveShadow = true;
          if (child.material && !shelfColor._sampled) {
            shelfColor = child.material.color.clone();
            shelfColor._sampled = true;
          }
        }
      });

      bookshelfGroup.add(model);

      
      const shelfTopY    = scaledBox.max.y + model.position.y;
      const shelfBottomY = scaledBox.min.y + model.position.y;
      const shelfMinX    = scaledBox.min.x + model.position.x;
      const shelfMaxX    = scaledBox.max.x + model.position.x;
      const shelfCenterX = (shelfMinX + shelfMaxX) / 2;
      const shelfW       = shelfMaxX - shelfMinX;

      
      
      let cleatMat = null;
      model.traverse((child) => {
        if (child.isMesh && child.material && !cleatMat) {
          cleatMat = child.material.clone();
          cleatMat.name = 'shelf_cleat';
        }
      });
      if (!cleatMat) {
        cleatMat = new THREE.MeshStandardMaterial({ color: 0x3a2a18, roughness: 0.80 });
      }
      const CLEAT_H = 0.022;
      const CLEAT_D = 0.018;
      const CLEAT_W = shelfW + 0.006;

      [[shelfTopY    - CLEAT_H * 1.5],
       [shelfBottomY + CLEAT_H * 0.5]].forEach(([cy]) => {
        const cleat = new THREE.Mesh(
          new THREE.BoxGeometry(CLEAT_W, CLEAT_H, CLEAT_D),
          cleatMat
        );
        cleat.position.set(
          shelfCenterX,
          cy,
          WALL_Z + CLEAT_D * 0.5 - 0.05  
        );
        cleat.castShadow    = true;
        cleat.receiveShadow = true;
        scene.add(cleat);
      });

      
      buildBooksModel(scene, shelfTopY, shelfBottomY, shelfCenterX, shelfW);

      
      const shelfBackZ  = scaledBox.min.z + model.position.z;   
      const shelfFrontZ = scaledBox.max.z + model.position.z;   

      const shelfBounds = {
        topY:    shelfTopY,
        bottomY: shelfBottomY,
        minX:    shelfMinX,
        maxX:    shelfMaxX,
        centerX: shelfCenterX,
        width:   shelfW,
        backZ:   shelfBackZ,
        frontZ:  shelfFrontZ,
      };

      buildPinkFlowers(scene, shelfBounds);
      buildMagnolia(scene, shelfBounds);
    },
    undefined,
    (error) => {
      console.error('Failed to load ./models/wooden_wall_bookshelf.glb — make sure it is in the same folder as this HTML file:', error);
    }
  );

  return bookshelfGroup;
}

function buildBooksModel(scene, shelfTopY, shelfBottomY, shelfCenterX, shelfW) {

  
  
  const BOOK_TARGET_H     = 0.25;
  
  
  
  const BOOKS_Y_NUDGE     = 0.0;
  
  
  
  const BOOKS_Z_PULL      = 0.08;
  
  const GLB_TYPICAL_H     = 1.0016;  
  const GLB_TYPICAL_Y_MIN = 0.0125;  
  

  const booksGroup = new THREE.Group();
  booksGroup.name = 'Books';
  scene.add(booksGroup);

  
  
  
  const errBanner = document.createElement('div');
  errBanner.style.cssText = [
    'position:fixed', 'top:50%', 'left:50%',
    'transform:translate(-50%,-50%)',
    'background:rgba(160,20,20,0.93)',
    'color:#fff', 'padding:22px 28px', 'border-radius:8px',
    'font:13px/1.6 monospace', 'white-space:pre',
    'text-align:center', 'z-index:9999', 'display:none',
    'pointer-events:none', 'box-shadow:0 4px 24px rgba(0,0,0,.6)'
  ].join(';');
  document.body.appendChild(errBanner);

  const loader = new GLTFLoader(loadingManager);
  loader.load(
    './models/Final_Books.glb',

    
    (gltf) => {
      const model = gltf.scene;

      
      const bookScale = BOOK_TARGET_H / GLB_TYPICAL_H;
const BOOKS_X_STRETCH = 1.15;   
model.scale.set(bookScale * BOOKS_X_STRETCH, bookScale, bookScale);

      
      
      const scaledBox    = new THREE.Box3().setFromObject(model);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

      
      
      
      
      model.position.y = (shelfTopY + BOOKS_Y_NUDGE) - (GLB_TYPICAL_Y_MIN * bookScale);

      
      model.position.x = shelfCenterX - scaledCenter.x;

      
      
      
      
      const shelfBackZ = WALL_Z - 0.125;
      model.position.z = (shelfBackZ + BOOKS_Z_PULL) - scaledBox.min.z;

      
      model.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow    = true;
        child.receiveShadow = true;
        
        
        
        child.frustumCulled = false;

        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          if (!mat) return;
          if (mat.transmission  > 0)                  mat.transmission  = 0;
          if (mat.transparent && mat.opacity >= 0.9)  mat.transparent   = false;
          mat.depthWrite  = true;
          mat.needsUpdate = true;
        });
      });

      booksGroup.add(model);

      
      
      const wb = new THREE.Box3().setFromObject(model);
      console.log(
        '[Books] loaded ✓\n' +
        `  scale   : ${bookScale.toFixed(4)}\n` +
        `  world X : ${wb.min.x.toFixed(3)} → ${wb.max.x.toFixed(3)}\n` +
        `  world Y : ${wb.min.y.toFixed(3)} → ${wb.max.y.toFixed(3)}  (shelfTop=${shelfTopY.toFixed(3)})\n` +
        `  world Z : ${wb.min.z.toFixed(3)} → ${wb.max.z.toFixed(3)}  (wall=${WALL_Z})\n` +
        '  If books are invisible, check:\n' +
        '    • Final__Books.glb is in the same folder as desk-scene.html\n' +
        '    • Adjust BOOKS_Y_NUDGE / BOOKS_Z_PULL at top of buildBooksModel()'
      );
    },

    
    (xhr) => {
      if (xhr.lengthComputable) {
        console.log(`[Books] loading… ${Math.round(xhr.loaded / xhr.total * 100)}%`);
      }
    },

    
    (err) => {
      console.error('[Books] ✗ Failed to load ./models/Final__Books.glb\n' +
        'Ensure Final__Books.glb is in the SAME FOLDER as desk-scene.html\n', err);
      errBanner.textContent =
        '⚠  Final__Books.glb not found\n\n' +
        'Place  Final__Books.glb  in the same\n' +
        'folder as  desk-scene.html  and reload.';
      errBanner.style.display = 'block';
      setTimeout(() => { errBanner.style.display = 'none'; }, 8000);
    }
  );

  return booksGroup;
}

function buildBankerLamp(scene, deskBounds) {
  const lampGroup = new THREE.Group();
  lampGroup.name = 'BankerLamp';
  scene.add(lampGroup);

  const loader = new GLTFLoader(loadingManager);
  loader.load(
    './models/bankers_lamp.glb',
    (gltf) => {
      const model = gltf.scene;
      const SHADE_Z_SPLIT = 0.255; 

      model.traverse((child) => {
        if (!child.isMesh) return;

        const geom = child.geometry;
        const srcMat = Array.isArray(child.material) ? child.material[0] : child.material;
        const posAttr = geom.attributes.position;
        const srcIndex = geom.index;
        const triCount = srcIndex ? srcIndex.count / 3 : posAttr.count / 3;

        const shadeTris = [];
        const baseTris  = [];

        for (let t = 0; t < triCount; t++) {
          const a = srcIndex ? srcIndex.getX(t * 3)     : t * 3;
          const b = srcIndex ? srcIndex.getX(t * 3 + 1) : t * 3 + 1;
          const c = srcIndex ? srcIndex.getX(t * 3 + 2) : t * 3 + 2;
          const avgZ = (posAttr.getZ(a) + posAttr.getZ(b) + posAttr.getZ(c)) / 3;
          const bucket = avgZ > SHADE_Z_SPLIT ? shadeTris : baseTris;
          bucket.push(a, b, c);
        }

        
        
        function makeOpaque(name) {
          const mat = new THREE.MeshStandardMaterial({
            name,
            map:        srcMat.map        || null,
            normalMap:  srcMat.normalMap  || null,
            color:      srcMat.color ? srcMat.color.clone() : new THREE.Color(0xffffff),
            metalness:  srcMat.metalness,
            roughness:  srcMat.roughness,
            emissive:        srcMat.emissive ? srcMat.emissive.clone() : new THREE.Color(0x000000),
            emissiveMap:     srcMat.emissiveMap || null,
            emissiveIntensity: srcMat.emissiveIntensity || 1,
            transparent: false,
            opacity:     1,
            depthWrite:  true,
            depthTest:   true,
            side:        THREE.FrontSide, 
          });
          return mat;
        }

        const shadeGeom = geom.clone();
        shadeGeom.setIndex(shadeTris);
        const shadeMesh = new THREE.Mesh(shadeGeom, makeOpaque('M_Lamp_Shade_Opaque'));
        shadeMesh.name = child.name + '_Shade';

        const baseGeom = geom.clone();
        baseGeom.setIndex(baseTris);
        const baseMesh = new THREE.Mesh(baseGeom, makeOpaque('M_Lamp_Base_Opaque'));
        baseMesh.name = child.name + '_BaseArm';

        child.parent.add(shadeMesh, baseMesh);
        child.parent.remove(child);
      });
      model.rotation.y = THREE.MathUtils.degToRad(-267);

      
      const rawBox  = new THREE.Box3().setFromObject(model);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      const scale   = LAMP_TARGET_HEIGHT / rawSize.y;
      model.scale.setScalar(scale);

      
      
      const scaledBox    = new THREE.Box3().setFromObject(model);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
      model.position.x -= scaledCenter.x;
      model.position.z -= scaledCenter.z;
      model.position.y += deskBounds.topY - scaledBox.min.y;

      const targetX = deskBounds.minX + LAMP_INSET_X;
      const targetZ = deskBounds.maxZ - LAMP_INSET_Z_FRONT;
      model.position.x += targetX;
      model.position.z += targetZ;

      shadowAll(model);
      lampGroup.add(model);

      
      
      
      
      
      
      const lampBox = new THREE.Box3().setFromObject(model);
      bankersLampLight.position.set(
        model.position.x,
        lampBox.min.y + (lampBox.max.y - lampBox.min.y) * 0.62,
        model.position.z
      );
      
      
      
      
      const deskCenterX = (deskBounds.minX + deskBounds.maxX) / 2;
      bankersLampLight.target.position.set(
        THREE.MathUtils.lerp(model.position.x, deskCenterX, 0.6),
        deskBounds.topY,
        model.position.z - 0.03
      );
      lampGroup.add(bankersLampLight);
      lampGroup.add(bankersLampLight.target);
    },
    undefined,
    (error) => {
      console.error('Failed to load ./models/bankers_lamp.glb — make sure it is in the same folder as this HTML file:', error);
    }
  );

  return lampGroup;
}

function buildMusicPlayer(scene, deskBounds) {
  const musicGroup = new THREE.Group();
  musicGroup.name = 'MusicPlayer';
  scene.add(musicGroup);

  const loader = new GLTFLoader(loadingManager);
  loader.load(
    './models/Music_player.glb',
    (gltf) => {
      const model = gltf.scene;
      model.rotation.y = THREE.MathUtils.degToRad(-44.55);

      
      const rawBox  = new THREE.Box3().setFromObject(model);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      const scale   = MUSIC_TARGET_HEIGHT / rawSize.y;
      model.scale.setScalar(scale);

      
      
      const scaledBox    = new THREE.Box3().setFromObject(model);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
      model.position.x -= scaledCenter.x;
      model.position.z -= scaledCenter.z;
      model.position.y += deskBounds.topY - scaledBox.min.y;

      const targetX = deskBounds.maxX - MUSIC_INSET_X;
      const targetZ = deskBounds.minZ + MUSIC_INSET_Z_BACK;
      model.position.x += targetX;
      model.position.z += targetZ;

      shadowAll(model);
      musicGroup.add(model);

      
      
      if (gltf.animations && gltf.animations.length) {
        const mixer = new THREE.AnimationMixer(model);
        const clip  = THREE.AnimationClip.findByName(gltf.animations, 'Playing music') || gltf.animations[0];
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat);
        action.play();
        mixers.push(mixer);
      }
    },
    undefined,
    (error) => {
      console.error('Failed to load ./models/Music_player.glb — make sure it is in the same folder as this HTML file:', error);
    }
  );

  return musicGroup;
}

function buildDeskPictureFrame(scene, deskBounds) {
  const frameGroup = new THREE.Group();
  frameGroup.name = 'DeskPictureFrame';
  scene.add(frameGroup);

  const loader = new GLTFLoader(loadingManager);
  loader.load(
    './models/Desk_Picture_Frame_1.glb',
    (gltf) => {
      const model = gltf.scene;

      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      model.rotation.set(
        THREE.MathUtils.degToRad(-PICTURE_FRAME_TILT_DEG),
        THREE.MathUtils.degToRad(PICTURE_FRAME_YAW_DEG),
        0,
        'YXZ'
      );

      
      const rawBox  = new THREE.Box3().setFromObject(model);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      const scale   = PICTURE_FRAME_TARGET_HEIGHT / rawSize.y;
      model.scale.setScalar(scale);

      
      
      
      const scaledBox    = new THREE.Box3().setFromObject(model);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
      model.position.x -= scaledCenter.x;
      model.position.z -= scaledCenter.z;
      model.position.y += deskBounds.topY - scaledBox.min.y + PICTURE_FRAME_DESK_Y_EPS;

      const targetX = deskBounds.maxX - PICTURE_FRAME_INSET_X;
      const targetZ = deskBounds.minZ + PICTURE_FRAME_INSET_Z_BACK;
      model.position.x += targetX;
      model.position.z += targetZ;

      shadowAll(model);
      frameGroup.add(model);
    },
    undefined,
    (error) => {
      console.error('Failed to load ./models/Desk_Picture_Frame_1.glb — make sure it is in the same folder as this HTML file:', error);
    }
  );

  return frameGroup;
}

function buildBookOnDesk(scene, deskBounds) {
  
  
  
  
  
  
  
  
  

  const bookGroup = new THREE.Group();
  bookGroup.name = 'BookOnDesk';
  scene.add(bookGroup);
 
  const loader = new GLTFLoader(loadingManager);
  loader.load(
    './models/book_on_desk.glb',
    (gltf) => {
      const model = gltf.scene;
 
      
      const rawBox  = new THREE.Box3().setFromObject(model);
      const rawSize = rawBox.getSize(new THREE.Vector3());
 
      
      
      
      
      
      const longestRaw = Math.max(rawSize.x, rawSize.z);
      const scale = BOOK_DESK_TARGET_LENGTH / longestRaw;
      model.scale.setScalar(scale);

      
      
      
      
      
      model.rotation.y = BOOK_DESK_ROTATION_Y;

      
      const scaledBox    = new THREE.Box3().setFromObject(model);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
 
      
      
      
      model.position.x -= scaledCenter.x;
      model.position.z -= scaledCenter.z;
      model.position.y += deskBounds.topY - scaledBox.min.y + BOOK_DESK_Y_EPS;
 
      
      
      const targetX = deskBounds.minX + BOOK_DESK_INSET_X;
      const targetZ = deskBounds.maxZ - BOOK_DESK_INSET_Z_FRONT;
      model.position.x += targetX;
      model.position.z += targetZ;
 
      
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow    = true;
          child.receiveShadow = true;
          
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            if (!mat) return;
            if (mat.transmission > 0)                 mat.transmission = 0;
            if (mat.transparent && mat.opacity >= 0.9) mat.transparent = false;
            mat.depthWrite  = true;
            mat.needsUpdate = true;
          });
        }
      });
 
      bookGroup.add(model);
 
      
      const wb = new THREE.Box3().setFromObject(model);
      console.log(
        '[BookOnDesk] loaded ✓\n' +
        `  scale   : ${scale.toFixed(4)}\n` +
        `  world X : ${wb.min.x.toFixed(3)} → ${wb.max.x.toFixed(3)}\n` +
        `  world Y : ${wb.min.y.toFixed(3)} → ${wb.max.y.toFixed(3)}  (deskTop=${deskBounds.topY.toFixed(3)})\n` +
        `  world Z : ${wb.min.z.toFixed(3)} → ${wb.max.z.toFixed(3)}\n` +
        '  Adjust BOOK_DESK_INSET_X / BOOK_DESK_INSET_Z_FRONT / BOOK_DESK_TARGET_LENGTH if needed.'
      );
    },
    undefined,
    (error) => {
      console.error(
        '[BookOnDesk] ✗ Failed to load ./models/book_on_desk.glb\n' +
        'Ensure book_on_desk.glb is in the SAME FOLDER as desk-scene.html\n', error
      );
    }
  );
 
  return bookGroup;
}

function buildVintageBook(scene, transform, deskBounds, groupName = 'VintageBook') {
  
  
  
  
  
  
  
  
  

  const bookGroup = new THREE.Group();
  bookGroup.name = groupName;
  scene.add(bookGroup);

  const loader = new GLTFLoader(loadingManager);
  loader.load(
    './models/vintage_book_retextured.glb',
    (gltf) => {
      const model = gltf.scene;

      
      
      
      
      
      
      
      
      
      model.rotation.set(transform.rotation.x, transform.rotation.y, transform.rotation.z, 'YXZ');

      
      model.scale.setScalar(transform.scale);

      
      
      
      const box    = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.x -= center.x;
      model.position.y -= center.y;
      model.position.z -= center.z;

      
      
      
      if (deskBounds) {
        const deskCenterX = (deskBounds.minX + deskBounds.maxX) / 2;
        const deskCenterZ = (deskBounds.minZ + deskBounds.maxZ) / 2;
        model.position.x += deskCenterX;
        model.position.z += deskCenterZ;
        
        
        
        
        const settledBox = new THREE.Box3().setFromObject(model);
        model.position.y += deskBounds.topY - settledBox.min.y + VINTAGE_BOOK_DESK_Y_EPS;
      } else {
        model.position.x += transform.position.x;
        model.position.y += transform.position.y;
        model.position.z += transform.position.z;
      }

      
      
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow    = true;
          child.receiveShadow = true;
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            if (!mat) return;
            if (mat.transmission > 0)                 mat.transmission = 0;
            if (mat.transparent && mat.opacity >= 0.9) mat.transparent = false;
            mat.depthWrite  = true;
            mat.needsUpdate = true;
          });
        }
      });

      bookGroup.add(model);

      
      const wb = new THREE.Box3().setFromObject(model);
      console.log(
        '[VintageBook] loaded ✓\n' +
        `  scale   : ${transform.scale.toFixed(4)}\n` +
        `  world X : ${wb.min.x.toFixed(3)} → ${wb.max.x.toFixed(3)}\n` +
        `  world Y : ${wb.min.y.toFixed(3)} → ${wb.max.y.toFixed(3)}\n` +
        `  world Z : ${wb.min.z.toFixed(3)} → ${wb.max.z.toFixed(3)}\n` +
        '  To switch placement, change the transform passed to buildVintageBook().'
      );
    },
    undefined,
    (error) => {
      console.error(
        '[VintageBook] ✗ Failed to load ./models/vintage_book_retextured.glb\n' +
        'Ensure vintage_book_retextured.glb is in the SAME FOLDER as desk-scene.html\n', error
      );
    }
  );

  return bookGroup;
}

function buildBouquet(scene, deskBounds) {
  const group = new THREE.Group();
  group.name  = 'DeskBouquet';
  scene.add(group);

  const loader = new GLTFLoader(loadingManager);
  loader.load(
    './models/bouquet__rose_red.glb',
    (gltf) => {
      const model = gltf.scene;

      
      
      
      
      const rawBox  = new THREE.Box3().setFromObject(model);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      const scale   = BOUQUET_TARGET_LENGTH / (rawSize.y || 1);
      model.scale.setScalar(scale);

      
      
      
      
      
      
      
      
      model.rotation.set(
        BOUQUET_ROTATION_X + THREE.MathUtils.degToRad(BOUQUET_BACK_TILT_DEG),
        BOUQUET_ROTATION_Y,
        BOUQUET_ROTATION_Z,
        'YXZ'
      );

      
      const scaledBox    = new THREE.Box3().setFromObject(model);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
      model.position.x -= scaledCenter.x;
      model.position.z -= scaledCenter.z;
      model.position.y += (deskBounds.topY + BOUQUET_Y_EPS) - scaledBox.min.y;

      
      const deskCenterX = (deskBounds.minX + deskBounds.maxX) / 2;
      const deskCenterZ = (deskBounds.minZ + deskBounds.maxZ) / 2;
      model.position.x += deskCenterX;
      model.position.z += deskCenterZ;

      
      
      model.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow    = true;
        child.receiveShadow = true;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          if (!mat) return;
          mat.polygonOffset       = true;
          mat.polygonOffsetFactor = -1;
          mat.polygonOffsetUnits  = -1;
          if (mat.transmission > 0)                  mat.transmission = 0;
          if (mat.transparent && mat.opacity >= 0.9) mat.transparent  = false;
          mat.depthWrite  = true;
          mat.needsUpdate = true;
        });
      });

      group.add(model);
    },
    undefined,
    (error) => {
      console.error(
        '[Bouquet] ✗ Failed to load ./models/bouquet__rose_red.glb\n' +
        'Ensure bouquet__rose_red.glb is in a "desk" folder next to desk-scene.html\n', error
      );
    }
  );

  return group;
}

function buildFlowersWithVase(scene, deskBounds) {
  const group = new THREE.Group();
  group.name  = 'FlowersWithVase';
  scene.add(group);

  const loader = new GLTFLoader(loadingManager);
  loader.load(
    './models/flowers_with_the_vase.glb',
    (gltf) => {
      const model = gltf.scene;

      
      
      if (FLOWERS_VASE_ROTATION_X !== 0) model.rotation.x = FLOWERS_VASE_ROTATION_X;
      model.rotation.y = FLOWERS_VASE_ROTATION_Y;

      
      const rawBox   = new THREE.Box3().setFromObject(model);
      const rawSize  = rawBox.getSize(new THREE.Vector3());
      
      
      
      const rawH          = rawSize.y || 1;
      const deskHeight    = deskBounds.topY - FLOOR_Y;   
      const targetHeight  = deskHeight * 1.11;           
      const scale         = targetHeight / rawH;
      model.scale.setScalar(scale);

      
      const scaledBox    = new THREE.Box3().setFromObject(model);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

      
      model.position.x -= scaledCenter.x;
      model.position.z -= scaledCenter.z;
      
      
      
      model.position.y += (FLOOR_Y + FLOWERS_VASE_Y_EPS) - scaledBox.min.y;

      
      const targetX = deskBounds.minX - FLOWERS_VASE_X_CLEARANCE;
      
      const deskCenterZ = (deskBounds.minZ + deskBounds.maxZ) / 2;
      const targetZ     = deskCenterZ + FLOWERS_VASE_Z_OFFSET;
      model.position.x += targetX;
      model.position.z += targetZ;

      
      model.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow    = true;
        child.receiveShadow = true;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          if (!mat) return;
          
          
          mat.polygonOffset       = true;
          mat.polygonOffsetFactor = -1;
          mat.polygonOffsetUnits  = -1;
          
          
          if (mat.transmission > 0)                  mat.transmission = 0;
          if (mat.transparent && mat.opacity >= 0.9) mat.transparent  = false;
          mat.depthWrite  = true;
          mat.depthTest   = true;
          mat.needsUpdate = true;
        });
      });

      group.add(model);

      
      const wb = new THREE.Box3().setFromObject(group);
      console.log(
        '[FlowersWithVase] loaded ✓\n' +
        `  scale       : ${scale.toFixed(4)}\n` +
        `  targetHeight: ${targetHeight.toFixed(3)} m  (deskH=${deskHeight.toFixed(3)} × 1.05)\n` +
        `  world X     : ${wb.min.x.toFixed(3)} → ${wb.max.x.toFixed(3)}  (deskMinX=${deskBounds.minX.toFixed(3)})\n` +
        `  world Y     : ${wb.min.y.toFixed(3)} → ${wb.max.y.toFixed(3)}  (floor=${FLOOR_Y})\n` +
        `  world Z     : ${wb.min.z.toFixed(3)} → ${wb.max.z.toFixed(3)}\n` +
        '  Tune with FLOWERS_VASE_X_CLEARANCE / FLOWERS_VASE_Z_OFFSET / FLOWERS_VASE_ROTATION_X'
      );
    },
    undefined,
    (err) => console.error('[FlowersWithVase] ✗ Failed to load ./models/flowers_with_the_vase.glb\n' +
      'Ensure flowers_with_the_vase.glb is in the SAME FOLDER as desk-scene.html\n', err)
  );

  return group;
}

const SHELF_Y_LIFT = 0.001;   

function buildPinkFlowers(scene, sb) {
  
  
  
  const group = new THREE.Group();
  group.name  = 'PinkFlowers';
  scene.add(group);

  const worldX = sb.minX + PINK_FLOWERS_INSET_X;   
  const worldZ = sb.backZ + (sb.frontZ - sb.backZ) * PINK_FLOWERS_Z_RATIO;
  const rotY   = 0.12;   

  const loader = new GLTFLoader(loadingManager);
  loader.load('./models/pink_flowers.glb', (gltf) => {
    const model = gltf.scene;

    
    const rawBox  = new THREE.Box3().setFromObject(model);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    const scale   = PINK_FLOWERS_TARGET_H / rawSize.y;
    model.scale.setScalar(scale);

    
    const scaledBox    = new THREE.Box3().setFromObject(model);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
    model.position.x -= scaledCenter.x;
    model.position.z -= scaledCenter.z;
    model.position.y += (sb.topY + SHELF_Y_LIFT) - scaledBox.min.y;
    model.position.x += worldX;
    model.position.z += worldZ;
    model.rotation.y  = rotY;

    model.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow    = true;
      child.receiveShadow = true;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        if (!mat) return;
        mat.polygonOffset       = true;
        mat.polygonOffsetFactor = -1;
        mat.polygonOffsetUnits  = -1;
        if (mat.transmission > 0)                  mat.transmission = 0;
        if (mat.transparent && mat.opacity >= 0.9) mat.transparent  = false;
        mat.depthWrite  = true;
        mat.needsUpdate = true;
      });
    });

    group.add(model);
    const wb = new THREE.Box3().setFromObject(model);
    console.log(
      `[PinkFlowers] loaded ✓  scale=${scale.toFixed(4)}  ` +
      `Y: ${wb.min.y.toFixed(3)}→${wb.max.y.toFixed(3)}  (shelfTop=${sb.topY.toFixed(3)})`
    );
  }, undefined, (err) => console.error('[PinkFlowers] ✗', err));

  return group;
}

function buildMagnolia(scene, sb) {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  

  const worldX = sb.maxX - MAGNOLIA_INSET_X;       
  const worldZ = sb.backZ + (sb.frontZ - sb.backZ) * MAGNOLIA_Z_RATIO;
  const rotY   = MAGNOLIA_ROTATION_Y;

  
  const yawGroup = new THREE.Group();
  yawGroup.name  = 'Magnolia';
  yawGroup.position.set(worldX, sb.topY + SHELF_Y_LIFT + MAGNOLIA_OFFSET_Y, worldZ + MAGNOLIA_OFFSET_Z);
  yawGroup.rotation.x = MAGNOLIA_TILT_X;
  yawGroup.rotation.y = rotY;
  yawGroup.rotation.z = MAGNOLIA_TILT_Z;
  scene.add(yawGroup);

  
  const orientGroup = new THREE.Group();
  orientGroup.rotation.x = -Math.PI / 2;  
  yawGroup.add(orientGroup);

  const loader = new GLTFLoader(loadingManager);
  loader.load('./models/magnolia_in_a_vase.glb', (gltf) => {
    const model = gltf.scene;

    
    const rawBox  = new THREE.Box3().setFromObject(model);   
    const rawSize = rawBox.getSize(new THREE.Vector3());
    const scale   = MAGNOLIA_TARGET_H / rawSize.z;           
    model.scale.setScalar(scale);

    
    
    
    
    const scaledBox    = new THREE.Box3().setFromObject(model);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
    model.position.x  -= scaledCenter.x;   
    model.position.y  -= scaledCenter.y;   
    

    orientGroup.add(model);

    
    model.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow    = true;
      child.receiveShadow = true;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        if (!mat) return;
        mat.polygonOffset       = true;
        mat.polygonOffsetFactor = -1;
        mat.polygonOffsetUnits  = -1;
        if (mat.transmission > 0)                  mat.transmission = 0;
        if (mat.transparent && mat.opacity >= 0.9) mat.transparent  = false;
        mat.depthWrite  = true;
        mat.needsUpdate = true;
      });
    });

    const wb = new THREE.Box3().setFromObject(yawGroup);
    console.log(
      `[Magnolia] loaded ✓  scale=${scale.toFixed(6)}\n` +
      `  world X: ${wb.min.x.toFixed(3)}→${wb.max.x.toFixed(3)}  ` +
      `Y: ${wb.min.y.toFixed(3)}→${wb.max.y.toFixed(3)}  ` +
      `Z: ${wb.min.z.toFixed(3)}→${wb.max.z.toFixed(3)}\n` +
      `  (shelfTop=${sb.topY.toFixed(3)}, base should be at ${(sb.topY + SHELF_Y_LIFT).toFixed(3)})`
    );
  }, undefined, (err) => console.error('[Magnolia] ✗ Failed to load ./models/magnolia_in_a_vase.glb', err));

  return yawGroup;
}

function buildFlowerFrame(scene) {
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  

  const frameGroup = new THREE.Group();
  frameGroup.name  = 'FlowerFrame';
  scene.add(frameGroup);

  const scaleX = FRAME_FLORAL_DEPTH    / 2.0;   
  const scaleY = FRAME_FLORAL_TARGET_H / 2.0;   
  const scaleZ = FRAME_FLORAL_TARGET_W / 2.0;   

  const loader = new GLTFLoader(loadingManager);
  loader.load(
    './models/fancy_victorian_flower_frame.glb',
    (gltf) => {
      const model = gltf.scene;

      
      model.rotation.y = -Math.PI / 2;
      model.scale.set(scaleX, scaleY, scaleZ);

      
      model.position.set(
        FRAME_FLORAL_CENTER_X,
        FRAME_FLORAL_CENTER_Y,
        WALL_Z + scaleX + FRAME_FLORAL_OFFSET
      );

      model.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow    = true;
        child.receiveShadow = true;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          if (!mat) return;
          mat.depthWrite  = true;
          mat.needsUpdate = true;
        });
      });

      frameGroup.add(model);

      const wb = new THREE.Box3().setFromObject(model);
      console.log(
        `[FlowerFrame] loaded ✓\n` +
        `  X: ${wb.min.x.toFixed(3)} → ${wb.max.x.toFixed(3)}  (face width ~${FRAME_FLORAL_TARGET_W}m)\n` +
        `  Y: ${wb.min.y.toFixed(3)} → ${wb.max.y.toFixed(3)}  (face height ~${FRAME_FLORAL_TARGET_H}m)\n` +
        `  Z: ${wb.min.z.toFixed(3)} → ${wb.max.z.toFixed(3)}  (wall=${WALL_Z}, depth=${FRAME_FLORAL_DEPTH}m)`
      );
    },
    undefined,
    (err) => console.error('[FlowerFrame] ✗ Failed to load ./models/fancy_victorian_flower_frame.glb', err)
  );

  return frameGroup;
}

function buildWallPicture(scene) {
  const frameGroup = new THREE.Group();
  frameGroup.name  = 'WallPicture';
  scene.add(frameGroup);

  const loader = new GLTFLoader(loadingManager);
  loader.load(
    './models/wall_picture.glb',
    (gltf) => {
      const model = gltf.scene;

      
      model.rotation.y = WALL_PIC_ROTATION_Y;

      
      
      model.updateMatrixWorld(true);
      const rawBox  = new THREE.Box3().setFromObject(model);
      const rawSize = rawBox.getSize(new THREE.Vector3());

      
      
      
      
      const nativeW = rawSize.x;   
      const nativeH = rawSize.y;   
      const nativeD = rawSize.z;   

      
      const scaleByW = WALL_PIC_TARGET_W / (nativeW || 1);
      const scaleByH = WALL_PIC_TARGET_H / (nativeH || 1);
      const uniformScale = Math.min(scaleByW, scaleByH);

      
      
      const depthScale = WALL_PIC_DEPTH / ((nativeD * uniformScale) || 1);
      model.scale.set(
        uniformScale,
        uniformScale,
        uniformScale * depthScale
      );

      
      
      model.updateMatrixWorld(true);
      const scaledBox    = new THREE.Box3().setFromObject(model);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

      
      
      
      
      model.position.x += WALL_PIC_CENTER_X - scaledCenter.x;
      model.position.y += WALL_PIC_CENTER_Y  - scaledCenter.y;
      model.position.z += (WALL_Z + WALL_PIC_Z_OFFSET) - scaledBox.min.z;

      
      model.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow    = true;
        child.receiveShadow = true;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          if (!mat) return;
          mat.depthWrite  = true;
          mat.needsUpdate = true;
        });
      });

      frameGroup.add(model);

      const wb = new THREE.Box3().setFromObject(model);
      console.log(
        '[WallPicture] loaded ✓\n' +
        `  X: ${wb.min.x.toFixed(3)} → ${wb.max.x.toFixed(3)}  (width ~${(wb.max.x-wb.min.x).toFixed(3)} m)\n` +
        `  Y: ${wb.min.y.toFixed(3)} → ${wb.max.y.toFixed(3)}  (height ~${(wb.max.y-wb.min.y).toFixed(3)} m)\n` +
        `  Z: ${wb.min.z.toFixed(3)} → ${wb.max.z.toFixed(3)}  (wall front=${WALL_Z})\n` +
        '  Tune: WALL_PIC_CENTER_X/Y, WALL_PIC_TARGET_W/H, WALL_PIC_ROTATION_Y'
      );
    },
    undefined,
    (err) => console.error('[WallPicture] ✗ Failed to load ./models/wall_picture.glb\n' +
      'Ensure wall_picture.glb is in the SAME FOLDER as desk-scene.html\n', err)
  );

  return frameGroup;
}

function buildPictureFrame(scene) {
  const frameGroup = new THREE.Group();
  frameGroup.name  = 'PictureFrameSmall';
  scene.add(frameGroup);

  
  function createFallbackPainting() {
    const W = 512, H = 384;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');

    
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.62);
    sky.addColorStop(0.00, '#2e1b3d');  
    sky.addColorStop(0.35, '#7c3d72');  
    sky.addColorStop(0.70, '#e8854a');  
    sky.addColorStop(1.00, '#f5c47a');  
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.62);

    
    const glow = ctx.createRadialGradient(W * 0.5, H * 0.62, 0, W * 0.5, H * 0.62, W * 0.55);
    glow.addColorStop(0.0, 'rgba(255,200,100,0.45)');
    glow.addColorStop(0.5, 'rgba(240,150,60,0.18)');
    glow.addColorStop(1.0, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H * 0.72);

    
    const grd = ctx.createLinearGradient(0, H * 0.60, 0, H);
    grd.addColorStop(0.0, '#1a2a10');
    grd.addColorStop(0.5, '#0f1a08');
    grd.addColorStop(1.0, '#0a1205');
    ctx.fillStyle = grd;
    ctx.fillRect(0, H * 0.58, W, H);

    
    ctx.fillStyle = '#162011';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.70);
    ctx.bezierCurveTo(W * 0.15, H * 0.58, W * 0.30, H * 0.62, W * 0.45, H * 0.60);
    ctx.bezierCurveTo(W * 0.60, H * 0.58, W * 0.75, H * 0.64, W,       H * 0.68);
    ctx.lineTo(W, H); ctx.lineTo(0, H);
    ctx.fill();

    
    function paintTree(cx, baseY, h, spread, segs) {
      ctx.fillStyle = '#0d1a08';
      for (let i = 0; i < segs; i++) {
        const ty = baseY - h * (i / segs);
        const tw = spread * (1 - i / segs) * 0.85 + 2;
        ctx.beginPath();
        ctx.ellipse(cx, ty, tw, h * 0.18 + 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.fillStyle = '#0a1005';
      ctx.fillRect(cx - 3, baseY - h * 0.18, 6, h * 0.22);
    }

    paintTree(W * 0.18, H * 0.62, H * 0.28, 22, 8);
    paintTree(W * 0.25, H * 0.63, H * 0.24, 18, 7);
    paintTree(W * 0.12, H * 0.64, H * 0.20, 16, 6);
    paintTree(W * 0.82, H * 0.63, H * 0.25, 19, 7);
    paintTree(W * 0.88, H * 0.62, H * 0.22, 17, 6);

    
    const dabColors = [
      'rgba(240,180,80,0.12)', 'rgba(200,120,60,0.10)',
      'rgba(160,90,140,0.09)', 'rgba(255,220,120,0.08)',
    ];
    let _s2 = 0xC4B1 | 0;
    const lcg2 = () => { _s2 = (Math.imul(_s2, 1664525) + 1013904223) | 0; return (_s2 >>> 0) / 0x100000000; };
    for (let i = 0; i < 220; i++) {
      const dx = lcg2() * W, dy = lcg2() * H * 0.65;
      const dw = 6 + lcg2() * 14, dh = 3 + lcg2() * 5;
      const angle = (lcg2() - 0.5) * 0.6;
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(angle);
      ctx.fillStyle = dabColors[Math.floor(lcg2() * dabColors.length)];
      ctx.beginPath();
      ctx.ellipse(0, 0, dw, dh, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    
    const vign = ctx.createRadialGradient(W/2, H/2, W*0.25, W/2, H/2, W*0.72);
    vign.addColorStop(0, 'rgba(0,0,0,0)');
    vign.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = vign;
    ctx.fillRect(0, 0, W, H);

    const tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  
  
  function findPictureMesh(root) {
    const PICTURE_NAMES = /picture|canvas|painting|image|art|photo|artwork|print/i;
    let namedMatch  = null;
    let flattest    = null;  
    let flattestScore = Infinity;

    root.traverse((child) => {
      if (!child.isMesh) return;

      
      if (PICTURE_NAMES.test(child.name) && !namedMatch) {
        namedMatch = child;
      }

      
      const bb   = new THREE.Box3().setFromObject(child);
      const size = bb.getSize(new THREE.Vector3());
      const faceArea = Math.max(size.x * size.y, size.x * size.z, size.y * size.z);
      const minDim   = Math.min(size.x, size.y, size.z);
      if (faceArea > 0.001) {  
        const flatScore = minDim / faceArea;  
        if (flatScore < flattestScore) {
          flattestScore = flatScore;
          flattest = child;
        }
      }
    });

    return namedMatch || flattest;
  }

  
  function applyPictureTexture(pictureMesh, texture) {
    if (!pictureMesh) return;
    const newMat = new THREE.MeshStandardMaterial({
      map:       texture,
      roughness: 0.82,   
      metalness: 0.0,
      name:      'picture_canvas_mat',
    });
    pictureMesh.material = newMat;
    pictureMesh.material.needsUpdate = true;
    console.log(`[PictureFrameSmall] Applied texture to mesh "${pictureMesh.name || '(unnamed)'}"`);
  }

  
  const loader = new GLTFLoader(loadingManager);
  loader.load(
    './models/picture_frame_11mb.glb',
    (gltf) => {
      const model = gltf.scene;

      
      console.log('[PictureFrameSmall] Mesh inventory:');
      model.traverse((child) => {
        if (child.isMesh) {
          const bb   = new THREE.Box3().setFromObject(child);
          const size = bb.getSize(new THREE.Vector3());
          console.log(`  mesh: "${child.name}"  size: ${size.x.toFixed(3)} × ${size.y.toFixed(3)} × ${size.z.toFixed(3)}`);
        }
      });

      
      model.rotation.y = SMALL_FRAME_ROTATION_Y;
      model.updateMatrixWorld(true);

      
      const rawBox  = new THREE.Box3().setFromObject(model);
      const rawSize = rawBox.getSize(new THREE.Vector3());

      const nativeW = rawSize.x;
      const nativeH = rawSize.y;
      const nativeD = rawSize.z;

      const scaleByW    = SMALL_FRAME_TARGET_W / (nativeW || 1);
      const scaleByH    = SMALL_FRAME_TARGET_H / (nativeH || 1);
      const uniformScale = Math.min(scaleByW, scaleByH);

      
      const depthScale = SMALL_FRAME_DEPTH / ((nativeD * uniformScale) || 1);
      model.scale.set(
        uniformScale,
        uniformScale,
        uniformScale * depthScale
      );

      
      model.updateMatrixWorld(true);
      const scaledBox    = new THREE.Box3().setFromObject(model);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

      model.position.x += SMALL_FRAME_CENTER_X - scaledCenter.x;
      model.position.y += SMALL_FRAME_CENTER_Y  - scaledCenter.y;
      
      
      
      model.position.z += (WALL_Z + SMALL_FRAME_Z_OFFSET) - scaledBox.min.z;

      
      model.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow    = true;
        child.receiveShadow = true;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          if (!mat) return;
          mat.depthWrite  = true;
          mat.needsUpdate = true;
        });
      });

      
      const pictureMesh = findPictureMesh(model);

      const texLoader = new THREE.TextureLoader(loadingManager);
      texLoader.load(
        PICTURE_FRAME_IMAGE,
        
        (userTex) => {
          userTex.encoding = THREE.sRGBEncoding;
          userTex.wrapS    = THREE.ClampToEdgeWrapping;
          userTex.wrapT    = THREE.ClampToEdgeWrapping;
          userTex.needsUpdate = true;
          applyPictureTexture(pictureMesh, userTex);
          console.log(`[PictureFrameSmall] User image "${PICTURE_FRAME_IMAGE}" applied ✓`);
        },
        undefined,
        
        () => {
          console.warn(
            `[PictureFrameSmall] Could not load "${PICTURE_FRAME_IMAGE}" — using procedural fallback.\n` +
            `  Put your image in the same folder as desk-scene.html and update PICTURE_FRAME_IMAGE.`
          );
          applyPictureTexture(pictureMesh, createFallbackPainting());
        }
      );

      frameGroup.add(model);

      const wb = new THREE.Box3().setFromObject(model);
      console.log(
        '[PictureFrameSmall] loaded ✓\n' +
        `  X: ${wb.min.x.toFixed(3)} → ${wb.max.x.toFixed(3)}  (width ~${(wb.max.x-wb.min.x).toFixed(3)} m)\n` +
        `  Y: ${wb.min.y.toFixed(3)} → ${wb.max.y.toFixed(3)}  (height ~${(wb.max.y-wb.min.y).toFixed(3)} m)\n` +
        `  Z: ${wb.min.z.toFixed(3)} → ${wb.max.z.toFixed(3)}  (wall front=${WALL_Z})\n` +
        `  floral frame above: center Y=${FRAME_FLORAL_CENTER_Y}, ` +
          `bottom ~${(FRAME_FLORAL_CENTER_Y - FRAME_FLORAL_TARGET_H * 0.5).toFixed(3)}\n` +
        '  Tune: SMALL_FRAME_CENTER_X/Y, SMALL_FRAME_TARGET_W/H, SMALL_FRAME_ROTATION_Y'
      );
    },
    undefined,
    (err) => console.error('[PictureFrameSmall] ✗ Failed to load ./models/picture_frame_11mb.glb\n' +
      'Ensure picture_frame_11mb.glb is in the SAME FOLDER as desk-scene.html\n', err)
  );

  return frameGroup;
}

function buildWindowPlant(scene, opts = {}) {
  const {
    targetH      = PLANT_W_TARGET_H,
    visibleRatio = PLANT_W_VISIBLE_RATIO,
    x            = PLANT_W_X,
    rotationY    = PLANT_W_ROTATION_Y,
    zOffset      = PLANT_W_Z_OFFSET,
    yLift        = 0,        
    label        = 'WindowPlant',
  } = opts;

  const oT     = WIN_Y + WIN_H * 0.5;        
  const plantZ = WALL_Z + zOffset;           

  const group = new THREE.Group();
  group.name  = label;
  scene.add(group);

  const loader = new GLTFLoader(loadingManager);
  loader.load(
    './models/W_plant.glb',
    (gltf) => {
      const model = gltf.scene;

      
      model.rotation.y = rotationY;

      
      const rawBox = new THREE.Box3().setFromObject(model);
      const rawH   = (rawBox.max.y - rawBox.min.y) || 1;
      const scale  = targetH / rawH;
      model.scale.setScalar(scale);

      
      const sBox   = new THREE.Box3().setFromObject(model);
      const totalH = sBox.max.y - sBox.min.y;

      
      
      
      
      
      const hiddenH    = totalH * (1.0 - visibleRatio);
      model.position.x = x;
      model.position.y = (oT + hiddenH) - sBox.max.y + yLift;
      model.position.z = plantZ;

      model.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow    = true;
        child.receiveShadow = false;
        
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => { if (m) { m.depthWrite = true; m.needsUpdate = true; } });
      });

      group.add(model);

      const wb = new THREE.Box3().setFromObject(model);
      console.log(
        `[${label}] loaded ✓  scale=${scale.toFixed(4)}\n` +
        `  X: ${wb.min.x.toFixed(3)} → ${wb.max.x.toFixed(3)}\n` +
        `  Y: ${wb.min.y.toFixed(3)} → ${wb.max.y.toFixed(3)}` +
        `  (oT=${oT.toFixed(3)}, ${Math.round(visibleRatio * 100)}% visible)\n` +
        `  Z: ${wb.min.z.toFixed(3)} → ${wb.max.z.toFixed(3)}  (wall front=${WALL_Z})`
      );
    },
    undefined,
    (err) => console.error(`[${label}] ✗ Failed to load ./models/W_plant.glb`, err)
  );

  return group;
}

function cutHoleInMesh(mesh, oL, oR, oB, oT) {
  const geo = mesh.geometry;
  if (!geo || !geo.isBufferGeometry) return;

  const posAttr  = geo.attributes.position;
  const uvAttr   = geo.attributes.uv;
  const uv2Attr  = geo.attributes.uv2;
  const idxAttr  = geo.index;
  if (!posAttr) return;

  
  mesh.updateWorldMatrix(true, false);
  const m4    = mesh.matrixWorld;
  const m4inv = new THREE.Matrix4().copy(m4).invert();

  const triCount = idxAttr
    ? Math.floor(idxAttr.count / 3)
    : Math.floor(posAttr.count / 3);

  
  function vtx(i) {
    const lp = new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
    const wp = lp.applyMatrix4(m4);
    return {
      x: wp.x, y: wp.y, z: wp.z,
      u:  uvAttr  ? uvAttr .getX(i) : 0,
      v:  uvAttr  ? uvAttr .getY(i) : 0,
      u2: uv2Attr ? uv2Attr.getX(i) : 0,
      v2: uv2Attr ? uv2Attr.getY(i) : 0,
    };
  }

  function lerpV(a, b, t) {
    return {
      x: a.x+(b.x-a.x)*t, y: a.y+(b.y-a.y)*t, z: a.z+(b.z-a.z)*t,
      u:  a.u +(b.u -a.u )*t, v:  a.v +(b.v -a.v )*t,
      u2: a.u2+(b.u2-a.u2)*t, v2: a.v2+(b.v2-a.v2)*t,
    };
  }

  
  function clipHalf(poly, signedDist) {
    if (poly.length < 2) return poly;
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const da = signedDist(a), db = signedDist(b);
      if (da >= 0) out.push(a);
      if ((da > 0 && db < 0) || (da < 0 && db > 0))
        out.push(lerpV(a, b, da / (da - db)));
    }
    return out;
  }

  
  function fanTris(poly, cb) {
    for (let i = 1; i + 1 < poly.length; i++) cb(poly[0], poly[i], poly[i + 1]);
  }

  
  const oWPos = [], oUV = [], oUV2 = [], oIdx = [];

  function pushTri(a, b, c) {
    const base = oWPos.length / 3;
    oWPos.push(a.x, a.y, a.z,  b.x, b.y, b.z,  c.x, c.y, c.z);
    oUV .push(a.u,  a.v,        b.u,  b.v,        c.u,  c.v);
    oUV2.push(a.u2, a.v2,       b.u2, b.v2,       c.u2, c.v2);
    oIdx.push(base, base + 1, base + 2);
  }

  
  for (let t = 0; t < triCount; t++) {
    const ai = idxAttr ? idxAttr.getX(t * 3)     : t * 3;
    const bi = idxAttr ? idxAttr.getX(t * 3 + 1) : t * 3 + 1;
    const ci = idxAttr ? idxAttr.getX(t * 3 + 2) : t * 3 + 2;
    const va = vtx(ai), vb = vtx(bi), vc = vtx(ci);

    
    const txMin = Math.min(va.x, vb.x, vc.x), txMax = Math.max(va.x, vb.x, vc.x);
    const tyMin = Math.min(va.y, vb.y, vc.y), tyMax = Math.max(va.y, vb.y, vc.y);
    if (txMax <= oL || txMin >= oR || tyMax <= oB || tyMin >= oT) {
      pushTri(va, vb, vc);
      continue;
    }

    
    

    const T = [va, vb, vc];

    
    fanTris(clipHalf(T, v => oL - v.x), pushTri);

    
    fanTris(clipHalf(T, v => v.x - oR), pushTri);

    
    const col = clipHalf(clipHalf(T, v => v.x - oL), v => oR - v.x);
    fanTris(clipHalf(col, v => oB - v.y), pushTri);

    
    fanTris(clipHalf(col, v => v.y - oT), pushTri);
  }

  
  const localPos = new Float32Array(oWPos.length);
  for (let i = 0; i < oWPos.length; i += 3) {
    const lp = new THREE.Vector3(oWPos[i], oWPos[i+1], oWPos[i+2]).applyMatrix4(m4inv);
    localPos[i] = lp.x; localPos[i+1] = lp.y; localPos[i+2] = lp.z;
  }

  
  const newGeo = new THREE.BufferGeometry();
  newGeo.setAttribute('position', new THREE.Float32BufferAttribute(localPos, 3));
  if (uvAttr)  newGeo.setAttribute('uv',  new THREE.Float32BufferAttribute(oUV,  2));
  if (uv2Attr) newGeo.setAttribute('uv2', new THREE.Float32BufferAttribute(oUV2, 2));
  newGeo.setIndex(oIdx);
  newGeo.computeVertexNormals();

  geo.dispose();
  mesh.geometry = newGeo;
}

function buildWallModel(scene) {
  const wallModelGroup = new THREE.Group();
  wallModelGroup.name = 'WallModel';
  scene.add(wallModelGroup);

  const loader = new GLTFLoader(loadingManager);
  loader.load(
    './models/victorian_wall.glb',
    (gltf) => {
      const model = gltf.scene;

      
      const TRIM_TINT = new THREE.Color(1.60, 1.28, 0.80);
      let tintedTrimMat = null;

      model.traverse((child) => {
        if (child.isMesh) {
          const isWallMesh = child.name.startsWith('Wall');
          child.visible = isWallMesh;
          if (isWallMesh) {
            child.castShadow    = true;
            child.receiveShadow = true;
            if (child.material && child.material.name === 'TrimSheet') {
              if (!tintedTrimMat) {
                tintedTrimMat = child.material.clone();
                tintedTrimMat.color.copy(TRIM_TINT);
              }
              child.material = tintedTrimMat;
            }
          }
        }
      });

      
      model.rotation.y = -Math.PI / 2;

      
      const rawBox  = new THREE.Box3().setFromObject(model);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      const scale   = WALL_TARGET_HEIGHT / rawSize.y;
      model.scale.setScalar(scale);

      
      const scaledBox    = new THREE.Box3().setFromObject(model);
      const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
      model.position.x  -= scaledCenter.x;
      model.position.y  += FLOOR_Y - scaledBox.min.y;
      model.position.z  += WALL_FRONT_Z - scaledBox.max.z;

      
      
      
      wallModelGroup.add(model);
      wallModelGroup.updateMatrixWorld(true);

      
      const oL = WIN_X - WIN_W * 0.5;
      const oR = WIN_X + WIN_W * 0.5;
      const oB = WIN_Y - WIN_H * 0.5;
      const oT = WIN_Y + WIN_H * 0.5;

      
      
      
      
      model.traverse((child) => {
        if (child.isMesh && child.visible) {
          cutHoleInMesh(child, oL, oR, oB, oT);
        }
      });
    },
    undefined,
    (error) => {
      console.error('Failed to load ./models/victorian_wall.glb — make sure it is in the same folder as this HTML file:', error);
    }
  );

  return wallModelGroup;
}

function createWoodGrainTexture() {
  const w = 512, h = 512;
  const canvas = document.createElement('canvas');
  canvas.width  = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  
  const base = ctx.createLinearGradient(0, 0, w, 0);
  base.addColorStop(0,    '#241509');
  base.addColorStop(0.35, '#3a2613');
  base.addColorStop(0.65, '#33210f');
  base.addColorStop(1,    '#1f1208');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  
  const lineCount = 60;
  for (let i = 0; i < lineCount; i++) {
    const baseY = (i / lineCount) * h;
    const alpha = 0.10 + Math.random() * 0.22;
    ctx.strokeStyle = Math.random() < 0.5
      ? `rgba(10, 6, 3, ${alpha})`         
      : `rgba(94, 66, 36, ${alpha * 0.6})`; 
    ctx.lineWidth = 0.5 + Math.random() * 1.6;
    ctx.beginPath();
    let x = 0;
    let y = baseY + (Math.random() - 0.5) * 4;
    ctx.moveTo(x, y);
    while (x < w) {
      const nx = x + 14 + Math.random() * 22;
      const ny = baseY + (Math.random() - 0.5) * 7;
      ctx.quadraticCurveTo((x + nx) * 0.5, (y + ny) * 0.5 + (Math.random() - 0.5) * 3, nx, ny);
      x = nx; y = ny;
    }
    ctx.stroke();
  }

  
  for (let i = 0; i < 3; i++) {
    const kx = Math.random() * w;
    const ky = Math.random() * h;
    const r  = 10 + Math.random() * 14;
    const rg = ctx.createRadialGradient(kx, ky, 0, kx, ky, r);
    rg.addColorStop(0,   'rgba(12, 7, 3, 0.65)');
    rg.addColorStop(0.6, 'rgba(12, 7, 3, 0.25)');
    rg.addColorStop(1,   'rgba(12, 7, 3, 0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(kx, ky, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);   
  if (renderer.capabilities && renderer.capabilities.getMaxAnisotropy) {
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }
  tex.needsUpdate = true;
  return tex;
}

function buildWindow(scene) {
  const WALL_COL = 0x2a2219;  

  
  
  
  
  const windowWood = new THREE.MeshStandardMaterial({
    map:       createWoodGrainTexture(),
    color:     0xffffff,   
    roughness: 0.68,
    metalness: 0.04,
    name:      'window_wood'
  });

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const glassMat = new THREE.MeshPhysicalMaterial({
    color:             new THREE.Color(0xd0e8fc),  
    roughness:         0.085,                       
    metalness:         0.0,
    reflectivity:      0.55,                        
    emissive:          new THREE.Color(0x3a608e),  
    emissiveIntensity: 0.038,
    transparent:       true,
    opacity:           0.13,                        
    side:              THREE.DoubleSide,
    depthWrite:        false,
    name:              'window_glass'
  });

  
  
  
  
  
  
  
  
  glassMat.onBeforeCompile = (shader) => {
    
    
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <output_fragment>',
      [
        '// ── Fresnel rim ────────────────────────────────────────────',
        'float _NdotV = abs(dot(normalize(vNormal), normalize(vViewPosition)));',
        '// Schlick-style exponent: 1 at grazing (NdotV=0), 0 head-on',
        'float _fresnel = pow(clamp(1.0 - _NdotV, 0.0, 1.0), 3.5);',
        '// Add a faint cool-blue glow at the rim — matches rainy sky reflected',
        'gl_FragColor.rgb += vec3(0.10, 0.16, 0.26) * _fresnel * 0.38;',
        '// Tiny opacity boost at grazing angles (stays below 0.22 overall)',
        'gl_FragColor.a   = clamp(gl_FragColor.a + _fresnel * 0.05, 0.0, 1.0);',
        '// ───────────────────────────────────────────────────────────',
        '#include <output_fragment>',
      ].join('\n')
    );
  };

  
  
  
  const wallRevealMat = new THREE.MeshStandardMaterial({
    color:     WALL_COL,
    roughness: 0.94,
    metalness: 0.0,
    side:      THREE.DoubleSide,
    name:      'wall_reveal'
  });

  const win = new THREE.Group();
  win.name = 'window_root';

  
  const oL = WIN_X - WIN_W * 0.5;
  const oR = WIN_X + WIN_W * 0.5;
  const oB = WIN_Y - WIN_H * 0.5;
  const oT = WIN_Y + WIN_H * 0.5;

  
  const wallBackZ = WALL_Z - WIN_DEPTH;
  const wallSlabZ = (WALL_Z + wallBackZ) * 0.5;

  
  
  
  
  
  
  
  
  
  
  
  
  const REVEAL_EPS = 0.001;

  const leftReveal = new THREE.Mesh(new THREE.PlaneGeometry(WIN_DEPTH, WIN_H), wallRevealMat);
  leftReveal.rotation.y =  Math.PI * 0.5;  
  leftReveal.position.set(oL + REVEAL_EPS, WIN_Y, wallSlabZ);
  leftReveal.receiveShadow = true;
  win.add(leftReveal);

  const rightReveal = new THREE.Mesh(new THREE.PlaneGeometry(WIN_DEPTH, WIN_H), wallRevealMat);
  rightReveal.rotation.y = -Math.PI * 0.5;  
  rightReveal.position.set(oR - REVEAL_EPS, WIN_Y, wallSlabZ);
  rightReveal.receiveShadow = true;
  win.add(rightReveal);

  const topReveal = new THREE.Mesh(new THREE.PlaneGeometry(WIN_W, WIN_DEPTH), wallRevealMat);
  topReveal.rotation.x = Math.PI * 0.5;    
  topReveal.position.set(WIN_X, oT - REVEAL_EPS, wallSlabZ);
  topReveal.receiveShadow = true;
  win.add(topReveal);

  const botReveal = new THREE.Mesh(new THREE.PlaneGeometry(WIN_W, WIN_DEPTH), wallRevealMat);
  botReveal.rotation.x = -Math.PI * 0.5;   
  botReveal.position.set(WIN_X, oB + REVEAL_EPS, wallSlabZ);
  botReveal.receiveShadow = true;
  win.add(botReveal);

  
  const FRAME_DEPTH = WIN_DEPTH * 0.85;
  const FRAME_Z_CTR = WALL_Z - FRAME_DEPTH * 0.5;

  function frameMember(w, h, d, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), windowWood);
    m.position.set(x, y, z);
    m.castShadow    = true;
    m.receiveShadow = true;
    win.add(m);
  }

  frameMember(WIN_W,  FRAME_T, FRAME_DEPTH, WIN_X,               oT - FRAME_T * 0.5, FRAME_Z_CTR);  
  frameMember(WIN_W,  FRAME_T, FRAME_DEPTH, WIN_X,               oB + FRAME_T * 0.5, FRAME_Z_CTR);  
  const stileH = WIN_H - FRAME_T * 2;
  frameMember(FRAME_T, stileH, FRAME_DEPTH, oL + FRAME_T * 0.5, WIN_Y,               FRAME_Z_CTR);  
  frameMember(FRAME_T, stileH, FRAME_DEPTH, oR - FRAME_T * 0.5, WIN_Y,               FRAME_Z_CTR);  

  
  const paneW = WIN_W - FRAME_T * 2;
  const paneH = WIN_H - FRAME_T * 2;
  frameMember(paneW,    MULLION_T, FRAME_DEPTH, WIN_X, WIN_Y, FRAME_Z_CTR);           
  frameMember(MULLION_T, paneH,   FRAME_DEPTH, WIN_X, WIN_Y, FRAME_Z_CTR + 0.0005);  

  
  
  
  
  
  
  
  
  
  
  const gpW = (paneW - MULLION_T) * 0.5;
  const gpH = (paneH - MULLION_T) * 0.5;
  const gpZ = WALL_Z - FRAME_DEPTH * 0.88;

  const gpXL = WIN_X - MULLION_T * 0.5 - gpW * 0.5;
  const gpXR = WIN_X + MULLION_T * 0.5 + gpW * 0.5;
  const gpYT = WIN_Y + MULLION_T * 0.5 + gpH * 0.5;
  const gpYB = WIN_Y - MULLION_T * 0.5 - gpH * 0.5;

  [[gpXL, gpYT], [gpXR, gpYT], [gpXL, gpYB], [gpXR, gpYB]].forEach(([gx, gy]) => {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(gpW, gpH), glassMat);
    pane.position.set(gx, gy, gpZ);
    pane.castShadow    = false;
    pane.receiveShadow = false;  
    win.add(pane);
  });

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  

  function createGlassFrostTexture() {
    const W = 512, H = 512;
    const cv  = document.createElement('canvas');
    cv.width  = W;
    cv.height = H;
    const ctx = cv.getContext('2d');

    
    ctx.clearRect(0, 0, W, H);

    
    
    
    
    const vg = ctx.createRadialGradient(W * 0.5, H * 0.5, W * 0.22,
                                         W * 0.5, H * 0.5, W * 0.80);
    vg.addColorStop(0.00, 'rgba(195,212,232,0.000)');
    vg.addColorStop(0.62, 'rgba(195,212,232,0.000)');
    vg.addColorStop(0.82, 'rgba(195,212,232,0.048)');
    vg.addColorStop(1.00, 'rgba(195,212,232,0.150)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    
    
    
    [[0, 0], [W, 0], [0, H], [W, H]].forEach(([cx, cy]) => {
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.38);
      cg.addColorStop(0.00, 'rgba(205,220,240,0.122)');
      cg.addColorStop(0.55, 'rgba(205,220,240,0.038)');
      cg.addColorStop(1.00, 'rgba(205,220,240,0.000)');
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, W, H);
    });

    
    
    
    
    
    
    let _s = 0xA3C1 | 0;
    const lcg = () => { _s = (Math.imul(_s, 1664525) + 1013904223) | 0; return (_s >>> 0) / 0x100000000; };

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 5; i++) {
      const alpha = 0.028 + lcg() * 0.022;             
      ctx.strokeStyle = `rgba(218,230,248,${alpha.toFixed(4)})`;
      ctx.lineWidth   = 6 + lcg() * 14;                
      ctx.lineCap     = 'round';
      ctx.shadowColor = `rgba(218,230,248,${(alpha * 0.6).toFixed(4)})`;
      ctx.shadowBlur  = 8 + lcg() * 12;                
      const x0  = W * (0.1 + lcg() * 0.8);
      const y0  = H * (0.1 + lcg() * 0.8);
      const cpx = x0 + (lcg() - 0.5) * W * 0.55;
      const cpy = y0 + (lcg() - 0.5) * H * 0.55;
      const x1  = x0 + (lcg() - 0.5) * W * 0.70;
      const y1  = y0 + (lcg() - 0.5) * H * 0.70;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(cpx, cpy, x1, y1);
      ctx.stroke();
    }
    ctx.restore();

    const tex = new THREE.CanvasTexture(cv);
    tex.needsUpdate = true;
    return tex;
  }

  
  
  
  
  const frostTex = createGlassFrostTexture();
  const frostMat = new THREE.MeshBasicMaterial({
    map:         frostTex,       
    transparent: true,
    opacity:     1.0,            
    depthWrite:  false,          
    side:        THREE.DoubleSide,
    name:        'window_glass_frost',
  });

  
  
  
  const FROST_Z = gpZ + 0.0015;

  [[gpXL, gpYT], [gpXR, gpYT], [gpXL, gpYB], [gpXR, gpYB]].forEach(([gx, gy]) => {
    const frost = new THREE.Mesh(new THREE.PlaneGeometry(gpW, gpH), frostMat);
    frost.position.set(gx, gy, FROST_Z);
    frost.renderOrder   = 1;
    frost.castShadow    = false;
    frost.receiveShadow = false;
    win.add(frost);
  });
  

  
  const SILL_W = WIN_W + FRAME_T * 2 + 0.04;
  const SILL_H = FRAME_T * 0.60;
  const SILL_D = WIN_DEPTH + SILL_PROJ;
  const SILL_Y = oB;
  const SILL_Z = WALL_Z - WIN_DEPTH * 0.5 + SILL_PROJ * 0.5;

  const sillBoard = new THREE.Mesh(new THREE.BoxGeometry(SILL_W, SILL_H, SILL_D), windowWood);
  sillBoard.position.set(WIN_X, SILL_Y - SILL_H * 0.5, SILL_Z);
  sillBoard.castShadow    = true;
  sillBoard.receiveShadow = true;
  win.add(sillBoard);

  
  const sillFascia = new THREE.Mesh(new THREE.BoxGeometry(SILL_W + 0.008, SILL_H * 0.35, 0.012), windowWood);
  sillFascia.position.set(WIN_X, SILL_Y - SILL_H * 0.5, WALL_Z + SILL_PROJ + 0.001);
  sillFascia.castShadow    = true;
  sillFascia.receiveShadow = true;
  win.add(sillFascia);

  
  const archZ      = WALL_Z + ARCH_OFFSET + ARCH_T * 0.5;
  const archZStile = archZ + 0.0005;  
  const archTotalW = WIN_W + FRAME_T * 2;
  const archTotalH = WIN_H + FRAME_T * 2;

  function archrave(w, h, x, y, z = archZ) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, ARCH_T), windowWood);
    m.position.set(x, y, z);
    m.castShadow    = true;
    m.receiveShadow = true;
    win.add(m);
  }

  archrave(archTotalW + ARCH_W * 2, ARCH_W,         WIN_X,                        oT + FRAME_T + ARCH_W * 0.5);  
  archrave(archTotalW + ARCH_W * 2, ARCH_W,         WIN_X,                        oB - FRAME_T - ARCH_W * 0.5);  
  archrave(ARCH_W, archTotalH + ARCH_W * 2,         oL - FRAME_T - ARCH_W * 0.5, WIN_Y, archZStile);             
  archrave(ARCH_W, archTotalH + ARCH_W * 2,         oR + FRAME_T + ARCH_W * 0.5, WIN_Y, archZStile);             

  scene.add(win);
  return win;
}

function createWindowBackground(scene) {
  const BG_Z = -5.0;   
  const BG_W = 8.0;    
  const BG_H = 6.0;    

  
  const loader  = new THREE.TextureLoader(loadingManager);
  const texture = loader.load(
    WINDOW_BACKGROUND,
    (tex) => {
      
      
      tex.encoding = THREE.sRGBEncoding;
      tex.wrapS    = THREE.ClampToEdgeWrapping;
      tex.wrapT    = THREE.ClampToEdgeWrapping;

      const imgW   = tex.image.naturalWidth  || tex.image.width  || 1;
      const imgH   = tex.image.naturalHeight || tex.image.height || 1;
      const imageAR = imgW / imgH;
      const planeAR = BG_W / BG_H;

      if (imageAR > planeAR) {
        
        const rx = planeAR / imageAR;
        tex.repeat.set(rx, 1);
        tex.offset.set((1 - rx) * 0.5, 0);
      } else {
        
        const ry = imageAR / planeAR;
        tex.repeat.set(1, ry);
        tex.offset.set(0, (1 - ry) * 0.5);
      }
      tex.needsUpdate = true;
    },
    undefined,
    (err) => console.warn('[WindowBackground] Could not load', WINDOW_BACKGROUND, err)
  );

  const mat = new THREE.MeshBasicMaterial({
    map:         texture,
    toneMapped:  false,   
    transparent: false,
    depthWrite:  false,   
    side:        THREE.FrontSide,
  });

  const geo  = new THREE.PlaneGeometry(BG_W, BG_H);
  const mesh = new THREE.Mesh(geo, mat);

  
  mesh.position.set(WIN_X - 1.5, WIN_Y + 1.2, BG_Z);

  mesh.renderOrder   = -1;    
  mesh.castShadow    = false;
  mesh.receiveShadow = false;
  mesh.name          = 'WindowBackground';

  scene.add(mesh);
  return mesh;
}

function buildRainSystem(scene) {

  
  const RAIN_COUNT     = 2500;    

  
  
  const SPAWN_X_MIN    = -3.8;   
  const SPAWN_X_MAX    =  1.5;   
  const SPAWN_Y_TOP    =  3.0;   
  const SPAWN_Y_FLOOR  =  0.4;   
  const SPAWN_Z_NEAR   = -0.68;  
  const SPAWN_Z_FAR    = -4.50;  

  
  const DROP_LENGTH    =  0.10;  
  const FALL_SPEED_MIN =  1.2;   
  const FALL_SPEED_MAX =  2.8;   
  const WIND_X         = -0.06;  
  const RAIN_COLOR     = 0xadd8ff; 
  const RAIN_OPACITY   = 0.40;

  
  const positions  = new Float32Array(RAIN_COUNT * 6); 
  const velocities = new Float32Array(RAIN_COUNT);     

  for (let i = 0; i < RAIN_COUNT; i++) {
    const x = SPAWN_X_MIN + Math.random() * (SPAWN_X_MAX - SPAWN_X_MIN);
    const y = SPAWN_Y_FLOOR + Math.random() * (SPAWN_Y_TOP - SPAWN_Y_FLOOR);
    const z = SPAWN_Z_FAR + Math.random() * (SPAWN_Z_NEAR - SPAWN_Z_FAR);
    velocities[i] = FALL_SPEED_MIN + Math.random() * (FALL_SPEED_MAX - FALL_SPEED_MIN);

    
    positions[i * 6 + 0] = x;
    positions[i * 6 + 1] = y;
    positions[i * 6 + 2] = z;
    
    positions[i * 6 + 3] = x + WIND_X * 0.04;
    positions[i * 6 + 4] = y - DROP_LENGTH;
    positions[i * 6 + 5] = z;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  
  
  
  const mat = new THREE.LineBasicMaterial({
    color:      RAIN_COLOR,
    transparent: true,
    opacity:    RAIN_OPACITY,
    depthWrite: false,
  });

  const rain = new THREE.LineSegments(geo, mat);
  rain.name = 'OutdoorRain';
  
  
  rain.frustumCulled = false;
  scene.add(rain);

  
  
  
  function update(delta) {
    const pos = positions;

    for (let i = 0; i < RAIN_COUNT; i++) {
      const fall = velocities[i] * delta;

      
      pos[i * 6 + 0] += WIND_X * delta;
      pos[i * 6 + 1] -= fall;
      
      pos[i * 6 + 3] += WIND_X * delta;
      pos[i * 6 + 4] -= fall;

      
      
      if (pos[i * 6 + 1] < SPAWN_Y_FLOOR) {
        const nx = SPAWN_X_MIN + Math.random() * (SPAWN_X_MAX - SPAWN_X_MIN);
        const nz = SPAWN_Z_FAR + Math.random() * (SPAWN_Z_NEAR - SPAWN_Z_FAR);
        
        
        const ny = SPAWN_Y_TOP - Math.random() * (SPAWN_Y_TOP - SPAWN_Y_FLOOR) * 0.35;

        pos[i * 6 + 0] = nx;
        pos[i * 6 + 1] = ny;
        pos[i * 6 + 2] = nz;
        pos[i * 6 + 3] = nx + WIND_X * 0.04;
        pos[i * 6 + 4] = ny - DROP_LENGTH;
        pos[i * 6 + 5] = nz;

        
        velocities[i] = FALL_SPEED_MIN + Math.random() * (FALL_SPEED_MAX - FALL_SPEED_MIN);
      }
    }

    
    geo.attributes.position.needsUpdate = true;
  }

  return { rain, update };
}

buildFloor(scene);
buildDeskModel(scene);
buildWallModel(scene);
buildWindow(scene);
buildFlowerFrame(scene);

buildWallPicture(scene);
buildPictureFrame(scene);

buildWindowPlant(scene, {
  targetH:      PLANT_W_TARGET_H,
  visibleRatio: PLANT_W_VISIBLE_RATIO,
  x:            PLANT_W_X + PLANT_GROUP_X_SHIFT,
  rotationY:    PLANT_W_ROTATION_Y,
  zOffset:      PLANT_W_Z_OFFSET + PLANT_GROUP_Z_SHIFT,
  yLift:        PLANT_GROUP_Y_SHIFT,
  label:        'WindowPlant',
});
buildWindowPlant(scene, {
  targetH:      PLANT_W2_TARGET_H,
  visibleRatio: PLANT_W2_VISIBLE_RATIO,
  x:            PLANT_W2_X + PLANT_GROUP_X_SHIFT,
  rotationY:    PLANT_W2_ROTATION_Y,
  zOffset:      PLANT_W2_Z_OFFSET + PLANT_GROUP_Z_SHIFT,
  yLift:        PLANT_W2_Y_LIFT + PLANT_GROUP_Y_SHIFT,
  label:        'WindowPlant2',
});
createWindowBackground(scene);

rainSystem = buildRainSystem(scene);

const BOOK_BREATH_PERIOD    = 3.75;  
const BOOK_BREATH_AMPLITUDE = 0.01;  

const SHELF_LIGHT_SWEEP_DURATION     = 3.5;  
const SHELF_LIGHT_SWEEP_PERIOD       = 7.0;  
const SHELF_LIGHT_SWEEP_HEIGHT       = 0.24; 
const SHELF_LIGHT_SWEEP_PEAK_OPACITY = 0.28; 

const DUST_PARTICLE_COUNT  = 10;
const DUST_DRIFT_AMPLITUDE = 0.028; 
const DUST_FADE_PERIOD_MIN = 3.0;   
const DUST_FADE_PERIOD_MAX = 4.5;
const DUST_MAX_OPACITY     = 0.65;
const DUST_SIZE            = 0.02;  

const SPARKLE_INTERVAL_SEC = 3.5;  
const SPARKLE_MIN_COUNT    = 3;
const SPARKLE_MAX_COUNT    = 6;
const SPARKLE_LIFETIME_MIN = 0.6;  
const SPARKLE_LIFETIME_MAX = 0.8;
const SPARKLE_SIZE         = isMobileDevice ? 0.034 * 0.55 : 0.034;
const SPARKLE_PEAK_OPACITY = isMobileDevice ? 0.55 : 1;

function makeGlowSpriteTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0,    'rgba(255,255,255,1)');
  grad.addColorStop(0.4,  'rgba(255,255,255,0.55)');
  grad.addColorStop(1,    'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
const glowSpriteTexture = makeGlowSpriteTexture();

function makeGlowSprite(colorHex, size, opacity) {
  const material = new THREE.SpriteMaterial({
    map: glowSpriteTexture,
    color: colorHex,
    transparent: true,
    opacity: opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.setScalar(size);
  return sprite;
}

function updateBookBreathing(t) {
  const deskBook = window.__vintageBookDeskGroup;
  if (!deskBook || !deskBook.visible) return;
  
  const cycle = (Math.sin((t / BOOK_BREATH_PERIOD) * Math.PI * 2 - Math.PI / 2) + 1) / 2;
  deskBook.scale.setScalar(1 + cycle * BOOK_BREATH_AMPLITUDE);
}

let shelfLightBeam = null;
function initShelfLightBeam() {
  const geo = new THREE.PlaneGeometry(0.065, 0.14);
  const mat = new THREE.MeshBasicMaterial({
    map: glowSpriteTexture,
    color: 0xfff0d2,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.NormalBlending, 
    side: THREE.DoubleSide,
  });
  shelfLightBeam = new THREE.Mesh(geo, mat);
  shelfLightBeam.position.set(
    BOOK_SHELF_TRANSFORM.position.x,
    BOOK_SHELF_TRANSFORM.position.y,
    BOOK_SHELF_TRANSFORM.position.z + 0.02  
  );
  shelfLightBeam.visible = false;
  scene.add(shelfLightBeam);
}
function updateShelfLightBeam(t) {
  const shelfBook = window.__vintageBookShelfGroup;
  if (!shelfBook || !shelfBook.visible) {
    if (shelfLightBeam) shelfLightBeam.visible = false;
    return;
  }
  if (!shelfLightBeam) initShelfLightBeam();

  const phase = t % SHELF_LIGHT_SWEEP_PERIOD;
  if (phase > SHELF_LIGHT_SWEEP_DURATION) {
    shelfLightBeam.visible = false;
    return;
  }
  const progress = phase / SHELF_LIGHT_SWEEP_DURATION;
  shelfLightBeam.visible = true;
  shelfLightBeam.position.y =
    BOOK_SHELF_TRANSFORM.position.y - SHELF_LIGHT_SWEEP_HEIGHT / 2 + progress * SHELF_LIGHT_SWEEP_HEIGHT;
  
  shelfLightBeam.material.opacity = Math.sin(progress * Math.PI) * SHELF_LIGHT_SWEEP_PEAK_OPACITY;
}

let dustParticlesInitialized = false;
const dustParticles = [];
function initDustParticles() {
  const frameGroup = scene.getObjectByName('DeskPictureFrame');
  if (!frameGroup || frameGroup.children.length === 0) return;

  const box    = new THREE.Box3().setFromObject(frameGroup);
  const size   = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  for (let i = 0; i < DUST_PARTICLE_COUNT; i++) {
    const sprite = makeGlowSprite(0xf3d9a6, DUST_SIZE, 0);
    const basePos = new THREE.Vector3(
      center.x + (Math.random() - 0.5) * size.x * 1.4,
      center.y + (Math.random() - 0.5) * size.y * 1.4,
      center.z + (Math.random() - 0.5) * 0.04 + 0.02
    );
    sprite.position.copy(basePos);
    scene.add(sprite);
    dustParticles.push({
      sprite,
      basePos,
      phase:      Math.random() * Math.PI * 2,
      driftSeedX: Math.random() * Math.PI * 2,
      driftSeedY: Math.random() * Math.PI * 2,
      fadePeriod: DUST_FADE_PERIOD_MIN + Math.random() * (DUST_FADE_PERIOD_MAX - DUST_FADE_PERIOD_MIN),
    });
  }
  dustParticlesInitialized = true;
}
function updateDustParticles(t) {
  if (!dustParticlesInitialized) { initDustParticles(); return; }
  dustParticles.forEach((p) => {
    p.sprite.position.x = p.basePos.x + Math.sin(t * 0.35 + p.driftSeedX) * DUST_DRIFT_AMPLITUDE;
    p.sprite.position.y = p.basePos.y + Math.sin(t * 0.28 + p.driftSeedY) * DUST_DRIFT_AMPLITUDE * 0.8;
    const cycle = (Math.sin((t / p.fadePeriod) * Math.PI * 2 + p.phase) + 1) / 2;
    p.sprite.material.opacity = cycle * DUST_MAX_OPACITY;
  });
}

let musicSparkleTimer = 0;
const activeSparkles = [];
function spawnMusicSparkles() {
  const musicGroup = scene.getObjectByName('MusicPlayer');
  if (!musicGroup || musicGroup.children.length === 0) return;

  const box    = new THREE.Box3().setFromObject(musicGroup);
  const size   = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const count = SPARKLE_MIN_COUNT + Math.floor(Math.random() * (SPARKLE_MAX_COUNT - SPARKLE_MIN_COUNT + 1));
  for (let i = 0; i < count; i++) {
    const sprite = makeGlowSprite(0xffcf6b, SPARKLE_SIZE * 0.6, 0);
    
    
    sprite.position.set(
      box.min.x + Math.random() * size.x,
      box.min.y + Math.random() * size.y,
      box.min.z + Math.random() * size.z
    );
    scene.add(sprite);
    activeSparkles.push({
      sprite,
      startTime: performance.now() / 1000,
      duration:  SPARKLE_LIFETIME_MIN + Math.random() * (SPARKLE_LIFETIME_MAX - SPARKLE_LIFETIME_MIN),
    });
  }
}
function updateMusicSparkles(delta, now) {
  musicSparkleTimer += delta;
  if (musicSparkleTimer >= SPARKLE_INTERVAL_SEC) {
    musicSparkleTimer = 0;
    spawnMusicSparkles();
  }

  for (let i = activeSparkles.length - 1; i >= 0; i--) {
    const s   = activeSparkles[i];
    const age = now - s.startTime;
    const life = age / s.duration;
    if (life >= 1) {
      scene.remove(s.sprite);
      s.sprite.material.dispose();
      activeSparkles.splice(i, 1);
      continue;
    }
    
    const opacity = Math.sin(Math.min(life, 1) * Math.PI) * SPARKLE_PEAK_OPACITY;
    s.sprite.material.opacity = opacity;
    s.sprite.scale.setScalar(SPARKLE_SIZE * (0.6 + life * 0.6));
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;

  if (isMobileDevice) {
    const { z, fov } = computeMobileCam(camera.aspect);
    CAM_BASE.z = z;
    camera.fov = fov;
    if (frameZoomProgress === 0 && !frameZoomActive) {
      camera.position.set(CAM_BASE.x, CAM_BASE.y, CAM_BASE.z);
    }
  }

  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  if (bokehPass.uniforms.aspect) bokehPass.uniforms.aspect.value = camera.aspect;
});
window.addEventListener('orientationchange', () => {
  
  setTimeout(() => window.dispatchEvent(new Event('resize')), 250);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();   
  const t     = clock.elapsedTime;

  mixers.forEach((mixer) => mixer.update(delta));

  
  if (rainSystem) rainSystem.update(delta);

  
  
  updateBookBreathing(t);
  updateShelfLightBeam(t);
  updateDustParticles(t);
  updateMusicSparkles(delta, t);

  const breathY = Math.sin(t * 1.55) * 0.004 + Math.sin(t * 0.97) * 0.002;
  const breathZ = Math.sin(t * 1.55 + 0.8) * 0.003;
  const baseX = CAM_BASE.x, baseY = CAM_BASE.y + breathY, baseZ = CAM_BASE.z + breathZ;

  if (frameZoomTarget) {
    const zoomStep = delta / FRAME_ZOOM_DURATION;
    frameZoomProgress = THREE.MathUtils.clamp(
      frameZoomProgress + (frameZoomActive ? zoomStep : -zoomStep),
      0,
      1
    );
    const ease = frameZoomProgress * frameZoomProgress * (3 - 2 * frameZoomProgress); 

    camera.position.set(
      THREE.MathUtils.lerp(baseX, frameZoomTarget.position.x, ease),
      THREE.MathUtils.lerp(baseY, frameZoomTarget.position.y, ease),
      THREE.MathUtils.lerp(baseZ, frameZoomTarget.position.z, ease)
    );
    camera.lookAt(
      THREE.MathUtils.lerp(CAM_LOOK.x, frameZoomTarget.lookAt.x, ease),
      THREE.MathUtils.lerp(CAM_LOOK.y, frameZoomTarget.lookAt.y, ease),
      THREE.MathUtils.lerp(CAM_LOOK.z, frameZoomTarget.lookAt.z, ease)
    );

    if (frameZoomProgress === 0) frameZoomTarget = null; 
  } else {
    camera.position.set(baseX, baseY, baseZ);
    camera.lookAt(CAM_LOOK);
  }

  renderer.render(scene, camera);
}
animate();

function initPictureFrameZoom() {
  if (!window.__sceneRefs) { requestAnimationFrame(initPictureFrameZoom); return; }
  const { scene, camera, renderer } = window.__sceneRefs;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const sceneWrapEl = document.getElementById('scene-wrap');

  function setPointer(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  renderer.domElement.addEventListener('click', (e) => {
    const musicOverlay = document.getElementById('music-player-overlay');
    const bookOverlayEl = document.getElementById('book-overlay');
    if (musicOverlay && musicOverlay.classList.contains('active')) return;
    if (bookOverlayEl && bookOverlayEl.classList.contains('active')) return;

    const frameGroup = scene.getObjectByName('DeskPictureFrame');
    if (!frameGroup || frameGroup.children.length === 0) return;

    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(frameGroup, true);

    if (frameZoomActive) {
      
      frameZoomActive = false;
      document.getElementById('frame-blur-overlay').classList.remove('active');
      return;
    }

    if (hits.length === 0) return;

    const box = new THREE.Box3().setFromObject(frameGroup);
    const center = box.getCenter(new THREE.Vector3());
    const dir = new THREE.Vector3().subVectors(center, CAM_BASE).normalize();
    const zoomPos = center.clone().addScaledVector(dir, -FRAME_ZOOM_STANDOFF);

    frameZoomTarget = { position: zoomPos, lookAt: center };
    frameZoomActive = true;
    document.getElementById('frame-blur-overlay').classList.add('active');
  });

  renderer.domElement.addEventListener('pointermove', (e) => {
    const frameGroup = scene.getObjectByName('DeskPictureFrame');
    if (!frameGroup || frameGroup.children.length === 0) return;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(frameGroup, true);
    sceneWrapEl.classList.toggle('frame-hoverable', hits.length > 0);
  });
}
initPictureFrameZoom();

(function initRainAudio() {
  const rainAudio = new Audio('./audio/rain-in-the-forest.wav');
  rainAudio.loop   = true;
  rainAudio.volume = 0.35;  

  function startAudio() {
    rainAudio.play().catch(() => {});
  }

  const autoplayPromise = rainAudio.play();
  if (autoplayPromise !== undefined) {
    autoplayPromise.catch(() => {
      const EVENTS = ['pointerdown', 'keydown', 'touchstart'];
      EVENTS.forEach(evt =>
        window.addEventListener(evt, startAudio, { once: true, passive: true })
      );
    });
  }
})();

/* ---- Gramophone / music player interaction ---- */
import * as THREE_MP from 'three';

const PLAYLIST = [
  { title: 'Golden Brown',         url: './audio/golden-brown.mp3' },
  { title: 'Valentine',            url: './audio/valentine.mp3' },
  { title: 'Light Shower',         url: './audio/light-shower.mp3' },
  { title: 'Beautiful Torment',    url: './audio/beautiful-torment.mp3' },
  { title: 'Wiege',                url: './audio/wiege.mp3' },
  { title: 'Return to Versailles', url: './audio/return-to-versailles.mp3' },
  { title: 'Clair de Lune',        url: './audio/clair-de-lune.mp3' },
];

class MusicPlayerUI {
  constructor(playlist) {
    this.playlist = playlist;
    this.currentIndex = 0;
    this.isPlaying = false;
    this.audio = new Audio();

    this.mockTime = 0;
    this.mockDuration = 210;
    this.mockTimer = null;

    this.overlay = document.getElementById('music-player-overlay');
    this.sceneWrap = document.getElementById('scene-wrap');
    this.bindEvents();
    this.renderPlaylist();
    this.loadTrack(0, false);
  }

  open() {
    this.overlay.classList.add('active');
    this.sceneWrap.classList.add('scene-blurred');
  }

  close() {
    this.overlay.classList.remove('active');
    this.sceneWrap.classList.remove('scene-blurred');
  }

  toggle() {
    if (this.overlay.classList.contains('active')) this.close();
    else this.open();
  }

  bindEvents() {
    this.overlay.addEventListener('mousedown', (e) => {
      if (e.target === this.overlay) this.close();
    });
    document.getElementById('mp-close-btn').addEventListener('click', () => this.close());
    document.getElementById('mp-play-btn').addEventListener('click', () => this.togglePlay());
    document.getElementById('mp-prev-btn').addEventListener('click', () => this.prevTrack());
    document.getElementById('mp-next-btn').addEventListener('click', () => this.nextTrack());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('active')) this.close();
    });

    const prog = document.getElementById('mp-progress');
    prog.addEventListener('mousedown', (e) => {
      const rect = prog.getBoundingClientRect();
      let percent = (e.clientX - rect.left) / rect.width;
      percent = Math.max(0, Math.min(1, percent));
      this.seek(percent);
    });

    this.audio.addEventListener('timeupdate', () => {
      if (!this.audio.src) return;
      this.updateProgress(this.audio.currentTime / this.audio.duration, this.audio.currentTime, this.audio.duration);
    });
    this.audio.addEventListener('ended', () => this.nextTrack());
    this.audio.addEventListener('loadedmetadata', () => {
      document.getElementById('mp-time-total').textContent = this.formatTime(this.audio.duration);
    });
    this.audio.addEventListener('error', () => {
      if (this.isPlaying) this.startMockTimer();
    });
  }

  renderPlaylist() {
    const ul = document.getElementById('mp-playlist-ul');
    ul.innerHTML = '';
    this.playlist.forEach((track, index) => {
      const li = document.createElement('li');
      li.className = `mp-song ${index === this.currentIndex ? 'active' : ''}`;
      li.innerHTML = `
        <div class="mp-song-left">
          <span class="mp-song-num">${index + 1}</span>
          <span class="mp-song-title">${track.title}</span>
        </div>
        <div class="mp-eq" style="display:${index === this.currentIndex && this.isPlaying ? 'flex' : 'none'}">
          <span></span><span></span><span></span>
        </div>
      `;
      li.addEventListener('click', () => this.loadTrack(index, true));
      ul.appendChild(li);
    });
  }

  updatePlaylistUI() {
    const items = document.querySelectorAll('.mp-song');
    items.forEach((item, index) => {
      const eq = item.querySelector('.mp-eq');
      if (index === this.currentIndex) {
        item.classList.add('active');
        eq.style.display = this.isPlaying ? 'flex' : 'none';
      } else {
        item.classList.remove('active');
        eq.style.display = 'none';
      }
    });
  }

  loadTrack(index, playNow) {
    if (index < 0) index = this.playlist.length - 1;
    if (index >= this.playlist.length) index = 0;
    this.currentIndex = index;

    const track = this.playlist[this.currentIndex];
    document.getElementById('mp-current-title').textContent = track.title;

    this.stopMockTimer();
    this.mockTime = 0;
    this.updateProgress(0, 0, this.mockDuration);

    if (track.url) {
      this.audio.src = track.url;
      if (playNow) {
        this.audio.play().then(() => {
          this.isPlaying = true;
          this.updatePlayPauseUI();
        }).catch(() => this.fallbackPlay(playNow));
      }
    } else {
      this.audio.removeAttribute('src');
      if (playNow) this.fallbackPlay(playNow);
    }

    if (!playNow) {
      this.isPlaying = false;
      this.updatePlayPauseUI();
    } else {
      this.renderPlaylist();
    }
  }

  fallbackPlay(playNow) {
    if (!playNow) return;
    this.isPlaying = true;
    this.updatePlayPauseUI();
    this.startMockTimer();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.isPlaying = false;
      if (this.audio.src) this.audio.pause();
      this.stopMockTimer();
    } else {
      this.isPlaying = true;
      if (this.audio.src) {
        this.audio.play().catch(() => this.startMockTimer());
      } else {
        this.startMockTimer();
      }
    }
    this.updatePlayPauseUI();
  }

  nextTrack() { this.loadTrack(this.currentIndex + 1, true); }
  prevTrack() { this.loadTrack(this.currentIndex - 1, true); }

  seek(percent) {
    if (this.audio.src && this.audio.readyState > 0) {
      this.audio.currentTime = percent * this.audio.duration;
    } else {
      this.mockTime = percent * this.mockDuration;
      this.updateProgress(percent, this.mockTime, this.mockDuration);
    }
  }

  startMockTimer() {
    this.stopMockTimer();
    document.getElementById('mp-time-total').textContent = this.formatTime(this.mockDuration);
    this.mockTimer = setInterval(() => {
      this.mockTime += 1;
      if (this.mockTime >= this.mockDuration) {
        this.nextTrack();
      } else {
        this.updateProgress(this.mockTime / this.mockDuration, this.mockTime, this.mockDuration);
      }
    }, 1000);
  }

  stopMockTimer() {
    if (this.mockTimer) { clearInterval(this.mockTimer); this.mockTimer = null; }
  }

  updatePlayPauseUI() {
    const playIcon = document.getElementById('mp-play-icon');
    const pauseIcon = document.getElementById('mp-pause-icon');
    const disk = document.getElementById('mp-disk');
    if (this.isPlaying) {
      playIcon.style.display = 'none';
      pauseIcon.style.display = '';
      disk.classList.add('playing');
    } else {
      playIcon.style.display = '';
      pauseIcon.style.display = 'none';
      disk.classList.remove('playing');
    }
    this.updatePlaylistUI();
  }

  updateProgress(percent, currentTime, totalTime) {
    if (isNaN(percent)) percent = 0;
    document.getElementById('mp-progress-bar').style.width = `${percent * 100}%`;
    document.getElementById('mp-time-current').textContent = this.formatTime(currentTime);
    if (totalTime) document.getElementById('mp-time-total').textContent = this.formatTime(totalTime);
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }
}

const musicPlayerUI = new MusicPlayerUI(PLAYLIST);

function startInitialPlayback() {
  const track = musicPlayerUI.playlist[0];
  document.getElementById('mp-current-title').textContent = track.title;
  musicPlayerUI.audio.src = track.url;

  function beginPlayback() {
    musicPlayerUI.audio.play().then(() => {
      musicPlayerUI.isPlaying = true;
      musicPlayerUI.updatePlayPauseUI();
    }).catch(() => {
      const EVENTS = ['pointerdown', 'keydown', 'touchstart'];
      EVENTS.forEach(evt =>
        window.addEventListener(evt, beginPlayback, { once: true, passive: true })
      );
    });
  }
  beginPlayback();
}

if (document.getElementById('loading-screen').classList.contains('hidden')) {
  startInitialPlayback();
} else {
  window.addEventListener('scene-loaded', startInitialPlayback, { once: true });
}

function initGramophoneInteraction() {
  if (!window.__sceneRefs) { requestAnimationFrame(initGramophoneInteraction); return; }
  const { scene, camera, renderer } = window.__sceneRefs;

  const raycaster = new THREE_MP.Raycaster();
  const pointer = new THREE_MP.Vector2();
  const sceneWrap = document.getElementById('scene-wrap');

  function getMusicGroup() {
    return scene.getObjectByName('MusicPlayer');
  }

  function setPointer(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  renderer.domElement.addEventListener('click', (e) => {
    const musicGroup = getMusicGroup();
    if (!musicGroup || musicGroup.children.length === 0) return;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(musicGroup, true);
    if (hits.length > 0) {
      musicPlayerUI.open();
    }
  });

  renderer.domElement.addEventListener('pointermove', (e) => {
    const musicGroup = getMusicGroup();
    if (!musicGroup || musicGroup.children.length === 0) return;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(musicGroup, true);
    sceneWrap.classList.toggle('mp-hoverable', hits.length > 0);
  });
}
initGramophoneInteraction();

/* ---- Embedded interactive book HTML (base64) ---- */
window.BOOK_HTML_B64 = "PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CjxtZXRhIGNoYXJzZXQ9IlVURi04IiAvPgo8bWV0YSBuYW1lPSJ2aWV3cG9ydCIgY29udGVudD0id2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMCIgLz4KPHRpdGxlPkludGVyYWN0aXZlIDNEIEJvb2s8L3RpdGxlPgo8bGluayBocmVmPSJodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tL2NzczI/ZmFtaWx5PUNvcm1vcmFudCtHYXJhbW9uZDp3Z2h0QDMwMDs0MDA7NjAwOzcwMCZmYW1pbHk9RUIrR2FyYW1vbmQ6d2dodEA0MDA7NjAwJmZhbWlseT1QbGF5ZmFpcitEaXNwbGF5Oml0YWwsd2dodEAwLDQwMDswLDYwMDsxLDQwMCZmYW1pbHk9RGFuY2luZytTY3JpcHQ6d2dodEA1MDAmZGlzcGxheT1zd2FwIiByZWw9InN0eWxlc2hlZXQiPgo8c2NyaXB0IHR5cGU9ImltcG9ydG1hcCI+CnsKICAiaW1wb3J0cyI6IHsKICAgICJ0aHJlZSI6ICJodHRwczovL3VucGtnLmNvbS90aHJlZUAwLjEyOC4wL2J1aWxkL3RocmVlLm1vZHVsZS5qcyIsCiAgICAidGhyZWUvYWRkb25zLyI6ICJodHRwczovL3VucGtnLmNvbS90aHJlZUAwLjEyOC4wL2V4YW1wbGVzL2pzbS8iCiAgfQp9Cjwvc2NyaXB0Pgo8c3R5bGU+CiogeyBib3gtc2l6aW5nOiBib3JkZXItYm94OyBtYXJnaW46IDA7IHBhZGRpbmc6IDA7IH0KCmJvZHkgewogIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50OwogIGhlaWdodDogMTAwdmg7CiAgZGlzcGxheTogZmxleDsKICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsKICBhbGlnbi1pdGVtczogY2VudGVyOwogIGZvbnQtZmFtaWx5OiAnR2VvcmdpYScsIHNlcmlmOwogIG92ZXJmbG93OiBoaWRkZW47CiAgLXdlYmtpdC1mb250LXNtb290aGluZzogYW50aWFsaWFzZWQ7Cn0KCi5zY2VuZSB7CiAgd2lkdGg6IDEwMHZ3OwogIGhlaWdodDogMTAwdmg7CiAgZGlzcGxheTogZmxleDsKICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsKICBhbGlnbi1pdGVtczogY2VudGVyOwogIHBlcnNwZWN0aXZlOiAyMDAwcHg7Cn0KCi5ib29rLWhvdmVyIHsKICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gMC42cyBjdWJpYy1iZXppZXIoMC4yNSwgMSwgMC41LCAxKTsKICB0cmFuc2Zvcm0tc3R5bGU6IHByZXNlcnZlLTNkOwp9CgouYm9vay1ob3Zlcjpob3ZlciB7CiAgdHJhbnNmb3JtOiByb3RhdGVYKDEwZGVnKSByb3RhdGVZKDBkZWcpIHJvdGF0ZVooLTJkZWcpIHNjYWxlM2QoMS4wNSwgMS4wNSwgMS4wNSk7Cn0KCi5ib29rLXdyYXAgewogIHBvc2l0aW9uOiByZWxhdGl2ZTsKICB3aWR0aDogMDsKICBoZWlnaHQ6IDY3NXB4OwogIHRyYW5zZm9ybS1zdHlsZTogcHJlc2VydmUtM2Q7CiAgdHJhbnNmb3JtOiByb3RhdGVYKDI1ZGVnKSByb3RhdGVZKDBkZWcpIHJvdGF0ZVooLTVkZWcpOwp9CgpAbWVkaWEgKG1heC13aWR0aDogOTAwcHgpLCAobWF4LWhlaWdodDogNTIwcHgpIHsKICAuc2NlbmUgewogICAgcGVyc3BlY3RpdmU6IDI2MDBweDsKICB9CiAgLmJvb2std3JhcCB7CiAgICB0cmFuc2Zvcm06IHNjYWxlKDAuNTUpIHJvdGF0ZVgoMjVkZWcpIHJvdGF0ZVkoMGRlZykgcm90YXRlWigtNWRlZyk7CiAgfQp9CgoudGFibGUtc2hhZG93IHsKICBwb3NpdGlvbjogYWJzb2x1dGU7CiAgd2lkdGg6IDk3NXB4OwogIGhlaWdodDogNzUwcHg7CiAgYmFja2dyb3VuZDogcmdiYSgwLDAsMCwwLjYpOwogIHRvcDogLTM3LjVweDsKICBsZWZ0OiAtNDg3LjVweDsKICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVooLTM3LjVweCk7CiAgZmlsdGVyOiBibHVyKDM3LjVweCk7CiAgYm9yZGVyLXJhZGl1czogMTVweDsKICBwb2ludGVyLWV2ZW50czogbm9uZTsKfQoKLnNwaW5lIHsKICBwb3NpdGlvbjogYWJzb2x1dGU7CiAgd2lkdGg6IDYwcHg7CiAgaGVpZ2h0OiA3MTVweDsKICBsZWZ0OiAtMzBweDsKICB0b3A6IC0yMHB4OwogIGJhY2tncm91bmQtaW1hZ2U6IHVybCgiaW1hZ2VzXFxzcGluZS5qZmlmIik7IGJhY2tncm91bmQtc2l6ZTogY292ZXI7IGJhY2tncm91bmQtcG9zaXRpb246IGNlbnRlcjsgYmFja2dyb3VuZC1jb2xvcjogIzJhMGUwYzsKICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVooLTIyLjVweCk7CiAgYm94LXNoYWRvdzogaW5zZXQgMCAwIDE1cHggcmdiYSgwLDAsMCwwLjgpOwogIGJvcmRlci1yYWRpdXM6IDZweDsKfQoKLmNvdmVyIHsKICBwb3NpdGlvbjogYWJzb2x1dGU7CiAgd2lkdGg6IDQ1MHB4OwogIGhlaWdodDogNzE1cHg7CiAgdG9wOiAtMjBweDsKICBiYWNrZ3JvdW5kLWltYWdlOiB1cmwoImltYWdlc1xcY292ZXIuamZpZiIpOwogIGJhY2tncm91bmQtc2l6ZTogY292ZXI7CiAgYmFja2dyb3VuZC1wb3NpdGlvbjogY2VudGVyOwogIGJhY2tncm91bmQtY29sb3I6ICMzYTE0MTA7CiAgdHJhbnNmb3JtLW9yaWdpbjogMCUgNTAlOwp9CgouY292ZXIuYmFjayB7CiAgbGVmdDogMzBweDsKICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVooLTIyLjVweCkgcm90YXRlWSgtMTJkZWcpOwogIGJvcmRlci1yYWRpdXM6IDZweCAxOHB4IDE4cHggNnB4OwogIGJveC1zaGFkb3c6IGluc2V0IDZweCAtNnB4IDZweCAxLjVweCAjNmIxYTFhLCBpbnNldCAxMC41cHggLTEwLjVweCA2cHggMCAjMmEwYTBhLCAxNXB4IDE1cHggMzBweCByZ2JhKDAsMCwwLDAuNCk7Cn0KCi5jb3Zlci5mcm9udCB7CiAgbGVmdDogLTMwcHg7CiAgdHJhbnNmb3JtOiB0cmFuc2xhdGVaKC0yMi41cHgpIHJvdGF0ZVkoLTE2OGRlZyk7CiAgYm9yZGVyLXJhZGl1czogMThweCA2cHggNnB4IDE4cHg7CiAgYm94LXNoYWRvdzogaW5zZXQgLTZweCAtNnB4IDZweCAxLjVweCAjNmIxYTFhLCBpbnNldCAtMTAuNXB4IC0xMC41cHggNnB4IDAgIzJhMGEwYSwgLTE1cHggMTVweCAzMHB4IHJnYmEoMCwwLDAsMC40KTsKfQoKCi5wYWdlIHsKICBwb3NpdGlvbjogYWJzb2x1dGU7CiAgd2lkdGg6IDQzNXB4OwogIGhlaWdodDogNjc1cHg7CiAgbGVmdDogMDsKICB0b3A6IDA7CiAgdHJhbnNmb3JtLW9yaWdpbjogMCUgNTAlOwogIHRyYW5zZm9ybS1zdHlsZTogcHJlc2VydmUtM2Q7CiAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDEuMnMgY3ViaWMtYmV6aWVyKDAuNCwgMC4wLCAwLjIsIDEpOwogIGN1cnNvcjogcG9pbnRlcjsKfQoKCi5wYWdlLmR1bW15IHsKICB3aWR0aDogNDM5cHg7ICAgCiAgaGVpZ2h0OiA2NzhweDsgIAogIHRvcDogLTEuNXB4OyAgICAKfQoKLmZhY2UgewogIHBvc2l0aW9uOiBhYnNvbHV0ZTsKICB3aWR0aDogMTAwJTsKICBoZWlnaHQ6IDEwMCU7CiAgYmFja2ZhY2UtdmlzaWJpbGl0eTogaGlkZGVuOwogIGJhY2tncm91bmQ6ICNmZGZiZjc7CiAgb3ZlcmZsb3c6IGhpZGRlbjsKfQoKLmZhY2UuZnJvbnQgewogIHRyYW5zZm9ybTogdHJhbnNsYXRlWigxLjVweCk7CiAgYm9yZGVyLXJhZGl1czogM3B4IDEycHggMTJweCAzcHg7Cn0KCi5mYWNlLmJhY2sgewogIHRyYW5zZm9ybTogcm90YXRlWSgxODBkZWcpIHRyYW5zbGF0ZVooMS41cHgpOwogIGJvcmRlci1yYWRpdXM6IDEycHggM3B4IDNweCAxMnB4Owp9CgouZmFjZS5mcm9udDo6YmVmb3JlIHsKICBjb250ZW50OiAnJzsKICBwb3NpdGlvbjogYWJzb2x1dGU7CiAgdG9wOiAwOyBib3R0b206IDA7IGxlZnQ6IDA7IHdpZHRoOiA2MHB4OwogIGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCh0byByaWdodCwgcmdiYSgwLDAsMCwwLjE1KSwgdHJhbnNwYXJlbnQpOwogIHBvaW50ZXItZXZlbnRzOiBub25lOwp9CgouZmFjZS5iYWNrOjpiZWZvcmUgewogIGNvbnRlbnQ6ICcnOwogIHBvc2l0aW9uOiBhYnNvbHV0ZTsKICB0b3A6IDA7IGJvdHRvbTogMDsgcmlnaHQ6IDA7IHdpZHRoOiA2MHB4OwogIGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCh0byBsZWZ0LCByZ2JhKDAsMCwwLDAuMTUpLCB0cmFuc3BhcmVudCk7CiAgcG9pbnRlci1ldmVudHM6IG5vbmU7Cn0KCi5lZGdlIHsKICBwb3NpdGlvbjogYWJzb2x1dGU7CiAgYmFja2dyb3VuZDogI2Q0YzliODsKICBiYWNrZmFjZS12aXNpYmlsaXR5OiBoaWRkZW47Cn0KCi5lZGdlLnJpZ2h0IHsKICB3aWR0aDogM3B4OyBoZWlnaHQ6IDEwMCU7CiAgcmlnaHQ6IC0xLjVweDsgdG9wOiAwOwogIHRyYW5zZm9ybTogcm90YXRlWSg5MGRlZyk7Cn0KCi5lZGdlLnRvcCB7CiAgd2lkdGg6IDEwMCU7IGhlaWdodDogM3B4OwogIGxlZnQ6IDA7IHRvcDogLTEuNXB4OwogIHRyYW5zZm9ybTogcm90YXRlWCg5MGRlZyk7Cn0KCi5lZGdlLmJvdHRvbSB7CiAgd2lkdGg6IDEwMCU7IGhlaWdodDogM3B4OwogIGxlZnQ6IDA7IGJvdHRvbTogLTEuNXB4OwogIHRyYW5zZm9ybTogcm90YXRlWCg5MGRlZyk7Cn0KCi5jb250ZW50IHsKICBwb3NpdGlvbjogcmVsYXRpdmU7CiAgcGFkZGluZzogNjBweCA0NXB4OwogIGhlaWdodDogMTAwJTsKICBkaXNwbGF5OiBmbGV4OwogIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47Cn0KCi5kdW1teS1wYWdlIHsKICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDsKfQoKLnRpdGxlIHsKICBtYXJnaW4tdG9wOiAxMDBweDsKICB0ZXh0LWFsaWduOiBjZW50ZXI7CiAgZm9udC1zaXplOiAzOHB4OwogIGNvbG9yOiAjMmUxODAwOwogIGxpbmUtaGVpZ2h0OiAxLjI7Cn0KCi5zdWJ0aXRsZSB7CiAgdGV4dC1hbGlnbjogY2VudGVyOwogIGZvbnQtc3R5bGU6IGl0YWxpYzsKICBjb2xvcjogIzY2NjsKICBtYXJnaW4tdG9wOiAxNXB4OwogIGZvbnQtc2l6ZTogMThweDsKfQoKaDIgewogIGZvbnQtc2l6ZTogMjRweDsKICBjb2xvcjogIzJlMTgwMDsKICBtYXJnaW4tYm90dG9tOiAyMHB4OwogIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZGRkOwogIHBhZGRpbmctYm90dG9tOiAxMHB4Owp9CgpwIHsKICBmb250LXNpemU6IDE0cHg7CiAgbGluZS1oZWlnaHQ6IDEuODsKICBjb2xvcjogIzMzMzsKICBtYXJnaW4tYm90dG9tOiAxNXB4OwogIHRleHQtYWxpZ246IGp1c3RpZnk7Cn0KCi5wYWdlLW51bSB7CiAgcG9zaXRpb246IGFic29sdXRlOwogIGJvdHRvbTogNTBweDsKICBmb250LXNpemU6IDI2cHg7CiAgZm9udC13ZWlnaHQ6IDcwMDsKICBjb2xvcjogIzRhM2EyNjsKICB0ZXh0LXNoYWRvdzogMCAxcHggMXB4IHJnYmEoMjU1LDI1NSwyNTUsMC40KTsKICB6LWluZGV4OiA1Owp9CgouZmFjZS5mcm9udCAucGFnZS1udW0geyByaWdodDogNjBweDsgfQouZmFjZS5iYWNrIC5wYWdlLW51bSAgeyBsZWZ0OiA2MHB4OyB9CgouZmlndXJlIHsKICB3aWR0aDogMTAwJTsKICBoZWlnaHQ6IDE0MHB4OwogIGJhY2tncm91bmQ6ICNmMGVlZTk7CiAgYm9yZGVyOiAxcHggc29saWQgI2RjZGFkNTsKICBtYXJnaW4tdG9wOiBhdXRvOwogIG1hcmdpbi1ib3R0b206IGF1dG87CiAgZGlzcGxheTogZmxleDsKICBhbGlnbi1pdGVtczogY2VudGVyOwogIGp1c3RpZnktY29udGVudDogY2VudGVyOwogIGNvbG9yOiAjODg4OwogIGZvbnQtc3R5bGU6IGl0YWxpYzsKICBib3gtc2hhZG93OiBpbnNldCAwIDAgMTBweCByZ2JhKDAsMCwwLDAuMDUpOwp9CgoKLmZhY2UgewogIAogIGJhY2tncm91bmQtaW1hZ2U6IHVybCgiaW1hZ2VzXFxwYXBlcl90ZXh0dXJlLmpwZyIpICFpbXBvcnRhbnQ7CiAgYmFja2dyb3VuZC1zaXplOiBjb3ZlcjsKICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmRmYmY3Owp9CgoKCi5wYWdlLm51bWJlcmVkIC5mYWNlOjphZnRlciB7CiAgY29udGVudDogJyc7CiAgcG9zaXRpb246IGFic29sdXRlOwogIGluc2V0OiAwOwogIGJhY2tncm91bmQtaW1hZ2U6IHVybCgiaW1hZ2VzXFxwYXBlcl90ZXh0dXJlX2JhY2tncm91bmQucG5nIik7CiAgYmFja2dyb3VuZC1zaXplOiBjb3ZlcjsKICBvcGFjaXR5OiAwLjA4OwogIHBvaW50ZXItZXZlbnRzOiBub25lOwogIGJvcmRlci1yYWRpdXM6IGluaGVyaXQ7CiAgei1pbmRleDogMTsKfQoKCi5wYWdlLmR1bW15IC5mYWNlOjphZnRlciB7IGRpc3BsYXk6IG5vbmU7IH0KLnBhZ2UuZHVtbXkgLmZhY2UgewogIGJhY2tncm91bmQtaW1hZ2U6IHVybCgiaW1hZ2VzXFxwYXBlcl90ZXh0dXJlLmpwZyIpICFpbXBvcnRhbnQ7CiAgYmFja2dyb3VuZC1zaXplOiBjb3ZlcjsKICBmaWx0ZXI6IGJyaWdodG5lc3MoMC45Nykgc2VwaWEoMC4wNSk7Cn0KCgoKLnBhZ2UxLWNvbnRlbnQgewogIHBvc2l0aW9uOiBhYnNvbHV0ZTsKICBpbnNldDogMDsKICBkaXNwbGF5OiBmbGV4OwogIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47CiAgYWxpZ24taXRlbXM6IGNlbnRlcjsKICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtc3RhcnQ7CiAgcGFkZGluZy10b3A6IDQyJTsKfQoKLnBhZ2UxLXRpdGxlIHsKICBmb250LWZhbWlseTogJ0Nvcm1vcmFudCBHYXJhbW9uZCcsIHNlcmlmOwogIGZvbnQtd2VpZ2h0OiA3MDA7CiAgZm9udC1zaXplOiA0NnB4OwogIGNvbG9yOiAjMkExRDE3OwogIHRleHQtYWxpZ246IGNlbnRlcjsKICBsaW5lLWhlaWdodDogMS4yOwogIGxldHRlci1zcGFjaW5nOiAwLjAyZW07Cn0KCi5wYWdlMS1mbG9yYWwgewogIG1hcmdpbi10b3A6IDIwcHg7CiAgZm9udC1zaXplOiAyOHB4OwogIGNvbG9yOiAjMkExRDE3OwogIG9wYWNpdHk6IDAuNzsKICB1c2VyLXNlbGVjdDogbm9uZTsKfQoKCgoucGFnZTItY29udGVudCB7CiAgcG9zaXRpb246IGFic29sdXRlOwogIGluc2V0OiAwOwogIGRpc3BsYXk6IGZsZXg7CiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsKICBhbGlnbi1pdGVtczogY2VudGVyOwogIGp1c3RpZnktY29udGVudDogY2VudGVyOwogIHBhZGRpbmc6IDAgMTAlOwogIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtNSUpOwogIHBvaW50ZXItZXZlbnRzOiBub25lOwogIG9wYWNpdHk6IDA7CiAgYW5pbWF0aW9uOiBwMmZhZGUgMnMgZWFzZSBmb3J3YXJkczsKICBhbmltYXRpb24tZGVsYXk6IDIuMjVzOwp9CgoucGFnZTItbGluZSB7CiAgZm9udC1mYW1pbHk6ICdQbGF5ZmFpciBEaXNwbGF5Jywgc2VyaWY7CiAgY29sb3I6ICMyQTFEMTc7CiAgdGV4dC1hbGlnbjogY2VudGVyOwogIGxpbmUtaGVpZ2h0OiAxLjU1Owp9CgoucGFnZTItbGluZS5ob29rIHsKICBmb250LWZhbWlseTogJ1BsYXlmYWlyIERpc3BsYXknLCBzZXJpZjsKICBmb250LXNpemU6IDI3cHg7CiAgZm9udC13ZWlnaHQ6IDcwMDsKICBtYXJnaW4tYm90dG9tOiAxOHB4OwogIGNvbG9yOiAjNGEzMzI4Owp9CgoucGFnZTItbGluZS5tYWluIHsKICBmb250LXNpemU6IDE4LjVweDsKICBmb250LXdlaWdodDogNDAwOwogIG1hcmdpbi1ib3R0b206IDEwcHg7Cn0KCi5wYWdlMi1saW5lLmNsb3NpbmcgewogIGZvbnQtZmFtaWx5OiAnRGFuY2luZyBTY3JpcHQnLCBjdXJzaXZlOwogIGZvbnQtc2l6ZTogMjMuNXB4OwogIGZvbnQtd2VpZ2h0OiA1MDA7CiAgbWFyZ2luLXRvcDogMThweDsKICBjb2xvcjogIzRhMzMyODsKICBmb250LXN0eWxlOiBpdGFsaWM7Cn0KCi5wYWdlMi1kaXZpZGVyIHsKICB3aWR0aDogNDBweDsKICBoZWlnaHQ6IDFweDsKICBiYWNrZ3JvdW5kOiAjMkExRDE3OwogIG1hcmdpbjogMTRweCBhdXRvOwp9CgpAa2V5ZnJhbWVzIHAyZmFkZSB7CiAgZnJvbSB7IG9wYWNpdHk6IDA7IHRyYW5zZm9ybTogdHJhbnNsYXRlWSg2cHgpOyB9CiAgdG8gICB7IG9wYWNpdHk6IDE7IHRyYW5zZm9ybTogdHJhbnNsYXRlWSgwKTsgICB9Cn0KCi5wYWdlMi1jYW52YXMgewogIHBvc2l0aW9uOiBhYnNvbHV0ZTsKICBpbnNldDogMDsKICBwb2ludGVyLWV2ZW50czogbm9uZTsKICBib3JkZXItcmFkaXVzOiBpbmhlcml0Owp9CgoucGFnZTItbnVtIHsKICBwb3NpdGlvbjogYWJzb2x1dGU7CiAgYm90dG9tOiA1MHB4OwogIHJpZ2h0OiA2MHB4OwogIGZvbnQtc2l6ZTogMjZweDsKICBmb250LXdlaWdodDogNzAwOwogIGNvbG9yOiAjNGEzYTI2OwogIHRleHQtc2hhZG93OiAwIDFweCAxcHggcmdiYSgyNTUsMjU1LDI1NSwwLjQpOwogIHotaW5kZXg6IDU7Cn0KCgoKLnBhZ2UzLWNvbnRlbnQgewogIHBvc2l0aW9uOiBhYnNvbHV0ZTsKICBpbnNldDogMDsKICBkaXNwbGF5OiBmbGV4OwogIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47CiAgYWxpZ24taXRlbXM6IGNlbnRlcjsKICBwYWRkaW5nOiA1MHB4IDMwcHggNDBweDsKICBwb2ludGVyLWV2ZW50czogbm9uZTsKICAKICB0cmFuc2Zvcm0tc3R5bGU6IGZsYXQ7CiAgei1pbmRleDogMjsKfQoKLnBhZ2UzLXBvbGFyb2lkIHsKICB3aWR0aDogMzAwcHg7CiAgYmFja2dyb3VuZDogI2ZiZmFmNjsKICBwYWRkaW5nOiAxMnB4IDEycHggMCAxMnB4OwogIGJvcmRlci1yYWRpdXM6IDJweDsKICBib3gtc2hhZG93OgogICAgMCAxNHB4IDMwcHggcmdiYSgzMCwxOCw4LDAuMzIpLAogICAgMCAzcHggOHB4IHJnYmEoMzAsMTgsOCwwLjE4KTsKICB0cmFuc2Zvcm06IHJvdGF0ZSgtMmRlZyk7CiAgZmxleC1zaHJpbms6IDA7CiAgcG9zaXRpb246IHJlbGF0aXZlOwp9CgoucGFnZTMtcGhvdG8tZnJhbWUgewogIHBvc2l0aW9uOiByZWxhdGl2ZTsKICB3aWR0aDogMTAwJTsKICBoZWlnaHQ6IDI4MHB4OwogIG92ZXJmbG93OiBoaWRkZW47CiAgYmFja2dyb3VuZDogIzA1MDcwZDsKfQoKLnBhZ2UzLW1vb24gewogIHBvc2l0aW9uOiByZWxhdGl2ZTsKICB6LWluZGV4OiAyOwogIGRpc3BsYXk6IGJsb2NrOwogIHdpZHRoOiAxMDAlOwogIGhlaWdodDogMTAwJTsKICBvYmplY3QtZml0OiBjb3ZlcjsKICBvYmplY3QtcG9zaXRpb246IGNlbnRlcjsKfQoKLnBhZ2UzLXBvbGFyb2lkLWNhcHRpb24gewogIGhlaWdodDogNDBweDsKICBkaXNwbGF5OiBmbGV4OwogIGFsaWduLWl0ZW1zOiBjZW50ZXI7CiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7CiAgZ2FwOiA4cHg7Cn0KCi5wYWdlMy1jYXB0aW9uLWxpbmUgewogIGZsZXg6IDE7CiAgbWF4LXdpZHRoOiA0NHB4OwogIGhlaWdodDogMXB4OwogIGJhY2tncm91bmQ6IHJnYmEoNjAsNDUsMzAsMC4zNSk7Cn0KCi5wYWdlMy1jYXB0aW9uLWhlYXJ0IHsKICBmb250LXNpemU6IDExcHg7CiAgY29sb3I6IHJnYmEoNjAsNDUsMzAsMC41NSk7CiAgbGluZS1oZWlnaHQ6IDE7Cn0KCi5wYWdlMy10YXBlIHsKICBwb3NpdGlvbjogYWJzb2x1dGU7CiAgd2lkdGg6IDY4cHg7CiAgaGVpZ2h0OiAyNHB4OwoKICBiYWNrZ3JvdW5kOiByZXBlYXRpbmctbGluZWFyLWdyYWRpZW50KAogICAgLTQ1ZGVnLAogICAgcmdiYSgyMzUsIDIyMiwgMTk4LCAwLjc1KSAwcHgsCiAgICByZ2JhKDIzNSwgMjIyLCAxOTgsIDAuNzUpIDRweCwKICAgIHJnYmEoMjIwLCAyMDUsIDE4MCwgMC42NSkgNHB4LAogICAgcmdiYSgyMjAsIDIwNSwgMTgwLCAwLjY1KSA4cHgKICApOwoKICBib3JkZXItcmFkaXVzOiAycHg7CiAgb3BhY2l0eTogMC45OwogIGJveC1zaGFkb3c6IDAgM3B4IDZweCByZ2JhKDMwLCAxOCwgOCwgMC4yNSk7CiAgei1pbmRleDogNDsKCiAgdHJhbnNmb3JtOiByb3RhdGUoLTEyZGVnKTsKfQoKLnBhZ2UzLXRhcGUudGwgewogIHRvcDogLTlweDsKICBsZWZ0OiAtMjVweDsKICB0cmFuc2Zvcm06IHJvdGF0ZSgtMzhkZWcpOwp9CgoucGFnZTMtdGFwZS5iciB7CiAgYm90dG9tOiAtOHB4OwogIHJpZ2h0OiAtMjJweDsKICB0cmFuc2Zvcm06IHJvdGF0ZSgtMTJkZWcpOwp9CgoucGFnZTMtdGFwZTo6YWZ0ZXIgewogIGNvbnRlbnQ6ICIiOwogIHBvc2l0aW9uOiBhYnNvbHV0ZTsKICBpbnNldDogMDsKICBiYWNrZ3JvdW5kOiByYWRpYWwtZ3JhZGllbnQoCiAgICBjaXJjbGUgYXQgY2VudGVyLAogICAgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjE4KSwKICAgIHRyYW5zcGFyZW50IDcwJQogICk7CiAgYm9yZGVyLXJhZGl1czogMnB4OwogIHBvaW50ZXItZXZlbnRzOiBub25lOwp9CgoucGFnZTMtdGV4dCB7CiAgbWFyZ2luLXRvcDogMzBweDsKICB0ZXh0LWFsaWduOiBjZW50ZXI7CiAgbWF4LXdpZHRoOiA2OCU7Cn0KCi5wYWdlMy1saW5lIHsKICBjb2xvcjogIzJBMUQxNzsKICBvcGFjaXR5OiAwLjk7Cn0KCi5wYWdlMy1saW5lLW1haW4gewogIGZvbnQtZmFtaWx5OiAnUGxheWZhaXIgRGlzcGxheScsIHNlcmlmOwogIGZvbnQtd2VpZ2h0OiA0MDA7CiAgZm9udC1zdHlsZTogaXRhbGljOwogIGZvbnQtc2l6ZTogMjRweDsKICBsaW5lLWhlaWdodDogMS42OwogIG1hcmdpbi1ib3R0b206IDEwcHg7Cn0KCi5wYWdlMy1saW5lLXN1YiB7CiAgZm9udC1mYW1pbHk6ICdQbGF5ZmFpciBEaXNwbGF5Jywgc2VyaWY7CiAgZm9udC13ZWlnaHQ6IDcwMDsKICBmb250LXNpemU6IDIwcHg7CiAgbGV0dGVyLXNwYWNpbmc6IDAuMDFlbTsKICBvcGFjaXR5OiAwLjk7Cn0KCgoKLnBhZ2U0LWNhbnZhcyB7CiAgcG9zaXRpb246IGFic29sdXRlOwogIGluc2V0OiAwOwogIHBvaW50ZXItZXZlbnRzOiBub25lOwogIGJvcmRlci1yYWRpdXM6IGluaGVyaXQ7Cn0KCi5wYWdlNC1jb250ZW50IHsKICBwb3NpdGlvbjogYWJzb2x1dGU7CiAgaW5zZXQ6IDA7CiAgZGlzcGxheTogZmxleDsKICBmbGV4LWRpcmVjdGlvbjogY29sdW1uOwogIGFsaWduLWl0ZW1zOiBjZW50ZXI7CiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7CiAgcGFkZGluZzogMCA4JTsKICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTUlKTsKICBwb2ludGVyLWV2ZW50czogbm9uZTsKICB6LWluZGV4OiAyOwp9CgoucGFnZTQtdGV4dCB7CiAgdGV4dC1hbGlnbjogY2VudGVyOwogIG1heC13aWR0aDogODUlOwp9CgoucGFnZTQtbGluZSB7CiAgb3BhY2l0eTogMDsKICBjb2xvcjogIzJBMUQxNzsKICB0ZXh0LXNoYWRvdzogMCAxcHggMnB4IHJnYmEoMjU1LDI1NSwyNTUsMC40KTsKICBsaW5lLWhlaWdodDogMS41OwogIG1hcmdpbi1ib3R0b206IDE0cHg7CiAgYW5pbWF0aW9uOiBwNGZhZGUgMS4zcyBlYXNlIGZvcndhcmRzOwogIGFuaW1hdGlvbi1wbGF5LXN0YXRlOiBwYXVzZWQ7Cn0KCi5wYWdlNC1saW5lLmFjY2VudCB7CiAgZm9udC1mYW1pbHk6ICdEYW5jaW5nIFNjcmlwdCcsIGN1cnNpdmU7CiAgZm9udC13ZWlnaHQ6IDUwMDsKICBmb250LXN0eWxlOiBpdGFsaWM7CiAgZm9udC1zaXplOiAzNHB4OwogIGNvbG9yOiAjNGEzMzI4OwogIG1hcmdpbi10b3A6IDcwcHg7CiAgbWFyZ2luLWJvdHRvbTogMjBweDsKICBwYWRkaW5nLXRvcDogMjBweDsKfQoKLnBhZ2U0LWxpbmUudGl0bGUgewogIGZvbnQtZmFtaWx5OiAnUGxheWZhaXIgRGlzcGxheScsIHNlcmlmOwogIGZvbnQtd2VpZ2h0OiA2MDA7CiAgZm9udC1zaXplOiAzMnB4OwogIG1hcmdpbi1ib3R0b206IDIwcHg7CiAgbWFyZ2luLXRvcDogLTEwcHg7Cn0KCi5wYWdlNC1saW5lLmJvZHkgewogIGZvbnQtZmFtaWx5OiAnUGxheWZhaXIgRGlzcGxheScsIHNlcmlmOwogIGZvbnQtd2VpZ2h0OiA0MDA7CiAgZm9udC1zaXplOiAyMHB4Owp9Ci5wYWdlNC1saW5lLmxhc3QgewogIGZvbnQtZmFtaWx5OiAnUGxheWZhaXIgRGlzcGxheScsIHNlcmlmOwogIGZvbnQtd2VpZ2h0OiA0MDA7CiAgZm9udC1zaXplOiAyNXB4Owp9CgoucGFnZTQtaGlnaGxpZ2h0IHsKICBwb3NpdGlvbjogcmVsYXRpdmU7CiAgd2hpdGUtc3BhY2U6IG5vd3JhcDsKfQoKLnBhZ2U0LXNwYXJrbGUgewogIGRpc3BsYXk6IGlubGluZS1ibG9jazsKICBtYXJnaW4tbGVmdDogM3B4OwogIGNvbG9yOiAjN2E1YTJlOwogIG9wYWNpdHk6IDA7CiAgZm9udC1zaXplOiAwLjg1ZW07CiAgdHJhbnNmb3JtOiBzY2FsZSgwLjMpIHJvdGF0ZSgtMTVkZWcpOwogIGFuaW1hdGlvbjogcDRzcGFya2xlIDFzIGVhc2UgZm9yd2FyZHM7CiAgYW5pbWF0aW9uLXBsYXktc3RhdGU6IHBhdXNlZDsKfQoKLnBhZ2U0LXN0YXIgewogIGNvbG9yOiAjMTcxMDA2Owp9CgoucGFnZTQtbGluZS5kMSB7IGFuaW1hdGlvbi1kZWxheTogNnM7IH0KLnBhZ2U0LWxpbmUuZDIgeyBhbmltYXRpb24tZGVsYXk6IDguNXM7IH0KLnBhZ2U0LWxpbmUuZDMgeyBhbmltYXRpb24tZGVsYXk6IDExczsgfQoucGFnZTQtbGluZS5kNCB7IGFuaW1hdGlvbi1kZWxheTogMTMuNXM7IH0KLnBhZ2U0LWxpbmUuZDUgeyBhbmltYXRpb24tZGVsYXk6IDE2czsgfQoucGFnZTQtbGluZS5sYXN0IHsgYW5pbWF0aW9uLWRlbGF5OiAxOC41czsgfQoKLnBhZ2U0LXNwYXJrbGUuZDNzIHsgYW5pbWF0aW9uLWRlbGF5OiAxMS41czsgfQoucGFnZTQtc3BhcmtsZS5kNHMgeyBhbmltYXRpb24tZGVsYXk6IDE0czsgfQoKCi5wYWdlNC1jb250ZW50LnBhZ2U0LWFybWVkIC5wYWdlNC1saW5lLAoucGFnZTQtY29udGVudC5wYWdlNC1hcm1lZCAucGFnZTQtc3BhcmtsZSB7CiAgYW5pbWF0aW9uLXBsYXktc3RhdGU6IHJ1bm5pbmc7Cn0KCkBrZXlmcmFtZXMgcDRmYWRlIHsKICBmcm9tIHsgb3BhY2l0eTogMDsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDhweCk7IH0KICB0byAgIHsgb3BhY2l0eTogMTsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDApOyAgIH0KfQoKQGtleWZyYW1lcyBwNHNwYXJrbGUgewogIDAlICAgeyBvcGFjaXR5OiAwOyB0cmFuc2Zvcm06IHNjYWxlKDAuMykgcm90YXRlKC0xNWRlZyk7IH0KICA1MCUgIHsgb3BhY2l0eTogMTsgdHJhbnNmb3JtOiBzY2FsZSgxLjM1KSByb3RhdGUoMTJkZWcpOyB9CiAgMTAwJSB7IG9wYWNpdHk6IDE7IHRyYW5zZm9ybTogc2NhbGUoMSkgcm90YXRlKDBkZWcpOyB9Cn0KCgoKLnBhZ2U1LWNvbnRlbnQgewogIHBvc2l0aW9uOiBhYnNvbHV0ZTsKICBpbnNldDogMDsKICBkaXNwbGF5OiBmbGV4OwogIGFsaWduLWl0ZW1zOiBjZW50ZXI7CiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7CiAgcG9pbnRlci1ldmVudHM6IG5vbmU7CiAgei1pbmRleDogMjsKfQoKLnBhZ2U1LWNhbnZhcy10bCwKLnBhZ2U1LWNhbnZhcy1iciB7CiAgcG9zaXRpb246IGFic29sdXRlOwogIHdpZHRoOiA0NCU7CiAgaGVpZ2h0OiA0NCU7CiAgcG9pbnRlci1ldmVudHM6IG5vbmU7Cn0KCi5wYWdlNS1jYW52YXMtdGwgewogIHRvcDogNnB4OwogIGxlZnQ6IDZweDsKfQoKLnBhZ2U1LWNhbnZhcy1iciB7CiAgYm90dG9tOiA2cHg7CiAgcmlnaHQ6IDZweDsKfQoKLnBhZ2U1LWNhbnZhcy10bCBjYW52YXMsCi5wYWdlNS1jYW52YXMtYnIgY2FudmFzIHsKICB3aWR0aDogMTAwJSAhaW1wb3J0YW50OwogIGhlaWdodDogMTAwJSAhaW1wb3J0YW50OwogIGZpbHRlcjogZHJvcC1zaGFkb3coMCAwIDE0cHggcmdiYSgyMTQsIDE5MCwgMTMwLCAwLjM1KSk7Cn0KCi5wYWdlNS10ZXh0IHsKICBwb3NpdGlvbjogcmVsYXRpdmU7CiAgd2lkdGg6IDg4JTsKICBtYXgtd2lkdGg6IDg4JTsKICB0ZXh0LWFsaWduOiBjZW50ZXI7CiAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKGNhbGMoKzYlICsgNXB4KSk7CiAgcGFkZGluZzogMCA4cHg7CiAgZGlzcGxheTogZmxleDsKICBmbGV4LWRpcmVjdGlvbjogY29sdW1uOwogIGdhcDogMTFweDsKfQoKLnBhZ2U1LWxpbmUgewogIGZvbnQtZmFtaWx5OiAnUGxheWZhaXIgRGlzcGxheScsIHNlcmlmOwogIGZvbnQtc2l6ZTogMTlweDsKICBsaW5lLWhlaWdodDogMS43OwogIGNvbG9yOiAjMkExRDE3OwogIG9wYWNpdHk6IDA7CiAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDhweCk7CiAgYW5pbWF0aW9uOiBwNWZhZGUgMS40cyBlYXNlIGZvcndhcmRzOwogIGFuaW1hdGlvbi1wbGF5LXN0YXRlOiBwYXVzZWQ7Cn0KCi5wYWdlNS1saW5lLmVtcGggewogIGZvbnQtc3R5bGU6IGl0YWxpYzsKfQoKLnBhZ2U1LWxpbmUubGFzdCB7CiAgZm9udC1zaXplOiAyMHB4Owp9CgoucGFnZTUtbGluZS5hbGlnbi1yaWdodCB7CiAgdGV4dC1hbGlnbjogY2VudGVyOwogIHBhZGRpbmctcmlnaHQ6IDYlOwp9CgoucGFnZTUtbGluZS5hbGlnbi1jZW50ZXIgewogIHRleHQtYWxpZ246IGNlbnRlcjsKfQoKLnBhZ2U1LWxpbmUuYWxpZ24tbGVmdCB7CiAgdGV4dC1hbGlnbjogbGVmdDsKICBwYWRkaW5nLWxlZnQ6IDYlOwp9CgoucGFnZTUtbGluZS5sMSB7IGFuaW1hdGlvbi1kZWxheTogMC40czsgfQoucGFnZTUtbGluZS5sMiB7IGFuaW1hdGlvbi1kZWxheTogMS42czsgfQoucGFnZTUtbGluZS5sMyB7IGFuaW1hdGlvbi1kZWxheTogMi44czsgfQoucGFnZTUtbGluZS5sNCB7IGFuaW1hdGlvbi1kZWxheTogNC4wczsgfQoKCi5wYWdlNS1jb250ZW50LnBhZ2U1LWFybWVkIC5wYWdlNS1saW5lIHsKICBhbmltYXRpb24tcGxheS1zdGF0ZTogcnVubmluZzsKfQoKQGtleWZyYW1lcyBwNWZhZGUgewogIGZyb20geyBvcGFjaXR5OiAwOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoOHB4KTsgfQogIHRvICAgeyBvcGFjaXR5OiAwLjk1OyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMCk7IH0KfQoKCgoucGFnZTYtY29udGVudCB7CiAgcG9zaXRpb246IGFic29sdXRlOwogIGluc2V0OiAwOwogIGRpc3BsYXk6IGZsZXg7CiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsKICBhbGlnbi1pdGVtczogY2VudGVyOwogIHBhZGRpbmc6IDQ4cHggMjZweCA0MnB4OwogIHBvaW50ZXItZXZlbnRzOiBub25lOwogIHotaW5kZXg6IDI7Cn0KCi5wYWdlNi10ZXh0IHsKICB0ZXh0LWFsaWduOiBjZW50ZXI7CiAgbWF4LXdpZHRoOiA4OCU7CiAgZmxleDogMCAwIGF1dG87Cn0KCi5wYWdlNi10ZXh0LnRvcCB7CiAgbWFyZ2luLXRvcDogNDVweDsKICBtYXJnaW4tYm90dG9tOiA2cHg7Cn0KCi5wYWdlNi10ZXh0LmJvdHRvbSB7CiAgbWFyZ2luLXRvcDogNnB4OwogIG1hcmdpbi1ib3R0b206IDM1cHg7Cn0KCi5wYWdlNi1saW5lIHsKICBmb250LWZhbWlseTogJ0Nvcm1vcmFudCBHYXJhbW9uZCcsICdFQiBHYXJhbW9uZCcsICdQbGF5ZmFpciBEaXNwbGF5Jywgc2VyaWY7CiAgZm9udC1zdHlsZTogaXRhbGljOwogIGZvbnQtd2VpZ2h0OiA2MDA7CiAgZm9udC1zaXplOiAyM3B4OwogIGxpbmUtaGVpZ2h0OiAxLjQ7CiAgY29sb3I6ICM0QTM3Mjg7CiAgb3BhY2l0eTogMDsKICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoOHB4KTsKICBhbmltYXRpb246IHA2ZmFkZSAxLjZzIGVhc2UgZm9yd2FyZHM7CiAgYW5pbWF0aW9uLXBsYXktc3RhdGU6IHBhdXNlZDsKfQoKLnBhZ2U2LWxpbmUuYm90dG9tLWxpbmUgewogIGZvbnQtc2l6ZTogMTlweDsKICBmb250LXdlaWdodDogNTAwOwogIGNvbG9yOiAjNEQ1NjQyOwp9CgoucGFnZTYtbGluZS50b3AtbGluZSB7IGFuaW1hdGlvbi1kZWxheTogMC4zczsgfQoucGFnZTYtbGluZS5ib3R0b20tbGluZSB7IGFuaW1hdGlvbi1kZWxheTogMi4xczsgfQoKCi5wYWdlNi1jb250ZW50LnBhZ2U2LWFybWVkIC5wYWdlNi1saW5lIHsKICBhbmltYXRpb24tcGxheS1zdGF0ZTogcnVubmluZzsKfQoKLnBhZ2U2LXR1bGlwLWVtb2ppIHsKICBjb2xvcjogIzRBMzcyODsKICBmb250LXN0eWxlOiBub3JtYWw7Cn0KCkBrZXlmcmFtZXMgcDZmYWRlIHsKICBmcm9tIHsgb3BhY2l0eTogMDsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDhweCk7IH0KICB0byAgIHsgb3BhY2l0eTogMTsgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMCk7ICAgfQp9CgoucGFnZTYtY2FudmFzLXdyYXAgewogIGZsZXg6IDEgMSBhdXRvOwogIHdpZHRoOiA4OCU7CiAgbWluLWhlaWdodDogMDsKICBtYXJnaW46IDRweCAwOwogIHBvaW50ZXItZXZlbnRzOiBub25lOwogIG9wYWNpdHk6IDA7CiAgYW5pbWF0aW9uOiBwNmZhZGUgMS44cyBlYXNlIGZvcndhcmRzOwogIGFuaW1hdGlvbi1kZWxheTogMC45czsKICBmaWx0ZXI6IGRyb3Atc2hhZG93KDAgMTBweCAxNHB4IHJnYmEoNDUsIDMwLCAxNSwgMC4yMikpOwp9CgoucGFnZTYtY2FudmFzLXdyYXAgY2FudmFzIHsKICB3aWR0aDogMTAwJSAhaW1wb3J0YW50OwogIGhlaWdodDogMTAwJSAhaW1wb3J0YW50Owp9CgoucGFnZTYtY29ybmVyIHsKICBwb3NpdGlvbjogYWJzb2x1dGU7CiAgZm9udC1zaXplOiAyMHB4OwogIGNvbG9yOiAjNEEzNzI4OwogIG9wYWNpdHk6IDAuMjg7CiAgdXNlci1zZWxlY3Q6IG5vbmU7CiAgcG9pbnRlci1ldmVudHM6IG5vbmU7Cn0KCi5wYWdlNi1jb3JuZXIudGwgeyB0b3A6IDI2cHg7ICAgIGxlZnQ6IDMwcHg7ICB9Ci5wYWdlNi1jb3JuZXIudHIgeyB0b3A6IDI2cHg7ICAgIHJpZ2h0OiAzMHB4OyB0cmFuc2Zvcm06IHNjYWxlWCgtMSk7IH0KLnBhZ2U2LWNvcm5lci5ibCB7IGJvdHRvbTogMjZweDsgbGVmdDogMzBweDsgIHRyYW5zZm9ybTogc2NhbGVZKC0xKTsgfQoucGFnZTYtY29ybmVyLmJyIHsgYm90dG9tOiAyNnB4OyByaWdodDogMzBweDsgdHJhbnNmb3JtOiBzY2FsZSgtMSwgLTEpOyB9CgoKLnBhZ2U3LWNvbnRlbnQgewogIHBvc2l0aW9uOiBhYnNvbHV0ZTsKICBpbnNldDogMDsKICBkaXNwbGF5OiBmbGV4OwogIGFsaWduLWl0ZW1zOiBjZW50ZXI7CiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7CiAgcGFkZGluZzogNiUgNiU7CiAgb3ZlcmZsb3cteTogYXV0bzsKfQoKLnBhZ2U3LXRleHQgewogIGZvbnQtZmFtaWx5OiAnQ29ybW9yYW50IEdhcmFtb25kJywgJ0VCIEdhcmFtb25kJywgc2VyaWY7CiAgZm9udC13ZWlnaHQ6IDYwMDsKICBmb250LXN0eWxlOiBub3JtYWw7CiAgZm9udC1zaXplOiA1NnB4OwogIGxpbmUtaGVpZ2h0OiAxLjU7CiAgY29sb3I6ICM0QTM3Mjg7CiAgdGV4dC1hbGlnbjogY2VudGVyOwogIG1heC13aWR0aDogMTAwJTsKfQoKLnBhZ2U3LXRleHQgcCB7CiAgbWFyZ2luOiAwIDAgMThweCAwOwp9CgoucGFnZTctdGV4dCBwOmxhc3QtY2hpbGQgewogIG1hcmdpbi1ib3R0b206IDA7Cn0KCgoucGFnZTgtY29udGVudCB7CiAgcG9zaXRpb246IGFic29sdXRlOwogIGluc2V0OiAwOwogIGRpc3BsYXk6IGZsZXg7CiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsKICBhbGlnbi1pdGVtczogY2VudGVyOwogIGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDsKICBwYWRkaW5nOiA4JSAxMCU7Cn0KCi5wYWdlOC10ZXh0IHsKICBmb250LWZhbWlseTogJ0Nvcm1vcmFudCBHYXJhbW9uZCcsICdFQiBHYXJhbW9uZCcsIHNlcmlmOwogIGZvbnQtd2VpZ2h0OiA0MDA7CiAgZm9udC1zdHlsZTogaXRhbGljOwogIGZvbnQtc2l6ZTogMzRweDsKICBsaW5lLWhlaWdodDogMS41NTsKICBjb2xvcjogIzRBMzcyODsKICB0ZXh0LWFsaWduOiBjZW50ZXI7CiAgbWF4LXdpZHRoOiA5MCU7CiAgdGV4dC1zaGFkb3c6IDAgMCAxOHB4IHJnYmEoMjU1LCAyMTQsIDE1MCwgMC4yNSk7CiAgbWFyZ2luLXRvcDogNCU7CiAgbWFyZ2luLWJvdHRvbTogMiU7Cn0KCi5wYWdlOC10ZXh0IC5wYWdlOC1lbXBoIHsKICBjb2xvcjogIzhhNWEzYTsKfQoKLnBhZ2U4LWNha2UgewogIHdpZHRoOiA2MiU7CiAgbWF4LXdpZHRoOiAzNDBweDsKICBoZWlnaHQ6IGF1dG87CiAgZmlsdGVyOiBkcm9wLXNoYWRvdygwIDhweCAxMnB4IHJnYmEoNDUsIDMwLCAxNSwgMC4xNSkpOwp9CgoucGFnZTgtZGl2aWRlciB7CiAgd2lkdGg6IDQ2JTsKICBtYXgtd2lkdGg6IDIyMHB4OwogIGhlaWdodDogMXB4OwogIGJhY2tncm91bmQ6ICM0QTM3Mjg7CiAgb3BhY2l0eTogMC40OwogIGJvcmRlcjogbm9uZTsKICBtYXJnaW46IDMuNiUgMCA0JSAwOwp9CgoucGFnZTgtZW5kdGV4dCB7CiAgZm9udC1mYW1pbHk6ICdDb3Jtb3JhbnQgR2FyYW1vbmQnLCAnRUIgR2FyYW1vbmQnLCBzZXJpZjsKICBmb250LXdlaWdodDogNDAwOwogIGZvbnQtc3R5bGU6IGl0YWxpYzsKICBmb250LXNpemU6IDI2cHg7CiAgbGV0dGVyLXNwYWNpbmc6IDAuMDRlbTsKICBjb2xvcjogIzRBMzcyODsKICB0ZXh0LWFsaWduOiBjZW50ZXI7CiAgbWFyZ2luLWJvdHRvbTogOTBweDsKfQoKPC9zdHlsZT4KPC9oZWFkPgoKCgoKPGJvZHk+CjxkaXYgY2xhc3M9InNjZW5lIj4KICA8ZGl2IGNsYXNzPSJib29rLWhvdmVyIj4KICAgIDxkaXYgY2xhc3M9ImJvb2std3JhcCIgaWQ9ImJvb2std3JhcCI+CiAgICAgIDxkaXYgY2xhc3M9InRhYmxlLXNoYWRvdyI+PC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9InNwaW5lIj48L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0iY292ZXIgYmFjayI+PC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9ImNvdmVyIGZyb250Ij48L2Rpdj4KICAgICAgCiAgICA8L2Rpdj4KICA8L2Rpdj4KPC9kaXY+Cgo8c2NyaXB0PgooZnVuY3Rpb24gKCkgewogIGNvbnN0IFRPVEFMX1BBR0VTICAgID0gNDQ7CiAgY29uc3QgTlVNX0JFRk9SRSAgICAgPSAyMDsKICBjb25zdCBOVU1fSU5URVJBQ1RJVkUgPSA1OwoKICBsZXQgY3VycmVudCA9IE5VTV9CRUZPUkU7CiAgbGV0IHBhZ2U0QXJtVGltZXIgPSBudWxsOwoKICBjb25zdCB3cmFwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Jvb2std3JhcCcpOwoKICAKICAKICBmdW5jdGlvbiBhcm1QYWdlNCgpIHsKICAgIGlmIChwYWdlNEFybVRpbWVyKSByZXR1cm47IAogICAgcGFnZTRBcm1UaW1lciA9IHNldFRpbWVvdXQoKCkgPT4gewogICAgICBwYWdlNEFybVRpbWVyID0gbnVsbDsKICAgICAgY29uc3QgcDQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucGFnZTQtY29udGVudCcpOwogICAgICBpZiAocDQpIHA0LmNsYXNzTGlzdC5hZGQoJ3BhZ2U0LWFybWVkJyk7CiAgICB9LCAyNTApOwogIH0KCiAgCiAgCiAgCiAgY29uc3QgUEFHRTVfU0VRVUVOQ0VfTVMgPSA1NDAwOyAKCiAgbGV0IHBhZ2U1QXJtVGltZXIgPSBudWxsOwogIGxldCBwYWdlNkFybVRpbWVyID0gbnVsbDsKCiAgCiAgCiAgCiAgZnVuY3Rpb24gYXJtUGFnZTUoKSB7CiAgICBpZiAocGFnZTVBcm1UaW1lcikgcmV0dXJuOyAKICAgIHBhZ2U1QXJtVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHsKICAgICAgcGFnZTVBcm1UaW1lciA9IG51bGw7CiAgICAgIGNvbnN0IHA1ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnBhZ2U1LWNvbnRlbnQnKTsKICAgICAgaWYgKHA1KSBwNS5jbGFzc0xpc3QuYWRkKCdwYWdlNS1hcm1lZCcpOwogICAgICBpZiAod2luZG93Ll9fcGFnZTVQZW5kaW5nQWN0aW9ucykgewogICAgICAgIHdpbmRvdy5fX3BhZ2U1UGVuZGluZ0FjdGlvbnMuZm9yRWFjaCgoYWN0aW9uKSA9PiB7IGFjdGlvbi5wYXVzZWQgPSBmYWxzZTsgfSk7CiAgICAgIH0KICAgICAgYXJtUGFnZTYoKTsKICAgIH0sIDc3MCk7CiAgfQoKICAKICAKICBmdW5jdGlvbiBhcm1QYWdlNigpIHsKICAgIGlmIChwYWdlNkFybVRpbWVyKSByZXR1cm47IAogICAgcGFnZTZBcm1UaW1lciA9IHNldFRpbWVvdXQoKCkgPT4gewogICAgICBwYWdlNkFybVRpbWVyID0gbnVsbDsKICAgICAgY29uc3QgcDYgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucGFnZTYtY29udGVudCcpOwogICAgICBpZiAocDYpIHA2LmNsYXNzTGlzdC5hZGQoJ3BhZ2U2LWFybWVkJyk7CiAgICB9LCBQQUdFNV9TRVFVRU5DRV9NUyArIDMwMDApOwogIH0KCiAgCiAgZnVuY3Rpb24gbWFrZUZhY2VDb250ZW50KHNpZGUsIGludGVyYWN0aXZlSW5kZXgpIHsKICAgIAogICAgY29uc3QgZGl2ID0gKGNscywgaW5uZXIpID0+IGA8ZGl2IGNsYXNzPSJjb250ZW50ICR7Y2xzfSI+JHtpbm5lcn08L2Rpdj5gOwoKICAgIGlmIChpbnRlcmFjdGl2ZUluZGV4ID09PSBudWxsKSB7CiAgICAgIHJldHVybiBkaXYoJ2R1bW15LXBhZ2UnLCAnJyk7CiAgICB9CgogICAgY29uc3QgcGFnZU51bXMgPSB7CiAgICAgIAogICAgICAwOiAgeyBmcm9udDogbnVsbCwgIGJhY2s6ICAxICB9LCAgIAogICAgICAxOiAgeyBmcm9udDogMiwgICAgIGJhY2s6ICAzICB9LAogICAgICAyOiAgeyBmcm9udDogNCwgICAgIGJhY2s6ICA1ICB9LAogICAgICAzOiAgeyBmcm9udDogNiwgICAgIGJhY2s6ICA3ICB9LAogICAgICA0OiAgeyBmcm9udDogOCwgICAgIGJhY2s6ICBudWxsIH0sCiAgICB9OwoKICAgIGNvbnN0IG51bXMgPSBwYWdlTnVtc1tpbnRlcmFjdGl2ZUluZGV4XTsKICAgIGlmICghbnVtcykgcmV0dXJuIGRpdignZHVtbXktcGFnZScsICcnKTsKCiAgICAKICAgIGlmIChpbnRlcmFjdGl2ZUluZGV4ID09PSAxICYmIHNpZGUgPT09ICdmcm9udCcpIHsKICAgICAgcmV0dXJuIGAKICAgICAgICA8Y2FudmFzIGNsYXNzPSJwYWdlMi1jYW52YXMiIGlkPSJwMmNhbnZhcyI+PC9jYW52YXM+CiAgICAgICAgPGRpdiBjbGFzcz0icGFnZTItY29udGVudCI+CiAgICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlMi1saW5lIGhvb2siPk9rYXksIHRoaXMgbWlnaHQgYmUgYSBiaXQgbmVyZHnigKYgaGFoYSA6KTwvZGl2PgogICAgICAgICAgPGRpdiBjbGFzcz0icGFnZTItZGl2aWRlciI+PC9kaXY+CiAgICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlMi1saW5lIG1haW4iPkJ1dCB0aGlzIGlzIGEgc21hbGwgYmlydGhkYXkgZ2lmdCBJIG1hZGUgZm9yIHlvdS48L2Rpdj4KICAgICAgICAgIDxkaXYgY2xhc3M9InBhZ2UyLWxpbmUgbWFpbiI+SXQgdG9vayBtZSBhIGxvdCBvZiBlZmZvcnQgdG8gcHV0IHRoaXMgdG9nZXRoZXIsPGJyPmFuZCBJIHRydWx5IGhvcGUgeW91IGxpa2UgaXQuPC9kaXY+CiAgICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlMi1saW5lIGNsb3NpbmciPlRha2UgeW91ciB0aW1l4oCmIGFuZCBlbmpveSB0aGUgbW9tZW50LjwvZGl2PgogICAgICAgIDwvZGl2PgogICAgICAgIDxkaXYgY2xhc3M9InBhZ2UyLW51bSI+MjwvZGl2PgogICAgICBgOwogICAgfQoKICAgIAogICAgaWYgKGludGVyYWN0aXZlSW5kZXggPT09IDEgJiYgc2lkZSA9PT0gJ2JhY2snKSB7CiAgICAgIHJldHVybiBgCiAgICAgICAgPGRpdiBjbGFzcz0icGFnZTMtY29udGVudCI+CiAgICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlMy1wb2xhcm9pZCI+CiAgICAgICAgICAgIDxkaXYgY2xhc3M9InBhZ2UzLXRhcGUgdGwiPjwvZGl2PgogICAgICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlMy10YXBlIGJyIj48L2Rpdj4KICAgICAgICAgICAgPGRpdiBjbGFzcz0icGFnZTMtcGhvdG8tZnJhbWUiPgogICAgICAgICAgICAgIDxpbWcgY2xhc3M9InBhZ2UzLW1vb24iIHNyYz0iaW1hZ2VzXFxNb29uX2ltYWdlLnBuZyIgYWx0PSJUaGUgTW9vbiI+CiAgICAgICAgICAgIDwvZGl2PgogICAgICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlMy1wb2xhcm9pZC1jYXB0aW9uIj4KICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0icGFnZTMtY2FwdGlvbi1saW5lIj48L3NwYW4+CiAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9InBhZ2UzLWNhcHRpb24taGVhcnQiPiYjMTAwODQ7PC9zcGFuPgogICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSJwYWdlMy1jYXB0aW9uLWxpbmUiPjwvc3Bhbj4KICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICA8L2Rpdj4KICAgICAgICAgIDxkaXYgY2xhc3M9InBhZ2UzLXRleHQiPgogICAgICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlMy1saW5lIHBhZ2UzLWxpbmUtbWFpbiI+TG9vayBhdCB0aGUgTW9vbiBvbiB0aGUgZGF5PGJyPllPVSB3ZXJlIGJvcm4uPC9kaXY+CiAgICAgICAgICAgIDxkaXYgY2xhc3M9InBhZ2UzLWxpbmUgcGFnZTMtbGluZS1zdWIiPkJlYXV0aWZ1bCBpc24ndCBpdD88L2Rpdj4KICAgICAgICAgIDwvZGl2PgogICAgICAgIDwvZGl2PgogICAgICAgIDxkaXYgY2xhc3M9InBhZ2UtbnVtIj4zPC9kaXY+CiAgICAgIGA7CiAgICB9CgogICAgCiAgICBpZiAoaW50ZXJhY3RpdmVJbmRleCA9PT0gMCAmJiBzaWRlID09PSAnYmFjaycpIHsKICAgICAgcmV0dXJuIGA8ZGl2IGNsYXNzPSJwYWdlMS1jb250ZW50Ij4KICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlMS10aXRsZSI+SGFwcHkgQmlydGhkYXksPGJyPllhbm91PC9kaXY+CiAgICAgICAgPGRpdiBjbGFzcz0icGFnZTEtZmxvcmFsIj7inacg4py/IOKdpzwvZGl2PgogICAgICA8L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0icGFnZS1udW0iPjE8L2Rpdj5gOwogICAgfQoKICAgIAogICAgaWYgKGludGVyYWN0aXZlSW5kZXggPT09IDIgJiYgc2lkZSA9PT0gJ2Zyb250JykgewogICAgICByZXR1cm4gYAogICAgICAgIDxjYW52YXMgY2xhc3M9InBhZ2U0LWNhbnZhcyIgaWQ9InA0Y2FudmFzIj48L2NhbnZhcz4KICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlNC1jb250ZW50Ij4KICAgICAgICAgIDxkaXYgY2xhc3M9InBhZ2U0LXRleHQiPgogICAgICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlNC1saW5lIGFjY2VudCBkMSI+RGlkIHlvdSBrbm93PzwvZGl2PgogICAgICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlNC1saW5lIHRpdGxlIGQyIj5Zb3VyIGJpcnRoZGF5IGlzIGFsbW9zdCBwZXJmZWN0bHkgaW4gdGhlIG1pZGRsZSBvZiB0aGUgeWVhci48L2Rpdj4KICAgICAgICAgICAgPGRpdiBjbGFzcz0icGFnZTQtbGluZSBib2R5IGQzIj5UaGVyZSBhcmUgPHNwYW4gY2xhc3M9InBhZ2U0LWhpZ2hsaWdodCI+MTgyIGRheXM8c3BhbiBjbGFzcz0icGFnZTQtc3BhcmtsZSBkM3MiPiYjMTAwMjI7PC9zcGFuPjwvc3Bhbj4gYmVmb3JlIGl0JmhlbGxpcDs8L2Rpdj4KICAgICAgICAgICAgPGRpdiBjbGFzcz0icGFnZTQtbGluZSBib2R5IGQ0Ij5hbmQgPHNwYW4gY2xhc3M9InBhZ2U0LWhpZ2hsaWdodCI+MTgyIGRheXM8c3BhbiBjbGFzcz0icGFnZTQtc3BhcmtsZSBkNHMiPiYjMTAwMjI7PC9zcGFuPjwvc3Bhbj4gYWZ0ZXIgaXQgITwvZGl2PgogICAgICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlNC1saW5lIGJvZHkgZDUiPldoYXQgYSBzcGVjaWFsIGRheSZoZWxsaXA7PC9kaXY+CiAgICAgICAgICAgIDxkaXYgY2xhc3M9InBhZ2U0LWxpbmUgbGFzdCBkNiI+SSdkIHNheSB0aGF0J3MgcHJldHR5IGZpdHRpbmcgZm9yIGEgdHJ1bHkgc3BlY2lhbCBwZXJzb24uIDxzcGFuIGNsYXNzPSJwYWdlNC1zdGFyIj4mIzk3MzM7PC9zcGFuPjwvZGl2PgogICAgICAgICAgPC9kaXY+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPGRpdiBjbGFzcz0icGFnZS1udW0iPjQ8L2Rpdj4KICAgICAgYDsKICAgIH0KCiAgICAKICAgIGlmIChpbnRlcmFjdGl2ZUluZGV4ID09PSAyICYmIHNpZGUgPT09ICdiYWNrJykgewogICAgICByZXR1cm4gYAogICAgICAgIDxkaXYgY2xhc3M9InBhZ2U1LWNhbnZhcy10bCIgaWQ9InA1Y2FudmFzLXRsIj48L2Rpdj4KICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlNS1jYW52YXMtYnIiIGlkPSJwNWNhbnZhcy1iciI+PC9kaXY+CiAgICAgICAgPGRpdiBjbGFzcz0icGFnZTUtY29udGVudCI+CiAgICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlNS10ZXh0Ij4KICAgICAgICAgICAgPGRpdiBjbGFzcz0icGFnZTUtbGluZSBhbGlnbi1yaWdodCBsMSI+SSBoZWFyZCB0aGF0IGVhY2ggbW9udGggaGFzIGl0cyBvd24gc3BlY2lhbCBmbG93ZXJzLjwvZGl2PgogICAgICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlNS1saW5lIGFsaWduLWNlbnRlciBsMiI+Rm9yIEp1bHksIGl0J3MgdGhlIGxhcmtzcHVyIGFuZCB0aGUgd2F0ZXIgbGlseS48L2Rpdj4KICAgICAgICAgICAgPGRpdiBjbGFzcz0icGFnZTUtbGluZSBlbXBoIGFsaWduLWNlbnRlciBsMyI+VGhleSdyZSBzYWlkIHRvIHJlcHJlc2VudCBwb3NpdGl2aXR5IGFuZCBkaWduaXR5JmhlbGxpcDs8L2Rpdj4KICAgICAgICAgICAgPGRpdiBjbGFzcz0icGFnZTUtbGluZSBsYXN0IGFsaWduLWxlZnQgbDQiPktpbmQgb2YgaW50ZXJlc3Rpbmcgd2hlbiB5b3UgdGhpbmsgYWJvdXQgaXQsIHJpZ2h0PzwvZGl2PgogICAgICAgICAgPC9kaXY+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPGRpdiBjbGFzcz0icGFnZS1udW0iPjU8L2Rpdj4KICAgICAgYDsKICAgIH0KCiAgICAKICAgIGlmIChpbnRlcmFjdGl2ZUluZGV4ID09PSAzICYmIHNpZGUgPT09ICdmcm9udCcpIHsKICAgICAgcmV0dXJuIGAKICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlNi1jb3JuZXIgdGwiPiYjMTAwODc7PC9kaXY+CiAgICAgICAgPGRpdiBjbGFzcz0icGFnZTYtY29ybmVyIHRyIj4mIzEwMDg3OzwvZGl2PgogICAgICAgIDxkaXYgY2xhc3M9InBhZ2U2LWNvcm5lciBibCI+JiMxMDA4Nzs8L2Rpdj4KICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlNi1jb3JuZXIgYnIiPiYjMTAwODc7PC9kaXY+CiAgICAgICAgPGRpdiBjbGFzcz0icGFnZTYtY29udGVudCI+CiAgICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlNi10ZXh0IHRvcCI+CiAgICAgICAgICAgIDxkaXYgY2xhc3M9InBhZ2U2LWxpbmUgdG9wLWxpbmUiPkFuZCBvZiBjb3Vyc2UsIEkgZGlkbid0IGZvcmdldCB5b3VyIGZhdm9yaXRlIGZsb3dlcnMuIFNvJmhlbGxpcDsgSSBicm91Z2h0IHlvdSBzb21lIHR1bGlwcyA8c3BhbiBjbGFzcz0icGFnZTYtdHVsaXAtZW1vamkiPiYjMTI3Nzk5OyYjNjUwMzg7PC9zcGFuPjwvZGl2PgogICAgICAgICAgPC9kaXY+CiAgICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlNi1jYW52YXMtd3JhcCIgaWQ9InA2Y2FudmFzIj48L2Rpdj4KICAgICAgICAgIDxkaXYgY2xhc3M9InBhZ2U2LXRleHQgYm90dG9tIj4KICAgICAgICAgICAgPGRpdiBjbGFzcz0icGFnZTYtbGluZSBib3R0b20tbGluZSI+SSBob3BlIHlvdSBsaWtlIHRoZW0gYW5kIHRoYXQgdGhleSBicmluZyBhIHNtaWxlIHRvIHlvdXIgZmFjZS48L2Rpdj4KICAgICAgICAgIDwvZGl2PgogICAgICAgIDwvZGl2PgogICAgICAgIDxkaXYgY2xhc3M9InBhZ2UtbnVtIj42PC9kaXY+CiAgICAgIGA7CiAgICB9CgogICAgCiAgICBpZiAoaW50ZXJhY3RpdmVJbmRleCA9PT0gMyAmJiBzaWRlID09PSAnYmFjaycpIHsKICAgICAgcmV0dXJuIGAKICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlNy1jb250ZW50Ij4KICAgICAgICAgIDxkaXYgY2xhc3M9InBhZ2U3LXRleHQiPgogICAgICAgICAgICA8cD5IYXBweSBCaXJ0aGRheSBIYWRlZWwuPC9wPgogICAgICAgICAgICA8cD5JIGhvcGUgdGhpcyB5ZWFyIGJyaW5ncyB5b3UgY2FsbSBkYXlzLCBjbGVhciB0aG91Z2h0cywgYW5kIGV2ZXJ5dGhpbmcgeW91JnJzcXVvO3ZlIGJlZW4gd2lzaGluZyBmb3IuPC9wPgogICAgICAgICAgICA8cD5JIGhvcGUgeW91IHN0YXkgc3Vycm91bmRlZCBieSBwZW9wbGUgYW5kIHRoaW5ncyB0aGF0IGZlZWwgcmlnaHQgZm9yIHlvdSwgYW5kIGJyaW5nIHlvdSBjb21mb3J0IGluc3RlYWQgb2YgcHJlc3N1cmUuPC9wPgogICAgICAgICAgICA8cD5UYWtlIHlvdXIgdGltZSB3aXRoIGV2ZXJ5dGhpbmcsIGFuZCBzbG93bHkgdGhpbmdzIHdpbGwgc3RhcnQgZmFsbGluZyBpbnRvIHBsYWNlLjwvcD4KICAgICAgICAgICAgPHA+V2lzaGluZyB5b3UgYSByZWFsbHkgZ29vZCB5ZWFyIGFoZWFkLjwvcD4KICAgICAgICAgIDwvZGl2PgogICAgICAgIDwvZGl2PgogICAgICAgIDxkaXYgY2xhc3M9InBhZ2UtbnVtIj43PC9kaXY+CiAgICAgIGA7CiAgICB9CgogICAgCiAgICBpZiAoaW50ZXJhY3RpdmVJbmRleCA9PT0gNCAmJiBzaWRlID09PSAnZnJvbnQnKSB7CiAgICAgIHJldHVybiBgCiAgICAgICAgPGRpdiBjbGFzcz0icGFnZTgtY29udGVudCI+CiAgICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlOC10ZXh0Ij5JIGhvcGUgdGhlIGNhbmRsZXMgb24geW91ciBjYWtlPGJyPmxpZ2h0IHVwIHRoZSA8c3BhbiBjbGFzcz0icGFnZTgtZW1waCI+c21pbGU8L3NwYW4+IG9uIHlvdXIgZmFjZSE8L2Rpdj4KICAgICAgICAgIDxpbWcgY2xhc3M9InBhZ2U4LWNha2UiIHNyYz0iaW1hZ2VzXFxjYWtlLnBuZyIgYWx0PSJCaXJ0aGRheSBjYWtlIHdpdGggY2FuZGxlcyI+CiAgICAgICAgICA8aHIgY2xhc3M9InBhZ2U4LWRpdmlkZXIiPgogICAgICAgICAgPGRpdiBjbGFzcz0icGFnZTgtZW5kdGV4dCI+VGhlIEVuZC48L2Rpdj4KICAgICAgICA8L2Rpdj4KICAgICAgICA8ZGl2IGNsYXNzPSJwYWdlLW51bSI+ODwvZGl2PgogICAgICBgOwogICAgfQoKICAgIGNvbnN0IG51bSA9IHNpZGUgPT09ICdmcm9udCcgPyBudW1zLmZyb250IDogbnVtcy5iYWNrOwogICAgY29uc3QgbnVtSHRtbCA9IG51bSAhPT0gbnVsbCA/IGA8ZGl2IGNsYXNzPSJwYWdlLW51bSI+JHtudW19PC9kaXY+YCA6ICcnOwogICAgcmV0dXJuIGRpdignJywgbnVtSHRtbCk7CiAgfQoKICBmdW5jdGlvbiBjb21wdXRlVHJhbnNmb3JtKGkpIHsKICAgIGNvbnN0IHNwYWNpbmcgPSAxLjI7CiAgICBjb25zdCBiYXNlWiAgID0gLTIyLjU7CgogICAgaWYgKGkgPD0gY3VycmVudCkgewogICAgICBjb25zdCBkZXB0aCAgICA9IGN1cnJlbnQgLSBpOwogICAgICBjb25zdCB6TGVmdCAgICA9IC0oYmFzZVogKyBpICogc3BhY2luZyk7CiAgICAgIGNvbnN0IGFuZ2xlTGVmdCA9IC0xNzAgKyAoaSAqIDAuMyk7CiAgICAgIGNvbnN0IHNjYWxlICAgID0gMSArIGRlcHRoICogMC4wMDE1OwogICAgICByZXR1cm4gYHJvdGF0ZVkoJHthbmdsZUxlZnR9ZGVnKSB0cmFuc2xhdGVaKCR7ekxlZnR9cHgpIHNjYWxlKCR7c2NhbGV9KWA7CiAgICB9IGVsc2UgewogICAgICBjb25zdCBkZXB0aCAgICAgPSBpIC0gKGN1cnJlbnQgKyAxKTsKICAgICAgY29uc3QgelJpZ2h0ICAgID0gYmFzZVogKyAoVE9UQUxfUEFHRVMgLSBpICsgMSkgKiBzcGFjaW5nOwogICAgICBjb25zdCBhbmdsZVJpZ2h0ID0gLTEwIC0gKFRPVEFMX1BBR0VTIC0gaSArIDEpICogMC4zOwogICAgICBjb25zdCBzY2FsZSAgICAgPSAxICsgZGVwdGggKiAwLjAwMTU7CiAgICAgIHJldHVybiBgcm90YXRlWSgke2FuZ2xlUmlnaHR9ZGVnKSB0cmFuc2xhdGVaKCR7elJpZ2h0fXB4KSBzY2FsZSgke3NjYWxlfSlgOwogICAgfQogIH0KCiAgCiAgY29uc3QgcGFnZUVscyA9IFtdOwoKICBmb3IgKGxldCBpID0gMTsgaSA8PSBUT1RBTF9QQUdFUzsgaSsrKSB7CiAgICBjb25zdCBpc1RyYW5zaXRpb24gID0gKGkgPT09IE5VTV9CRUZPUkUpOwogICAgY29uc3QgaXNJbnRlcmFjdGl2ZSA9IChpID4gTlVNX0JFRk9SRSAmJiBpIDw9IE5VTV9CRUZPUkUgKyBOVU1fSU5URVJBQ1RJVkUpOwogICAgY29uc3QgaXNEdW1teSAgICAgICA9ICFpc1RyYW5zaXRpb24gJiYgIWlzSW50ZXJhY3RpdmU7CgogICAgCiAgICBsZXQgaW50ZXJJZHggPSBudWxsOwogICAgaWYgKGlzVHJhbnNpdGlvbikgICBpbnRlcklkeCA9IDA7CiAgICBpZiAoaXNJbnRlcmFjdGl2ZSkgIGludGVySWR4ID0gaSAtIE5VTV9CRUZPUkU7CgogICAgY29uc3QgZnJvbnRIdG1sID0gbWFrZUZhY2VDb250ZW50KCdmcm9udCcsIGludGVySWR4KTsKICAgIGNvbnN0IGJhY2tIdG1sICA9IG1ha2VGYWNlQ29udGVudCgnYmFjaycsICBpbnRlcklkeCk7CgogICAgY29uc3QgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsKICAgIGVsLmNsYXNzTmFtZSA9ICdwYWdlJyArIChpc0R1bW15ID8gJyBkdW1teScgOiAnJykgKyAoKGlzSW50ZXJhY3RpdmUgfHwgaXNUcmFuc2l0aW9uKSA/ICcgbnVtYmVyZWQnIDogJycpOwogICAgZWwuaWQgPSBgcCR7aX1gOwogICAgZWwuc3R5bGUudHJhbnNmb3JtID0gY29tcHV0ZVRyYW5zZm9ybShpKTsKICAgIGVsLmlubmVySFRNTCA9IGAKICAgICAgPGRpdiBjbGFzcz0iZmFjZSBmcm9udCI+JHtmcm9udEh0bWx9PC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9ImZhY2UgYmFjayI+JHtiYWNrSHRtbH08L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0iZWRnZSByaWdodCI+PC9kaXY+CiAgICAgIDxkaXYgY2xhc3M9ImVkZ2UgdG9wIj48L2Rpdj4KICAgICAgPGRpdiBjbGFzcz0iZWRnZSBib3R0b20iPjwvZGl2PgogICAgYDsKCiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHsKICAgICAgY29uc3QgTUlOX0NVUlJFTlQgPSBOVU1fQkVGT1JFOwogICAgICBjb25zdCBNQVhfQ1VSUkVOVCA9IE5VTV9CRUZPUkUgKyAzOyAKCiAgICAgIAogICAgICAKICAgICAgaWYgKGkgPCBNSU5fQ1VSUkVOVCB8fCBpID4gTUFYX0NVUlJFTlQpIHJldHVybjsKCiAgICAgIGNvbnN0IHByZXYgPSBjdXJyZW50OwogICAgICBsZXQgbmV4dCA9IChpID4gY3VycmVudCkgPyBpIDogaSAtIDE7CiAgICAgIG5leHQgPSBNYXRoLm1heChNSU5fQ1VSUkVOVCwgTWF0aC5taW4oTUFYX0NVUlJFTlQsIG5leHQpKTsKICAgICAgY3VycmVudCA9IG5leHQ7CiAgICAgIHVwZGF0ZVRyYW5zZm9ybXMoKTsKCiAgICAgIGNvbnN0IFBBR0UzX0xFQUYgPSBOVU1fQkVGT1JFICsgMTsgCiAgICAgIGNvbnN0IFBBR0U1X0xFQUYgPSBOVU1fQkVGT1JFICsgMjsgCgogICAgICAKICAgICAgaWYgKHByZXYgPT09IE5VTV9CRUZPUkUgJiYgY3VycmVudCA9PT0gUEFHRTNfTEVBRikgewogICAgICAgIGFybVBhZ2U0KCk7CiAgICAgIH0KICAgICAgCiAgICAgIGlmIChjdXJyZW50IDwgUEFHRTNfTEVBRiAmJiBwYWdlNEFybVRpbWVyKSB7CiAgICAgICAgY2xlYXJUaW1lb3V0KHBhZ2U0QXJtVGltZXIpOwogICAgICAgIHBhZ2U0QXJtVGltZXIgPSBudWxsOwogICAgICB9CgogICAgICAKICAgICAgCiAgICAgIGlmIChwcmV2ID09PSBQQUdFM19MRUFGICYmIGN1cnJlbnQgPT09IFBBR0U1X0xFQUYpIHsKICAgICAgICBhcm1QYWdlNSgpOwogICAgICB9CiAgICAgIAogICAgICBpZiAoY3VycmVudCA8IFBBR0U1X0xFQUYpIHsKICAgICAgICBpZiAocGFnZTVBcm1UaW1lcikgeyBjbGVhclRpbWVvdXQocGFnZTVBcm1UaW1lcik7IHBhZ2U1QXJtVGltZXIgPSBudWxsOyB9CiAgICAgICAgaWYgKHBhZ2U2QXJtVGltZXIpIHsgY2xlYXJUaW1lb3V0KHBhZ2U2QXJtVGltZXIpOyBwYWdlNkFybVRpbWVyID0gbnVsbDsgfQogICAgICB9CgogICAgICAKICAgICAgCiAgICAgIAogICAgICBpZiAocHJldiAhPT0gTUFYX0NVUlJFTlQgJiYgY3VycmVudCA9PT0gTUFYX0NVUlJFTlQpIHsKICAgICAgICB3aW5kb3cucGFyZW50LnBvc3RNZXNzYWdlKHsgdHlwZTogJ2Jvb2stbGFzdC1wYWdlJyB9LCAnKicpOwogICAgICB9CiAgICB9KTsKCiAgICB3cmFwLmFwcGVuZENoaWxkKGVsKTsKICAgIHBhZ2VFbHMucHVzaChlbCk7CiAgfQoKICAKICBmdW5jdGlvbiB1cGRhdGVUcmFuc2Zvcm1zKCkgewogICAgcGFnZUVscy5mb3JFYWNoKChlbCwgaWR4KSA9PiB7CiAgICAgIGVsLnN0eWxlLnRyYW5zZm9ybSA9IGNvbXB1dGVUcmFuc2Zvcm0oaWR4ICsgMSk7CiAgICB9KTsKICB9CgogIAogIGZ1bmN0aW9uIGluaXRQYWdlMlBhcnRpY2xlcyhjYW52YXMpIHsKICAgIGlmICghY2FudmFzKSByZXR1cm47CiAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTsKICAgIGNvbnN0IFcgPSBjYW52YXMub2Zmc2V0V2lkdGgsIEggPSBjYW52YXMub2Zmc2V0SGVpZ2h0OwogICAgY2FudmFzLndpZHRoID0gVzsgY2FudmFzLmhlaWdodCA9IEg7CiAgICBjb25zdCBwYXJ0aWNsZXMgPSBBcnJheS5mcm9tKHtsZW5ndGg6IDIyfSwgKCkgPT4gKHsKICAgICAgeDogTWF0aC5yYW5kb20oKSAqIFcsCiAgICAgIHk6IE1hdGgucmFuZG9tKCkgKiBILAogICAgICByOiBNYXRoLnJhbmRvbSgpICogMS41ICsgMC40LAogICAgICB2eDogKE1hdGgucmFuZG9tKCkgLSAwLjUpICogMC4xOCwKICAgICAgdnk6IC0oTWF0aC5yYW5kb20oKSAqIDAuMjUgKyAwLjA4KSwKICAgICAgYWxwaGE6IE1hdGgucmFuZG9tKCkgKiAwLjI1ICsgMC4wNSwKICAgIH0pKTsKICAgIGZ1bmN0aW9uIGRyYXcoKSB7CiAgICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgVywgSCk7CiAgICAgIHBhcnRpY2xlcy5mb3JFYWNoKHAgPT4gewogICAgICAgIGN0eC5iZWdpblBhdGgoKTsKICAgICAgICBjdHguYXJjKHAueCwgcC55LCBwLnIsIDAsIE1hdGguUEkgKiAyKTsKICAgICAgICBjdHguZmlsbFN0eWxlID0gYHJnYmEoNDIsMjksMjMsJHtwLmFscGhhfSlgOwogICAgICAgIGN0eC5maWxsKCk7CiAgICAgICAgcC54ICs9IHAudng7IHAueSArPSBwLnZ5OwogICAgICAgIGlmIChwLnkgPCAtNSkgeyBwLnkgPSBIICsgNTsgcC54ID0gTWF0aC5yYW5kb20oKSAqIFc7IH0KICAgICAgICBpZiAocC54IDwgLTUpIHAueCA9IFcgKyA1OwogICAgICAgIGlmIChwLnggPiBXICsgNSkgcC54ID0gLTU7CiAgICAgIH0pOwogICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZHJhdyk7CiAgICB9CiAgICBkcmF3KCk7CiAgfQoKICAKICBjb25zdCBwMm9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKCkgPT4gewogICAgY29uc3QgYyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwMmNhbnZhcycpOwogICAgaWYgKGMgJiYgIWMuZGF0YXNldC5pbml0KSB7CiAgICAgIGMuZGF0YXNldC5pbml0ID0gJzEnOwogICAgICBzZXRUaW1lb3V0KCgpID0+IGluaXRQYWdlMlBhcnRpY2xlcyhjKSwgMTAwKTsKICAgIH0KICAgIGNvbnN0IGM0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3A0Y2FudmFzJyk7CiAgICBpZiAoYzQgJiYgIWM0LmRhdGFzZXQuaW5pdCkgewogICAgICBjNC5kYXRhc2V0LmluaXQgPSAnMSc7CiAgICAgIHNldFRpbWVvdXQoKCkgPT4gaW5pdFBhZ2UyUGFydGljbGVzKGM0KSwgMTAwKTsKICAgIH0KICB9KTsKICBwMm9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Jvb2std3JhcCcpLCB7Y2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlfSk7CiAgCiAgc2V0VGltZW91dCgoKSA9PiB7CiAgICBjb25zdCBjID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3AyY2FudmFzJyk7CiAgICBpZiAoYyAmJiAhYy5kYXRhc2V0LmluaXQpIHsgYy5kYXRhc2V0LmluaXQgPSAnMSc7IGluaXRQYWdlMlBhcnRpY2xlcyhjKTsgfQogICAgY29uc3QgYzQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncDRjYW52YXMnKTsKICAgIGlmIChjNCAmJiAhYzQuZGF0YXNldC5pbml0KSB7IGM0LmRhdGFzZXQuaW5pdCA9ICcxJzsgaW5pdFBhZ2UyUGFydGljbGVzKGM0KTsgfQogIH0sIDIwMCk7Cgp9KSgpOwo8L3NjcmlwdD4KCjxzY3JpcHQgdHlwZT0ibW9kdWxlIj4KaW1wb3J0ICogYXMgVEhSRUUgZnJvbSAndGhyZWUnOwppbXBvcnQgeyBHTFRGTG9hZGVyIH0gZnJvbSAndGhyZWUvYWRkb25zL2xvYWRlcnMvR0xURkxvYWRlci5qcyc7Cgpjb25zdCBsb2FkZXIgPSBuZXcgR0xURkxvYWRlcigpOwpjb25zdCBpbml0ZWRDb250YWluZXJzID0gbmV3IFNldCgpOwoKZnVuY3Rpb24gY3JlYXRlTGlseVNjZW5lKGNvbnRhaW5lcklkLCBtb2RlbFVybCwgY29ybmVyKSB7CiAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY29udGFpbmVySWQpOwogIGlmICghY29udGFpbmVyIHx8IGluaXRlZENvbnRhaW5lcnMuaGFzKGNvbnRhaW5lcklkKSkgcmV0dXJuOwogIGluaXRlZENvbnRhaW5lcnMuYWRkKGNvbnRhaW5lcklkKTsKCiAgY29uc3Qgd2lkdGggID0gY29udGFpbmVyLmNsaWVudFdpZHRoICB8fCAyMDA7CiAgY29uc3QgaGVpZ2h0ID0gY29udGFpbmVyLmNsaWVudEhlaWdodCB8fCAyMDA7CgogIGNvbnN0IHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7CgogIGNvbnN0IGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSgyOCwgd2lkdGggLyBoZWlnaHQsIDAuMSwgMTAwKTsKICAKICBjYW1lcmEucG9zaXRpb24uc2V0KDAsIDUuMiwgMC4wMDEpOwogIGNhbWVyYS51cC5zZXQoMCwgMCwgLTEpOwogIGNhbWVyYS5sb29rQXQoMCwgMCwgMCk7CgogIGNvbnN0IHJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoeyBhbnRpYWxpYXM6IHRydWUsIGFscGhhOiB0cnVlIH0pOwogIHJlbmRlcmVyLnNldFBpeGVsUmF0aW8oTWF0aC5taW4od2luZG93LmRldmljZVBpeGVsUmF0aW8sIDIpKTsKICByZW5kZXJlci5zZXRTaXplKHdpZHRoLCBoZWlnaHQpOwogIHJlbmRlcmVyLnNldENsZWFyQ29sb3IoMHgwMDAwMDAsIDApOwogIHJlbmRlcmVyLm91dHB1dEVuY29kaW5nID0gVEhSRUUuc1JHQkVuY29kaW5nOwogIHJlbmRlcmVyLnNoYWRvd01hcC5lbmFibGVkID0gdHJ1ZTsKICByZW5kZXJlci5zaGFkb3dNYXAudHlwZSA9IFRIUkVFLlBDRlNvZnRTaGFkb3dNYXA7CiAgY29udGFpbmVyLmFwcGVuZENoaWxkKHJlbmRlcmVyLmRvbUVsZW1lbnQpOwoKICAKICBjb25zdCBhbWJpZW50ID0gbmV3IFRIUkVFLkFtYmllbnRMaWdodCgweGZmZjJkOCwgMS4xKTsKICBzY2VuZS5hZGQoYW1iaWVudCk7CgogIGNvbnN0IGtleSA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KDB4ZmZmNmUwLCAxLjUpOwogIGtleS5wb3NpdGlvbi5zZXQoMC45LCAzLCAwLjkpOwogIGtleS5jYXN0U2hhZG93ID0gdHJ1ZTsKICBrZXkuc2hhZG93Lm1hcFNpemUuc2V0KDEwMjQsIDEwMjQpOwogIGtleS5zaGFkb3cuY2FtZXJhLm5lYXIgPSAwLjU7CiAga2V5LnNoYWRvdy5jYW1lcmEuZmFyID0gODsKICBrZXkuc2hhZG93LmNhbWVyYS5sZWZ0ID0gLTEuNTsKICBrZXkuc2hhZG93LmNhbWVyYS5yaWdodCA9IDEuNTsKICBrZXkuc2hhZG93LmNhbWVyYS50b3AgPSAxLjU7CiAga2V5LnNoYWRvdy5jYW1lcmEuYm90dG9tID0gLTEuNTsKICBrZXkuc2hhZG93LmJpYXMgPSAtMC4wMDE1OwogIGtleS5zaGFkb3cucmFkaXVzID0gMzsKICBzY2VuZS5hZGQoa2V5KTsKCiAgY29uc3QgZmlsbCA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KDB4ZDhjOWE4LCAwLjQ1KTsKICBmaWxsLnBvc2l0aW9uLnNldCgtMC42LCAyLCAtMC42KTsKICBzY2VuZS5hZGQoZmlsbCk7CgogIAogIAogIGNvbnN0IHNoYWRvd0dyb3VuZCA9IG5ldyBUSFJFRS5NZXNoKAogICAgbmV3IFRIUkVFLlBsYW5lR2VvbWV0cnkoNiwgNiksCiAgICBuZXcgVEhSRUUuU2hhZG93TWF0ZXJpYWwoeyBvcGFjaXR5OiAwLjM1IH0pCiAgKTsKICBzaGFkb3dHcm91bmQucm90YXRpb24ueCA9IC1NYXRoLlBJIC8gMjsKICBzaGFkb3dHcm91bmQucG9zaXRpb24ueSA9IDA7CiAgc2hhZG93R3JvdW5kLnJlY2VpdmVTaGFkb3cgPSB0cnVlOwogIHNjZW5lLmFkZChzaGFkb3dHcm91bmQpOwoKICBsZXQgbWl4ZXIgPSBudWxsOwogIGNvbnN0IGNsb2NrID0gbmV3IFRIUkVFLkNsb2NrKCk7CgogIGxvYWRlci5sb2FkKG1vZGVsVXJsLCAoZ2x0ZikgPT4gewogICAgY29uc3QgbW9kZWwgPSBnbHRmLnNjZW5lOwoKICAgIAogICAgCiAgICBjb25zdCBib3ggPSBuZXcgVEhSRUUuQm94MygpLnNldEZyb21PYmplY3QobW9kZWwpOwogICAgY29uc3Qgc2l6ZSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7CiAgICBjb25zdCBjZW50ZXIgPSBuZXcgVEhSRUUuVmVjdG9yMygpOwogICAgYm94LmdldFNpemUoc2l6ZSk7CiAgICBib3guZ2V0Q2VudGVyKGNlbnRlcik7CgogICAgY29uc3QgbWF4RGltID0gTWF0aC5tYXgoc2l6ZS54LCBzaXplLnksIHNpemUueikgfHwgMTsKICAgIGNvbnN0IHNjYWxlID0gMS44IC8gbWF4RGltOwogICAgbW9kZWwuc2NhbGUuc2V0U2NhbGFyKHNjYWxlKTsKCiAgICAKICAgIGNvbnN0IGJveDIgPSBuZXcgVEhSRUUuQm94MygpLnNldEZyb21PYmplY3QobW9kZWwpOwogICAgbW9kZWwucG9zaXRpb24ueCAtPSAoYm94Mi5taW4ueCArIGJveDIubWF4LngpIC8gMjsKICAgIG1vZGVsLnBvc2l0aW9uLnogLT0gKGJveDIubWluLnogKyBib3gyLm1heC56KSAvIDI7CiAgICBtb2RlbC5wb3NpdGlvbi55IC09IGJveDIubWluLnk7IAoKICAgIAogICAgbW9kZWwucm90YXRpb24ueSA9IGNvcm5lciA9PT0gJ3RsJyA/IDAuMzUgOiAtMC4zNTsKCiAgICBtb2RlbC50cmF2ZXJzZSgoY2hpbGQpID0+IHsKICAgICAgaWYgKGNoaWxkLmlzTWVzaCkgewogICAgICAgIGNoaWxkLmNhc3RTaGFkb3cgPSB0cnVlOwogICAgICAgIGNoaWxkLnJlY2VpdmVTaGFkb3cgPSB0cnVlOwogICAgICAgIGlmIChjaGlsZC5tYXRlcmlhbCkgewogICAgICAgICAgCiAgICAgICAgICAKICAgICAgICAgIGNoaWxkLm1hdGVyaWFsLmZsYXRTaGFkaW5nID0gdHJ1ZTsKICAgICAgICAgIGNoaWxkLm1hdGVyaWFsLm5lZWRzVXBkYXRlID0gdHJ1ZTsKICAgICAgICB9CiAgICAgIH0KICAgIH0pOwoKICAgIHNjZW5lLmFkZChtb2RlbCk7CgogICAgaWYgKGdsdGYuYW5pbWF0aW9ucyAmJiBnbHRmLmFuaW1hdGlvbnMubGVuZ3RoKSB7CiAgICAgIG1peGVyID0gbmV3IFRIUkVFLkFuaW1hdGlvbk1peGVyKG1vZGVsKTsKICAgICAgY29uc3QgY2xpcCA9IGdsdGYuYW5pbWF0aW9uc1swXTsKICAgICAgY29uc3QgYWN0aW9uID0gbWl4ZXIuY2xpcEFjdGlvbihjbGlwKTsKICAgICAgYWN0aW9uLnNldExvb3AoVEhSRUUuTG9vcE9uY2UpOwogICAgICBhY3Rpb24uY2xhbXBXaGVuRmluaXNoZWQgPSB0cnVlOwogICAgICBhY3Rpb24ucGxheSgpOwogICAgICAKICAgICAgCiAgICAgIGFjdGlvbi5wYXVzZWQgPSB0cnVlOwogICAgICB3aW5kb3cuX19wYWdlNVBlbmRpbmdBY3Rpb25zID0gd2luZG93Ll9fcGFnZTVQZW5kaW5nQWN0aW9ucyB8fCBbXTsKICAgICAgd2luZG93Ll9fcGFnZTVQZW5kaW5nQWN0aW9ucy5wdXNoKGFjdGlvbik7CiAgICB9CiAgfSk7CgogIGZ1bmN0aW9uIGFuaW1hdGUoKSB7CiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZSk7CiAgICBjb25zdCBkZWx0YSA9IGNsb2NrLmdldERlbHRhKCk7CiAgICBpZiAobWl4ZXIpIG1peGVyLnVwZGF0ZShkZWx0YSk7CiAgICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7CiAgfQogIGFuaW1hdGUoKTsKCiAgCiAgY29uc3QgcmVzaXplT2JzZXJ2ZXIgPSBuZXcgUmVzaXplT2JzZXJ2ZXIoKCkgPT4gewogICAgY29uc3QgdyA9IGNvbnRhaW5lci5jbGllbnRXaWR0aCwgaCA9IGNvbnRhaW5lci5jbGllbnRIZWlnaHQ7CiAgICBpZiAodyA9PT0gMCB8fCBoID09PSAwKSByZXR1cm47CiAgICBjYW1lcmEuYXNwZWN0ID0gdyAvIGg7CiAgICBjYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpOwogICAgcmVuZGVyZXIuc2V0U2l6ZSh3LCBoKTsKICB9KTsKICByZXNpemVPYnNlcnZlci5vYnNlcnZlKGNvbnRhaW5lcik7Cn0KCgoKY29uc3QgcDVPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHsKICBjcmVhdGVMaWx5U2NlbmUoJ3A1Y2FudmFzLXRsJywgJ21vZGVsc1xcd2F0ZXJfbGlseV90b3AuZ2xiJywgJ3RsJyk7CiAgY3JlYXRlTGlseVNjZW5lKCdwNWNhbnZhcy1icicsICdtb2RlbHNcXHdhdGVyX2xpbHlfYm90dG9tLmdsYicsICdicicpOwp9KTsKY29uc3QgYm9va1dyYXAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYm9vay13cmFwJyk7CmlmIChib29rV3JhcCkgewogIHA1T2JzZXJ2ZXIub2JzZXJ2ZShib29rV3JhcCwgeyBjaGlsZExpc3Q6IHRydWUsIHN1YnRyZWU6IHRydWUgfSk7Cn0Kc2V0VGltZW91dCgoKSA9PiB7CiAgY3JlYXRlTGlseVNjZW5lKCdwNWNhbnZhcy10bCcsICdtb2RlbHNcXHdhdGVyX2xpbHlfdG9wLmdsYicsICd0bCcpOwogIGNyZWF0ZUxpbHlTY2VuZSgncDVjYW52YXMtYnInLCAnbW9kZWxzXFx3YXRlcl9saWx5X2JvdHRvbS5nbGInLCAnYnInKTsKfSwgMjAwKTsKCgpmdW5jdGlvbiBjcmVhdGVUdWxpcFNjZW5lKGNvbnRhaW5lcklkLCBtb2RlbFVybCkgewogIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNvbnRhaW5lcklkKTsKICBpZiAoIWNvbnRhaW5lciB8fCBpbml0ZWRDb250YWluZXJzLmhhcyhjb250YWluZXJJZCkpIHJldHVybjsKICBpbml0ZWRDb250YWluZXJzLmFkZChjb250YWluZXJJZCk7CgogIGNvbnN0IHdpZHRoICA9IGNvbnRhaW5lci5jbGllbnRXaWR0aCAgfHwgMjAwOwogIGNvbnN0IGhlaWdodCA9IGNvbnRhaW5lci5jbGllbnRIZWlnaHQgfHwgMjAwOwoKICBjb25zdCBzY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpOwoKICAKICAKICBjb25zdCBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoMzAsIHdpZHRoIC8gaGVpZ2h0LCAwLjEsIDEwMCk7CiAgY2FtZXJhLnVwLnNldCgwLCAwLCAtMSk7CiAgbGV0IG1vZGVsUmVmID0gbnVsbDsKCiAgZnVuY3Rpb24gZml0Q2FtZXJhVG9Nb2RlbChtb2RlbCkgewogICAgY29uc3QgYm94ID0gbmV3IFRIUkVFLkJveDMoKS5zZXRGcm9tT2JqZWN0KG1vZGVsKTsKICAgIGNvbnN0IHNpemUgPSBuZXcgVEhSRUUuVmVjdG9yMygpOwogICAgY29uc3QgY2VudGVyID0gbmV3IFRIUkVFLlZlY3RvcjMoKTsKICAgIGJveC5nZXRTaXplKHNpemUpOwogICAgYm94LmdldENlbnRlcihjZW50ZXIpOwoKICAgIGNvbnN0IG1hcmdpbiA9IDEuMTg7IAogICAgY29uc3QgdkZvdiA9IFRIUkVFLk1hdGhVdGlscy5kZWdUb1JhZChjYW1lcmEuZm92KTsKICAgIGNvbnN0IGRpc3RGb3JIZWlnaHQgPSAoc2l6ZS55IC8gMikgLyBNYXRoLnRhbih2Rm92IC8gMik7CiAgICBjb25zdCBoRm92ID0gMiAqIE1hdGguYXRhbihNYXRoLnRhbih2Rm92IC8gMikgKiBjYW1lcmEuYXNwZWN0KTsKICAgIGNvbnN0IGRpc3RGb3JXaWR0aCA9IChzaXplLnggLyAyKSAvIE1hdGgudGFuKGhGb3YgLyAyKTsKICAgIGNvbnN0IGRpc3QgPSBNYXRoLm1heChkaXN0Rm9ySGVpZ2h0LCBkaXN0Rm9yV2lkdGgpICogbWFyZ2luOwoKICAgIAogICAgY2FtZXJhLnBvc2l0aW9uLnNldChjZW50ZXIueCwgY2VudGVyLnkgKyBkaXN0LCBjZW50ZXIueiArIDAuMDAxKTsKICAgIGNhbWVyYS5sb29rQXQoY2VudGVyLngsIGNlbnRlci55LCBjZW50ZXIueik7CiAgICBjYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpOwogIH0KCiAgY29uc3QgcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcih7IGFudGlhbGlhczogdHJ1ZSwgYWxwaGE6IHRydWUgfSk7CiAgcmVuZGVyZXIuc2V0UGl4ZWxSYXRpbyhNYXRoLm1pbih3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbywgMikpOwogIHJlbmRlcmVyLnNldFNpemUod2lkdGgsIGhlaWdodCk7CiAgcmVuZGVyZXIuc2V0Q2xlYXJDb2xvcigweDAwMDAwMCwgMCk7CiAgcmVuZGVyZXIub3V0cHV0RW5jb2RpbmcgPSBUSFJFRS5zUkdCRW5jb2Rpbmc7CiAgcmVuZGVyZXIuc2hhZG93TWFwLmVuYWJsZWQgPSB0cnVlOwogIHJlbmRlcmVyLnNoYWRvd01hcC50eXBlID0gVEhSRUUuUENGU29mdFNoYWRvd01hcDsKICBjb250YWluZXIuYXBwZW5kQ2hpbGQocmVuZGVyZXIuZG9tRWxlbWVudCk7CgogIAogIAogIAogIAogIGNvbnN0IGtleSA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KDB4ZmZmNmUwLCAyLjMpOwogIGtleS5wb3NpdGlvbi5zZXQoMS40LCAzLCAwLjkpOwogIGtleS50YXJnZXQucG9zaXRpb24uc2V0KDAsIDAsIDApOwogIHNjZW5lLmFkZChrZXkudGFyZ2V0KTsKICBrZXkuY2FzdFNoYWRvdyA9IHRydWU7CiAga2V5LnNoYWRvdy5tYXBTaXplLnNldCgyMDQ4LCAyMDQ4KTsKICBrZXkuc2hhZG93LmNhbWVyYS5uZWFyID0gMC41OwogIGtleS5zaGFkb3cuY2FtZXJhLmZhciA9IDEwOwogIGtleS5zaGFkb3cuY2FtZXJhLmxlZnQgPSAtMS41OwogIGtleS5zaGFkb3cuY2FtZXJhLnJpZ2h0ID0gMS41OwogIGtleS5zaGFkb3cuY2FtZXJhLnRvcCA9IDEuNTsKICBrZXkuc2hhZG93LmNhbWVyYS5ib3R0b20gPSAtMS41OwogIGtleS5zaGFkb3cuYmlhcyA9IC0wLjAwMTU7CiAga2V5LnNoYWRvdy5yYWRpdXMgPSAzOwogIHNjZW5lLmFkZChrZXkpOwoKICAKICAKICBjb25zdCBhbWJpZW50ID0gbmV3IFRIUkVFLkFtYmllbnRMaWdodCgweGZmZjJkOCwgMC40KTsKICBzY2VuZS5hZGQoYW1iaWVudCk7CgogIAogIAogIAogIGNvbnN0IHNoYWRvd1dhbGwgPSBuZXcgVEhSRUUuTWVzaCgKICAgIG5ldyBUSFJFRS5QbGFuZUdlb21ldHJ5KDYsIDYpLAogICAgbmV3IFRIUkVFLlNoYWRvd01hdGVyaWFsKHsgb3BhY2l0eTogMC4yNSB9KQogICk7CiAgc2hhZG93V2FsbC5yZWNlaXZlU2hhZG93ID0gdHJ1ZTsKICBzY2VuZS5hZGQoc2hhZG93V2FsbCk7CgogIAogIAogIAogIGNvbnN0IHNoYWRvd0dyb3VuZCA9IG5ldyBUSFJFRS5NZXNoKAogICAgbmV3IFRIUkVFLlBsYW5lR2VvbWV0cnkoNiwgNiksCiAgICBuZXcgVEhSRUUuU2hhZG93TWF0ZXJpYWwoeyBvcGFjaXR5OiAwLjM3IH0pCiAgKTsKICBzaGFkb3dHcm91bmQucm90YXRpb24ueCA9IC1NYXRoLlBJIC8gMjsKICBzaGFkb3dHcm91bmQucG9zaXRpb24ueSA9IDAuMDAxOwogIHNoYWRvd0dyb3VuZC5yZWNlaXZlU2hhZG93ID0gdHJ1ZTsKICBzY2VuZS5hZGQoc2hhZG93R3JvdW5kKTsKCiAgbGV0IG1peGVyID0gbnVsbDsKICBjb25zdCBjbG9jayA9IG5ldyBUSFJFRS5DbG9jaygpOwoKICBsb2FkZXIubG9hZChtb2RlbFVybCwgKGdsdGYpID0+IHsKICAgIGNvbnN0IG1vZGVsID0gZ2x0Zi5zY2VuZTsKCiAgICBjb25zdCBib3ggPSBuZXcgVEhSRUUuQm94MygpLnNldEZyb21PYmplY3QobW9kZWwpOwogICAgY29uc3Qgc2l6ZSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7CiAgICBib3guZ2V0U2l6ZShzaXplKTsKCiAgICAKICAgIAogICAgY29uc3QgbWF4RGltID0gTWF0aC5tYXgoc2l6ZS54LCBzaXplLnksIHNpemUueikgfHwgMTsKICAgIGNvbnN0IHNjYWxlID0gMS41IC8gbWF4RGltOwogICAgbW9kZWwuc2NhbGUuc2V0U2NhbGFyKHNjYWxlKTsKCiAgICAKICAgIAogICAgCiAgICBtb2RlbC5yb3RhdGlvbi54ID0gMDsKICAgIG1vZGVsLnJvdGF0aW9uLnkgPSAtMC4xNTsKCiAgICAKICAgIAogICAgY29uc3QgYm94MiA9IG5ldyBUSFJFRS5Cb3gzKCkuc2V0RnJvbU9iamVjdChtb2RlbCk7CiAgICBtb2RlbC5wb3NpdGlvbi54IC09IChib3gyLm1pbi54ICsgYm94Mi5tYXgueCkgLyAyOwogICAgbW9kZWwucG9zaXRpb24ueiAtPSAoYm94Mi5taW4ueiArIGJveDIubWF4LnopIC8gMjsKICAgIG1vZGVsLnBvc2l0aW9uLnkgLT0gYm94Mi5taW4ueTsKCiAgICAKICAgIAogICAgY29uc3QgYm94MyA9IG5ldyBUSFJFRS5Cb3gzKCkuc2V0RnJvbU9iamVjdChtb2RlbCk7CiAgICBjb25zdCBmZXdDbUdhcCA9IDAuMTU7IAogICAgc2hhZG93V2FsbC5wb3NpdGlvbi56ID0gYm94My5taW4ueiAtIGZld0NtR2FwOwogICAgc2hhZG93V2FsbC5wb3NpdGlvbi55ID0gYm94My5tYXgueSAvIDI7CgogICAgbW9kZWwudHJhdmVyc2UoKGNoaWxkKSA9PiB7CiAgICAgIGlmIChjaGlsZC5pc01lc2gpIHsKICAgICAgICBjaGlsZC5jYXN0U2hhZG93ID0gdHJ1ZTsKICAgICAgICBjaGlsZC5yZWNlaXZlU2hhZG93ID0gdHJ1ZTsKICAgICAgfQogICAgfSk7CgogICAgc2NlbmUuYWRkKG1vZGVsKTsKICAgIG1vZGVsUmVmID0gbW9kZWw7CiAgICBmaXRDYW1lcmFUb01vZGVsKG1vZGVsKTsKCiAgICBpZiAoZ2x0Zi5hbmltYXRpb25zICYmIGdsdGYuYW5pbWF0aW9ucy5sZW5ndGgpIHsKICAgICAgbWl4ZXIgPSBuZXcgVEhSRUUuQW5pbWF0aW9uTWl4ZXIobW9kZWwpOwogICAgICBjb25zdCBjbGlwID0gZ2x0Zi5hbmltYXRpb25zWzBdOwogICAgICBjb25zdCBhY3Rpb24gPSBtaXhlci5jbGlwQWN0aW9uKGNsaXApOwogICAgICBhY3Rpb24uc2V0TG9vcChUSFJFRS5Mb29wT25jZSk7CiAgICAgIGFjdGlvbi5jbGFtcFdoZW5GaW5pc2hlZCA9IHRydWU7CiAgICAgIGFjdGlvbi5wbGF5KCk7CiAgICB9CiAgfSk7CgogIGZ1bmN0aW9uIGFuaW1hdGUoKSB7CiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZSk7CiAgICBjb25zdCBkZWx0YSA9IGNsb2NrLmdldERlbHRhKCk7CiAgICBpZiAobWl4ZXIpIG1peGVyLnVwZGF0ZShkZWx0YSk7CiAgICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7CiAgfQogIGFuaW1hdGUoKTsKCiAgY29uc3QgcmVzaXplT2JzZXJ2ZXIgPSBuZXcgUmVzaXplT2JzZXJ2ZXIoKCkgPT4gewogICAgY29uc3QgdyA9IGNvbnRhaW5lci5jbGllbnRXaWR0aCwgaCA9IGNvbnRhaW5lci5jbGllbnRIZWlnaHQ7CiAgICBpZiAodyA9PT0gMCB8fCBoID09PSAwKSByZXR1cm47CiAgICBjYW1lcmEuYXNwZWN0ID0gdyAvIGg7CiAgICByZW5kZXJlci5zZXRTaXplKHcsIGgpOwogICAgaWYgKG1vZGVsUmVmKSBmaXRDYW1lcmFUb01vZGVsKG1vZGVsUmVmKTsKICAgIGVsc2UgY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTsKICB9KTsKICByZXNpemVPYnNlcnZlci5vYnNlcnZlKGNvbnRhaW5lcik7Cn0KCmNvbnN0IHA2T2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigoKSA9PiB7CiAgY3JlYXRlVHVsaXBTY2VuZSgncDZjYW52YXMnLCAnbW9kZWxzXFx0dWxpcHMuZ2xiJyk7Cn0pOwppZiAoYm9va1dyYXApIHsKICBwNk9ic2VydmVyLm9ic2VydmUoYm9va1dyYXAsIHsgY2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlIH0pOwp9CnNldFRpbWVvdXQoKCkgPT4gewogIGNyZWF0ZVR1bGlwU2NlbmUoJ3A2Y2FudmFzJywgJ21vZGVsc1xcdHVsaXBzLmdsYicpOwp9LCAyMDApOwoKPC9zY3JpcHQ+CjwvYm9keT4KPC9odG1sPg==";

/* ---- Vintage book overlay interaction ---- */
import * as THREE_BOOK from 'three';

const bookOverlay  = document.getElementById('book-overlay');
const bookFrame     = document.getElementById('book-frame');
const bookCloseBtn = document.getElementById('book-close-btn');
const sceneWrapEl   = document.getElementById('scene-wrap');

let bookFrameLoaded = false;

function openBook() {
  bookOverlay.classList.add('active');
  sceneWrapEl.classList.add('scene-blurred');
}

function closeBook() {
  bookOverlay.classList.remove('active');
  sceneWrapEl.classList.remove('scene-blurred');
}

/* Preload the book's iframe content immediately so it's ready before the
   loading screen disappears, and count it toward the loading progress bar. */
loadingManager.itemStart('interactive-book');
const binary = atob(window.BOOK_HTML_B64);
const bytes  = Uint8Array.from(binary, (c) => c.charCodeAt(0));
bookFrame.addEventListener('load', () => {
  bookFrameLoaded = true;
  loadingManager.itemEnd('interactive-book');
}, { once: true });
bookFrame.srcdoc = new TextDecoder('utf-8').decode(bytes);

window.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'book-last-page') return;
  const deskBook  = window.__vintageBookDeskGroup;
  const shelfBook = window.__vintageBookShelfGroup;
  const bouquet   = window.__deskBouquetGroup;
  if (deskBook)  deskBook.visible  = false;
  if (shelfBook) shelfBook.visible = true;
  if (bouquet)   bouquet.visible   = true;
});

bookCloseBtn.addEventListener('click', closeBook);
bookOverlay.addEventListener('mousedown', (e) => {
  if (e.target === bookOverlay) closeBook();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && bookOverlay.classList.contains('active')) closeBook();
});

function initVintageBookInteraction() {
  if (!window.__sceneRefs) { requestAnimationFrame(initVintageBookInteraction); return; }
  const { scene, camera, renderer } = window.__sceneRefs;

  const raycaster = new THREE_BOOK.Raycaster();
  const pointer = new THREE_BOOK.Vector2();

  function getBookGroup() {
    
    
    const desk  = scene.getObjectByName('VintageBook');
    const shelf = scene.getObjectByName('VintageBookShelf');
    if (desk && desk.visible)  return desk;
    if (shelf && shelf.visible) return shelf;
    return null;
  }

  function setPointer(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  renderer.domElement.addEventListener('click', (e) => {
    if (bookOverlay.classList.contains('active')) return;
    const bookGroup = getBookGroup();
    if (!bookGroup || bookGroup.children.length === 0) return;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(bookGroup, true);
    if (hits.length > 0) openBook();
  });

  renderer.domElement.addEventListener('pointermove', (e) => {
    if (bookOverlay.classList.contains('active')) return;
    const bookGroup = getBookGroup();
    if (!bookGroup || bookGroup.children.length === 0) return;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(bookGroup, true);
    sceneWrapEl.classList.toggle('book-hoverable', hits.length > 0);
  });
}
initVintageBookInteraction();
