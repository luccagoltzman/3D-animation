import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, HostListener, PLATFORM_ID, Inject } from '@angular/core';
import * as THREE from 'three';
import { CommonModule, isPlatformBrowser } from '@angular/common';

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

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private mesh!: THREE.Mesh;
  private meshes: THREE.Mesh[] = [];
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private animationId: number = 0;
  private mousePosition = { x: 0, y: 0 };
  private isMouseDown = false;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.initScene();
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.setupRenderer();
      this.animate();
    }
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
  }

  @HostListener('mousedown')
  onMouseDown(): void {
    if (!this.isBrowser) return;

    this.isMouseDown = true;
    this.customCursor.nativeElement.style.width = '15px';
    this.customCursor.nativeElement.style.height = '15px';
    this.customCursor.nativeElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
  }

  @HostListener('mouseup')
  onMouseUp(): void {
    if (!this.isBrowser) return;

    this.isMouseDown = false;
    this.customCursor.nativeElement.style.width = '20px';
    this.customCursor.nativeElement.style.height = '20px';
    this.customCursor.nativeElement.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
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
    this.scene.background = new THREE.Color(0x000000);

    // Criar câmera
    this.camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    this.camera.position.z = 5;

    // Criar luzes
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // Criar geometrias e materiais variados
    this.createObjects();
  }

  private createObjects(): void {
    if (!this.isBrowser) return;

    // Criar várias formas geométricas com cores diferentes
    const geometries = [
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.SphereGeometry(0.6, 32, 32),
      new THREE.ConeGeometry(0.6, 1, 32),
      new THREE.TorusGeometry(0.5, 0.2, 16, 100),
      new THREE.OctahedronGeometry(0.7),
      new THREE.IcosahedronGeometry(0.7)
    ];

    const colors = [
      0xff5555, 0x55ff55, 0x5555ff,
      0xffff55, 0xff55ff, 0x55ffff
    ];

    // Distribuir objetos em um padrão circular
    for (let i = 0; i < geometries.length; i++) {
      const angle = (i / geometries.length) * Math.PI * 2;
      const radius = 3;
      
      const material = new THREE.MeshPhongMaterial({ 
        color: colors[i],
        shininess: 100, 
        specular: 0x111111
      });
      
      const mesh = new THREE.Mesh(geometries[i], material);
      
      mesh.position.x = Math.cos(angle) * radius;
      mesh.position.y = Math.sin(angle) * radius;
      mesh.position.z = 0;
      
      this.meshes.push(mesh);
      this.scene.add(mesh);
    }
  }

  private setupRenderer(): void {
    if (!this.isBrowser) return;

    // Configurar renderizador
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    // Adicionar canvas ao container
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);
  }

  private animate(): void {
    if (!this.isBrowser) return;

    this.animationId = requestAnimationFrame(() => this.animate());
    
    // Atualizar raycaster com posição do mouse
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // Verificar interseções
    const intersects = this.raycaster.intersectObjects(this.meshes);
    
    // Animar todos os objetos
    this.meshes.forEach((mesh, index) => {
      // Rotação normal
      mesh.rotation.x += 0.005;
      mesh.rotation.y += 0.01;
      
      // Escalar para tamanho original (caso tenha sido aumentado)
      mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      
      // Mover em direção à posição original
      const angle = (index / this.meshes.length) * Math.PI * 2;
      const radius = 3;
      const targetX = Math.cos(angle) * radius;
      const targetY = Math.sin(angle) * radius;
      
      mesh.position.x += (targetX - mesh.position.x) * 0.05;
      mesh.position.y += (targetY - mesh.position.y) * 0.05;
      mesh.position.z += (0 - mesh.position.z) * 0.05;
    });
    
    // Efeito de interação com o mouse
    if (intersects.length > 0) {
      const intersectedMesh = intersects[0].object as THREE.Mesh;
      
      // Aumentar o objeto e mudar o cursor
      intersectedMesh.scale.lerp(new THREE.Vector3(1.3, 1.3, 1.3), 0.1);
      
      // Mover o objeto em direção ao mouse (eixo Z)
      intersectedMesh.position.z += (0.5 - intersectedMesh.position.z) * 0.1;
      
      // Aumentar o cursor ao passar sobre um objeto
      if (this.customCursor && this.customCursor.nativeElement) {
        this.customCursor.nativeElement.style.width = '30px';
        this.customCursor.nativeElement.style.height = '30px';
        this.customCursor.nativeElement.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
      }
    } else {
      // Resetar o cursor quando não estiver sobre objetos
      if (this.customCursor && this.customCursor.nativeElement && !this.isMouseDown) {
        this.customCursor.nativeElement.style.width = '20px';
        this.customCursor.nativeElement.style.height = '20px';
        this.customCursor.nativeElement.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
      }
    }
    
    // Efeito de ondulação nos objetos com base no mouse
    this.meshes.forEach(mesh => {
      const distX = mesh.position.x - this.mouse.x * 3;
      const distY = mesh.position.y - this.mouse.y * 3;
      const dist = Math.sqrt(distX * distX + distY * distY);
      const effect = 1 / (1 + dist * 0.5);
      
      mesh.rotation.z += effect * 0.01;
    });
    
    this.renderer.render(this.scene, this.camera);
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Limpar memória
    this.meshes.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(material => material.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    
    if (this.renderer) {
      this.renderer.dispose();
      if (this.rendererContainer && this.rendererContainer.nativeElement) {
        this.rendererContainer.nativeElement.removeChild(this.renderer.domElement);
      }
    }
  }
}
