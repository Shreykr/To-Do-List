import { Injectable } from '@angular/core';

import io from 'socket.io-client';

import { Observable } from 'rxjs';
import { Cookie } from 'ng2-cookies/ng2-cookies'

import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/toPromise';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HttpErrorResponse, HttpParams } from "@angular/common/http";

@Injectable()
export class SocketService {

  private url = 'http://localhost:3000';
  private socket;

  constructor(public http: HttpClient) {
    // connection is being created. that handshake
    this.socket = io(this.url);

  }

  public verifyUser = () => {
    return Observable.create((observer) => {
      this.socket.on('verifyUser', (data) => {
        observer.next(data);
      });
    });
  }

  public connected = () => {
    return Observable.create((observer) => {
      this.socket.on('connected', (data) => {
        observer.next();
      });
    });
  }

  public setUser = (authToken) => {
    this.socket.emit('set-user', authToken);
  }

  // public receiveFriendRequestReply = (userObject) => {
  //   return Observable.create((observer) => {
  //     this.socket.on('friend-request-state', userObject => {
  //       observer.next(userObject);
  //     });
  //   });
  // }

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



  // public disconnectedSocket = () => {

  //   return Observable.create((observer) => {

  //     this
  //       .socket
  //       .on("disconnect", () => {

  //         observer.next();

  //       });

  //   });

  // }     

  private handleError(err: HttpErrorResponse) {

    let errorMessage = '';

    if (err.error instanceof Error) {

      errorMessage = `An error occurred: ${err.error.message}`;

    } else {

      errorMessage = `Server returned code: ${err.status}, error message is: ${err.message}`;

    }

    console.error(errorMessage);

    return Observable.throw(errorMessage);

  }

}
