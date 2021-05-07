import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActionService {

  private url = "http://localhost:3000"

  constructor(public http: HttpClient) { }

  public addNewAction(data): Observable<any> {
    var params = new HttpParams()
      .set('type', data.type)
      .set('fromId', data.fromId)
      .set('collabLeaderId', data.collabLeaderId)
      .set('previousProjectName', data.previousProjectName)
      .set('currentProjectName', data.currentProjectName)
      .set('previousItemName', data.previousItemName)
      .set('currentItemName', data.currentItemName)
      .set('previousStatus', data.previousStatus)
      .set('currentStatus', data.currentStatus)
      .set('authToken', data.authToken)
    for (let i of data.previousSubItems) {
      params = params.append('previousSubItems', i)
    }

    for (let j of data.currentSubItems) {
      params = params.append('currentSubItems', j)
    }

    return this.http.post(`${this.url}/api/v1/actions/log-action`, params)
  }

  public getActions(data): Observable<any> {
    const params = new HttpParams()
      .set("fromId", data.fromId)
      .set("collabLeaderId", data.collabLeaderId)
      .set('authToken', data.authToken)

    return this.http.post(`${this.url}/api/v1/actions/get-user-actions`, params)
  }

  public deleteAction(data): Observable<any> {
    const params = new HttpParams()
      .set('fromId', data.fromId)
      .set('collabLeaderId', data.collabLeaderId)
      .set('authToken', data.authToken)

    return this.http.post(`${this.url}/api/v1/actions/delete-friend-action`, params)
  }
}
