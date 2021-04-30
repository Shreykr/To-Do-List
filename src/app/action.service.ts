import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cookie } from 'ng2-cookies/ng2-cookies';

@Injectable({
  providedIn: 'root'
})
export class ActionService {

  private url = "http://localhost:3000"

  constructor(public http: HttpClient) { }

  public addNewAction(data): Observable<any> {
    const params = new HttpParams()
      .set('type', data.type)
      .set('fromId', data.fromId)
      .set('collabLeaderId', data.collabLeaderId)
      .set('previousValueOfTarget', data.previousValueOfTarget)
      .set('newValueOfTarget', data.newValueOfTarget)
      .set('authToken', data.authToken)

    return this.http.post(`${this.url}/api/v1/actions/log-action`, params)
  }
}
