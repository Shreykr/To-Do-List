//Components
import { SignupComponent } from './user/signup/signup.component';
import { HomeComponent } from './general/home/home.component';
import { LoginComponent } from './user/login/login.component';
import { AppComponent } from './app.component';
import { PasswordRecoveryComponent } from './user/password-recovery/password-recovery.component'

//Modules
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { HttpClientModule } from '@angular/common/http';

import { AppService } from './app.service';
@NgModule({
  declarations: [
    AppComponent,
    SignupComponent,
    HomeComponent,
    LoginComponent,
    PasswordRecoveryComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ToastrModule.forRoot(),
    RouterModule.forRoot([
      { path: 'home', component: HomeComponent },
      { path: 'signup', component: SignupComponent },
      { path: 'login', component: LoginComponent },
      { path: 'password-recovery/:authToken/:userId', component: PasswordRecoveryComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: '*', component: HomeComponent },
      { path: '**', component: HomeComponent }
    ])
  ],
  providers: [AppService],
  bootstrap: [AppComponent]
})
export class AppModule { }
