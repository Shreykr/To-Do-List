//Components
import { SignupComponent } from './user/signup/signup.component';
import { HomeComponent } from './general/home/home.component';
import { LoginComponent } from './user/login/login.component';
import { AppComponent } from './app.component';
import { PasswordRecoveryComponent } from './user/password-recovery/password-recovery.component';
import { MainHomeComponent } from './main/main-home/main-home.component';
import { ViewTaskComponent } from './main/view-task/view-task.component';
import { CollabHomeComponent } from './main/collab-home/collab-home.component';
import { CollabViewTaskComponent } from './main/collab-view-task/collab-view-task.component';
import { ErrorComponent } from './general/error/error.component'

//Modules
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { MatProgressBarModule } from '@angular/material/progress-bar'

import { AppService } from './app.service';
import { MainService } from './main.service';
import { SocketService } from './socket.service';
import { ActionService } from './action.service';
import { LoaderService } from './loader.service';
import { InterceptorService } from './interceptor.service';
@NgModule({
  declarations: [
    AppComponent,
    SignupComponent,
    HomeComponent,
    LoginComponent,
    PasswordRecoveryComponent,
    MainHomeComponent,
    ViewTaskComponent,
    CollabHomeComponent,
    CollabViewTaskComponent,
    ErrorComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatProgressBarModule,
    ToastrModule.forRoot(),
    RouterModule.forRoot([
      { path: 'home', component: HomeComponent },
      { path: 'signup', component: SignupComponent },
      { path: 'login', component: LoginComponent },
      { path: 'main-home', component: MainHomeComponent },
      { path: 'view-task/:projectName', component: ViewTaskComponent },
      { path: 'collab-home/:toId', component: CollabHomeComponent },
      { path: 'collab-view-task/:toId/:projectName', component: CollabViewTaskComponent },
      { path: 'password-recovery/:authToken/:userId', component: PasswordRecoveryComponent },
      { path: 'not-found', component: ErrorComponent },
      { path: 'server-error/:error', component: ErrorComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: '*', component: ErrorComponent },
      { path: '**', component: ErrorComponent }
    ])
  ],
  providers: [AppService, MainService, SocketService, ActionService, LoaderService, { provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule { }
