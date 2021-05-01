import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainHomeComponent } from './main-home/main-home.component';
import { ViewTaskComponent } from './view-task/view-task.component';
import { CollabHomeComponent } from './collab-home/collab-home.component';
import { CollabViewTaskComponent } from './collab-view-task/collab-view-task.component';



@NgModule({
  declarations: [
    MainHomeComponent,
    ViewTaskComponent,
    CollabHomeComponent,
    CollabViewTaskComponent
  ],
  imports: [
    CommonModule
  ]
})
export class MainModule { }
