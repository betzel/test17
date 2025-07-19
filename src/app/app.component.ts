import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../environments/environment";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private file: File | null = null;
  resTextData: string = '';
  resJsonData: string = '';
  showImg = false;
  showResult = false;
  showLoadingIcon = false;
  copyTextIcon = 'file_copy';
  copyJsonIcon = 'file_copy';
  disabledBtnSend = false;
  errorSizeBoolean = false;
  errorTypeBoolean = false;

  protected readonly environment = environment;
  requiredFileTypes: string = 'image/png,image/jpeg';
  fileName = '';

  @ViewChild('fileUpload') fileUpload: ElementRef | undefined;
  @ViewChild('showMessage') showMessage: ElementRef | undefined;
  @ViewChild('showMessageText') showMessageText: ElementRef | undefined;
  @ViewChild('resultText') resultText: ElementRef | undefined;
  @ViewChild('resultJson') resultJson: ElementRef | undefined;
  @ViewChild('resultShowText') resultShowText: ElementRef | undefined;
  @ViewChild('resultShowJson') resultShowJson: ElementRef | undefined;
  @ViewChild('imgResult') imgResult: ElementRef | undefined;

  constructor(
    private http: HttpClient
  ) {}

  onFileSelected(event: any): void {
    this.allClearData();
    const file:File = event.target.files[0];

    if (file) {
      this.file = file;
      this.fileName = file.name;
      let errType: any = null;
      let errSize: any = null;

      if (file.type) {
        errType = this.allowedTypes(['jpeg', 'png'], file);
        if (errType && errType.invalidFileType) {
          this.errorTypeBoolean = true;
        }
      }
      if (file.size) {
        errSize = this.maxSize(2 * 1024 * 1024, file);
        if (errSize && errSize.exceedMax) {
          this.errorSizeBoolean = true;
        }
      }

      if (
        !this.errorTypeBoolean &&
        !this.errorSizeBoolean
      ) {
        this.showThumb(file);
      }
    }
  }

  async copyTextToClipboard(textToCopy: any): Promise<void> {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async copyText(id: string): Promise<boolean> {
    if (!id) {
      return false;
    }
    switch (id) {
      case 'result-text':
        await this.copyTextToClipboard(this.resTextData);
        this.copyTextIcon = 'done';
        break;
      case 'result-json':
        await this.copyTextToClipboard(this.resJsonData);
        this.copyJsonIcon = 'done';
        break;
    }
    return true;
  }

  allowedTypes(types: string[], file: File): any {
      if (!file) {
        return null;
      }

      if (!file.type) {
        return null;
      }
      const fileType = file.type.split('/')[1];

      if (!types.includes(fileType)) {
        return { invalidFileType: true };
      }
      return null;
  }

  maxSize(maxBytes: number, file: File): any {
    if (!file) {
      return null;
    }

    if (!file.size) {
      return null;
    }
    if (file.size > maxBytes) {
      return { exceedMax: true };
    }
    return null;
  }

  showThumb(file: File) {
    const srcData =  URL.createObjectURL(file);
    let newImage = document.createElement('img');
    newImage.setAttribute('src', srcData);
    newImage.setAttribute('width', '200');
    newImage.setAttribute('height', '150');
    this.imgResult?.nativeElement.appendChild(newImage);
    this.showImg = true;
  }

  allClearData (): void {
    this.resTextData = '';
    this.resJsonData = '';
    this.fileName = '';
    this.copyTextIcon = 'file_copy';
    this.copyJsonIcon = 'file_copy';
    this.errorSizeBoolean = false;
    this.errorTypeBoolean = false;
    if (this.file) {
      this.file = null;
    }
    this.showImg = false;
    this.showResult = false;
    if (this.imgResult && this.imgResult?.nativeElement) {
      this.imgResult.nativeElement.innerHTML = '';
    }
  }

  sendImg(): void {
    if (this.file) {
      this.showResult = false;
      this.disabledBtnSend = true;
      this.showLoadingIcon = true;
      const formData = new FormData();
      formData.append("image", this.file, this.fileName);

      this.http.post(
        "https://api.api-ninjas.com/v1/imagetotext",
        formData,
        {
          headers: {
            'X-Api-Key': 'BBZCAYfJWVlYqNkMG81HCw==o0RObuSqVAlztZRv',
          },
        }
      ).subscribe(res => {
        let domPre = document.createElement('pre');
        let domP = document.createElement('p');
        if (Array.isArray(res)) {
          let numbArr = 0;
          res.forEach(el => {
            numbArr++;
            if (numbArr === res.length) {
              domP.innerText += `${el.text}`;
            } else {
              domP.innerText += `${el.text} `;
            }
          });
        }
        this.resTextData = domP.innerText;
        this.resJsonData = JSON.stringify(res);
        domPre.innerText = JSON.stringify(res, undefined, 2);

        if (this.resultText) {
          this.resultText.nativeElement.innerHTML = '';
          this.resultText.nativeElement.appendChild(domP);
        }
        if (this.resultJson) {
          this.resultJson.nativeElement.innerHTML = '';
          this.resultJson.nativeElement.appendChild(domPre);
        }

        this.copyTextIcon = 'file_copy';
        this.copyJsonIcon = 'file_copy';

        this.showLoadingIcon = false;
        this.showResult = true;
        this.disabledBtnSend = false;
      },
      (error) => {
        let domPre = document.createElement('pre');
        domPre.setAttribute('style', 'overflow-x: scroll;');
        domPre.innerText = JSON.stringify(error.error, undefined, 2);

        if (this.resultText) {
          this.resultText.nativeElement.innerHTML = '';
        }
        if (this.resultJson) {
          this.resultJson.nativeElement.innerHTML = '';
          this.resultJson.nativeElement.appendChild(domPre);
        }

        this.copyTextIcon = 'file_copy';
        this.copyJsonIcon = 'file_copy';

        this.showLoadingIcon = false;
        this.showResult = true;
        this.disabledBtnSend = false;

        // this.showMessages(error.error.error, 'error');
      });
    }
  }

  showMessages(text: string, type: string = 'error') {
    if (
      this.showMessageText &&
      this.showMessageText.nativeElement.innerHTML
    ) {
      this.showMessageText.nativeElement.innerHTML = '';
    }
    const pDom = document.createElement('p');
    pDom.innerText = text;
    this.showMessageText?.nativeElement.appendChild(pDom);

    if (type === 'success') {
      this.showMessage?.nativeElement.classList.add(type);
      this.showMessage?.nativeElement.classList.remove('error');
    } else {
      this.showMessage?.nativeElement.classList.add(type);
      this.showMessage?.nativeElement.classList.remove('success');
    }

    this.showMessage?.nativeElement.classList.remove("hidden");

    setTimeout(() => {
      this.showMessageText?.nativeElement.removeChild(pDom);
      this.showMessage?.nativeElement.classList.add("hidden");
    }, 3000);
  }
}
