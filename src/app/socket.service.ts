import { Injectable } from '@angular/core';
import io from 'socket.io-client';
import { Observable } from 'rxjs';

import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/toPromise';

import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse } from "@angular/common/http";

@Injectable()
export class SocketService {

  private url = 'http://api.to-do-list.live';
  private socket;

  constructor(public http: HttpClient) {
    this.socket = io(this.url);
  }

  public startConnection = () => {
    return Observable.create((observer) => {
      this.socket = io(this.url);
      observer.next();
    })
  }

  public verifyUser = () => {
    return Observable.create((observer) => {
      this.socket.on('verifyUser', (data) => {
        observer.next(data);
      });
    });
  }

  public setUser = (authToken) => {
    this.socket.emit('set-user', authToken);
  }

  public receiveRealTimeNotifications = (userId) => {
    return Observable.create((observer) => {
      this.socket.on(userId, (data) => {
        observer.next(data)
      })
    })
  }

  public sendRequestNotification = (notificationObject) => {
    this.socket.emit('friend-request-notification', notificationObject)
  }

  public sendFriendAcceptNotification = (notificationObject) => {
    this.socket.emit('friend-accept-notification', notificationObject)
  }

  public sendConnectionStatusNotification = (notificationObject) => {
    this.socket.emit('friend-connect-notification', notificationObject)
  }

  public receiveGroupNotifications = () => {
    return Observable.create((observer) => {
      this.socket.on('friend-group-notification', (data) => {
        observer.next(data)
      })
    })
  }

  public sendGroupEditsNotification = (notificationObject) => {
    this.socket.emit('friend-edits-notification', notificationObject)
  }

  public disconnectFriend = (notificationObject) => {
    this.socket.emit('disconnectFriend', notificationObject)
  }

  public exitSocket = () => {
    this.socket.disconnect();
  }

  private handleError(err: HttpErrorResponse) {

    let errorMessage = '';
    if (err.error instanceof Error) {
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      errorMessage = `Server returned code: ${err.status}, error message is: ${err.message}`;
    }
    return Observable.throw(errorMessage);
  }
}
