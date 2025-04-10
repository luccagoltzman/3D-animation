import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import * as THREE from 'three';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface EnginePartInfo {
  name: string;
  description: string;
  visible: boolean;
  object?: THREE.Object3D | null;
  color?: THREE.Color;
  originalColor?: THREE.Color;
  originalMaterial?: THREE.Material;
}

@Component({
  selector: 'app-scene3d',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scene3d.component.html',
  styleUrl: './scene3d.component.scss'
})
export class Scene3dComponent implements OnInit, AfterViewInit {
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;
  @ViewChild('customCursor', { static: true }) customCursor!: ElementRef;
  @ViewChild('partInfo', { static: true }) partInfo!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private animationId: number = 0;
  private mousePosition = { x: 0, y: 0 };
  private isMouseDown = false;
  private isBrowser: boolean;
  private engineModel: THREE.Group | null = null;
  private engineParts: EnginePartInfo[] = [
    { name: 'Motor', description: 'Bloco do motor: Componente principal que abriga os cilindros e componentes internos do motor.', visible: true },
    { name: 'Pistões', description: 'Pistões: Movem-se para cima e para baixo nos cilindros, convertendo a pressão dos gases em movimento rotativo.', visible: true },
    { name: 'Virabrequim', description: 'Virabrequim: Converte o movimento linear dos pistões em movimento rotativo.', visible: true },
    { name: 'Cilindros', description: 'Cilindros: Câmaras onde ocorrem as explosões da mistura ar-combustível.', visible: true },
    { name: 'Cabeçote', description: 'Cabeçote: Parte superior do motor que sela os cilindros e contém válvulas e velas.', visible: true },
    { name: 'Válvulas', description: 'Válvulas: Controlam a entrada de ar/combustível e a saída dos gases de escapamento.', visible: true },
    { name: 'Comando de Válvulas', description: 'Comando de Válvulas: Sincroniza a abertura e fechamento das válvulas.', visible: true },
    { name: 'Coletor de Admissão', description: 'Coletor de Admissão: Distribui a mistura ar-combustível para os cilindros.', visible: true },
    { name: 'Sistema de Escape', description: 'Sistema de Escape: Direciona os gases resultantes da combustão para fora do motor.', visible: true },
    { name: 'Sistema de Refrigeração', description: 'Sistema de Refrigeração: Mantém a temperatura do motor em níveis operacionais adequados.', visible: true }
  ];
  private hoveredPart: EnginePartInfo | null = null;
  private loadingManager: THREE.LoadingManager = new THREE.LoadingManager();
  loadingPercentage: number = 0;
  
  private explodedView: boolean = false;
  private originalPositions: Map<THREE.Object3D, THREE.Vector3> = new Map();
  private highlightedMaterial = new THREE.MeshStandardMaterial({
    color: 0x3399ff,
    emissive: 0x3399ff,
    emissiveIntensity: 0.3,
    metalness: 0.8,
    roughness: 0.2
  });

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.setupLoadingManager();
      this.initScene();
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.setupRenderer();
      this.loadEngineModel();
      this.animate();
    }
  }

  private setupLoadingManager(): void {
    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      this.loadingPercentage = Math.floor((itemsLoaded / itemsTotal) * 100);
      console.log(`Carregando modelo 3D: ${this.loadingPercentage}%`);
    };

    this.loadingManager.onLoad = () => {
      console.log('Modelo 3D carregado com sucesso!');
    };

    this.loadingManager.onError = (url) => {
      console.error('Erro ao carregar:', url);
    };
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isBrowser) return;

    // Atualizar posição do cursor customizado
    this.mousePosition.x = event.clientX;
    this.mousePosition.y = event.clientY;
    this.updateCustomCursor();
    
    // Normalizar coordenadas do mouse (-1 a +1)
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Verificar se está sobre alguma parte do motor
    this.checkPartHover();
  }

  private checkPartHover(): void {
    if (!this.engineModel) return;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.engineModel.children, true);
    
    // Restaurar core original de peça anteriormente destacada
    if (this.hoveredPart && this.hoveredPart.object) {
      this.resetHighlight(this.hoveredPart.object);
      this.hoveredPart = null;
      this.hidePartInfo();
    }
    
    if (intersects.length > 0) {
      const object = this.findParentMesh(intersects[0].object);
      if (object) {
        const part = this.findEnginePartByObject(object);
        if (part) {
          this.hoveredPart = part;
          this.highlightPart(object);
          this.showPartInfo(part);
        }
      }
    }
  }

  private findParentMesh(object: THREE.Object3D): THREE.Object3D | null {
    let current = object;
    while (current && !(current instanceof THREE.Mesh) && current.parent) {
      current = current.parent;
    }
    return current instanceof THREE.Mesh ? current : object;
  }

  private findEnginePartByObject(object: THREE.Object3D): EnginePartInfo | null {
    // Em um modelo real, precisaríamos verificar nomes ou propriedades
    // específicas para identificar as partes do motor
    const partName = this.getPartNameFromObject(object);
    return partName ? this.engineParts.find(p => p.name.toLowerCase().includes(partName.toLowerCase())) || null : null;
  }

  private getPartNameFromObject(object: THREE.Object3D): string {
    // Esta é uma simplificação. Em um modelo real, você precisa examinar
    // os nomes dos objetos no modelo 3D para identificá-los corretamente
    const name = object.name.toLowerCase();
    
    if (name.includes('piston') || name.includes('pistao')) return 'Pistões';
    if (name.includes('block') || name.includes('bloco')) return 'Motor';
    if (name.includes('crank') || name.includes('virabr')) return 'Virabrequim';
    if (name.includes('cylinder') || name.includes('cilindr')) return 'Cilindros';
    if (name.includes('head') || name.includes('cabec')) return 'Cabeçote';
    if (name.includes('valve') || name.includes('valvul')) return 'Válvulas';
    if (name.includes('camshaft') || name.includes('coman')) return 'Comando de Válvulas';
    if (name.includes('intake') || name.includes('admiss')) return 'Coletor de Admissão';
    if (name.includes('exhaust') || name.includes('escap')) return 'Sistema de Escape';
    if (name.includes('cooling') || name.includes('refrig')) return 'Sistema de Refrigeração';
    
    // Se nenhuma correspondência for encontrada, use o nome do objeto como fallback
    return object.name;
  }

  private highlightPart(object: THREE.Object3D): void {
    if (object instanceof THREE.Mesh && object.material) {
      // Guardar material original
      if (!this.hoveredPart?.originalMaterial) {
        this.hoveredPart!.originalMaterial = object.material.clone();
      }
      
      // Aplicar material de destaque
      object.material = this.highlightedMaterial;
    }
    
    // Escalar um pouco o objeto para destacá-lo
    object.scale.multiplyScalar(1.05);
  }

  private resetHighlight(object: THREE.Object3D): void {
    // Restaurar escala original
    object.scale.set(1, 1, 1);
    
    // Restaurar material original
    if (object instanceof THREE.Mesh && this.hoveredPart?.originalMaterial) {
      object.material = this.hoveredPart.originalMaterial;
    }
  }

  private showPartInfo(part: EnginePartInfo): void {
    if (!this.partInfo || !this.partInfo.nativeElement) return;
    
    const infoElement = this.partInfo.nativeElement;
    infoElement.innerHTML = `
      <h3>${part.name}</h3>
      <p>${part.description}</p>
    `;
    
    infoElement.style.left = `${this.mousePosition.x + 20}px`;
    infoElement.style.top = `${this.mousePosition.y}px`;
    infoElement.style.display = 'block';
  }

  private hidePartInfo(): void {
    if (!this.partInfo || !this.partInfo.nativeElement) return;
    this.partInfo.nativeElement.style.display = 'none';
  }

  @HostListener('click')
  onClick(): void {
    if (!this.isBrowser || !this.hoveredPart || !this.hoveredPart.object) return;
    
    // Isolar o componente clicado (ocultar os outros componentes)
    this.engineParts.forEach(part => {
      if (part.object && part !== this.hoveredPart) {
        // Toggle de visibilidade
        part.visible = !part.visible;
        part.object.visible = part.visible;
      }
    });
  }

  @HostListener('dblclick')
  onDoubleClick(): void {
    if (!this.isBrowser) return;
    
    // Restaurar visibilidade de todas as partes
    this.engineParts.forEach(part => {
      if (part.object) {
        part.visible = true;
        part.object.visible = true;
      }
    });

    // Toggle do modo de "vista explodida"
    this.toggleExplodedView();
  }

  private toggleExplodedView(): void {
    if (!this.engineModel) return;
    
    this.explodedView = !this.explodedView;
    
    if (this.explodedView) {
      // Salvar posições originais e "explodir" o modelo
      this.engineModel.children.forEach((child, index) => {
        if (!this.originalPositions.has(child)) {
          this.originalPositions.set(child, child.position.clone());
        }
        
        // Deslocar cada parte em uma direção diferente
        const direction = new THREE.Vector3(
          Math.sin(index * 0.5) * 0.3,
          Math.cos(index * 0.5) * 0.3,
          (index % 2 === 0 ? 1 : -1) * 0.3
        ).normalize();
        
        // A distância do deslocamento depende do índice do componente
        const distance = 0.5 + (index * 0.2);
        child.position.copy(this.originalPositions.get(child)!.clone().add(direction.multiplyScalar(distance)));
      });
    } else {
      // Restaurar posições originais
      this.engineModel.children.forEach(child => {
        if (this.originalPositions.has(child)) {
          child.position.copy(this.originalPositions.get(child)!);
        }
      });
    }
  }

  @HostListener('mousedown')
  onMouseDown(): void {
    if (!this.isBrowser) return;

    this.isMouseDown = true;
    if (this.customCursor && this.customCursor.nativeElement) {
      this.customCursor.nativeElement.style.width = '15px';
      this.customCursor.nativeElement.style.height = '15px';
      this.customCursor.nativeElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    }
  }

  @HostListener('mouseup')
  onMouseUp(): void {
    if (!this.isBrowser) return;

    this.isMouseDown = false;
    if (this.customCursor && this.customCursor.nativeElement) {
      this.customCursor.nativeElement.style.width = '20px';
      this.customCursor.nativeElement.style.height = '20px';
      this.customCursor.nativeElement.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (!this.isBrowser || !this.camera || !this.renderer) return;
    
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private updateCustomCursor(): void {
    if (!this.isBrowser) return;

    if (this.customCursor && this.customCursor.nativeElement) {
      this.customCursor.nativeElement.style.left = `${this.mousePosition.x}px`;
      this.customCursor.nativeElement.style.top = `${this.mousePosition.y}px`;
    }
  }

  private initScene(): void {
    if (!this.isBrowser) return;

    // Criar cena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);

    // Criar câmera
    this.camera = new THREE.PerspectiveCamera(
      45, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    this.camera.position.set(0, 2, 5);

    // Adicionar luzes
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    this.scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight1.position.set(1, 1, 1);
    this.scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight2.position.set(-1, -1, -1);
    this.scene.add(directionalLight2);

    // Adicionar spotlight para destacar partes
    const spotlight = new THREE.SpotLight(0xffffff, 5);
    spotlight.position.set(3, 5, 2);
    spotlight.angle = Math.PI / 6;
    spotlight.penumbra = 0.1;
    spotlight.decay = 2;
    spotlight.distance = 50;
    this.scene.add(spotlight);
  }

  private setupRenderer(): void {
    if (!this.isBrowser) return;

    // Configurar renderizador
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Adicionar canvas ao container
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    // Configurar controles de órbita
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.7;
    this.controls.zoomSpeed = 1.0;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 10;
  }

  private loadEngineModel(): void {
    if (!this.isBrowser) return;

    // Para este exemplo, vamos usar um modelo de demonstração
    // Em um projeto real, você usaria seu próprio modelo de motor
    const loader = new GLTFLoader(this.loadingManager);
    
    // URL do modelo (substitua por um modelo real de motor)
    const modelUrl = 'assets/models/engine.glb';
    
    loader.load(
      modelUrl,
      (gltf) => {
        this.engineModel = gltf.scene;
        
        // Ajustar posição, rotação e escala conforme necessário
        this.engineModel.position.set(0, 0, 0);
        this.engineModel.rotation.set(0, 0, 0);
        this.engineModel.scale.set(1, 1, 1);
        
        // Atravessar a hierarquia do modelo para identificar as partes
        this.traverseModel(this.engineModel);
        
        this.scene.add(this.engineModel);
        
        // Como não temos um modelo real neste exemplo, vamos criar um modelo
        // de demonstração com formas geométricas básicas para simular um motor
        this.createDemoEngineModel();
      },
      (xhr) => {
        // Progresso de carregamento já está sendo tratado pelo loadingManager
      },
      (error) => {
        console.error('Erro ao carregar o modelo:', error);
        // Carregar modelo de demonstração em caso de erro
        this.createDemoEngineModel();
      }
    );
  }

  private traverseModel(model: THREE.Group): void {
    // Percorrer a hierarquia do modelo para encontrar e configurar as partes do motor
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // Habilitar sombras
        object.castShadow = true;
        object.receiveShadow = true;
        
        // Tentar identificar a parte do motor pelo nome do objeto
        const partName = this.getPartNameFromObject(object);
        const enginePart = this.engineParts.find(p => p.name.toLowerCase().includes(partName.toLowerCase()));
        
        if (enginePart) {
          enginePart.object = object;
          
          // Salvar cor original para restaurar após hover
          if (object.material instanceof THREE.MeshStandardMaterial) {
            enginePart.originalColor = object.material.color.clone();
          }
        }
      }
    });
  }

  private createDemoEngineModel(): void {
    // Criar um modelo de motor de demonstração usando formas geométricas básicas
    // Será usado se não conseguirmos carregar um modelo real
    if (this.engineModel) return; // Não criar se já temos um modelo
    
    this.engineModel = new THREE.Group();
    
    // Bloco do motor (base)
    const blockGeometry = new THREE.BoxGeometry(2, 1, 1.5);
    const blockMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x555555, 
      metalness: 0.7, 
      roughness: 0.3 
    });
    const block = new THREE.Mesh(blockGeometry, blockMaterial);
    block.name = 'Motor';
    block.castShadow = true;
    block.receiveShadow = true;
    this.engineModel.add(block);
    
    // Cabeçote
    const headGeometry = new THREE.BoxGeometry(2, 0.3, 1.5);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x777777, 
      metalness: 0.8, 
      roughness: 0.2 
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.65;
    head.name = 'Cabeçote';
    head.castShadow = true;
    head.receiveShadow = true;
    this.engineModel.add(head);
    
    // Pistões
    for (let i = 0; i < 4; i++) {
      const pistonGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 16);
      const pistonMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xcccccc, 
        metalness: 0.9, 
        roughness: 0.1 
      });
      const piston = new THREE.Mesh(pistonGeometry, pistonMaterial);
      piston.rotation.x = Math.PI / 2;
      piston.position.set(-0.75 + (i * 0.5), 0, 0);
      piston.name = 'Pistões';
      piston.castShadow = true;
      piston.receiveShadow = true;
      this.engineModel.add(piston);
    }
    
    // Virabrequim
    const crankGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2.2, 16);
    const crankMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x999999, 
      metalness: 0.9, 
      roughness: 0.1 
    });
    const crankshaft = new THREE.Mesh(crankGeometry, crankMaterial);
    crankshaft.rotation.z = Math.PI / 2;
    crankshaft.position.y = -0.3;
    crankshaft.name = 'Virabrequim';
    crankshaft.castShadow = true;
    crankshaft.receiveShadow = true;
    this.engineModel.add(crankshaft);
    
    // Coletor de admissão
    const intakeGeometry = new THREE.BoxGeometry(1.5, 0.2, 0.3);
    const intakeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3366cc, 
      metalness: 0.6, 
      roughness: 0.4 
    });
    const intake = new THREE.Mesh(intakeGeometry, intakeMaterial);
    intake.position.set(0, 0.7, -0.8);
    intake.name = 'Coletor de Admissão';
    intake.castShadow = true;
    intake.receiveShadow = true;
    this.engineModel.add(intake);
    
    // Sistema de escape
    const exhaustGeometry = new THREE.BoxGeometry(1.5, 0.2, 0.3);
    const exhaustMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x993333, 
      metalness: 0.6, 
      roughness: 0.4 
    });
    const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaust.position.set(0, 0.7, 0.8);
    exhaust.name = 'Sistema de Escape';
    exhaust.castShadow = true;
    exhaust.receiveShadow = true;
    this.engineModel.add(exhaust);
    
    // Adicionar a cena
    this.scene.add(this.engineModel);
    
    // Atualizar as referências aos objetos para as informações das partes
    this.engineParts[0].object = block; // Motor
    this.engineParts[1].object = this.engineModel.children.find(c => c.name === 'Pistões'); // Pistões
    this.engineParts[2].object = crankshaft; // Virabrequim
    this.engineParts[4].object = head; // Cabeçote
    this.engineParts[7].object = intake; // Coletor de Admissão
    this.engineParts[8].object = exhaust; // Sistema de Escape
    
    // Armazenar posições originais para vista explodida
    this.engineModel.children.forEach(child => {
      this.originalPositions.set(child, child.position.clone());
    });
  }

  private animate(): void {
    if (!this.isBrowser) return;

    this.animationId = requestAnimationFrame(() => this.animate());
    
    // Atualizar controles
    if (this.controls) {
      this.controls.update();
    }
    
    // Rotação lenta do motor para visualização
    if (this.engineModel && !this.isMouseDown && !this.hoveredPart) {
      this.engineModel.rotation.y += 0.002;
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Limpar memória
    if (this.engineModel) {
      this.engineModel.traverse(object => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) {
            object.geometry.dispose();
          }
          
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
    }
    
    if (this.renderer) {
      this.renderer.dispose();
      if (this.rendererContainer && this.rendererContainer.nativeElement) {
        this.rendererContainer.nativeElement.removeChild(this.renderer.domElement);
      }
    }
  }
}
