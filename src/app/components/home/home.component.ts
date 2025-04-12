import { Component, OnInit, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';

import { LoginComponent } from '../login/login.component';
import { ContentComponent } from "../content/content.component";
import { UserComponent } from "../../user/user.component";
import { NotificationComponent } from "../notification/notification.component";


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [LoginComponent, ContentComponent, UserComponent, NotificationComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  authenticated = signal(false);
  title = "StockSphere";

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Subscribe to the authentication status
    this.authService.authenticated$.subscribe(isAuthenticated => {
      console.log('HomeComponent: Authenticated status =', isAuthenticated);
      this.authenticated.set(isAuthenticated);
    });
  }

}
