import { Component } from '@angular/core';
import { LoginComponent } from '../login/login.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [LoginComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  title = "StockSphere";

  greeting: { id: string; content: string } = { id: 'XXX', content: 'Hello World' };
  constructor(private http: HttpClient){
    http.get<{ id: string; content: string }>('http://localhost:8080/resource').subscribe(data => this.greeting = data);
  }

}
