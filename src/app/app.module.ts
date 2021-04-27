//Components
import { SignupComponent } from './user/signup/signup.component';
import { HomeComponent } from './general/home/home.component';
import { LoginComponent } from './user/login/login.component';
import { AppComponent } from './app.component';
import { PasswordRecoveryComponent } from './user/password-recovery/password-recovery.component';
import { MainHomeComponent } from './main/main-home/main-home.component';
import { ViewTaskComponent } from './main/view-task/view-task.component';
import { CollabHomeComponent } from './main/collab-home/collab-home.component';

//Modules
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { HttpClientModule } from '@angular/common/http';

import { AppService } from './app.service';
import { MainService } from './main.service';
import { SocketService } from './socket.service';
@NgModule({
  declarations: [
    AppComponent,
    SignupComponent,
    HomeComponent,
    LoginComponent,
    PasswordRecoveryComponent,
    MainHomeComponent,
    ViewTaskComponent,
    CollabHomeComponent
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
      { path: 'main-home', component: MainHomeComponent },
      { path: 'view-task/:projectName', component: ViewTaskComponent },
      { path: 'collab-home', component: CollabHomeComponent },
      { path: 'password-recovery/:authToken/:userId', component: PasswordRecoveryComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: '*', component: HomeComponent },
      { path: '**', component: HomeComponent }
    ])
  ],
  providers: [AppService, MainService, SocketService],
  bootstrap: [AppComponent]
})
export class AppModule { }
