import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Scene3dComponent } from './scene3d/scene3d.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Scene3dComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'animacao-3d';
}
