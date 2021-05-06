import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.css']
})
export class ErrorComponent implements OnInit {

  public error404: Boolean = true;
  public error500: Boolean = false;
  public toggleValue;

  constructor(
    public _route: ActivatedRoute,
    public router: Router
  ) { }

  ngOnInit(): void {
    this.toggleValue = this._route.snapshot.paramMap.get('error');
    console.log(this.toggleValue)
    if (Number(this.toggleValue) === 500) {
      console.log(1)
      this.error404 = false;
      this.error500 = true;
    }
    else {
      console.log(2)
      this.error404 = true;
      this.error500 = false;
    }
  }
}
