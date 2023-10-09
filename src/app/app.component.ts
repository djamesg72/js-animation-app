import { Component, OnInit } from '@angular/core';
import * as TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

@Component({
  selector: 'app-animation',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  // Scene, camera, and renderer
  private scene: THREE.Scene | undefined;
  private camera: THREE.PerspectiveCamera | undefined;
  private renderer: THREE.WebGLRenderer | undefined;

  // Cube and sphere objects
  private box: THREE.Group<THREE.Object3DEventMap> | undefined;
  private sphere: THREE.Mesh | undefined;

  // Mouse position
  private mouseX = 0;
  private mouseY = 0;

  // Added Object Array
  private newMeshes: THREE.Group<THREE.Object3DEventMap>[] = [];
  private rotationVectors: THREE.Vector3[] = [];

  private boxData: GLTF | undefined;
  private boxBumped = 0;

  //add Loader
  private loader = new GLTFLoader();

  async ngOnInit() {
    // Create the scene, camera, and renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 100);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    // const axesHelper = new THREE.AxesHelper(5);
    // this.scene.add(axesHelper);

    window.addEventListener('resize',()=> {
      // Update the renderer's size to match the new window size
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      this.renderer!.setSize(newWidth, newHeight);
    
      // Update the camera's aspect ratio
      this.camera!.aspect = newWidth / newHeight;
      this.camera!.updateProjectionMatrix();
    });

    this.camera.position.y = 3;
    this.camera.position.z = 10;
    // Create the cube and sphere objects
    this.box = await this.AddTreasureBox();

    
    // Set the ambient light color and intensity
    const ambientLight = new THREE.AmbientLight(new THREE.Color(1,1,1),2);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(new THREE.Color(1,1,0.2),10,10);
    pointLight.position.set(0.3,1.7,0);
    const pointLight2 = new THREE.PointLight(new THREE.Color(1,1,0.2),7,10);
    pointLight2.position.set(-0.6,1.5,0.4);
    const pointLight3 = new THREE.PointLight(new THREE.Color(1,1,0.2),10,10);
    pointLight3.position.set(1.3,1.6,0);
  
    this.box.children[0].add(pointLight);
    this.box.children[0].add(pointLight2);
    this.box.children[0].add(pointLight3);


    // const spotLight = new THREE.SpotLight(new THREE.Color(1,1,0),1,2,Math.PI/4,0.5,2);
    // this.scene.add(spotLight);
    
    // Set the background color of the scene
    this.scene.background = new THREE.Color(new THREE.Color(0,0.1,0)); 

    // Create a plane geometry
    const planeGeometry = new THREE.PlaneGeometry(100, 100); // Width and height of the plane
    // Create a material (e.g., Lambert or Phong)
    const material = new THREE.MeshLambertMaterial({ color: 0x008000 }); // Green color
    // Create a mesh by combining the geometry and material
    const plane = new THREE.Mesh(planeGeometry, material);
    // Rotate the plane to make it horizontal (optional)
    plane.rotation.x = 0;
    // position the plane to make it horizontal (optional)
    plane.position.z = -10;
    // Add the plane to the scene
    plane.layers.disableAll();
    plane.material.blending = 2;
    this.scene.add(plane);


    // Pause all animations
    this.boxData!.userData.mixer.timeScale = 0;


    // Add event listeners
    document.addEventListener('mousemove', (event) => {
      this.mouseX = event.clientX;
      this.mouseY = event.clientY;
    });

    document.addEventListener('click', (event) => {
      // Make the sphere bounce when clicked

      //Add Present Box on Mouse Location
        // Get the mouse click coordinates
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        // Create a raycaster
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera!);

        // Intersect the raycaster with objects in the scene
        const intersects = raycaster.intersectObjects(this.scene!.children);
        if(raycaster.intersectObject(this.box!)){
          this.BumpTreasureBox();
        };

        let i = 0;
        this.newMeshes.forEach(model=> {
          if(raycaster.intersectObject(model)){
            this.rotationVectors[i].x = (Math.random() - 0.5 )* 0.02;
            this.rotationVectors[i].y = (Math.random() - 0.5 )* 0.02;
            if(i == 1) {

            }
          }
          i+=1;
        });

        // Check if there are any intersections
        if (intersects.length > 0) {
          // Load a 3D mesh where the mouse was clicked
          // this.AddBox(intersects[0].point);
        }
    });

    // Start the render loop
    this.render();
  }

  render() {
    // Update the cube's rotation
    if(this.boxBumped < 3) {
      this.box!.rotation.y += 0.001;
    }
    
    //animate newly added meshes
    let i = 0;
    this.newMeshes.forEach(model=> {
      model.rotation.x += this.rotationVectors[i].x;
      model.rotation.y += this.rotationVectors[i].y;
      i+=1;
    });
    // Update the model's animations
    this.boxData!.userData.mixer.update(0.01);

    // Render the scene
    this.renderer!.render(this.scene!, this.camera!);
    
    // Update the Tween.js animations
    TWEEN.update();

    // Request the next animation frame
    requestAnimationFrame(this.render.bind(this));
  }

  private async AddTreasureBox() {
    const modelData = await this.loader.loadAsync('../assets/Chest.glb');
    this.boxData = modelData
    const model = modelData.scene;
    model.scale.set(2,2,2);
    model.rotation.x = Math.PI/9;

    // Set Up Model Animations
    this.setupModelAnimation(modelData);

    // Add the loaded model to your scene
    this.scene!.add(model);
    
    return model;
  }

  private BumpTreasureBox(){
    if(this.boxBumped < 3) {
      const rotateToZeroTween = new TWEEN.Tween(this.box!.rotation).to(new THREE.Vector3(Math.PI/6,0,0),200).easing(TWEEN.Easing.Quadratic.InOut).onComplete(()=>{ upscaleTween.start()})
      const upscaleTween = new TWEEN.Tween(this.box!.scale).to(new THREE.Vector3(2.2,2.2,2.2),200).easing(TWEEN.Easing.Cubic.In).onUpdate(()=> {
        this.box!.rotation.set(Math.PI/6,0,0);
      }).chain(new TWEEN.Tween(this.box!.scale).to(new THREE.Vector3(2,2,2),400).easing(TWEEN.Easing.Cubic.Out).onUpdate(()=> {
        this.box!.rotation.set(Math.PI/6,0,0);
      }))
      rotateToZeroTween.start();
      this.boxBumped += 1;
    }else if(this.boxBumped == 3){ 
      // Resume all animations
      this.boxBumped += 1;
      this.boxData!.userData.mixer.timeScale = 1;
      this.AddNewMeshes();
    }
  }

  private setupModelAnimation(modelData: GLTF) {
    // Create a mixer for the model
    const mixer = new THREE.AnimationMixer(modelData.scene);
    
    // Get all animations from the model
    const animations = modelData.animations;
  
    // Add each animation to the mixer
    mixer.clipAction(animations[1]).play();
    mixer.clipAction(animations[1]).setLoop(THREE.LoopOnce,1); 
    mixer.clipAction(animations[1]).clampWhenFinished = true
  
    // Store the mixer for later updates
    modelData.userData.mixer = mixer;
  }

  private async AddNewMeshes() {
    
    // Create a transform node (parent node)
    const transformNode = new THREE.Group();

    // Set the position, rotation, or scale of the transform node


    for (let i = 0; i < 4; i++) {
      const modelData = await this.loader.loadAsync('../assets/item-'+ i +'.glb');
      const model = modelData.scene;
      model.scale.set(0,0,0);
      model.position.set(0,0,0);
      // Set the GLB model as a child of the transform node
      // transformNode.add(model);

      this.newMeshes.push(model);
      this.rotationVectors.push(new THREE.Vector3((Math.random()-0.5)*0.001, (Math.random()-0.5)*0.01, 0));
  
      // Add the loaded model to your scene
      this.scene!.add(model);
      let scaleIndex = 1;
      if(i == 2) {
        scaleIndex = 0.2;
      }else if(i == 1){
        scaleIndex = 2;
      }
      const outOfBoxTween = new TWEEN.Tween(model.position).to(new THREE.Vector3(Math.random()*1 +i*3 - 5,Math.random()*2 +3, 2),3000).easing(TWEEN.Easing.Cubic.InOut);
      const outOfBoxTween2 = new TWEEN.Tween(model.scale).to(new THREE.Vector3(scaleIndex,scaleIndex,scaleIndex),3000).easing(TWEEN.Easing.Cubic.InOut);
      outOfBoxTween.start();
      outOfBoxTween2.start();
    }

    // Add the transform node to the scene
    this.scene!.add(transformNode);
  }
}