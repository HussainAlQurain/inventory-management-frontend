import { Component } from '@angular/core';
import { LoginComponent } from '../login/login.component';
import { ContentComponent } from "../content/content.component";


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [LoginComponent, ContentComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  title = "StockSphere";

}
