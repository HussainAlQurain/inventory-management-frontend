import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { User } from '../../models/user';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {merge} from 'rxjs';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  @Input() title: string = '';
  user!: User;
  readonly username = new FormControl('', [Validators.required]);
  password = new FormControl('', [Validators.required, Validators.minLength(3)])
  errorMessage = signal('');


  constructor() {
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


  hide = signal(true);
  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  onSubmit(){
    alert(`You tried to login with\n${this.username.value}\n${this.password.value}`);
  }
}
