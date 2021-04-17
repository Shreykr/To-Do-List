import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { PasswordRecoveryComponent } from './password-recovery/password-recovery.component';



@NgModule({
  declarations: [
    LoginComponent,
    SignupComponent,
    PasswordRecoveryComponent
  ],
  imports: [
    CommonModule
  ]
})
export class UserModule { }
