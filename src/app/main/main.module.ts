import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainHomeComponent } from './main-home/main-home.component';
import { ViewTaskComponent } from './view-task/view-task.component';



@NgModule({
  declarations: [
    MainHomeComponent,
    ViewTaskComponent
  ],
  imports: [
    CommonModule
  ]
})
export class MainModule { }
