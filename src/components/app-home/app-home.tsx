import { Component, h, State } from '@stencil/core';
import { Network, NetworkStatus, Camera, Filesystem, FilesystemDirectory, CameraResultType, Capacitor } from '@capacitor/core';
import { toastController } from '@ionic/core';

@Component({
  tag: 'app-home',
  styleUrl: 'app-home.css'
})
export class AppHome {

  @State() networkStatus: NetworkStatus | undefined;
  @State() choosePhotoAndMoveFromTempToPermStorageImgSrc: string | undefined;
  @State() downloadPhotoAndAddToStorageOriginialImgSrc: string = "https://upload.wikimedia.org/wikipedia/commons/d/dc/HondaS2000-004.jpg";
  @State() downloadPhotoAndAddToStorageDownloadedDataUrl: string | undefined;
  @State() downloadPhotoAndAddToStorageImgSrc: string | undefined;

  async componentWillLoad() {
    this.networkStatus = await Network.getStatus();
    Network.addListener('networkStatusChange', status => {
      console.log('Network Status Changed: ' + status.connectionType);
      this.networkStatus = {...status};
    });
  }

  async choosePhotoAndMoveFromTempToPermStorage() {
    try {
      console.log('Invoked choosePhotoAndMoveFromTempToPermStorage, calling Camera.getPhoto');
     const photoInTemp = await Camera.getPhoto({
        resultType: CameraResultType.Uri
      });
      console.log('Photo in temp path is ' + photoInTemp.path);
      console.log('Photo in temp webPath is ' + photoInTemp.webPath);
      if (!photoInTemp.path) {
        throw new Error('Photo does not contain a path');
      }
      const tempFile = await Filesystem.readFile({
        path: photoInTemp.path
      });
      if (tempFile) {
        console.log('We have the file contents');
      } else {
        console.log('Could not read the file');
      }
      const writeResult = await Filesystem.writeFile({
        path: Date.now() + '.jpeg',
        directory: FilesystemDirectory.Data,
        data: tempFile.data
      });
      if (writeResult) {
        console.log('We got a writeResult');
      } else {
        console.log('Could not write the file');
      }
      console.log('The uri is ' + writeResult.uri);
      console.log('The path after Capacitor.convertFileSrc is: ' + Capacitor.convertFileSrc(writeResult.uri));
      this.choosePhotoAndMoveFromTempToPermStorageImgSrc = Capacitor.convertFileSrc(writeResult.uri);
    } catch (error) {
      console.log('Error in choosePhotoAndMoveFromTempToPermStorage');
      console.log(error);
      toastController.create({
        message: 'There was an error in choosePhotoAndMoveFromTempToPermStorage ',
        duration: 2000
      }).then(toast => toast.present());
    }
  }

  async downloadPhotoAndAddToStorage() {
    try {
      console.log('Invoked downloadPhotoAndAddToStorage');
      const result = await fetch(this.downloadPhotoAndAddToStorageOriginialImgSrc);
      console.log('Did we get an ok result? ' + result.ok);
      if (!result || !result.ok) {
        throw new Error('There was an error fetching image');
      }
      const blob = await result.blob();
      
      if (!blob) {
        console.log('Did not get blob data, throwing an error');
        throw new Error('Was not a blob result');
      }
      console.log('Have blob data');
      const dataUrl = await this.convertBlobToDataUrl(blob);
      console.log('Converted it to a dataUrl');
      this.downloadPhotoAndAddToStorageDownloadedDataUrl = dataUrl;
      const writeResult = await Filesystem.writeFile({
        path: Date.now() + '.jpeg',
        directory: FilesystemDirectory.Data,
        data: dataUrl
      });

      // Throws error on writeFile so never gets below this line, error is empty
      if (writeResult) {
        console.log('We got a writeResult');
      } else {
        console.log('Could not write the file');
      }
      console.log('The uri is ' + writeResult.uri);
      console.log('The path after Capacitor.convertFileSrc is: ' + Capacitor.convertFileSrc(writeResult.uri));
      this.downloadPhotoAndAddToStorageImgSrc = Capacitor.convertFileSrc(writeResult.uri);
    } catch (error) {
      console.log('Error in downloadPhotoAndAddToStorage');
      console.log(error);
      toastController.create({
        message: 'There was an error in downloadPhotoAndAddToStorage ',
        duration: 2000
      }).then(toast => toast.present());
    }
  }

  convertBlobToDataUrl(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
      if (!blob || !(blob instanceof  Blob)) {
        return reject();
      }
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = (event) => {
        if (!event || typeof event.target.result !== 'string') {
          return reject();
        }
        return resolve(event.target.result);
      }
    })
  }

  render() {
    return [
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Home</ion-title>
        </ion-toolbar>
      </ion-header>,

      <ion-content class="ion-padding">
        <div class="ion-padding">
          <b> choosePhotoAndMoveFromTempToPermStorageImgSrc:</b> {this.choosePhotoAndMoveFromTempToPermStorageImgSrc}
          <br />
          <img src={this.choosePhotoAndMoveFromTempToPermStorageImgSrc} />
        </div>

        <div class="ion-padding">
          <b>downloadPhotoAndAddToStorageOriginialImgSrc:</b> {this.downloadPhotoAndAddToStorageOriginialImgSrc}
          <br />
          <img src={this.downloadPhotoAndAddToStorageOriginialImgSrc} />
        </div>

        <div class="ion-padding">
          <b>downloadPhotoAndAddToStorageDownloadedDataUrl:</b> {this.downloadPhotoAndAddToStorageDownloadedDataUrl && this.downloadPhotoAndAddToStorageDownloadedDataUrl.slice(0, 15)}
          <br />
          <img src={this.downloadPhotoAndAddToStorageDownloadedDataUrl} />
        </div>

        <div class="ion-padding">
          <b>downloadPhotoAndAddToStorageImgSrc:</b> {this.downloadPhotoAndAddToStorageImgSrc}
          <br />
          <img src={this.downloadPhotoAndAddToStorageImgSrc} />
        </div>

        <ion-button onClick={() => this.choosePhotoAndMoveFromTempToPermStorage()}>
          choosePhotoAndMoveFromTempToPermStorage
        </ion-button>

        <ion-button onClick={() => this.downloadPhotoAndAddToStorage()}>
          downloadPhotoAndAddToStorage
        </ion-button>

      </ion-content>
    ];
  }
}
