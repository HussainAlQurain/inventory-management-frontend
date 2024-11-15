import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../models/user';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { merge } from 'rxjs';
import { AuthService } from '../../services/auth.service'; // Import AuthService
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  @Input() title: string = '';
  user!: User;
  readonly username = new FormControl('', [Validators.required]);
  readonly password = new FormControl('', [Validators.required, Validators.minLength(3)]);
  errorMessage = signal('');

  hide = signal(true);

  constructor(private authService: AuthService, private router: Router) {
    // Listening for changes in the username field to set error messages
    merge(this.username.statusChanges, this.username.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessage());
  }

  updateErrorMessage() {
    if (this.username.hasError('required')) {
      this.errorMessage.set('You must enter a value');
    } else if (this.username.hasError('username')) {
      this.errorMessage.set('Not a valid username');
    } else {
      this.errorMessage.set('');
    }
  }

  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  onSubmit(event: Event) {
    event.preventDefault(); // Prevent the default form submission
  
    this.authService.login(this.username.value!, this.password.value!)
      .subscribe(
        data => {
          if (data) {
            this.router.navigate(['/']); // Only navigate if login is successful and token is saved.
          }
        },
        error => {
          console.error('Login error:', error);
        }
      );
  }
  
  
  
}
