import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  public imageString: any;

  constructor(
    public router: Router
  ) { }

  ngOnInit(): void {
  }

  //function to navigate to signup route
  public updateImageString: any = (img) => {
    this.imageString = img;
  } // end of navigateToSignUp

  //function to navigate to signup route
  public navigateToSignUp: any = () => {
    this.router.navigate(['/signup']);
  } // end of navigateToSignUp

}
